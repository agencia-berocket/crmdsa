import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const mdPath = "./Referencias/analise_completa.md";
  if (!fs.existsSync(mdPath)) {
    console.error("analise_completa.md does not exist yet");
    return;
  }

  let report = fs.readFileSync(mdPath, "utf-8");

  // We want to find sections of the form:
  // ## Tela X: <filename>.png
  // **Caminho do arquivo**: `Referencias/<filename>.png`
  // Erro ao analisar...
  // ---

  const matches = [...report.matchAll(/## Tela (\d+): ([^\n]+)\n\n\*\*Caminho do arquivo\*\*: `([^`]+)`\n\n(?:Erro ao analisar|Sem resposta)[^]+?\n\n---/g)];

  console.log(`Found ${matches.length} failed/missing screens to heal.`);

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const fullBlock = match[0];
    const screenNum = match[1];
    const filename = match[2].trim();
    const filepath = match[3].trim();

    console.log(`[${i + 1}/${matches.length}] Healing Tela ${screenNum}: ${filename}...`);

    try {
      if (!fs.existsSync(filepath)) {
        console.error(`File ${filepath} does not exist`);
        continue;
      }

      const imgBuffer = fs.readFileSync(filepath);
      const base64Data = imgBuffer.toString("base64");

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/png"
            }
          },
          {
            text: `Você é um designer de UI/UX sênior e engenheiro frontend especialista em recriar interfaces com pixel-perfect precision.
Estou desenvolvendo uma aplicação web/extensão que deve replicar fielmente esta tela de referência.

Por favor, analise esta imagem e forneça um relatório conciso contendo:
1. **Identificação da Tela**: Qual é o propósito principal desta tela? (ex: lista de emails, sidebar de detalhes do lead, pipeline, etc.).
2. **Componentes e Funcionalidades**: Descreva detalhadamente todos os elementos interativos, botões, campos de entrada, modais, tabelas, ou painéis visíveis.
3. **Estilo Visual e Layout**:
   - Layout e Grid: Estrutura.
   - Cores exatas (HEX ou classes Tailwind) para fundos, bordas, textos e elementos ativos.
   - Tipografia: Estilo, peso e tamanhos de fonte.
   - Bordas, Sombras e cantos (rounded).

Escreva em português focado em especificações práticas para React + Tailwind CSS.`
          }
        ]
      });

      const analysis = response.text || "Sem resposta do modelo.";
      const newBlock = `## Tela ${screenNum}: ${filename}\n\n**Caminho do arquivo**: \`${filepath}\`\n\n${analysis}\n\n---`;

      // Replace in the report
      report = report.replace(fullBlock, newBlock);
      fs.writeFileSync(mdPath, report);
      console.log(`Successfully healed Tela ${screenNum}!`);

      // Wait 12 seconds to respect free tier rate limit
      if (i < matches.length - 1) {
        console.log("Sleeping for 12 seconds to avoid rate limits...");
        await sleep(12000);
      }
    } catch (err) {
      console.error(`Error healing ${filename}:`, err);
    }
  }

  console.log("Healing process completed!");
}

run().catch(console.error);
