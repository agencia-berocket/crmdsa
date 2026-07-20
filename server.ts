import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

interface TrackEvent {
  email: string;
  spreadsheetId: string;
  row: string;
  openedAt: string;
}

// In-memory buffer for tracking events
let trackedOpens: TrackEvent[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Tracking pixel
  app.get("/api/track", (req, res) => {
    const { email, spreadsheetId, row } = req.query;

    if (email && spreadsheetId && row) {
      const emailStr = String(email);
      const sheetIdStr = String(spreadsheetId);
      const rowStr = String(row);

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
    res.json({ success: true });
  });

  // Lazy initialization of the GoogleGenAI client (fails gracefully if API Key is missing)
  let aiClient: any = null;
  function getGeminiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("A variável de ambiente GEMINI_API_KEY é necessária para habilitar o preenchimento por IA.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // API Route: AI Autofill
  app.post("/api/ai/autofill", async (req, res) => {
    try {
      const { notes, name, organization, contextType } = req.body;
      const ai = getGeminiClient();

      const prompt = `
Analise as notas de CRM / histórico de e-mails abaixo para uma prospecção de clube estudantil / contato universitário.
Nome do Contato: ${name || "Desconhecido"}
Organização: ${organization || "Desconhecida"}
Contexto: Este é um fluxo de ${contextType === "batches" ? "prospecção em massa (batches)" : "agendamento de reuniões (meetings)"}.

Conteúdo das Notas:
"""
${notes || ""}
"""

Tarefa: Extraia detalhes estruturados sobre a conversa, sugira o melhor status de pipeline com base nas notas, identifique qualquer horário sugerido para reunião, data confirmada de reunião (booked time), forneça um resumo de 1 frase, analise o sentimento do contato e recomende a próxima ação de acompanhamento (follow-up).

Retorne sua resposta estritamente no formato JSON especificado.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: {
                type: Type.STRING,
                description: "O status sugerido. Para batches: 'Lead', 'waiting on them', 'Replied - waiting', 'Opened', 'Email bounced', 'nurture'. Para meetings: 'New', 'waiting on them', 'Scheduled', 'Completed'."
              },
              suggestedTimes: {
                type: Type.STRING,
                description: "Horários de reunião sugeridos (ex: 'Terça 14:00, Quinta 16:30'). Deixe string vazia se nenhum for mencionado."
              },
              bookedTime: {
                type: Type.STRING,
                description: "Data/horário da reunião confirmada/agendada (ex: '16/07/2026 14:00'). Deixe string vazia se não houver confirmação."
              },
              summary: {
                type: Type.STRING,
                description: "Resumo conciso de 1 frase sobre o estado atual deste lead."
              },
              sentiment: {
                type: Type.STRING,
                description: "Sentimento do lead. Escolha entre: 'Altamente Interessado', 'Interessado', 'Neutro', 'Ausente/Férias', 'Sem Interesse'."
              },
              followUpAction: {
                type: Type.STRING,
                description: "Ação de acompanhamento recomendada para a equipe."
              }
            },
            required: ["status", "suggestedTimes", "bookedTime", "summary", "sentiment", "followUpAction"]
          }
        }
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText.trim());
      res.json(data);
    } catch (err: any) {
      console.error("AI Autofill Error:", err);
      res.status(500).json({ error: err.message || "Erro ao processar preenchimento automático por IA" });
    }
  });

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
