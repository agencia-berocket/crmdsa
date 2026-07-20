import { JWT } from "google-auth-library";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

let cachedClient: JWT | null | undefined;

// Lazily builds (and caches) a JWT-authenticated client from the Service Account
// credentials in GOOGLE_SERVICE_ACCOUNT_KEY. Returns null (and logs a warning once)
// when the env var is missing or malformed, so callers can degrade gracefully.
function getServiceAccountClient(): JWT | null {
  if (cachedClient !== undefined) return cachedClient;

  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!rawKey) {
    console.warn(
      "[sheets-server] GOOGLE_SERVICE_ACCOUNT_KEY não está definida. A escrita direta na planilha via Service Account está desabilitada (modo degradado)."
    );
    cachedClient = null;
    return cachedClient;
  }

  try {
    const credentials = JSON.parse(rawKey);
    cachedClient = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [SHEETS_SCOPE],
    });
    return cachedClient;
  } catch (err) {
    console.warn(
      "[sheets-server] Falha ao parsear GOOGLE_SERVICE_ACCOUNT_KEY. A escrita direta na planilha via Service Account está desabilitada (modo degradado).",
      err
    );
    cachedClient = null;
    return cachedClient;
  }
}

export function isServiceAccountConfigured(): boolean {
  return getServiceAccountClient() !== null;
}

async function sheetsFetch(url: string, options: RequestInit = {}) {
  const client = getServiceAccountClient();
  if (!client) {
    throw new Error("Service Account do Google Sheets não está configurada.");
  }

  const accessToken = await client.getAccessToken();
  if (!accessToken.token) {
    throw new Error("Não foi possível obter um access token da Service Account.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Sheets API request failed: ${response.status} - ${errText}`);
  }

  return response.json();
}

function getColLetter(index: number): string {
  let letter = "";
  let i = index;
  while (i >= 0) {
    letter = String.fromCharCode((i % 26) + 65) + letter;
    i = Math.floor(i / 26) - 1;
  }
  return letter;
}

const COLUMN_PATTERNS_MAP: { [key: string]: string[] } = {
  "data de abertura": ["abertura", "opened", "data de abertura", "aberto em", "data abertura"],
  "abertura em": ["abertura", "opened", "data de abertura", "aberto em", "data abertura"],
  "email opened alert": ["abertura", "opened", "email opened alert", "alerta abertura", "notificação abertura"],
  "alerta abertura": ["abertura", "opened", "email opened alert", "alerta abertura", "notificação abertura"],
};

// Server-side replica of the fuzzy header matching used in updateSheetRow (src/lib/google-api.ts),
// adapted to run with a Service Account JWT instead of a user access token.
export async function updateSheetRowAsServiceAccount(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  updates: { [key: string]: string }
): Promise<void> {
  const headersData = await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z1`
  );

  const headers: string[] = headersData.values?.[0] || [];
  const dataToUpdate: { range: string; values: string[][] }[] = [];

  for (const [colName, val] of Object.entries(updates)) {
    let colIndex = headers.findIndex((h) => h.trim().toLowerCase() === colName.toLowerCase());

    if (colIndex === -1) {
      colIndex = headers.findIndex((h) => {
        const norm = h.trim().toLowerCase();
        const isSearchingAlert =
          colName.toLowerCase().includes("alert") ||
          colName.toLowerCase().includes("alerta") ||
          colName.toLowerCase().includes("notif") ||
          colName.toLowerCase().includes("abertura") ||
          colName.toLowerCase().includes("retorno");
        return (
          norm.includes(colName.toLowerCase()) &&
          (isSearchingAlert || (!norm.includes("alert") && !norm.includes("alerta") && !norm.includes("notific")))
        );
      });
    }

    if (colIndex === -1) {
      const normalized = colName.trim().toLowerCase();
      const patterns = COLUMN_PATTERNS_MAP[normalized];
      if (patterns) {
        colIndex = headers.findIndex((h) => {
          const lowerH = h.toLowerCase().trim();
          return patterns.some((p) => lowerH.includes(p.toLowerCase()));
        });
      }
    }

    if (colIndex !== -1) {
      const colLetter = getColLetter(colIndex);
      dataToUpdate.push({
        range: `${sheetName}!${colLetter}${rowIndex}`,
        values: [[val]],
      });
    }
  }

  if (dataToUpdate.length === 0) return;

  await sheetsFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: dataToUpdate,
    }),
  });
}
