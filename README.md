# The Data Savings Act (DSA CRM)

CRM de prospecção universitária integrado com Google Sheets, Gmail e Google Calendar.

## Stack

- React 19 + Vite + TypeScript
- Express (server-side, serve o build e expõe rotas de API)
- Firebase Auth (login Google) + Google APIs (Sheets, Gmail, Calendar)

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
| `APP_URL` | URL pública onde a aplicação está hospedada. Os links de pixel de abertura e descadastro embutidos nos e-mails são montados a partir dela |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | JSON da Service Account do Google (em uma linha). **Necessária para o rastreamento de abertura ("Abertura") funcionar 24/7** — sem ela, aberturas só são gravadas enquanto alguém estiver com o CRM aberto no navegador |
| `TRACKING_DATA_DIR` | (Opcional) Diretório onde o servidor persiste o buffer de eventos de abertura/descadastro. Padrão: `./data` |
| `VITE_FIREBASE_*` | Configuração do projeto Firebase (Auth/Google OAuth) |

### Configurando a Service Account (rastreamento de abertura)

O pixel de abertura (`/api/track`) grava a coluna "Abertura" diretamente na planilha no momento em que o lead abre o e-mail — mesmo sem ninguém com o CRM aberto. Para isso funcionar:

1. No [Google Cloud Console](https://console.cloud.google.com), no mesmo projeto do OAuth, acesse **IAM & Admin > Service Accounts** e crie uma Service Account (ex.: `dsa-crm-tracker`).
2. Ative a **Google Sheets API** no projeto (APIs & Services > Library).
3. Na Service Account, crie uma chave em **Keys > Add key > JSON** e baixe o arquivo.
4. **Compartilhe a planilha do CRM** com o e-mail da Service Account (campo `client_email` do JSON, algo como `dsa-crm-tracker@<projeto>.iam.gserviceaccount.com`) com permissão de **Editor**.
5. No Coolify, defina a variável de ambiente de runtime `GOOGLE_SERVICE_ACCOUNT_KEY` com o conteúdo completo do JSON em uma única linha.

Sem essa variável o servidor loga um aviso `[sheets-server] GOOGLE_SERVICE_ACCOUNT_KEY não está definida` e opera em modo degradado (aberturas dependem de um navegador aberto para serem sincronizadas).

## Build e deploy em produção

```
npm run build
npm start
```

O `npm run build` gera o bundle do frontend (`dist/`) e compila o servidor Express (`dist/server.cjs`). `npm start` sobe o servidor na porta `3000`.

Este projeto está configurado para deploy via **Coolify** a partir do repositório Git, usando o `Dockerfile` incluso.

### Importante: variáveis `VITE_*` no Coolify

As variáveis `VITE_FIREBASE_*` são lidas em **build-time** pelo Vite (ficam embutidas no bundle do frontend), não em runtime. No Coolify, configure-as como **Build Variables / Build Args** (não apenas como variáveis de ambiente do container em runtime), para que o `Dockerfile` (que declara `ARG` para cada uma) consiga repassá-las ao `npm run build`.

`APP_URL`, por outro lado, é usada apenas no servidor em runtime — basta configurá-la como variável de ambiente normal do serviço no Coolify.
