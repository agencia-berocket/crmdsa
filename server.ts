import dotenv from "dotenv";
// Load server-side env vars in local dev (Coolify injects them directly in
// production). Without this, GOOGLE_SERVICE_ACCOUNT_KEY / APP_URL defined in
// .env.local are silently invisible to the Express process.
dotenv.config({ path: [".env.local", ".env"], quiet: true });

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { updateSheetRowAsServiceAccount } from "./src/lib/sheets-server";

interface TrackEvent {
  email: string;
  spreadsheetId: string;
  row: string;
  openedAt: string;
}

// In-memory buffer for tracking events
let trackedOpens: TrackEvent[] = [];

// In-memory buffer of unsubscribe requests
let unsubscribedEmails: { email: string; spreadsheetId: string; row: string; unsubscribedAt: string }[] = [];

// Best-effort persistence of the event buffers, so opens/unsubscribes captured
// while nobody has the CRM open in a browser survive a server restart. On
// Coolify this only spans restarts within the same container unless the data
// dir is volume-mounted — the Service Account direct write remains the primary
// durable path; this file is the fallback for the browser-consumed buffer.
const DATA_DIR = process.env.TRACKING_DATA_DIR || path.join(process.cwd(), "data");
const EVENTS_FILE = path.join(DATA_DIR, "tracking-events.json");

function loadPersistedEvents() {
  try {
    const raw = fs.readFileSync(EVENTS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.trackedOpens)) trackedOpens = parsed.trackedOpens;
    if (Array.isArray(parsed.unsubscribedEmails)) unsubscribedEmails = parsed.unsubscribedEmails;
  } catch {
    // Missing or corrupt file: start with empty buffers.
  }
}

function persistEvents() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(EVENTS_FILE, JSON.stringify({ trackedOpens, unsubscribedEmails }), "utf-8");
  } catch (err) {
    console.warn("[server] Não foi possível persistir eventos de rastreamento em disco:", err);
  }
}

const LEGAL_PAGE_STYLE = `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 48px 24px; color: #1f2937; line-height: 1.6; }
  h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
  h2 { font-size: 1.15rem; margin-top: 2rem; }
  .meta { color: #6b7280; font-size: 0.9rem; margin-bottom: 2rem; }
  a { color: #2563eb; }
`;

const PRIVACY_POLICY_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Política de Privacidade - DSA CRM</title>
  <style>${LEGAL_PAGE_STYLE}</style>
</head>
<body>
  <h1>Política de Privacidade</h1>
  <p class="meta">The Data Savings Act (DSA CRM) &mdash; ferramenta interna de uso restrito à equipe da BeRocket.</p>

  <p>Esta aplicação (&ldquo;DSA CRM&rdquo;) é uma ferramenta interna utilizada exclusivamente pela equipe da BeRocket para gestão de contatos, prospecção e acompanhamento de comunicações com organizações estudantis parceiras.</p>

  <h2>1. Dados coletados</h2>
  <p>O aplicativo acessa e processa dados da sua Conta Google exclusivamente para operar suas funcionalidades, incluindo: leitura e escrita em planilhas do Google Sheets utilizadas como base do CRM, envio e leitura de e-mails via Gmail para comunicação com contatos, e criação/consulta de eventos no Google Calendar para agendamento de reuniões.</p>

  <h2>2. Uso dos dados</h2>
  <p>Os dados acessados são utilizados apenas para o funcionamento do CRM interno (sincronização de contatos, envio de comunicações e agendamento) e não são compartilhados com terceiros, vendidos ou utilizados para publicidade.</p>

  <h2>3. Armazenamento</h2>
  <p>A planilha do Google Sheets conectada permanece como fonte única da verdade dos dados. O aplicativo não mantém uma cópia permanente independente dos seus dados fora do que é necessário para o funcionamento em tempo real da interface.</p>

  <h2>4. Acesso restrito</h2>
  <p>O uso deste aplicativo é restrito a membros autorizados da equipe da BeRocket. Não é um produto disponibilizado ao público geral.</p>

  <h2>5. Contato</h2>
  <p>Dúvidas sobre esta política podem ser enviadas para a equipe responsável pela BeRocket através dos canais internos habituais.</p>
