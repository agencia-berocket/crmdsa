import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { BatchContact, MeetingRow, GmailAlias } from "../types";

// Initialize Firebase
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request the full scopes we need
provider.addScope("https://www.googleapis.com/auth/spreadsheets");
provider.addScope("https://www.googleapis.com/auth/gmail.send");
provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
provider.addScope("https://www.googleapis.com/auth/calendar");

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If logged in but no token, we can check if we can restore or ask for sign-in again
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in via Google popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Google OAuth");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Sign-in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Helper to make Google API requests
async function googleFetch(url: string, options: RequestInit = {}) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("No Google access token found. Please sign in again.");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errText = await response.text();
    console.error(`Google API Error for ${url}:`, errText);
    throw new Error(`Google API request failed: ${response.status} - ${errText}`);
  }

  return response.json();
}

/**
 * GOOGLE SHEETS FUNCTIONS
 */

// Fetch details about a spreadsheet
export async function fetchSpreadsheetInfo(spreadsheetId: string) {
  return googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);
}

// Fetch and parse the batches tab
export async function fetchBatches(spreadsheetId: string, sheetName = "batches"): Promise<BatchContact[]> {
  const data = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z2000`
  );
  
  const values: string[][] = data.values || [];
  if (values.length === 0) return [];

  const headers = values[0].map(h => h.trim());
  
  // Dynamic column detection
  const colIndex = {
    university: headers.findIndex((h) => h.toLowerCase().includes("university") || h.toLowerCase().includes("faculdade") || h.toLowerCase().includes("universidade") || h.toLowerCase().includes("escola")),
    studentOrganization: headers.findIndex(
      (h) =>
        h.toLowerCase().includes("student") ||
        h.toLowerCase().includes("organization") ||
        h.toLowerCase().includes("org") ||
        h.toLowerCase().includes("club") ||
        h.toLowerCase().includes("grupo")
    ),
    name: headers.findIndex((h) => h.toLowerCase().includes("name") || h.toLowerCase().includes("nome")),
    status: (() => {
      // Prioritize "Status Pipeline" (or bare "Status") over "Status Meetings",
      // which is a distinct column tracked separately (see statusMeetings below).
      const exactIdx = headers.findIndex((h) => {
        const norm = h.toLowerCase().trim();
        return norm === "status pipeline" || norm === "status";
      });
      if (exactIdx !== -1) return exactIdx;

      return headers.findIndex((h) => {
        const norm = h.toLowerCase();
        return (norm.includes("status") && !norm.includes("meeting")) || norm.includes("etapa");
      });
    })(),
    email: (() => {
      // Prioritize finding a column containing "email", "e-mail" (excluding alerts)
      const exactEmailIdx = headers.findIndex((h) => {
        const norm = h.toLowerCase();
        return (
          norm.includes("email") || 
          norm.includes("e-mail")
        ) && !norm.includes("alert") && !norm.includes("alerta") && !norm.includes("notific");
      });
      if (exactEmailIdx !== -1) return exactEmailIdx;
      
      // Try finding a column containing "contato" or "contact", but NEVER match Column A (index 0) to prevent email overwriting college
      const contactIdx = headers.findIndex((h, idx) => {
        const norm = h.toLowerCase();
        return (
          (norm.includes("contato") || norm.includes("contact")) &&
          idx !== 0 &&
          !norm.includes("alert") && !norm.includes("alerta") && !norm.includes("notific")
        );
      });
      if (contactIdx !== -1) return contactIdx;

      // Secondary Fallback: look for "sent" or "envio" columns (excluding alerts and "data"/"date")
      const sentIdx = headers.findIndex((h) => {
        const norm = h.toLowerCase();
        return (norm.includes("sent") || norm.includes("envio")) && 
               !norm.includes("alert") && !norm.includes("alerta") && !norm.includes("notific") &&
               !norm.includes("data") && !norm.includes("date");
      });
      if (sentIdx !== -1) return sentIdx;

      // Strict fallback to Column H (index 7) as specified by the user
      return 7;
    })(),
    emailSent: (() => {
      // Prioritize exact/fuzzy match for send date column
      const exactSentIdx = headers.findIndex((h) => {
        const norm = h.toLowerCase().trim();
        return norm === "data de envio" || norm === "data do envio" || norm === "data envio" || norm === "enviado em" || norm === "date sent" || norm === "email sent" || norm === "ultimo envio" || norm === "último envio";
      });
      if (exactSentIdx !== -1) return exactSentIdx;

      // Find a column for date sent: contains "sent" or "envio" or "data" / "date"
      // but does NOT contain email / contato / alert / notification keywords
      const dateSentIdx = headers.findIndex((h) => {
        const norm = h.toLowerCase();
        return (norm.includes("sent") || norm.includes("envio") || norm.includes("data") || norm.includes("date")) && 
               !norm.includes("alert") && !norm.includes("alerta") && !norm.includes("notific") &&
               (norm !== "email" && norm !== "e-mail" && norm !== "contato");
      });
      return dateSentIdx;
    })(),
    notes: headers.findIndex((h) => h.toLowerCase().includes("note") || h.toLowerCase().includes("anotação") || h.toLowerCase().includes("obs")),
    emailSentAlert: headers.findIndex(
      (h) =>
        h.toLowerCase().includes("alerta envio") ||
        h.toLowerCase().includes("notificação envio") ||
        h.toLowerCase().includes("sent alert") ||
        h.toLowerCase().includes("email sent alert") ||
        h.toLowerCase().includes("alerta_envio") ||
        h.toLowerCase().includes("notificacao envio") ||
        h.toLowerCase().includes("envio notificação") ||
        h.toLowerCase().includes("envio notificacao") ||
        h.toLowerCase().includes("notif. envio")
    ),
    emailReceivedAlert: headers.findIndex(
      (h) =>
        h.toLowerCase().includes("alerta retorno") ||
        h.toLowerCase().includes("alerta recebido") ||
        h.toLowerCase().includes("notificação retorno") ||
        h.toLowerCase().includes("notificação recebido") ||
        h.toLowerCase().includes("received alert") ||
        h.toLowerCase().includes("email received alert") ||
        h.toLowerCase().includes("alerta_retorno") ||
        h.toLowerCase().includes("notificacao retorno") ||
        h.toLowerCase().includes("notificacao recebido") ||
        h.toLowerCase().includes("retorno notificação") ||
        h.toLowerCase().includes("retorno notificacao") ||
        h.toLowerCase().includes("notif. retorno")
    ),
    emailOpenedAlert: headers.findIndex(
      (h) =>
        h.toLowerCase().includes("alerta abertura") ||
        h.toLowerCase().includes("notificação abertura") ||
        h.toLowerCase().includes("opened alert") ||
        h.toLowerCase().includes("email opened alert") ||
        h.toLowerCase().includes("alerta_abertura") ||
        h.toLowerCase().includes("notificacao abertura") ||
        h.toLowerCase().includes("abertura notificação") ||
        h.toLowerCase().includes("abertura notificacao") ||
        h.toLowerCase().includes("abertura")
    ),
    dataEnvio: headers.findIndex((h) => {
      const norm = h.toLowerCase().trim();
      return (
        (norm === "data de envio" || norm === "data do envio" || norm === "data envio" || norm === "enviado em" || norm === "date sent" || norm === "ultimo envio" || norm === "último envio") &&
        !norm.includes("alert") && !norm.includes("alerta") && !norm.includes("notific")
      );
    }),
    dataAbertura: headers.findIndex((h) => {
      const norm = h.toLowerCase().trim();
      return (
        (norm === "data de abertura" || norm === "abertura em" || norm === "aberto em" || norm === "data abertura" || norm === "opened at" || norm === "open date" || norm === "date opened") &&
        !norm.includes("alert") && !norm.includes("alerta") && !norm.includes("notific")
      );
    }),
    dataRetorno: headers.findIndex((h) => {
      const norm = h.toLowerCase().trim();
      return (
        (norm === "data de retorno" || norm === "data retorno" || norm === "resposta em" || norm === "retorno em" || norm === "replied at" || norm === "reply date" || norm === "date replied") &&
        !norm.includes("alert") && !norm.includes("alerta") && !norm.includes("notific")
      );
    }),
    meetingConfirmationStatus: headers.findIndex((h) => {
      const norm = h.toLowerCase().trim();
      return norm.includes("confirmação reunião") || norm.includes("confirmacao reuniao") || norm.includes("meeting confirmation");
    }),
    meetingDateTime: headers.findIndex((h) => {
      const norm = h.toLowerCase().trim();
      return norm.includes("meeting date") || norm.includes("data da reunião") || norm.includes("data da reuniao");
    }),
    role: headers.findIndex((h) => h.toLowerCase().trim() === "role" || h.toLowerCase().trim() === "cargo"),
    statusMeetings: headers.findIndex((h) => h.toLowerCase().trim() === "status meetings" || h.toLowerCase().trim() === "status meeting"),
    suggestedTimes: headers.findIndex((h) => h.toLowerCase().trim() === "suggested times" || h.toLowerCase().trim() === "horários sugeridos"),
    bookedTime: headers.findIndex((h) => h.toLowerCase().trim() === "booked time" || h.toLowerCase().trim() === "horário confirmado"),
    notesMeetings: headers.findIndex((h) => h.toLowerCase().trim() === "notes meetings" || h.toLowerCase().trim() === "notes meeting"),
    meetingConfirmation: headers.findIndex((h) => h.toLowerCase().trim() === "meeting confirmation"),
    meetingInvitationSentOn: headers.findIndex((h) => h.toLowerCase().trim() === "meeting invitation sent on"),
  };

  // Build rows (rowIndex starts at 2 for Sheets row index, since header is row 1)
  const contacts: BatchContact[] = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const valAt = (idx: number) => (idx !== -1 && idx < row.length ? row[idx] || "" : "");

    contacts.push({
      rowIndex: i + 1,
      university: valAt(colIndex.university),
      studentOrganization: valAt(colIndex.studentOrganization),
      name: valAt(colIndex.name),
      status: valAt(colIndex.status),
      email: valAt(colIndex.email),
      emailSent: valAt(colIndex.emailSent),
      notes: valAt(colIndex.notes),
      emailSentAlert: valAt(colIndex.emailSentAlert),
      emailReceivedAlert: valAt(colIndex.emailReceivedAlert),
      emailOpenedAlert: valAt(colIndex.emailOpenedAlert),
      dataEnvio: valAt(colIndex.dataEnvio),
      dataAbertura: valAt(colIndex.dataAbertura),
      dataRetorno: valAt(colIndex.dataRetorno),
      meetingConfirmationStatus: valAt(colIndex.meetingConfirmationStatus),
      meetingDateTime: valAt(colIndex.meetingDateTime),
      role: valAt(colIndex.role),
      statusMeetings: valAt(colIndex.statusMeetings),
      suggestedTimes: valAt(colIndex.suggestedTimes),
      bookedTime: valAt(colIndex.bookedTime),
      notesMeetings: valAt(colIndex.notesMeetings),
      meetingConfirmation: valAt(colIndex.meetingConfirmation),
      meetingInvitationSentOn: valAt(colIndex.meetingInvitationSentOn),
    });
  }

  return contacts;
}

// Fetch and parse the meetings tab
export async function fetchMeetings(spreadsheetId: string, sheetName = "meetings"): Promise<MeetingRow[]> {
  const data = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z2000`
  );

  const values: string[][] = data.values || [];
  if (values.length === 0) return [];

  const headers = values[0].map(h => h.trim());

  // Dynamic column detection
  const colIndex = {
    email: headers.findIndex((h) => h.toLowerCase().includes("email") || h.toLowerCase().includes("contato")),
    suggestedTimes: headers.findIndex((h) => h.toLowerCase().includes("suggested") || h.toLowerCase().includes("sugerido")),
    bookedTime: headers.findIndex((h) => h.toLowerCase().includes("booked") || h.toLowerCase().includes("marcado") || h.toLowerCase().includes("data")),
    notes: headers.findIndex((h) => h.toLowerCase().includes("note") || h.toLowerCase().includes("anotação") || h.toLowerCase().includes("obs")),
    status: headers.findIndex((h) => h.toLowerCase().includes("status")),
    emailSentAlert: headers.findIndex(
      (h) =>
        h.toLowerCase().includes("alerta envio") ||
        h.toLowerCase().includes("notificação envio") ||
        h.toLowerCase().includes("sent alert") ||
        h.toLowerCase().includes("email sent alert") ||
        h.toLowerCase().includes("alerta_envio") ||
        h.toLowerCase().includes("notificacao envio") ||
        h.toLowerCase().includes("envio notificação") ||
        h.toLowerCase().includes("envio notificacao") ||
        h.toLowerCase().includes("notif. envio")
    ),
    emailReceivedAlert: headers.findIndex(
      (h) =>
        h.toLowerCase().includes("alerta retorno") ||
        h.toLowerCase().includes("alerta recebido") ||
        h.toLowerCase().includes("notificação retorno") ||
        h.toLowerCase().includes("notificação recebido") ||
        h.toLowerCase().includes("received alert") ||
        h.toLowerCase().includes("email received alert") ||
        h.toLowerCase().includes("alerta_retorno") ||
        h.toLowerCase().includes("notificacao retorno") ||
        h.toLowerCase().includes("notificacao recebido") ||
        h.toLowerCase().includes("retorno notificação") ||
        h.toLowerCase().includes("retorno notificacao") ||
        h.toLowerCase().includes("notif. retorno")
    ),
    emailOpenedAlert: headers.findIndex(
      (h) =>
        h.toLowerCase().includes("alerta abertura") ||
        h.toLowerCase().includes("notificação abertura") ||
        h.toLowerCase().includes("opened alert") ||
        h.toLowerCase().includes("email opened alert") ||
        h.toLowerCase().includes("alerta_abertura") ||
        h.toLowerCase().includes("notificacao abertura") ||
        h.toLowerCase().includes("abertura notificação") ||
        h.toLowerCase().includes("abertura notificacao") ||
        h.toLowerCase().includes("abertura")
    ),
    dataEnvio: headers.findIndex((h) => {
      const norm = h.toLowerCase().trim();
      return (
        (norm === "data de envio" || norm === "data do envio" || norm === "data envio" || norm === "enviado em" || norm === "date sent" || norm === "ultimo envio" || norm === "último envio") &&
        !norm.includes("alert") && !norm.includes("alerta") && !norm.includes("notific")
      );
    }),
    dataAbertura: headers.findIndex((h) => {
      const norm = h.toLowerCase().trim();
      return (
        (norm === "data de abertura" || norm === "abertura em" || norm === "aberto em" || norm === "data abertura" || norm === "opened at" || norm === "open date" || norm === "date opened") &&
        !norm.includes("alert") && !norm.includes("alerta") && !norm.includes("notific")
      );
    }),
    dataRetorno: headers.findIndex((h) => {
      const norm = h.toLowerCase().trim();
      return (
        (norm === "data de retorno" || norm === "data retorno" || norm === "resposta em" || norm === "retorno em" || norm === "replied at" || norm === "reply date" || norm === "date replied") &&
        !norm.includes("alert") && !norm.includes("alerta") && !norm.includes("notific")
      );
    }),
    meetingConfirmationStatus: headers.findIndex((h) => {
      const norm = h.toLowerCase().trim();
      return norm.includes("confirmação reunião") || norm.includes("confirmacao reuniao") || norm.includes("meeting confirmation");
    }),
    meetingDateTime: headers.findIndex((h) => {
      const norm = h.toLowerCase().trim();
      return norm.includes("meeting date") || norm.includes("data da reunião") || norm.includes("data da reuniao");
    }),
  };

  const meetings: MeetingRow[] = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const valAt = (idx: number) => (idx !== -1 && idx < row.length ? row[idx] || "" : "");

    meetings.push({
      rowIndex: i + 1,
      email: valAt(colIndex.email),
      suggestedTimes: valAt(colIndex.suggestedTimes),
      bookedTime: valAt(colIndex.bookedTime),
      notes: valAt(colIndex.notes),
      status: valAt(colIndex.status),
      emailSentAlert: valAt(colIndex.emailSentAlert),
      emailReceivedAlert: valAt(colIndex.emailReceivedAlert),
      emailOpenedAlert: valAt(colIndex.emailOpenedAlert),
      dataEnvio: valAt(colIndex.dataEnvio),
      dataAbertura: valAt(colIndex.dataAbertura),
      dataRetorno: valAt(colIndex.dataRetorno),
      meetingConfirmationStatus: valAt(colIndex.meetingConfirmationStatus),
      meetingDateTime: valAt(colIndex.meetingDateTime),
    });
  }

  return meetings;
}

