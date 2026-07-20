# The Data Savings Act (DSA CRM)

CRM de prospecção universitária integrado com Google Sheets, Gmail e Google Calendar.

## Stack

- React 19 + Vite + TypeScript
- Express (server-side, serve o build e expõe rotas de API)
- Firebase Auth (login Google) + Google APIs (Sheets, Gmail, Calendar)
- Gemini API (preenchimento assistido por IA no CRM)

## Rodando localmente

**Pré-requisitos:** Node.js 20+

1. Instale as dependências:
   ```
   npm install
   ```
2. Copie `.env.example` para `.env.local` e preencha as variáveis (veja seção abaixo).
3. Rode em modo desenvolvimento:
   ```
   npm run dev
   ```

## Variáveis de ambiente

Veja [.env.example](.env.example) para a lista completa. Resumo:

| Variável | Descrição |
|---|---|
| `GEMINI_API_KEY` | Chave da API Gemini, usada no servidor para o preenchimento automático por IA |
| `APP_URL` | URL pública onde a aplicação está hospedada |
| `VITE_FIREBASE_*` | Configuração do projeto Firebase (Auth/Google OAuth) |

## Build e deploy em produção

```
npm run build
npm start
```

O `npm run build` gera o bundle do frontend (`dist/`) e compila o servidor Express (`dist/server.cjs`). `npm start` sobe o servidor na porta `3000`.

Este projeto está configurado para deploy via **Coolify** a partir do repositório Git, usando o `Dockerfile` incluso.

### Importante: variáveis `VITE_*` no Coolify

As variáveis `VITE_FIREBASE_*` são lidas em **build-time** pelo Vite (ficam embutidas no bundle do frontend), não em runtime. No Coolify, configure-as como **Build Variables / Build Args** (não apenas como variáveis de ambiente do container em runtime), para que o `Dockerfile` (que declara `ARG` para cada uma) consiga repassá-las ao `npm run build`.

`GEMINI_API_KEY` e `APP_URL`, por outro lado, são usadas apenas no servidor em runtime — basta configurá-las como variáveis de ambiente normais do serviço no Coolify.