</body>
</html>`;

const TERMS_OF_SERVICE_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Termos de Serviço - DSA CRM</title>
  <style>${LEGAL_PAGE_STYLE}</style>
</head>
<body>
  <h1>Termos de Serviço</h1>
  <p class="meta">The Data Savings Act (DSA CRM) &mdash; ferramenta interna de uso restrito à equipe da BeRocket.</p>

  <p>Ao acessar e utilizar o DSA CRM, você concorda com os termos abaixo.</p>

  <h2>1. Finalidade</h2>
  <p>Este aplicativo é uma ferramenta interna de CRM destinada exclusivamente ao uso pela equipe da BeRocket para gestão de prospecção, comunicação e agendamento com contatos de organizações estudantis parceiras.</p>

  <h2>2. Uso autorizado</h2>
  <p>O acesso é restrito a colaboradores autorizados pela BeRocket. É vedado o uso deste aplicativo por terceiros não autorizados.</p>

  <h2>3. Responsabilidade do usuário</h2>
  <p>O usuário é responsável por manter a confidencialidade de suas credenciais de acesso e por utilizar as integrações com Google Sheets, Gmail e Google Calendar de forma condizente com as políticas internas da empresa.</p>

  <h2>4. Disponibilidade</h2>
  <p>O aplicativo é fornecido &ldquo;como está&rdquo;, sem garantias de disponibilidade contínua, podendo sofrer manutenções ou alterações a qualquer momento.</p>

  <h2>5. Alterações</h2>
  <p>Estes termos podem ser atualizados a qualquer momento para refletir mudanças no funcionamento do aplicativo.</p>
</body>
</html>`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  loadPersistedEvents();

  app.use(express.json());

  // API Route: Public runtime config for the frontend. APP_URL is the public
  // domain of the deployed service — tracking pixel and unsubscribe links in
  // outgoing emails must ALWAYS point at it, never at window.location.origin,
  // otherwise emails sent from a localhost/dev session carry links the lead
  // can never reach (opens would silently never be recorded for those sends).
  app.get("/api/config", (req, res) => {
    res.json({ appUrl: (process.env.APP_URL || "").trim().replace(/\/+$/, "") });
  });

  // API Route: Tracking pixel
  app.get("/api/track", (req, res) => {
    const { email, spreadsheetId, row } = req.query;

    if (email && spreadsheetId && row) {
      const emailStr = String(email);
      const sheetIdStr = String(spreadsheetId);
      const rowStr = String(row);
      const rowIndex = parseInt(rowStr, 10);

      // Avoid duplicates in the buffer
      const exists = trackedOpens.some(
        (t) => t.email === emailStr && t.spreadsheetId === sheetIdStr && t.row === rowStr
      );

      if (!exists) {
        trackedOpens.push({
          email: emailStr,
          spreadsheetId: sheetIdStr,
          row: rowStr,
          openedAt: new Date().toISOString(),
        });
        persistEvents();
      }

      // Best-effort direct write to the sheet via Service Account, so opens are
      // recorded even if nobody has the CRM open in a browser. This never blocks
      // or fails the pixel response - the in-memory buffer above remains as a
      // fallback/redundant path consumed by the frontend's polling sync.
      if (!isNaN(rowIndex)) {
        updateSheetRowAsServiceAccount(sheetIdStr, "batches", rowIndex, {
          "abertura": "Aberto",
        }).catch((err) => {
          console.error("[api/track] Falha ao gravar abertura diretamente na planilha:", err);
        });
      }
    }

    // Return a 1x1 transparent GIF
    const buf = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": buf.length,
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
    });
    res.end(buf);
  });

  // API Route: One-click unsubscribe (RFC 8058 List-Unsubscribe-Post target,
  // also reachable via a plain GET link in the email footer).
  const handleUnsubscribe = (req: express.Request, res: express.Response) => {
    const { email, spreadsheetId, row } = req.query;
    if (email && spreadsheetId && row) {
      const emailStr = String(email);
      const sheetIdStr = String(spreadsheetId);
      const rowStr = String(row);
      const rowIndex = parseInt(rowStr, 10);

      const exists = unsubscribedEmails.some(
        (u) => u.email === emailStr && u.spreadsheetId === sheetIdStr && u.row === rowStr
      );
      if (!exists) {
        unsubscribedEmails.push({
          email: emailStr,
          spreadsheetId: sheetIdStr,
          row: rowStr,
          unsubscribedAt: new Date().toISOString(),
        });
        persistEvents();
      }

      if (!isNaN(rowIndex)) {
        updateSheetRowAsServiceAccount(sheetIdStr, "batches", rowIndex, {
          Status: "Unsubscribed",
        }).catch((err) => {
          console.error("[api/unsubscribe] Falha ao gravar descadastro diretamente na planilha:", err);
        });
      }
    }
    res.type("html").send(
      `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8" /><title>Descadastro</title></head><body style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 80px auto; text-align: center; color: #1f2937;"><h2>Você foi descadastrado(a)</h2><p>Não enviaremos mais e-mails para este endereço a partir deste CRM.</p></body></html>`
    );
  };
  app.get("/api/unsubscribe", handleUnsubscribe);
  app.post("/api/unsubscribe", handleUnsubscribe);

  // API Route: Get tracked opens
  app.get("/api/events", (req, res) => {
    const { spreadsheetId } = req.query;
    if (spreadsheetId) {
      const filtered = trackedOpens.filter((t) => t.spreadsheetId === String(spreadsheetId));
      res.json(filtered);
    } else {
      res.json(trackedOpens);
    }
  });

  // API Route: Clear / Acknowledge tracked opens
  app.post("/api/events/clear", (req, res) => {
    const { spreadsheetId, events } = req.body;
    if (spreadsheetId && Array.isArray(events)) {
      trackedOpens = trackedOpens.filter(
        (t) =>
          !(
            t.spreadsheetId === String(spreadsheetId) &&
            events.some((ev: any) => ev.email === t.email && ev.row === t.row)
          )
      );
    } else if (spreadsheetId) {
      trackedOpens = trackedOpens.filter((t) => t.spreadsheetId !== String(spreadsheetId));
    } else {
      trackedOpens = [];
    }
    persistEvents();
    res.json({ success: true });
  });

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Static legal pages required for OAuth consent screen verification
  app.get("/pp", (req, res) => {
    res.type("html").send(PRIVACY_POLICY_HTML);
  });
  app.get("/ts", (req, res) => {
    res.type("html").send(TERMS_OF_SERVICE_HTML);
  });

  // Serve static assets or use Vite in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
