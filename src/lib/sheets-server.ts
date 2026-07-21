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

// Canonical column keys: exactly ONE set of patterns per target column, mirroring
// CANONICAL_COLUMN_PATTERNS in src/lib/google-api.ts, so a single updates{} entry
// can never resolve to more than one column (e.g. "Abertura" vs "Notif. Retorno").
const COLUMN_PATTERNS_MAP: { [key: string]: string[] } = {
  "abertura": ["abertura"],
  "notif. envio": ["notif. envio", "notificação envio", "alerta envio", "email sent alert"],
  "notif. retorno": ["notif. retorno", "notificação retorno", "alerta retorno", "email received alert"],
  "data do envio": ["data do envio", "data de envio", "date sent", "data envio"],
  "status": ["status pipeline", "status"],
};

// Server-side replica of the canonical header matching used in updateSheetRow (src/lib/google-api.ts),
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
    const normalized = colName.trim().toLowerCase();

    let colIndex = headers.findIndex((h) => h.trim().toLowerCase() === normalized);

    if (colIndex === -1) {
      const patterns = COLUMN_PATTERNS_MAP[normalized];
      if (patterns) {
        // Patterns are tried IN ORDER, exact matches first, mirroring
        // updateSheetRow in src/lib/google-api.ts — a high-priority pattern
        // always wins before a looser one can hit an unrelated header.
        for (const p of patterns) {
          colIndex = headers.findIndex((h) => h.toLowerCase().trim() === p.toLowerCase());
          if (colIndex !== -1) break;
        }
        if (colIndex === -1) {
          for (const p of patterns) {
            colIndex = headers.findIndex((h) => {
              const lowerH = h.toLowerCase().trim();
              return !lowerH.startsWith("#") && lowerH.includes(p.toLowerCase());
            });
            if (colIndex !== -1) break;
          }
        }
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