// Update a single cell in Google Sheets (e.g., Status or Notes)
export async function updateSheetCell(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  columnName: string,
  newValue: string
) {
  // First, retrieve headers to find the correct column index letter (A, B, C...)
  const headersData = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z1`
  );
  
  const headers: string[] = headersData.values?.[0] || [];
  let colIndex = headers.findIndex((h) => h.trim().toLowerCase().includes(columnName.toLowerCase()));

  if (colIndex === -1) {
    const normalized = columnName.trim().toLowerCase();
    const patternsMap: { [key: string]: string[] } = {
      "university": ["university", "faculdade", "universidade", "escola"],
      "student organization": ["student", "organization", "org", "club", "grupo", "entidade"],
      "name": ["name", "nome", "estudante", "aluno"],
      "status": ["status", "etapa", "fase"],
      "notes": ["note", "anotação", "obs", "observações", "comentário"],
      "email sent": ["email", "e-mail", "contato", "contact", "sent", "envio"],
      "email": ["email", "e-mail", "contato", "contact"],
      "suggested times": ["suggested", "sugerido", "horários"],
      "booked time": ["booked", "marcado", "data", "horário confirmado"],
    };

    const patterns = patternsMap[normalized];
    if (patterns) {
      colIndex = headers.findIndex((h) => {
        const lowerH = h.toLowerCase().trim();
        return (
          patterns.some((p) => lowerH.includes(p.toLowerCase())) &&
          !lowerH.includes("alert") &&
          !lowerH.includes("alerta") &&
          !lowerH.includes("notific")
        );
      });
    }
  }

  if (colIndex === -1) {
    throw new Error(`Column "${columnName}" not found in sheet "${sheetName}". Available headers: ${headers.join(", ")}`);
  }

  // Convert column index to sheet letter (e.g., 0 -> A, 1 -> B, 25 -> Z, 26 -> AA)
  const getColLetter = (index: number): string => {
    let letter = "";
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  };

  const colLetter = getColLetter(colIndex);
  const range = `${sheetName}!${colLetter}${rowIndex}`;

  return googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      body: JSON.stringify({
        range,
        majorDimension: "ROWS",
        values: [[newValue]],
      }),
    }
  );
}

// Bulk update multiple columns/cells for a specific row
export async function updateSheetRow(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  updates: { [key: string]: string }
) {
  // Retrieve headers to find corresponding column indexes
  const headersData = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z1`
  );
  
  const headers: string[] = headersData.values?.[0] || [];
  
  const getColLetter = (index: number): string => {
    let letter = "";
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  };

  const dataToUpdate = [];

  // Canonical column keys: exactly ONE set of patterns per target column, with no
  // overlap between them, so a single updates{} entry can never resolve to more
  // than one column or collide with a different concept (e.g. "Notif. Envio" vs
  // "Data do Envio" vs "Notif. Retorno"). Callers should pass one of these exact
  // canonical keys (case-insensitive) per column they intend to write.
  const CANONICAL_COLUMN_PATTERNS: { [key: string]: string[] } = {
    "university": ["university", "faculdade", "universidade", "escola"],
    "student organization": ["student", "organization", "org", "club", "grupo", "entidade"],
    "name": ["name", "nome", "estudante", "aluno"],
    "status": ["status pipeline", "status"],
    "notes": ["note", "anotação", "obs", "observações", "comentário"],
    "email": ["email", "e-mail"],
    "data do envio": ["data do envio", "data de envio", "date sent", "data envio"],
    "notif. envio": ["notif. envio", "notificação envio", "alerta envio", "email sent alert"],
    "abertura": ["abertura"],
    "notif. retorno": ["notif. retorno", "notificação retorno", "alerta retorno", "email received alert"],
    "suggested times": ["suggested", "sugerido", "horários sugeridos"],
    "booked time": ["booked time", "horário confirmado", "marcado"],
    "status meetings": ["status meetings", "status meeting"],
    "meeting confirmation": ["confirmação reunião", "confirmacao reuniao", "meeting confirmation"],
  };

  for (const [colName, val] of Object.entries(updates)) {
    const normalized = colName.trim().toLowerCase();

    // 1. Exact header match (case-insensitive) — the safest and preferred path.
    let colIndex = headers.findIndex((h) => h.trim().toLowerCase() === normalized);

    // 2. Canonical pattern match — only if the caller used one of the known
    // canonical keys above. Each key's patterns are unique to that column, so
    // this cannot collide with another target column.
    if (colIndex === -1) {
      const patterns = CANONICAL_COLUMN_PATTERNS[normalized];
      if (patterns) {
        colIndex = headers.findIndex((h) => {
          const lowerH = h.toLowerCase().trim();
          return patterns.some((p) => lowerH === p.toLowerCase() || lowerH.includes(p.toLowerCase()));
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

  // Execute batchUpdate
  return googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: dataToUpdate,
      }),
    }
  );
}

