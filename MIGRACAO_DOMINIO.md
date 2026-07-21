# Plano de Migração: novo domínio + nova conta de login

## Contexto atual (confirmado no código)
- Deploy: Coolify, via Docker, buildado a partir do push no GitHub (branch `main`).
- Auth: Firebase Auth (login Google) — variáveis `VITE_FIREBASE_*` embutidas em **build-time**.
- APIs Google usadas: Sheets, Gmail, Calendar — via OAuth (client-side, `google-auth-library` + Google Identity Services no browser).
- `APP_URL` runtime aponta para o domínio público (hoje algo como `crmdsa.berocket.com.br`, conforme o comentário no `.env.example`).

Isso implica **duas frentes de migração paralelas**: domínio/deploy (Coolify + DNS) e identidade (Firebase + Google Cloud Console), que precisam estar sincronizadas porque o OAuth do Google valida por domínio autorizado.

---

## Fase 1 — Decisão e preparação
1. Escolher o domínio definitivo entre `crmdsa.drumwave.com` ou `crmdsa.datareserve.org` (ou usar os dois, um como redirect).
2. Confirmar qual conta Google/Workspace será dona do novo projeto Firebase e do novo projeto Google Cloud (login de e-mail novo).
3. Levantar quem tem acesso administrativo a: DNS do domínio escolhido, Coolify, GitHub repo, conta Google que será usada.

## Fase 2 — Google Cloud Console (novo projeto ou reaproveitar)
1. Criar um novo projeto no [console.cloud.google.com](https://console.cloud.google.com) (ou decidir migrar o existente para a nova conta — migração de projeto entre contas é possível via **Transfer project** em IAM, mas geralmente é mais simples criar um novo).
2. Ativar as APIs necessárias: Google Sheets API, Gmail API, Google Calendar API, Google Identity/OAuth.
3. Configurar a **tela de consentimento OAuth** (OAuth consent screen) com o novo domínio e o novo e-mail de suporte.
4. Criar credenciais OAuth 2.0 (Client ID/Secret) novas, com:
   - **Authorized JavaScript origins**: `https://crmdsa.<novo-dominio>`
   - **Authorized redirect URIs**: os endpoints de callback usados pelo app (checar `src/lib/google-api.ts` e `server.ts` para os paths exatos).
5. Se o app estiver em modo "Testing" no consentimento OAuth, adicionar os e-mails de teste ou publicar em produção (verificação do Google pode ser necessária dependendo dos escopos sensíveis como Gmail).

## Fase 3 — Firebase
1. Criar um novo projeto Firebase (ligado à conta de e-mail nova) ou vincular um projeto Firebase ao mesmo projeto GCP criado na Fase 2 (recomendado — Firebase pode "adotar" um projeto GCP existente, mantendo tudo unificado).
2. Ativar **Authentication > Sign-in method > Google**.
3. Em **Authentication > Settings > Authorized domains**, adicionar o novo domínio (`crmdsa.<novo-dominio>`).
4. Copiar as novas credenciais em Project Settings > General > Your apps (Web app):
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`

## Fase 4 — DNS do novo domínio
1. No provedor de DNS do domínio escolhido, criar um registro apontando o subdomínio `crmdsa` para o Coolify:
   - Se Coolify usa proxy reverso próprio (Traefik): `CNAME` ou `A` apontando para o IP/host do servidor Coolify.
2. Aguardar propagação e validar com `dig`/`nslookup`.

## Fase 5 — Coolify
1. Criar (ou reconfigurar) o serviço no Coolify para o novo domínio, mantendo a integração com o GitHub (webhook de push/commit automático já existente).
2. Adicionar o novo domínio em **Domains** do serviço, com SSL automático (Let's Encrypt).
3. Atualizar as variáveis de ambiente do serviço:
   - **Build Variables/Args** (obrigatório em build-time, conforme já documentado no `README.md`): todas as `VITE_FIREBASE_*` novas.
   - **Runtime env var**: `APP_URL="https://crmdsa.<novo-dominio>"`.
4. Disparar um novo deploy (push no GitHub ou trigger manual) para rebuildar com as novas variáveis.

## Fase 6 — Código (se necessário)
1. Revisar `src/lib/google-api.ts`, `server.ts` e `index.html`/`metadata.json` por qualquer URL, client ID ou domínio **hardcoded** do domínio antigo.
2. Atualizar `.env.example` e `README.md` com o novo domínio, se ele se tornar o padrão definitivo.
3. Commit + push (o Coolify já dispara build automático).

## Fase 7 — Validação
1. Acessar `https://crmdsa.<novo-dominio>` e testar o fluxo de login Google ponta a ponta.
2. Testar as integrações: leitura/escrita em Google Sheets, envio via Gmail, criação de evento no Calendar.
3. Checar console do navegador por erros de `redirect_uri_mismatch` ou `unauthorized_domain` (sintomas comuns de configuração OAuth/Firebase incompleta).
4. Confirmar SSL válido e sem mixed content.

## Fase 8 — Corte e desativação do antigo
1. Depois de validado, atualizar quaisquer links/bookmarks/documentação apontando para o domínio antigo.
2. Decidir se o domínio antigo deve redirecionar (301) para o novo ou ser desativado.
3. Revogar/depreciar as credenciais OAuth e o projeto Firebase antigos **só depois** de confirmar que nada mais depende deles (ex.: sessões antigas, integrações externas).

---

## Ponto de atenção principal
A ordem crítica é **Google Cloud + Firebase primeiro** (Fase 2-3), **DNS depois** (Fase 4), e só então apontar o Coolify com as novas envs (Fase 5) — fazer o deploy antes de ter o domínio autorizado no Firebase/OAuth vai gerar erro de login mesmo com o site no ar.
