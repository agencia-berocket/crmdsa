# The Data Savings Act (DSA CRM) - Diretrizes e Regras do Projeto

Este arquivo serve como a nossa "Janela de Aprendizado" (Learning Window), armazenando as regras de contexto do projeto, identidades visuais e comportamentos que devem ser mantidos e respeitados em qualquer modificação futura do assistente de desenvolvimento.

---

## 1. Identidade Visual e Branding

- **Nome Oficial**: `The Data Savings Act` (abreviado ocasionalmente como `DSA CRM`).
- **Logo e Favicon**: 
  - Usamos o asset `/assets/favicon-light.png` (fundo transparente, traço claro/black de alto contraste) para exibição na interface principal (fundo cinza-claro/azuladom, ex: `#f0f4f9`) e nas telas de entrada (Login/Welcome card) para dar o máximo de contraste e sofisticação.
  - O favicon da página HTML (`index.html`) deve apontar para `/assets/favicon-light.png`.

---

## 2. Recursos e Colunas Importantes no CRMTable

O componente `CRMTable.tsx` foi aperfeiçoado para refletir o status de comunicação em tempo real de forma ultra-visual e responsiva:

### Coluna de Alerta de E-mail Enviado (`Notif. Envio` / `Sent Alert`)
- **Comportamento**: Exibe um selo discreto na cor verde-esmeralda (`Sent` / `Enviado`) se um e-mail foi enviado com sucesso, se um registro de data/hora é gravado, ou se o status do pipeline do lead indica uma comunicação enviada.
- **Estilização**: Fundo esmeralda super suave (`bg-emerald-50`), texto esmeralda médio (`text-emerald-700`), bordas claras (`border-emerald-100`) e ícone `MailCheck` do Lucide.

### Coluna de Alerta de E-mail Recebido (`Notif. Retorno` / `Reply Alert`)
- **Comportamento**: Exibe um selo âmbar pulsante de atenção (`New Reply!` / `Novo Retorno!`) assim que um retorno (contendo o DSA-ID oculto) é detectado na caixa de entrada do Gmail ou quando o status do registro é alterado de forma equivalente, alertando a equipe sobre a necessidade de acompanhamento imediato.
- **Estilização**: Fundo âmbar suave (`bg-amber-50`), texto âmbar vibrante (`text-amber-700`), borda correspondente (`border-amber-200`) e efeito pulsante (`animate-pulse`) junto ao ícone `MessageSquareReply`.

### Integração e Sincronização Universal com Planilha
- Ambos os indicadores são totalmente dinâmicos, responsivos e atualizados de forma consistente com os parâmetros lidos da planilha Google Sheets sincronizada em segundo plano, mantendo a planilha como a única fonte de verdade.

### Design Responsivo
- Estas colunas estão integradas harmoniosamente tanto no modo **Batches** (Lotes) quanto no modo **Meetings** (Reuniões).

---

## 3. Diretrizes de Desenvolvimento e Código

- **Prevenção de Quebras no Linter**: Sempre verificar o linter e certificar de que qualquer declaração de módulo ou recurso estático (como imagens `.png`) possua definição correta de tipos (como no arquivo `src/vite-env.d.ts`).
- **I18n**: Manter o suporte multilíngue (Português `pt` e Inglês `en`) atualizado no arquivo `src/lib/i18n.ts` para qualquer novo texto de interface que seja adicionado ao projeto.