// Dynamically maps standard lead keys to actual headers in the sheet and appends a new row
export async function addBatchLead(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number, // kept for backward compatibility signature, though append handles indexing
  leadData: {
    university: string;
    studentOrganization: string;
    name: string;
    status: string;
    notes: string;
    email?: string;
  }
) {
  // Fetch headers first to do fuzzy mapping and locate column indices
  const headersData = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z1`
  );
  
  const headers: string[] = headersData.values?.[0] || [];

  const univIdx = headers.findIndex((h) => h.toLowerCase().includes("university") || h.toLowerCase().includes("faculdade") || h.toLowerCase().includes("universidade"));
  const orgIdx = headers.findIndex((h) => h.toLowerCase().includes("student") || h.toLowerCase().includes("organization") || h.toLowerCase().includes("org") || h.toLowerCase().includes("grupo"));
  const nameIdx = headers.findIndex((h) => h.toLowerCase().includes("name") || h.toLowerCase().includes("nome"));
  const statusIdx = (() => {
    const exactIdx = headers.findIndex((h) => {
      const norm = h.toLowerCase().trim();
      return norm === "status pipeline" || norm === "status";
    });
    if (exactIdx !== -1) return exactIdx;

    return headers.findIndex((h) => {
      const norm = h.toLowerCase();
      return (norm.includes("status") && !norm.includes("meeting")) || norm.includes("etapa");
    });
  })();
  const notesIdx = headers.findIndex((h) => h.toLowerCase().includes("note") || h.toLowerCase().includes("anotação") || h.toLowerCase().includes("obs"));
  
  const emailSentIdx = headers.findIndex((h) => {
    const norm = h.toLowerCase().trim();
    return (norm.includes("sent") || norm.includes("envio") || norm.includes("data") || norm.includes("date")) && 
           !norm.includes("email") && !norm.includes("e-mail") && !norm.includes("contato") && !norm.includes("contact") &&
           !norm.includes("alert") && !norm.includes("alerta") && !norm.includes("notific");
  });

  const emailIdx = (() => {
    const exactEmailIdx = headers.findIndex((h) => {
      const norm = h.toLowerCase().trim();
      return (norm.includes("email") || norm.includes("e-mail")) && 
             !norm.includes("alert") && !norm.includes("alerta") && !norm.includes("notific");
    });
    if (exactEmailIdx !== -1) return exactEmailIdx;

    // Search for contato or contact but strictly prevent matching Column A (index 0)
    const contactIdx = headers.findIndex((h, idx) => {
      const norm = h.toLowerCase().trim();
      return (norm.includes("contato") || norm.includes("contact")) && 
             idx !== 0 &&
             !norm.includes("alert") && !norm.includes("alerta") && !norm.includes("notific");
    });
    if (contactIdx !== -1) return contactIdx;

    return 7; // Default to Column H (index 7)
  })();

  // Build the row array matching the sheet's structure
  let rowValues: string[] = [];
  if (headers.length > 0) {
    const maxIdx = Math.max(univIdx, orgIdx, nameIdx, statusIdx, notesIdx, emailIdx, emailSentIdx, headers.length - 1, 7);
    rowValues = Array(maxIdx + 1).fill("");
    
    if (univIdx !== -1) rowValues[univIdx] = leadData.university;
    if (orgIdx !== -1) rowValues[orgIdx] = leadData.studentOrganization;
    if (nameIdx !== -1) rowValues[nameIdx] = leadData.name;
    if (statusIdx !== -1) rowValues[statusIdx] = leadData.status;
    if (notesIdx !== -1) rowValues[notesIdx] = leadData.notes;
    
    // Note: emailSentIdx (Notif. Envio / Data do Envio) is intentionally left blank here —
    // it must only be filled after a real email send (see updateSheetRow calls in BatchSendTab).
    if (emailIdx !== -1) {
      rowValues[emailIdx] = leadData.email || "";
    }
  } else {
    // Fallback if sheet is completely empty without headers (creates exactly the standard 8 columns structure)
    rowValues = [
      leadData.university,          // Column A (index 0)
      leadData.studentOrganization,  // Column B (index 1)
      leadData.name,                 // Column C (index 2)
      leadData.status,               // Column D (index 3)
      leadData.notes,                // Column E (index 4)
      "",                            // Column F (index 5) - Alerta Envio
      "",                            // Column G (index 6) - Alerta Retorno
      leadData.email || ""           // Column H (index 7) - Email Sent (the email address)
    ];
  }

  // Append values dynamically, which automatically expands the spreadsheet grid bounds if needed
  return googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      body: JSON.stringify({
        range: `${sheetName}!A1`,
        majorDimension: "ROWS",
        values: [rowValues],
      }),
    }
  );
}

// Dynamically maps meeting lead keys to actual headers in the sheet and appends a new row
export async function addMeetingLead(
  spreadsheetId: string,
  sheetName: string,
  leadData: {
    email: string;
    suggestedTimes: string;
    bookedTime: string;
    status: string;
    notes: string;
  }
) {
  // Fetch headers first to do fuzzy mapping and locate column indices
  const headersData = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z1`
  );
  
  const headers: string[] = headersData.values?.[0] || [];

  const findHeaderIndex = (patterns: string[]): number => {
    return headers.findIndex(h => 
      patterns.some(p => h.toLowerCase().trim().includes(p.toLowerCase()))
    );
  };

  const emailIdx = findHeaderIndex(["email", "contato"]);
  const sugIdx = findHeaderIndex(["suggested", "sugerido"]);
  const bookIdx = findHeaderIndex(["booked", "marcado", "data"]);
  const statusIdx = findHeaderIndex(["status"]);
  const notesIdx = findHeaderIndex(["note", "anotação", "obs", "observações", "comentário"]);

  // Build the row array matching the sheet's structure
  let rowValues: string[] = [];
  if (headers.length > 0) {
    const maxIdx = Math.max(emailIdx, sugIdx, bookIdx, statusIdx, notesIdx, headers.length - 1);
    rowValues = Array(maxIdx + 1).fill("");
    
    if (emailIdx !== -1) rowValues[emailIdx] = leadData.email;
    if (sugIdx !== -1) rowValues[sugIdx] = leadData.suggestedTimes;
    if (bookIdx !== -1) rowValues[bookIdx] = leadData.bookedTime;
    if (statusIdx !== -1) rowValues[statusIdx] = leadData.status;
    if (notesIdx !== -1) rowValues[notesIdx] = leadData.notes;
  } else {
    // Fallback if sheet is completely empty without headers
    rowValues = [
      leadData.email,
      leadData.suggestedTimes,
      leadData.bookedTime,
      leadData.notes,
      leadData.status
    ];
  }

  // Append values dynamically, which automatically expands the spreadsheet grid bounds if needed
  return googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      body: JSON.stringify({
        range: `${sheetName}!A1`,
        majorDimension: "ROWS",
        values: [rowValues],
      }),
    }
  );
}


