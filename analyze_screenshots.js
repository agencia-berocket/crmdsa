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

async function run() {
  const dir = "./Referencias";
  if (!fs.existsSync(dir)) {
    console.error("Directory Referencias does not exist");
    return;
  }

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  console.log(`Found ${files.length} screenshots to analyze in PARALLEL.`);

  const startTime = Date.now();

  const promises = files.map(async (file, index) => {
    const filepath = path.join(dir, file);
    try {
      const imgBuffer = fs.readFileSync(filepath);
      const base64Data = imgBuffer.toString("base64");

      console.log(`Starting analysis for: ${file}`);
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
1. **Identificação da Tela**: Qual é o propósito principal desta tela? (ex: login, dashboard, lista de contatos, envio de emails, etc.).
2. **Componentes e Funcionalidades**: Descreva detalhadamente todos os elementos interativos, botões, campos de entrada (inputs), modais, tabelas, abas ou painéis visíveis. Descreva o comportamento esperado de cada um.
3. **Estilo Visual e Layout**:
   - Layout e Grid: Estrutura (ex: sidebar à esquerda, formulário à direita).
   - Cores exatas (HEX ou classes Tailwind equivalentes) para fundos, bordas, textos e elementos ativos/destacados.
   - Tipografia: Estilos de fonte (serif, sans-serif, mono), pesos, tamanhos e espaçamentos observados.
   - Bordas, Sombras e cantos (rounded-none, rounded-md, etc.).

Escreva a resposta em Markdown (em português) focando em detalhes práticos para implementação direta com React e Tailwind CSS.`
          }
        ]
      });

      console.log(`Completed analysis for: ${file}`);
      return {
        file,
        filepath,
        index,
        analysis: response.text || "Sem resposta do modelo."
      };
    } catch (err) {
      console.error(`Error analyzing ${file}:`, err);
      return {
        file,
        filepath,
        index,
        analysis: `Erro ao analisar a imagem: ${err.message}`
      };
    }
  });

  const results = await Promise.all(promises);

  // Sort results by original index to keep ordering
  results.sort((a, b) => a.index - b.index);

  let report = "# Análise das Telas da Extensão de Referência\n\n";
  report += "Este documento contém a análise detalhada de todas as capturas de tela fornecidas como referência para a interface, funcionalidades, paleta de cores e tipografia da extensão.\n\n";

  for (const result of results) {
    report += `## Tela ${result.index + 1}: ${result.file}\n\n`;
    report += `**Caminho do arquivo**: \`${result.filepath}\`\n\n`;
    report += `${result.analysis}\n\n`;
    report += "---\n\n";
  }

  fs.writeFileSync("./Referencias/analise_completa.md", report);
  console.log(`Parallel analysis complete in ${((Date.now() - startTime) / 1000).toFixed(2)}s! Saved to ./Referencias/analise_completa.md`);
}

run().catch(console.error);