/**
 * GMAIL FUNCTIONS
 */

// Fetch configured SendAs Aliases
export async function fetchGmailAliases(): Promise<GmailAlias[]> {
  try {
    const data = await googleFetch("https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs");
    const sendAsList = data.sendAs || [];
    
    return sendAsList.map((alias: any) => ({
      sendAsEmail: alias.sendAsEmail,
      displayName: alias.displayName || "",
      isDefault: alias.isDefault || false,
    }));
  } catch (error) {
    console.warn("Could not load Gmail sendAs aliases, defaulting to profile email:", error);
    // Return empty list or fall back gracefully
    return [];
  }
}

// Get primary user email profile
export async function fetchUserProfile(): Promise<{ emailAddress: string }> {
  return googleFetch("https://gmail.googleapis.com/gmail/v1/users/me/profile");
}

// Send email using Gmail API (with custom From alias and tracking pixel)
export async function sendGmailMessage(
  to: string,
  subject: string,
  bodyHtml: string,
  fromEmail?: string,
  fromName?: string
) {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  
  // Format From header based on alias
  const fromHeader = fromEmail
    ? fromName 
      ? `From: "${fromName}" <${fromEmail}>`
      : `From: ${fromEmail}`
    : "";

  const parts = [
    `To: ${to}`,
    fromHeader,
    `Subject: ${utf8Subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    bodyHtml,
  ].filter(line => line !== "");

  const message = parts.join("\r\n");
  
  // Base64URL encode standard RFC 2822 format
  const base64SafeMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return googleFetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    body: JSON.stringify({
      raw: base64SafeMessage,
    }),
  });
}

// Search Gmail for Bounces (Delivery failure alerts)
export async function searchBounces(): Promise<{ sender: string; recipient: string; subject: string; date: string }[]> {
  // Query for mailer-daemon, postmaster, or typical bounce headers
  const query = "from:(mailer-daemon OR postmaster) (subject:\"delivery status notification\" OR subject:\"undeliverable\" OR subject:\"failed\")";
  const searchResult = await googleFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=30`
  );

  const messages = searchResult.messages || [];
  const bounceDetails: { sender: string; recipient: string; subject: string; date: string }[] = [];

  for (const msg of messages) {
    const detail = await googleFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`);
    const headers: any[] = detail.payload.headers || [];
    
    const subject = headers.find((h) => h.name.toLowerCase() === "subject")?.value || "";
    const date = headers.find((h) => h.name.toLowerCase() === "date")?.value || "";
    const from = headers.find((h) => h.name.toLowerCase() === "from")?.value || "";
    
    // Attempt to parse failed recipient from headers or snippet
    let failedEmail = "";
    
    // Check specific bounce headers first
    const failedRecipientHeader = headers.find((h) => h.name.toLowerCase() === "x-failed-recipients")?.value;
    if (failedRecipientHeader) {
      failedEmail = failedRecipientHeader.trim();
    } else {
      // RegEx match on snippet or body
      const bodyText = detail.snippet + " " + (detail.payload.body?.data ? atob(detail.payload.body.data.replace(/-/g, "+").replace(/_/g, "/")) : "");
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = bodyText.match(emailRegex);
      if (matches) {
        // Find the first email that is NOT mailer-daemon, postmaster, or user email
        const userProfile = await fetchUserProfile().catch(() => ({ emailAddress: "" }));
        const matched = matches.find(
          (email) =>
            !email.toLowerCase().includes("mailer-daemon") &&
            !email.toLowerCase().includes("postmaster") &&
            email.toLowerCase() !== userProfile.emailAddress.toLowerCase()
        );
        if (matched) {
          failedEmail = matched;
        }
      }
    }

    if (failedEmail) {
      bounceDetails.push({
        sender: from,
        recipient: failedEmail.toLowerCase(),
        subject,
        date,
      });
    }
  }

  return bounceDetails;
}

// Helper to recursively get text content from Gmail parts
function getMessageBody(payload: any): string {
  let body = "";
  if (payload.body && payload.body.data) {
    try {
      const base64 = payload.body.data.replace(/-/g, "+").replace(/_/g, "/");
      body += decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    } catch (e) {
      try {
        body += atob(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
      } catch (e2) {
        // ignore
      }
    }
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      body += getMessageBody(part);
    }
  }
  return body;
}

// Search Gmail for Replies from contacts (returns array of objects with email and optional matched rowIndex)
export async function searchReplies(contactsEmails: string[]): Promise<{ email: string; rowIndex?: number }[]> {
  if (contactsEmails.length === 0) return [];
  
  // Search unread or inbox messages containing our custom hidden tag "DSA-ID" or from our contact list, excluding ourselves
  const batchEmailsQuery = contactsEmails.slice(0, 30).map(email => `from:${email}`).join(" OR ");
  const query = `(DSA-ID${batchEmailsQuery ? " OR " + batchEmailsQuery : ""}) -from:me`;
  
  const searchResult = await googleFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`
  );

  const messages = searchResult.messages || [];
  const resultsMap = new Map<string, { email: string; rowIndex?: number }>();

  for (const msg of messages) {
    try {
      const detail = await googleFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`);
      const headers: any[] = detail.payload.headers || [];
      const fromHeader = headers.find((h) => h.name.toLowerCase() === "from")?.value || "";
      
      // Extract raw email address
      const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
      const email = (emailMatch[1] || fromHeader).trim().toLowerCase();
      
      // Check the decoded body for the hidden tag "[DSA-ID:row]"
      const bodyText = getMessageBody(detail.payload) + " " + (detail.snippet || "");
      const dsaMatch = bodyText.match(/\[DSA-ID:(\d+)\]/);
      
      if (dsaMatch) {
        const rowIndex = parseInt(dsaMatch[1]);
        resultsMap.set(email, { email, rowIndex });
      } else if (contactsEmails.map(e => e.toLowerCase()).includes(email)) {
        // Fallback to standard email-based matching
        if (!resultsMap.has(email)) {
          resultsMap.set(email, { email });
        }
      }
    } catch (error) {
      console.warn(`Could not parse message details for ID ${msg.id}:`, error);
    }
  }

  return Array.from(resultsMap.values());
}


/**
 * GOOGLE CALENDAR FUNCTIONS
 */

// Fetch active calendar events and link with meeting slots
export async function fetchCalendarMeetings(): Promise<{ email: string; startTime: string; eventTitle: string; responseStatus: string }[]> {
  const nowStr = new Date().toISOString();
  // Fetch events from now onwards
  const data = await googleFetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(nowStr)}&singleEvents=true&orderBy=startTime&maxResults=50`
  );

  const events = data.items || [];
  const calendarMeetings: { email: string; startTime: string; eventTitle: string; responseStatus: string }[] = [];

  for (const event of events) {
    const attendees: any[] = event.attendees || [];
    const startTime = event.start?.dateTime || event.start?.date || "";
    const eventTitle = event.summary || "Reunião de Prospecção";

    for (const attendee of attendees) {
      if (attendee.email && !attendee.self) {
        calendarMeetings.push({
          email: attendee.email.toLowerCase(),
          startTime: new Date(startTime).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          eventTitle,
          responseStatus: attendee.responseStatus || "needsAction",
        });
      }
    }
  }

  return calendarMeetings;
}

// Map a raw Google Calendar attendee responseStatus into a friendly PT/EN label to persist in Sheets
export function mapConfirmationStatusLabel(responseStatus: string, locale: "pt" | "en" = "pt"): string {
  const normalized = (responseStatus || "").toLowerCase().trim();
  if (normalized === "accepted") return locale === "pt" ? "Confirmada" : "Confirmed";
  if (normalized === "declined") return locale === "pt" ? "Recusada" : "Declined";
  if (normalized === "tentative") return locale === "pt" ? "Talvez" : "Tentative";
  return locale === "pt" ? "Pendente" : "Pending";
}

// Query Google Calendar Freebusy and return open slots within business hours
export async function fetchFreeBusySlots(params: {
  daysAhead?: number;
  workHourStart?: number;
  workHourEnd?: number;
  slotMinutes?: number;
} = {}): Promise<{ start: string; end: string }[]> {
  const { daysAhead = 7, workHourStart = 9, workHourEnd = 18, slotMinutes = 30 } = params;

  const now = new Date();
  const timeMin = new Date(now.getTime() + 60 * 60 * 1000); // start suggesting from 1h from now
  const timeMax = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const data = await googleFetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: "primary" }],
    }),
  });

  const busy: { start: string; end: string }[] = data.calendars?.primary?.busy || [];
  const busyRanges = busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));

  const overlapsBusy = (slotStart: Date, slotEnd: Date) =>
    busyRanges.some((b) => slotStart < b.end && slotEnd > b.start);

  const slots: { start: string; end: string }[] = [];
  const cursor = new Date(timeMin);
  cursor.setMinutes(Math.ceil(cursor.getMinutes() / slotMinutes) * slotMinutes, 0, 0);

  while (cursor < timeMax) {
    const dayOfWeek = cursor.getDay();
    const isWeekday = dayOfWeek !== 0 && dayOfWeek !== 6;
    const hour = cursor.getHours();

    if (isWeekday && hour >= workHourStart && hour < workHourEnd) {
      const slotEnd = new Date(cursor.getTime() + slotMinutes * 60 * 1000);
      if (!overlapsBusy(cursor, slotEnd)) {
        slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString() });
      }
    }

    cursor.setMinutes(cursor.getMinutes() + slotMinutes);
  }

  return slots;
}

// Create a new Google Calendar event and send an invite email to the attendee
export async function createCalendarEvent(params: {
  summary: string;
  description?: string;
  attendeeEmail: string;
  startDateTime: string; // ISO string
  durationMinutes?: number;
}) {
  const { summary, description, attendeeEmail, startDateTime, durationMinutes = 30 } = params;

  const start = new Date(startDateTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  return googleFetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
    {
      method: "POST",
      body: JSON.stringify({
        summary,
        description: description || "",
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        attendees: [{ email: attendeeEmail }],
      }),
    }
  );
}
