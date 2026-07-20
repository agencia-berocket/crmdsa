# Análise das Telas da Extensão de Referência

Este documento contém a análise detalhada de todas as capturas de tela fornecidas como referência para a interface, funcionalidades, paleta de cores e tipografia da extensão.

## Tela 1: Captura de Tela 2026-07-17 às 09.20.24.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.20.24.png`

Com base na análise detalhada da imagem fornecida, apresento o relatório técnico para a recriação fiel da interface (pixel-perfect) utilizando **React** e **Tailwind CSS**.

---

# Relatório de Análise de Interface (UI/UX) - Streak CRM

## 1. Identificação da Tela
*   **Propósito Principal**: Tela de Onboarding / Autenticação (OAuth Google) da extensão do **Streak CRM** integrada ao Gmail.
*   **Contexto**: Trata-se de um modal de boas-vindas que se sobrepõe à interface do Gmail, explicando o valor do produto (CRM integrado) e solicitando que o usuário faça login com sua conta Google para ativar a extensão.

---

## 2. Componentes e Funcionalidades

### A. Modal Principal (Onboarding/Login)
*   **Logo Superior**: Branding "Streak CRM" centralizado no topo com o ícone característico de três faixas laranjas.
*   **Mockup de Demonstração (Gmail + Streak)**:
    *   Uma representação simplificada da interface do Gmail.
    *   **Sidebar Esquerda (Gmail)**: Ícones de Mail, Chat, Meet e o ícone destacado do **Streak** (com fundo laranja suave indicando estado ativo).
    *   **Visualizador de Funil (Pipeline)**: Elemento em formato de chevron indicando as etapas do funil ("Lead", "Contacted", "Sent Samples").
    *   **Tabela de Negócios (Deals)**: Colunas para *Name*, *Stage* (com dropdowns simulados) e *Deal size*.
*   **Texto Descritivo**: Parágrafo de apoio em português explicando o benefício principal.
*   **Botão Primário "Faça login no Google"**:
    *   *Comportamento*: Ao clicar, deve iniciar o fluxo de autenticação do Google (OAuth 2.0).
    *   *Estado Hover*: Leve escurecimento do azul do botão.
    *   *Detalhe*: Ícone oficial do Google em um círculo branco à esquerda.
*   **Link Secundário "Não use o Streak nesta conta"**:
    *   *Comportamento*: Fecha o modal ou desativa a extensão para a conta de email atual.
    *   *Estado Hover*: Sublinhado (`underline`) e mudança sutil de cor do texto para um cinza mais escuro.

### B. Tooltip/Pop-up Superior (Card Azul)
*   **Cabeçalho**: Logo do Streak, título "Streak" e subtítulo "CRM built into Gmail".
*   **Botão Fechar (X)**: No canto superior direito para fechar/dispensar o tooltip.
*   **Corpo de Texto**: Texto explicativo em inglês.
*   **Ações**:
    *   **Botão "Learn more"**: Link de texto branco para a documentação.
    *   **Botão "Take me to Gmail"**: Botão de destaque com fundo azul claro e ícone de seta para a direita (`→`).

---

## 3. Estilo Visual e Layout

### Layout e Grid
*   **Backdrop**: Fundo com overlay escurecido/borrado (backdrop-blur opcional) para focar a atenção no modal.
*   **Modal Principal**: Centralizado na tela (`flex items-center justify-center min-h-screen`).
*   **Mockup Interno**: Utiliza uma estrutura de duas colunas:
    *   Sidebar: Largura fixa (`w-16` ou `w-20`).
    *   Conteúdo: Flex-grow com scroll interno simulado.

### Paleta de Cores (Tailwind CSS)

| Elemento | Cor HEX | Equivalente Tailwind / Custom CSS |
| :--- | :--- | :--- |
| **Fundo do Modal** | `#FFFFFF` | `bg-white` |
| **Texto Principal** | `#3C4043` | `text-[#3c4043]` (Cinza Escuro Google) |
| **Texto Secundário / Labels** | `#5F6368` | `text-[#5f6368]` |
| **Botão Login Google (Fundo)** | `#1A73E8` | `bg-[#1a73e8]` (Google Blue) |
| **Botão Login Google (Hover)** | `#1557B0` | `hover:bg-[#1557b0]` |
| **Tooltip Superior (Fundo)** | `#5373D9` | `bg-[#5373d9]` (Azul Streak) |
| **Tooltip Botão Primário (Fundo)**| `#3B5998` (aprox.)| `bg-[#2f4cb0]` (Azul Escuro) |
| **Etapa do Funil Ativa (Lead)** | `#2E5BDB` | `bg-[#2e5bdb]` |
| **Etapa do Funil (Contacted)** | `#4273F6` | `bg-[#4273f6]` |
| **Etapa do Funil (Sent Samples)** | `#628EF8` | `bg-[#628ef8]` |
| **Bordas / Divisores** | `#F1F3F4` | `border-[#f1f3f4]` ou `border-gray-100` |
| **Ícone Streak Ativo (Fundo)** | `#FCE8E6` | `bg-[#fce8e6]` |
| **Ícone Streak Ativo (Laranja)**| `#E25C30` | `text-[#e25c30]` |

### Tipografia
*   **Família de Fontes**: Sans-serif limpa, preferencialmente **Roboto** ou **Inter** para emular a interface do Google Workspace (`font-sans`).
*   **Pesos e Tamanhos**:
    *   Título do Tooltip: `text-xl font-medium tracking-tight`
    *   Texto Descritivo: `text-sm leading-relaxed text-[#5f6368]`
    *   Botão Google: `text-sm font-semibold tracking-wide`
    *   Textos da Tabela: `text-xs` para simular densidade de dados do Gmail.

### Bordas, Sombras e Cantos
*   **Arredondamento (Border Radius)**:
    *   Modal Principal: `rounded-xl` (12px).
    *   Card de Tooltip Azul: `rounded-lg` (8px).
    *   Botão do Google: `rounded-md` (6px).
    *   Campos da Tabela: `rounded` (4px).
*   **Sombras (Box Shadow)**:
    *   Modal Principal: `shadow-2xl` profunda para dar efeito de elevação sobre o Gmail.
    *   Tooltip: `shadow-lg`.

### Detalhe Técnico para Implementação (Funil/Chevron)
As etapas do funil ("Lead", "Contacted") possuem um corte diagonal em formato de flecha (chevron). Para reproduzir isso com fidelidade em CSS/Tailwind, utilize `clip-path`:
```css
/* Exemplo de classe utilitária para o formato chevron */
.chevron-clip {
  clip-path: polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%);
}
```

---

## Tela 2: Captura de Tela 2026-07-17 às 09.20.54.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.20.54.png`

Erro ao analisar a imagem: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.5-flash\nPlease retry in 29.248402038s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"model":"gemini-3.5-flash","location":"global"},"quotaValue":"5"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"29s"}]}}

---

## Tela 3: Captura de Tela 2026-07-17 às 09.21.36.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.21.36.png`

Erro ao analisar a imagem: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.5-flash\nPlease retry in 28.20973029s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.5-flash"},"quotaValue":"5"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"28s"}]}}

---

## Tela 4: Captura de Tela 2026-07-17 às 09.21.59.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.21.59.png`

Com base na análise detalhada da imagem fornecida, apresento o relatório técnico e de design para a reconstrução da interface com fidelidade pixel-perfect utilizando **React** e **Tailwind CSS**.

---

### 1. Identificação da Tela
*   **Propósito Principal**: Esta é uma tela de **Onboarding / Seleção de Casos de Uso (User Intent)** da ferramenta Streak (um CRM integrado ao Gmail). O objetivo é coletar a preferência do usuário sobre quais recursos ele deseja ativar ou focar inicialmente, personalizando a experiência subsequente.
*   **Fluxo**: Etapa intermediária de configuração inicial (setup wizard).

---

### 2. Componentes e Funcionalidades

1.  **Cabeçalho da Etapa (Header)**:
    *   **Ícone de Marca/Contexto**: Um ícone quadrado estilizado em laranja à esquerda do título.
    *   **Título Principal**: Pergunta direta ao usuário ("Para que você quer usar o Streak?").

2.  **Seletor de Cartões Multiseleção (Grid de Cards)**:
    *   **Comportamento**: Funciona como um grupo de *checkboxes* estilizados. O usuário pode selecionar uma, duas ou todas as três opções. Na imagem, as três opções estão selecionadas (indicadas pelo ícone de *check* no canto superior direito de cada card).
    *   **Card 1 (CRM)**: Ícone de grade/tabela (representando o pipeline) + Texto "CRM".
    *   **Card 2 (Mala direta)**: Ícone de avião de papel (envio em massa) + Texto "Mala direta".
    *   **Card 3 (Rastreamento de e-mail)**: Ícone de olho + Texto "Rastreamento de e-mail".
    *   **Estados dos Cards**:
        *   *Não selecionado (padrão)*: Fundo branco/transparente, borda cinza clara, sem ícone de check.
        *   *Selecionado*: Fundo azul muito claro, borda azul/indigo fina, ícone de check visível no canto superior direito.
        *   *Selecionado + Focado/Hover (Card 3)*: Borda azul mais espessa (`border-2`) e tom ligeiramente mais escuro, indicando foco de navegação por teclado ou estado ativo de hover.

3.  **Texto de Ajuda / Subtexto (Helper Text)**:
    *   Texto explicativo centralizado abaixo dos cards: *"Use o Streak AI para criar um pipeline que monitore seu fluxo de trabalho."*

4.  **Botão de Ação Primária (Footer/Bottom Right)**:
    *   Botão "Prosseguir". Posicionado no canto inferior direito para guiar o usuário naturalmente para o próximo passo (padrão ocidental de leitura em Z).

---

### 3. Estilo Visual e Layout (Especificações Tailwind CSS)

#### A. Layout e Grid
*   **Container Principal (Modal/Card de Setup)**: Centralizado na tela, com fundo branco puro (`bg-white`), bordas ligeiramente arredondadas e padding interno generoso.
    *   *Tailwind*: `max-w-4xl mx-auto p-12 bg-white rounded-lg shadow-sm flex flex-col items-center justify-center`
*   **Grid de Opções**: Alinhamento horizontal (flex ou grid de 3 colunas) com espaçamento consistente de `16px` a `24px`.
    *   *Tailwind*: `grid grid-cols-3 gap-5 w-full max-w-3xl my-8`

#### B. Cores Exatas (Paleta de Cores)
*   **Fundo do Modal**: `#FFFFFF` (`bg-white`)
*   **Fundo da Tela (atrás do modal)**: `#F8F9FA` (`bg-slate-50`)
*   **Texto Principal**: `#1A1A1A` (`text-zinc-900`)
*   **Texto Secundário / Subtexto**: `#5F6368` (`text-gray-500` / `text-slate-600`)
*   **Laranja Accent (Ícone superior)**: `#FF5722` (`text-[#ff5722]`)
*   **Estados dos Cards (Selecionado)**:
    *   Fundo: `#EEF2FF` (`bg-indigo-50/60` ou `bg-blue-50/50`)
    *   Borda Padrão Selecionado: `#3F51B5` ou `#3B5998` (`border-indigo-200` ou `border-blue-300`)
    *   Borda Ativa/Focada (Card 3 na imagem): `#1A365D` ou `#1D4ED8` (`border-[#1a365d]` ou `border-blue-600 border-2`)
    *   Cor dos Ícones e Texto do Card: `#3F51B5` (`text-indigo-700` ou `text-blue-700`)
*   **Botão "Prosseguir"**:
    *   Fundo: `#3F51B5` (`bg-[#3f51b5]`)
    *   Hover: `#303F9F` (`hover:bg-[#303f9f]`)
    *   Texto: `#FFFFFF` (`text-white`)

#### C. Tipografia e Espaçamento
*   **Família Tipográfica**: Sans-serif limpa e geométrica, preferencialmente **Inter** ou a fonte nativa do sistema (`font-sans`).
*   **Título Principal**: `text-[26px]`, peso `font-medium`, tracking levemente fechado (`tracking-tight`).
*   **Texto dos Cards**: `text-[15px]`, peso `font-medium`, interlineado normal.
*   **Subtexto**: `text-[14px]` ou `text-[15px]`, cor cinza médio, peso `font-normal`.
*   **Botão "Prosseguir"**: `text-[15px] font-medium px-6 py-2.5 rounded-md`.

#### D. Detalhes de Bordas, Cantos e Sombras
*   **Arredondamento (Border Radius)**:
    *   Cards de Seleção: `rounded-lg` (8px de raio).
    *   Botão "Prosseguir": `rounded-md` (6px de raio).
*   **Bordas dos Cards**: `border` fina (`1px`) no estado padrão, e `border-2` no estado focado/destacado.

---

### Exemplo de Implementação React + Tailwind (Estrutura Recomendada)

```tsx
import React, { useState } from 'react';
import { LayoutGrid, Send, Eye, Check } from 'lucide-react'; // Biblioteca recomendada para os ícones

interface Option {
  id: string;
  title: string;
  icon: React.ReactNode;
}

export default function StreakOnboarding() {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['crm', 'direct-mail', 'tracking']); // Todos iniciam selecionados conforme imagem
  const [focusedOption, setFocusedOption] = useState<string | null>('tracking'); // "Rastreamento" com foco ativo na imagem

  const options: Option[] = [
    { id: 'crm', title: 'CRM', icon: <LayoutGrid className="w-8 h-8" /> },
    { id: 'direct-mail', title: 'Mala direta', icon: <Send className="w-8 h-8" /> },
    { id: 'tracking', title: 'Rastreamento de e-mail', icon: <Eye className="w-8 h-8" /> },
  ];

  const toggleOption = (id: string) => {
    if (selectedOptions.includes(id)) {
      setSelectedOptions(selectedOptions.filter(item => item !== id));
    } else {
      setSelectedOptions([...selectedOptions, id]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-[850px] p-12 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between min-h-[500px]">
        
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mt-4">
          {/* Logo/Ícone Laranja */}
          <div className="w-8 h-8 bg-[#FF5722] rounded flex flex-col justify-between p-1">
            <div className="flex justify-between w-full h-[40%]">
              <span className="border border-white w-2.5 h-full rounded-[1px]"></span>
              <span className="border border-white w-2.5 h-full rounded-[1px]"></span>
            </div>
            <div className="border border-white w-full h-[40%] rounded-[1px]"></div>
          </div>
          <h1 className="text-[28px] font-medium text-zinc-800 tracking-tight">
            Para que você quer usar o Streak?
          </h1>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-3 gap-5 my-8 w-full px-4">
          {options.map((option) => {
            const isSelected = selectedOptions.includes(option.id);
            const isFocused = focusedOption === option.id;

            return (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                onFocus={() => setFocusedOption(option.id)}
                className={`
                  relative flex flex-col items-center justify-center gap-3 h-[140px] rounded-lg transition-all duration-150
                  ${isSelected 
                    ? 'bg-[#EEF2FF] text-[#3F51B5]' 
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                  }
                  ${isFocused && isSelected
                    ? 'border-2 border-[#1d4ed8] ring-offset-1' 
                    : isSelected 
                      ? 'border border-[#3F51B5]' 
                      : ''
                  }
                `}
              >
                {/* Checkmark Icon */}
                {isSelected && (
                  <div className="absolute top-3 right-3 text-[#3F51B5]">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                )}
                
                {/* Card Icon */}
                <div className="mt-2">{option.icon}</div>
                
                {/* Card Title */}
                <span className="text-[15px] font-medium text-center px-4 leading-tight">
                  {option.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer Helper Text & Button */}
        <div className="flex flex-col items-center w-full">
          <p className="text-[14px] text-gray-500 text-center mb-10">
            Use o Streak AI para criar um pipeline que monitore seu fluxo de trabalho.
          </p>
          
          <div className="w-full flex justify-end">
            <button className="bg-[#3F51B5] hover:bg-[#303F9F] text-white text-[15px] font-medium px-8 py-2.5 rounded-md transition-colors shadow-sm">
              Prosseguir
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
```

---

## Tela 5: Captura de Tela 2026-07-17 às 09.22.12.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.22.12.png`

Aqui está o relatório de análise detalhado para a recriação da interface com precisão pixel-perfect, utilizando **React** e **Tailwind CSS**.

---

# Relatório de Análise de UI/UX para Implementação

## 1. Identificação da Tela
*   **Propósito Principal:** Tela de Onboarding / Seleção de Template de Rastreamento (Setup Wizard). O objetivo é que o usuário selecione qual categoria ou fluxo de trabalho deseja rastrear/gerenciar na ferramenta para que o sistema configure o espaço de trabalho inicial adequado.

---

## 2. Componentes e Funcionalidades

### A. Cabeçalho (Header)
*   **Ícone Temático:** Um ícone de tabela/grid estilizado na cor laranja da marca.
*   **Título Principal:** "O que você está tentando rastrear?" em uma tipografia sans-serif robusta e centralizada.

### B. Grid de Seleção (Cards de Opções)
*   **Comportamento do Grid:** Layout de 4 colunas em telas maiores, reduzindo responsivamente em telas menores. Os cards restantes na última linha alinham-se à esquerda.
*   **Estrutura de cada Card:**
    *   **Conteúdo:** Um emoji/ícone na parte superior esquerda e o texto descritivo na parte inferior esquerda.
    *   **Estados de Interação (Proposta UX):**
        *   *Default (Padrão):* Borda cinza clara, fundo branco.
        *   *Hover (Passar o mouse):* Borda cinza ligeiramente mais escura, elevação sutil (shadow-sm) ou mudança leve no fundo.
        *   *Selected (Selecionado):* Borda laranja espessa (2px) ou azul (dependendo da cor primária do sistema, mas sugerido laranja para combinar com o ícone superior) e fundo com tom sutil da cor ativa.
*   **Lógica de Negócio (React):** Seleção única (radio card) ou seleção múltipla. Ao selecionar pelo menos um item, o botão "Próximo" deve ser habilitado.

### C. Botão de Ação ("Próximo")
*   **Posicionamento:** Alinhado à direita, abaixo do grid principal.
*   **Estado Atual (Desabilitado):** Cinza claro, sem interatividade (`pointer-events-none`).
*   **Estado Ativo (Habilitado):** Deve mudar para a cor primária (provavelmente laranja ou preto) com texto branco contrastante e cursor pointer.
*   **Ícone:** Seta para a direita (`ArrowRight`) integrada ao botão.

---

## 3. Estilo Visual e Layout (Tailwind CSS)

### Layout e Grid
*   **Container Principal:** Centralizado horizontal e verticalmente na tela.
    *   Tailwind: `flex flex-col items-center justify-center min-h-screen bg-white p-6`
*   **Grid dos Cards:**
    *   Tailwind: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 w-full max-w-6xl mt-10`

### Elementos Específicos e Classes Tailwind sugeridas:

#### 1. Ícone Superior & Título
```html
<div class="flex flex-col items-center gap-4 mb-8">
  <!-- Ícone Laranja (ex: Lucide LayoutGrid ou SVG customizado) -->
  <svg class="w-10 h-10 text-[#FF6B00]" ... /> 
  <h1 class="text-3xl font-semibold text-[#1A1A1A] tracking-tight">
    O que você está tentando rastrear?
  </h1>
</div>
```

#### 2. Os Cards de Opção
*   **Dimensões:** Aspect ratio retangular horizontal. Sugere-se altura mínima fixa para garantir consistência.
*   **Tailwind:**
```html
<!-- Card Estado Padrão (Não Selecionado) -->
<button class="flex flex-col justify-between items-start p-6 h-[135px] bg-white border border-[#E5E5E5] rounded-lg transition-all duration-200 hover:border-[#CCCCCC] hover:shadow-sm text-left w-full focus:outline-none">
  <span class="text-2xl mb-4">💰</span>
  <span class="text-base font-semibold text-[#2D2D2D]">De vendas</span>
</button>

<!-- Card Estado Selecionado (Sugestão de Ativo baseado no ícone laranja) -->
<button class="flex flex-col justify-between items-start p-6 h-[135px] bg-[#FFF9F5] border-2 border-[#FF6B00] rounded-lg text-left w-full focus:outline-none">
  <span class="text-2xl mb-4">💰</span>
  <span class="text-base font-semibold text-[#1A1A1A]">De vendas</span>
</button>
```

#### 3. Botão "Próximo"
*   **Tailwind (Estado Desabilitado atual):**
```html
<button disabled class="flex items-center gap-2 px-6 py-3 bg-[#E5E5E5] text-[#999999] rounded-lg font-medium cursor-not-allowed ml-auto mt-8">
  Próximo
  <svg class="w-5 h-5 text-[#999999]" ... /> <!-- Seta para direita -->
</button>
```
*   **Tailwind (Estado Habilitado sugerido):**
```html
<button class="flex items-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#E05E00] text-white rounded-lg font-medium transition-colors ml-auto mt-8 shadow-md">
  Próximo
  <svg class="w-5 h-5 text-white" ... />
</button>
```

### Paleta de Cores (Fidelidade de Cores)
*   **Fundo da Tela:** `#FFFFFF` (Branco Puro).
*   **Bordas dos Cards:** `#E5E7EB` ou `#E5E5E5` (Cinza claro sutil).
*   **Texto Principal (Títulos e labels):** `#1A1A1A` ou `#2D2D2D` (Quase preto para alto contraste e legibilidade).
*   **Laranja Accent (Ícone superior):** `#FF6B00` ou `rgb(255, 107, 0)`.
*   **Botão Desabilitado:** Fundo `#E5E5E5`, Texto `#999999`.

### Tipografia
*   **Família de Fontes:** Sans-serif limpa e geométrica (ex: *Inter*, *Geist*, ou *SF Pro Display*).
*   **Tamanho do Título:** `text-3xl` (aproximadamente `30px`).
*   **Tamanho dos Textos dos Cards:** `text-[16px]` (`text-base`) com peso semibold/bold (`font-semibold`).

---

## Tela 6: Captura de Tela 2026-07-17 às 09.22.43.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.22.43.png`

Aqui está o relatório técnico e analítico detalhado para a recriação da interface com precisão de pixel (pixel-perfect) utilizando **React** e **Tailwind CSS**.

---

# Relatório de Análise de Interface (UI/UX)

## 1. Identificação da Tela
* **Propósito Principal**: Esta é uma tela de **Onboarding/Setup Wizard (Assistente de Configuração)** de uma ferramenta de CRM (especificamente a extensão *Streak* integrada ao Gmail). 
* **Fluxo de Usuário**: O usuário está no terceiro passo ("Creating columns") de um processo de 5 etapas para criar e customizar um pipeline de vendas diretamente dentro do ecossistema do Gmail. A tela combina um menu lateral de progresso estático/interativo com uma pré-visualização dinâmica e estilizada da aplicação final em segundo plano.

---

## 2. Componentes e Funcionalidades

### A. Sidebar Esquerda: Stepper Vertical (Indicador de Progresso)
* **Status Concluído (Steps 1 e 2)**:
  * Círculo preenchido em azul com ícone de *check* branco.
  * Linha conectora vertical sólida em azul.
  * Texto do título em cinza escuro/preto, com descrição em cinza médio.
* **Status Ativo (Step 3 - "Creating columns")**:
  * Círculo com borda dupla azul-escura e ponto central preenchido.
  * Linha conectora inferior de transição em cinza claro.
  * Título e descrição destacados.
* **Status Pendente (Steps 4 e 5)**:
  * Círculo cinza claro com ponto central cinza.
  * Linhas conectoras em cinza claro.
  * Texto com opacidade reduzida (cinza claro).

### B. Área de Pré-visualização (Painel Direito)
Simula a interface do Gmail com o plugin do Streak injetado:
1. **Header do Gmail**:
   * Logo do Gmail e barra de pesquisa com ícone de lupa (`rounded-full`).
2. **Sidebar de Navegação Esquerda**:
   * Ícone de Hambúrguer, Mail, Chat, Meet e o ícone destacado do **Streak** (laranja, dentro de um círculo com background suave).
3. **Pipeline View (Funil superior)**:
   * Um banner de progresso horizontal composto por *Chevrons* (setas de blocos) indicando as etapas do funil:
     * **Lead**: 7 (Azul escuro)
     * **Contacted**: 24 (Azul royal médio)
     * **Follow-Up**: 3 (Azul claro/violeta)
     * **Won**: 7 (Azul bem claro)
4. **Tabela de Dados (Grid)**:
   * Linhas e colunas simulando dados com *skeletons* (linhas cinzas arredondadas para simular texto carregando).
   * **Coluna em Destaque ("Deal Size")**: Destacada com uma borda lateral listrada em laranja/branco para indicar o foco da etapa atual do tutorial.
5. **Overlay de Instrução (Anotação manual)**:
   * Uma seta desenhada à mão em tom laranja quente, apontando para as colunas com o texto cursivo **"Columns"**.

---

## 3. Estilo Visual e Layout

### Layout e Grid
* **Container Principal**: `flex h-screen w-full bg-white`
* **Sidebar Esquerda (Stepper)**: Largura fixa de aproximadamente `w-[320px]` ou `w-1/4`, background levemente cinza/gelo (`bg-[#F8F9FA]`).
* **Painel da Direita (Mockup)**: Ocupa o restante da tela (`flex-1`), centralizando um "card" com bordas arredondadas e sombra suave que simula a tela do Gmail flutuando.

### Paleta de Cores (Tailwind & HEX)

| Elemento | Cor HEX | Classe Tailwind Equivalente/Aproximada |
| :--- | :--- | :--- |
| **Fundo da Sidebar Esquerda** | `#F8F9FA` | `bg-slate-50` |
| **Texto de Título Principal** | `#1A1A1A` | `text-slate-900` |
| **Texto de Descrição (Ativo)** | `#4A4A4A` | `text-slate-600` |
| **Azul Marca (Stepper Ativo/Sucesso)**| `#3B52CC` | `bg-[#3B52CC]` ou `text-[#3B52CC]` |
| **Azul Funil - Lead** | `#2B3EB3` | `bg-[#2B3EB3]` |
| **Azul Funil - Contacted** | `#3F54D9` | `bg-[#3F54D9]` |
| **Azul Funil - Follow-Up** | `#5F75FA` | `bg-[#5F75FA]` |
| **Azul Funil - Won** | `#8398FF` | `bg-[#8398FF]` |
| **Laranja Destaque (Streak/Anotação)**| `#FF5F3D` | `bg-[#FF5F3D]` / `text-[#FF5F3D]` |
| **Cinza Skeletons / Bordas** | `#EBEBEB` | `bg-gray-100` / `border-gray-200` |

### Tipografia
* **Fonte Principal**: Sans-serif limpa e moderna, preferencialmente **Inter** ou **SF Pro Display** (`font-sans`).
  * Título Principal ("Criando seu pipeline..."): `text-2xl font-bold tracking-tight`
  * Títulos do Stepper: `text-sm font-semibold`
  * Descrições do Stepper: `text-xs text-gray-500 font-normal leading-relaxed`
* **Fonte do Desenho Manual ("Columns")**: Uma fonte de estilo manuscrito/cursivo como **"Caveat"**, **"Architects Daughter"** ou **"Patrick Hand"** com `font-medium text-2xl tracking-wide text-[#E64A19]`.

### Bordas, Sombras e Cantos
* **Card do Mockup (Gmail)**: Borda arredondada externa bem acentuada (`rounded-[24px]` ou `rounded-3xl`) para dar um aspecto moderno de "frame".
* **Sombra do Mockup**: `shadow-[0_8px_30px_rgb(0,0,0,0.08)]` (Sombra muito suave, espalhada e com baixa opacidade).
* **Inputs e Skeletons**:
  * Barra de busca: `rounded-full`
  * Skeletons de texto: `rounded-md` com altura de `h-3` ou `h-4`.
  * Badges (ex: "Lead" roxo na tabela): `rounded` (pequeno, ~4px).

---

## Dicas para Implementação Frontend (React)

1. **Chevron CSS/SVG**: Para fazer o cabeçalho do funil (Pipeline View) com encaixe perfeito tipo seta, use a propriedade CSS `clip-path` ou renderize cada estágio como um elemento SVG responsivo adjacente para evitar gaps de layout.
2. **Texturas e Linhas Listradas**: Para a borda listrada laranja/branco na coluna focada, utilize um gradiente linear repetitivo do Tailwind no elemento de borda esquerda ou antes dele:
   ```tailwind
   bg-[repeating-linear-gradient(45deg,#FF5F3D,#FF5F3D_4px,#ffffff_4px,#ffffff_8px)]
   ```
3. **Animações (UX)**: Adicione uma transição suave de opacidade (`transition-all duration-300`) ao mudar os estados do stepper.

---

## Tela 7: Captura de Tela 2026-07-17 às 09.23.00.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.23.00.png`

Erro ao analisar a imagem: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.5-flash\nPlease retry in 22.549157426s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"model":"gemini-3.5-flash","location":"global"},"quotaValue":"5"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"22s"}]}}

---

## Tela 8: Captura de Tela 2026-07-17 às 09.23.34.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.23.34.png`

Erro ao analisar a imagem: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.5-flash\nPlease retry in 30.850484618s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.5-flash"},"quotaValue":"5"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"30s"}]}}

---

## Tela 9: Captura de Tela 2026-07-17 às 09.23.46.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.23.46.png`

Erro ao analisar a imagem: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.5-flash\nPlease retry in 22.931958946s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.5-flash"},"quotaValue":"5"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"22s"}]}}

---

## Tela 10: Captura de Tela 2026-07-17 às 09.23.54.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.23.54.png`

Erro ao analisar a imagem: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.5-flash\nPlease retry in 23.431238723s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"model":"gemini-3.5-flash","location":"global"},"quotaValue":"5"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"23s"}]}}

---

## Tela 11: Captura de Tela 2026-07-17 às 09.24.03.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.24.03.png`

Erro ao analisar a imagem: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.5-flash\nPlease retry in 23.130896624s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.5-flash"},"quotaValue":"5"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"23s"}]}}

---

## Tela 12: Captura de Tela 2026-07-17 às 09.24.10.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.24.10.png`

Erro ao analisar a imagem: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.5-flash\nPlease retry in 22.494877027s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.5-flash"},"quotaValue":"5"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"22s"}]}}

---

## Tela 13: Captura de Tela 2026-07-17 às 09.24.24.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.24.24.png`

Erro ao analisar a imagem: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.5-flash\nPlease retry in 29.112921038s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.5-flash"},"quotaValue":"5"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"29s"}]}}

---

## Tela 14: Captura de Tela 2026-07-17 às 09.24.45.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.24.45.png`

Erro ao analisar a imagem: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.5-flash\nPlease retry in 29.618107891s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.5-flash"},"quotaValue":"5"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"29s"}]}}

---

## Tela 15: Captura de Tela 2026-07-17 às 09.25.04.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.25.04.png`

Aqui está o relatório técnico detalhado para a recriação pixel-perfect da interface fornecida, estruturado para facilitação do desenvolvimento com **React** e **Tailwind CSS**.

---

# Relatório de Especificação de UI/UX

## 1. Identificação da Tela
*   **Contexto/Propósito**: Esta interface faz parte de um sistema de CRM ou Kanban baseado em estágios (especificamente semelhante ao *Streak CRM* para Gmail). A imagem exibe uma seção da barra de ferramentas superior de um pipeline (estágio "Fechado" em roxo) e o menu dropdown ativo (popover) acionado pelo botão flutuante de adição (FAB `+`).

---

## 2. Componentes e Funcionalidades

### A. Barra de Controle Superior (Toolbar)
*   **Indicador "0 Boxes"**: Texto informativo indicando a quantidade de itens na visualização atual.
*   **Botão de Filtro (Funil/Linhas)**: Ícone interativo para filtrar dados.
*   **Botão de Compartilhamento/Membros**: Ícone de usuário com símbolo `+` para gerenciamento de acesso.
*   **Botão de Opções Extras (Três pontos verticais)**: Menu de contexto adicional.
*   **Botão de Ação Flutuante (FAB `+`)**: Um botão circular destacado com um ícone de mais (`+`) em cor laranja, que atua como gatilho (trigger) para abrir o menu dropdown.

### B. Segmento do Pipeline (Fundo Esquerdo)
*   **Card de Estágio (Roxo)**: Exibe um contador grande `"0"` e o início do rótulo da etapa `"Fech..."` (provavelmente "Fechado").

### C. Menu Popover (Dropdown Ativo)
Um menu suspenso flutuante com sombra projetada contendo três opções principais de ação rápida:
1.  **Adicionar caixa (Add Box)**: Ícone de `+` simples. Ação esperada: criar um novo item/registro na coluna atual.
2.  **Adição rápida (Quick Add)**: Ícone de múltiplos usuários/grupo. Ação esperada: abrir um modal ou linha de inserção rápida em lote.
3.  **Importar (Import)**: Ícone de nuvem com seta para cima. Ação esperada: iniciar fluxo de importação de dados (ex: CSV/Planilhas).

---

## 3. Estilo Visual e Layout (Tailwind CSS)

### A. Cores (Color Palette)
*   **Roxo (Estágio pipeline)**: `#8E24AA` (ou Tailwind `bg-purple-700`).
*   **Laranja (Ícone FAB `+`)**: `#FF5722` (ou Tailwind `text-orange-600`).
*   **Fundo do Dropdown & FAB**: `#FFFFFF` (Branco absoluto).
*   **Textos do Menu & Ícones**: `#202124` (Cinza escuro corporativo, Tailwind `text-gray-800`).
*   **Texto Secundário ("0 Boxes" e ícones de topo)**: `#5F6368` (Cinza médio, Tailwind `text-gray-600`).
*   **Borda sutil do FAB**: `#EDEDED` (ou Tailwind `border-gray-200/50`).

### B. Tipografia
*   **Família de Fontes**: Sans-serif limpa e moderna (ex: `font-sans`, especificamente *Roboto* ou *Inter*).
*   **"0 Boxes"**: `text-sm font-medium tracking-wide text-gray-600` (aprox. 14px).
*   **"0" (no bloco roxo)**: `text-3xl font-bold text-white` (aprox. 30px).
*   **"Fech..."**: `text-xs font-normal text-white/90` (aprox. 12px).
*   **Itens do Menu**: `text-[15px] font-normal tracking-wide text-gray-800` com bom espaçamento vertical.

### C. Bordas, Sombras e Espaçamentos (Spacing & Borders)
*   **Container do Menu (Dropdown)**:
    *   Cantos arredondados: `rounded-lg` (8px).
    *   Sombra: `shadow-[0_4px_16px_rgba(0,0,0,0.12)]` (sombra suave, mas profunda).
    *   Padding interno total: `py-2` (e cada item individual com padding interno para área de clique confortável).
*   **Itens de Menu Individualmente**:
    *   Dimensões de clique: `h-12 px-5 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transitions-colors`.
*   **Botão FAB (`+`)**:
    *   Formato: `w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center shadow-md`.

---

## 4. Guia de Implementação (Dicas para React)

### Sugestão de Biblioteca de Ícones
Para reproduzir os ícones de forma fiel, recomenda-se o uso do **Lucide-react**:
*   *Filtro*: `<ListFilter size={20} className="text-gray-600" />`
*   *Membros/Compartilhar*: `<UserPlus size={20} className="text-gray-600" />`
*   *Três pontos*: `<MoreVertical size={20} className="text-gray-600" />`
*   *Ícone de mais (Menu)*: `<Plus size={20} className="text-gray-600" />`
*   *Adição rápida (Grupo)*: `<Users size={20} className="text-gray-600" />`
*   *Importar (Nuvem)*: `<CloudUpload size={20} className="text-gray-600" />`

### Estrutura de Estados
Utilize o componente `Popover` da biblioteca **Radix UI** (ou `@headlessui/react`) para garantir a acessibilidade e o posicionamento perfeito do dropdown em relação ao botão flutuante, evitando cortes na tela.

---

## Tela 16: Captura de Tela 2026-07-17 às 09.25.12.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.25.12.png`

Erro ao analisar a imagem: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.5-flash\nPlease retry in 30.834809046s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.5-flash"},"quotaValue":"5"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"30s"}]}}

---

## Tela 17: Captura de Tela 2026-07-17 às 09.25.21.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.25.21.png`

Erro ao analisar a imagem: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.5-flash\nPlease retry in 30.832748325s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.5-flash"},"quotaValue":"5"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"30s"}]}}

---

## Tela 18: Captura de Tela 2026-07-17 às 09.25.35.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.25.35.png`

Erro ao analisar a imagem: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.5-flash\nPlease retry in 30.826007471s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"model":"gemini-3.5-flash","location":"global"},"quotaValue":"5"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"30s"}]}}

---

## Tela 19: Captura de Tela 2026-07-17 às 09.25.40.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.25.40.png`

Erro ao analisar a imagem: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.5-flash\nPlease retry in 30.830746349s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.5-flash"},"quotaValue":"5"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"30s"}]}}

---

## Tela 20: Captura de Tela 2026-07-17 às 09.25.48.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.25.48.png`

Erro ao analisar a imagem: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.5-flash\nPlease retry in 30.828505831s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.5-flash"},"quotaValue":"5"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"30s"}]}}

---

## Tela 21: Captura de Tela 2026-07-17 às 09.25.54.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.25.54.png`

Como designer de UI/UX sênior e engenheiro frontend, apresento a análise detalhada para a reconstrução pixel-perfect do painel lateral do **Google Tasks** (versão em português).

---

# Relatório de UI/UX: Google Tasks (Painel Lateral)

## 1. Identificação da Tela
*   **Propósito Principal**: Painel lateral (sidebar) integrado para gerenciamento de tarefas pessoais. A imagem exibe o **estado vazio (Empty State)** da lista "Minhas tarefas" dentro do ecossistema Google Workspace.

---

## 2. Componentes e Funcionalidades

### A. Cabeçalho (Header do Painel)
1.  **Rótulo de Contexto ("TAREFAS")**: Texto em caixa alta, tamanho pequeno e cor neutra secundária, indicando o escopo global.
2.  **Seletor de Lista ("Minhas tarefas" + seta `▼`)**: Botão dropdown interativo. Ao clicar, deve abrir um menu para alternar entre diferentes listas de tarefas do usuário.
3.  **Ações Rápidas (Direita)**:
    *   **Ícone "Abrir em nova aba"** (Quadrado com seta para fora): Abre o Google Tasks em tela cheia.
    *   **Ícone "Fechar" (X)**: Oculta o painel lateral de tarefas.

### B. Barra de Ação Rápida ("Adicionar uma tarefa")
*   **Área Interativa**: Um botão de largura total (width: 100%) que, ao passar o mouse (hover), exibe um fundo cinza muito claro com cantos arredondados.
*   **Ícone de Adição**: Ícone de checkmark com um símbolo de mais integrado (`add_task` do Material Symbols).
*   **Texto de Ação**: "Adicionar uma tarefa" em azul padrão Google, convidando à ação rápida.
*   **Menu de Três Pontos (Vertical Ellipsis `⋮`)**: No canto direito, abre opções de ordenação e configurações da lista.

### C. Área de Estado Vazio (Empty State)
*   **Ilustração Central**: Gráfico vetorial abstrato com paleta pastel (rosa, verde-claro, amarelo-ouro, azul-claro) e traços pretos finos. Representa organização e folhas de tarefas em branco.
*   **Título de Feedback**: "Não há tarefas" (Negrito, tamanho médio/grande).
*   **Texto Auxiliar**: Descrição curta em tom cinza-médio, centralizado, explicando o valor do app ("Adicione suas tarefas e acompanhe-as...").

### D. Barra Lateral de Integrações do Google (Extrema Direita)
*   **Barra Vertical Estreita**: Exibe atalhos para outros serviços (Agenda, Keep, Tarefas, Contatos).
*   **Indicador Ativo**: O ícone do "Tasks" (check azul) possui uma pílula de fundo azul-claro (`bg-[#E8F0FE]`) e uma **linha vertical azul rígida** na borda esquerda da barra lateral, indicando que este painel está atualmente aberto.
*   **Botão de Adição (`+`)**: Permite instalar novos complementos do Workspace.
*   **Rodapé da Barra (`ⓘ`)**: Ícone de informação posicionado no canto inferior direito.

---

## 3. Estilo Visual e Layout (Para implementação com Tailwind CSS)

### Layout e Grid
*   **Estrutura Principal**: Grid flexível contendo:
    *   `Sidebar Esquerda` (Painel do Tasks): Largura fixa de `360px` com cantos superiores esquerdos arredondados (`rounded-tl-2xl` ou `16px`).
    *   `Barra Lateral Direita` (Atalhos do Workspace): Largura fixa de `56px`, com borda esquerda suave separatoria.

### Paleta de Cores (Fidelidade Google Workspace)
*   **Fundo do Painel do Tasks**: `bg-white` (`#FFFFFF`)
*   **Fundo da Barra de Atalhos**: `bg-[#F8F9FA]` (Cinza ultra-claro)
*   **Fundo da Página Geral (Atrás do painel)**: `bg-[#F1F3F4]`
*   **Azul Google (Marca/Ação)**: `text-[#1A73E8]` / `bg-[#1A73E8]`
*   **Fundo Ativo (Ícone Tasks)**: `bg-[#E8F0FE]`
*   **Texto Principal (Títulos)**: `text-[#202124]` (Quase preto)
*   **Texto Secundário/Muted**: `text-[#5F6368]` (Cinza médio)
*   **Bordas**: `border-[#DADCE0]` (Divisores finos de `1px`)

### Tipografia
*   **Família de Fontes**: `font-sans` (Preferencialmente *Google Sans* com fallback para *Roboto* ou *Arial*).
*   **"TAREFAS"**: `text-[11px] font-semibold tracking-wider text-[#5F6368]`
*   **"Minhas tarefas"**: `text-base font-medium text-[#202124]`
*   **"Adicionar uma tarefa"**: `text-[14px] font-medium text-[#1A73E8]`
*   **"Não há tarefas"**: `text-lg font-medium text-[#202124]`
*   **Descrição do Empty State**: `text-sm text-[#5F6368] leading-relaxed max-w-[240px] text-center mx-auto`

### Bordas, Sombras e Detalhes de Cantos
*   **Painel Principal**: `rounded-tl-2xl shadow-none` (Quando acoplado à interface principal).
*   **Borda Divisória**: Borda esquerda da barra de atalhos de `1px solid #E0E0E0` (`border-l border-gray-200`).
*   **Linha de Destaque Azul (Indicador Ativo)**: No lado esquerdo do contêiner do ícone do Tasks na barra vertical (`border-l-[3px] border-[#1A73E8]`).

---

## Tela 22: Captura de Tela 2026-07-17 às 09.25.59.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.25.59.png`

Aqui está o relatório técnico detalhado para a recriação pixel-perfect da interface com React e Tailwind CSS.

---

# Relatório de UI/UX: Painel Lateral de Contatos (Google Workspace)

## 1. Identificação da Tela
*   **Propósito Principal**: Painel lateral secundário para visualização rápida e gerenciamento de contatos integrado (comumente usado no Gmail/Google Agenda).
*   **Estado Atual**: Estado vazio (*Empty State*) quando o usuário não possui contatos cadastrados, oferecendo uma chamada de ação (CTA) direta para criação de contato.

---

## 2. Componentes e Funcionalidades

### A. Cabeçalho (Header)
*   **Título**: "Contatos" (alinhado à esquerda).
*   **Botão de Pesquisa (Ativo/Focado)**: 
    *   Exibe um ícone de lupa envolvido por uma borda circular azul.
    *   *Tooltip* ativo abaixo: "Pesquisa" (fundo preto/cinza escuro, texto branco, cantos levemente arredondados).
*   **Botão "Abrir em nova guia"**: Ícone de um quadrado com seta saindo pelo canto superior direito. Abre a versão completa do Google Contatos.
*   **Botão "Fechar"**: Ícone "X" para ocultar o painel lateral.

### B. Área de Estado Vazio (Empty State)
*   **Ilustração Central**: Vaso de flores estilizado com rostos de avatar nos botões, utilizando tons de azul e branco. (Implementado idealmente como um vetor SVG responsivo).
*   **Título do Estado**: "Nenhum contato ainda" (texto destacado e centralizado).
*   **Texto de Apoio**: Mensagem informativa centralizada descrevendo a utilidade do serviço.
*   **Botão de Ação (CTA)**: "+ Criar contato"
    *   Estilo de pílula (totalmente arredondado).
    *   Ícone de "+" seguido do texto.
    *   Efeito de *hover*: escurecimento suave do azul de fundo e sombra sutil.

### C. Barra de Aplicativos Lateral (Contexto Direito)
*   Barra vertical estreita contendo ícones dos serviços Google (Agenda, Keep, Tarefas, Contatos).
*   **Indicador Ativo**: O ícone de Contatos (silhueta de pessoa) está destacado com um fundo azul claro circular e uma linha vertical azul grossa à sua esquerda, indicando que este painel está aberto.

---

## 3. Estilo Visual e Layout (Tailwind CSS)

### Layout e Grid
*   **Container do Painel**: Painel lateral flutuante com largura fixa (aproximadamente `w-[360px]` a `w-[400px]`), altura total (`h-screen`).
*   **Arredondamento do Painel**: Cantos esquerdos arredondados (`rounded-l-3xl` / `24px`), enquanto o lado direito que encosta na borda da tela permanece reto.
*   **Espaçamento Interno (Padding)**: Cabeçalho com `px-6 pt-6 pb-2`. Área de conteúdo com `px-6 py-8 flex flex-col items-center justify-center text-center`.

### Paleta de Cores (Fidelidade Google Workspace)
*   **Fundo do Painel**: Branco puro (`bg-white` / `#FFFFFF`).
*   **Fundo da Tela Traseira**: Cinza/Azul ultra-claro (`bg-[#F6F8FC]`).
*   **Texto Principal**: Cinza bem escuro (`text-[#1F1F1F]`).
*   **Texto Secundário / Apoio**: Cinza médio (`text-[#444746]`).
*   **Azul Google (Botão/Destaques)**: Azul vibrante (`bg-[#0B57D0]` / `hover:bg-[#0842A0]`).
*   **Destaque do Ícone Ativo (Barra Lateral)**: Azul claro suave (`bg-[#C2E7FF]`) para o círculo interno e Azul Escuro (`#0B57D0`) para a barra de seleção lateral esquerda.
*   **Tooltip**: Preto carvão (`bg-[#1E1E1E]` com opacidade alta).

### Tipografia
*   **Família de Fontes**: Sans-serif limpa e moderna (Google Sans ou `font-sans` padrão do sistema).
*   **Título do Cabeçalho**: `text-[22px]` (aproximadamente `text-xl` ou `text-2xl`), peso `font-normal` (regular).
*   **Título de Estado Vazio**: `text-lg` ou `text-base`, peso `font-medium` ou `font-semibold`.
*   **Texto de Apoio**: `text-sm` (`14px`), espaçamento entre linhas `leading-relaxed` (`line-height: 20px`).

### Detalhes de Bordas, Sombras e Elementos
*   **Botão CTA "Criar contato"**: 
    ```html
    class="flex items-center gap-2 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-medium px-6 py-2.5 rounded-full transition-colors duration-200"
    ```
*   **Borda do Ícone de Busca Ativo**: Círculo fino azul escuro ao redor do ícone (`border-2 border-[#004A77] p-2 rounded-full`).
*   **Tooltip**:
    ```html
    class="absolute bg-[#1E1E1E] text-white text-xs py-1.5 px-3 rounded-md shadow-md mt-2"
    ```

---

## Tela 23: Captura de Tela 2026-07-17 às 09.26.31.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.26.31.png`

Com base na análise detalhada da imagem fornecida, apresento o relatório técnico de UI/UX e especificações de engenharia frontend para a reconstrução fiel da interface.

---

### 1. Identificação da Tela
*   **Nome/Propósito:** Painel Lateral (Drawer/Sidebar) de Configuração de Colunas de um Pipeline de Vendas (CRM).
*   **Função Principal:** Permitir ao usuário personalizar a visualização das colunas da tabela de vendas, reordenando-as, editando o layout padrão ("Padrão") e alternando entre configurações de colunas e estágios.

---

### 2. Componentes e Funcionalidades

1.  **Header da Sidebar:**
    *   **Botão Fechar (X):** Ícone simples no canto superior esquerdo para fechar o painel lateral.
    *   **Título:** Texto principal "De vendas" (alinhado horizontalmente ao lado do botão fechar).
2.  **Abas de Navegação (Tabs):**
    *   Duas abas: "Colunas" (Ativa) e "Estágios" (Inativa).
    *   *Comportamento:* A aba ativa exibe uma linha inferior (border-bottom) azul e texto de cor escura. A aba inativa exibe texto cinza sem borda inferior.
3.  **Seletor de Contexto (Pill Selector):**
    *   Um componente em formato de pílula contendo o texto `"Editando o Padrão ▾ visualizar"`.
    *   *Comportamento:* Funciona como um dropdown para selecionar qual layout/view está sendo editado (ex: "Padrão", "Minha Visão", etc.).
4.  **Subtítulo de Seção:**
    *   Texto `"COLUNAS"` em caixa alta, tamanho reduzido e cor cinza clara, servindo como label para a lista.
5.  **Lista de Colunas (Sortable List):**
    *   Uma pilha vertical de 11 cards representando os campos do CRM.
    *   *Comportamento Esperado:* Esta lista deve suportar ordenação via Drag-and-Drop (Arrastar e Soltar) usando bibliotecas como `@hello-pangea/dnd` ou `@dnd-kit`.
    *   Cada item possui:
        *   Um ícone descritivo à esquerda (representando o tipo de dado: texto, calendário, usuário, etc.).
        *   Texto identificador da coluna (ex: "Nome", "Etapa", "Anotações").
6.  **Rodapé Estático:**
    *   **Botão "Feito":** Localizado no canto inferior esquerdo. Ao clicar, salva as alterações e fecha a sidebar.

---

### 3. Estilo Visual e Layout (Especificações Tailwind CSS)

#### **Layout e Grid**
*   **Tipo de Container:** Drawer/Sidebar fixada à direita ou esquerda da tela principal.
*   **Largura:** Aproximadamente `w-[400px]` a `w-[450px]`.
*   **Espaçamento Interno (Padding):**
    *   Cabeçalho e abas: `px-6 pt-5 pb-0`.
    *   Área de conteúdo (lista): `px-6 py-4`.
    *   Espaçamento entre cards da lista: `space-y-2` (8px de gap vertical).

#### **Cores exatas (Paleta de Cores)**
*   **Fundo do Painel (Header e Abas):** Branco Puro (`bg-white` / `#FFFFFF`).
*   **Fundo da Área da Lista:** Cinza bem claro (`bg-slate-50` / `#F8F9FA` ou `#F9FAFB`).
*   **Texto Principal:** Cinza Escuro (`text-slate-800` / `#1F2937`).
*   **Texto Secundário / Muted ("COLUNAS", Abas Inativas):** Cinza Médio (`text-slate-500` / `#6B7280`).
*   **Aba Ativa / Destaque Azul:** Azul Royal (`border-indigo-600` / `#3E52C1` ou `bg-blue-600`).
*   **Fundo do Seletor "Editando o Padrão":** Cinza Claro (`bg-slate-100` / `#F3F4F6`).
*   **Cards da Lista:**
    *   Fundo: `bg-white` (`#FFFFFF`).
    *   Borda: `border border-slate-200` (`#E5E7EB`).
*   **Botão "Feito" (Ativo):**
    *   Fundo: Azul/Indigo Médio (`bg-[#3e52c1]` ou `bg-indigo-700`).
    *   Texto: Branco (`text-white`).

#### **Tipografia**
*   **Fonte:** Família Sans-serif (Inter, Roboto ou sistema).
*   **Título Principal:** `text-xl font-semibold tracking-tight text-slate-800`.
*   **Abas:** `text-sm font-medium`.
*   **Subtítulo ("COLUNAS"):** `text-xs font-semibold tracking-wider text-slate-400`.
*   **Textos dos Itens da Lista:** `text-sm font-normal text-slate-700`.

#### **Bordas, Sombras e Cantos**
*   **Cantos dos Cards da Lista:** `rounded-lg` (8px).
*   **Cantos da Pílula de Contexto:** `rounded-lg` (8px).
*   **Cantos do Botão "Feito":** `rounded` ou `rounded-md` (4px a 6px).
*   **Sombras (Shadows):** Os cards possuem uma sombra extremamente sutil ou nenhuma sombra, contando apenas com a borda para separação visual. Se necessário, utilizar `shadow-sm`.
*   **Borda das Abas:** Aba ativa possui `border-b-2 border-indigo-600`.

---

## Tela 24: Captura de Tela 2026-07-17 às 09.26.38.png

**Caminho do arquivo**: `Referencias/Captura de Tela 2026-07-17 às 09.26.38.png`

Com base na análise detalhada da imagem fornecida, aqui está o relatório técnico para recriar esta interface com precisão de pixel (pixel-perfect) utilizando **React** e **Tailwind CSS**.

---

### 1. Identificação da Tela
* **Nome/Propósito**: Painel Lateral (Drawer) de Configuração do Funil de Vendas ("De vendas").
* **Função Principal**: Permitir ao usuário gerenciar e ordenar os estágios visuais do pipeline de vendas, escolher um tema de cores (gradiente/arco-íris) e adicionar novos estágios.

---

### 2. Componentes e Funcionalidades

#### A. Cabeçalho (Header)
* **Botão Fechar (`X`)**: Ícone posicionado à esquerda para fechar o painel lateral.
* **Título**: Texto estático "De vendas".
* **Abas de Navegação (Tabs)**:
  * Duas abas: "Colunas" (Inativa) e "Estágios" (Ativa).
  * A aba ativa possui uma borda inferior (indicator) azul espessa e texto destacado em azul.

#### B. Seleção de Tema ("TEMA")
* **Dropdown de Tema**: 
  * Exibe o nome do tema atual ("arco Iris").
  * Exibe uma barra horizontal logo abaixo do texto com o gradiente do tema composto por setas/chevrons coloridos sequenciais (Vermelho, Laranja, Amarelo, Verde, Verde-escuro, Azul-claro, Azul, Roxo, Rosa).
  * Ícone de seta para baixo (seta de dropdown) posicionado à extrema direita.

#### C. Lista de Estágios ("ESTÁGIOS")
* **Itens de Estágio**: Lista vertical onde cada item é um card contendo:
  * Um ícone em formato de seta dupla (chevron à direita) com a cor correspondente ao estágio.
  * O nome do estágio em texto plano.
  * *Comportamento esperado em produção*: Reordenação por arrastar e soltar (Drag and Drop, utilizando bibliotecas como `@hello-pangea/dnd` ou `@dnd-kit`).
* **Botão "+ ADICIONAR ESTÁGIO"**:
  * Botão de largura total com bordas cinzas claras, ícone de mais (`+`) e texto em caixa alta, atuando como gatilho para criar um novo estágio.

#### D. Rodapé (Footer)
* **Área fixa**: Fundo cinza bem claro, separado visualmente do conteúdo por uma sutil linha divisória superior.
* **Botão "Feito"**: Botão de ação primária posicionado à esquerda, com cantos arredondados e cor azul sólida.

---

### 3. Estilo Visual e Layout (Tailwind CSS)

#### Layout e Grid
* **Container Principal (Drawer)**: Fixado à direita ou esquerda, `h-full`, largura típica de `w-[440px]`, `flex flex-col` para manter o cabeçalho e rodapé fixos enquanto o conteúdo do meio tem scroll (`overflow-y-auto`).
* **Espaçamentos (Padding/Gap)**:
  * Padding interno do container: `p-6` (24px).
  * Espaçamento entre os cards de estágio: `space-y-2` (8px).

#### Cores de Referência (Tailwind CSS)
* **Fundo do Painel**: `bg-white` (`#FFFFFF`)
* **Fundo do Rodapé**: `bg-[#F5F5F7]`
* **Bordas dos Cards/Inputs**: `border-[#E5E7EB]` ou `border-[#E2E8F0]` (cinza muito suave).
* **Textos Principais**: `text-[#1F2937]` (Gray-800) para títulos e nomes de estágios.
* **Textos Secundários / Labels (TEMA, ESTÁGIOS)**: `text-[#6B7280]` (Gray-500).
* **Cor de Destaque / Botão Principal ("Feito")**: `bg-[#3B52C5]` (azul royal/indigo médio) com texto `text-white`.
* **Cores dos Chevrons (Estágios)**:
  * Conduzir (Vermelho): `text-[#EF4444]`
  * Contactado (Laranja): `text-[#F97316]`
  * Inclinado (Verde Limão): `text-[#84CC16]`
  * Demonstração (Verde Água/Teal): `text-[#0D9488]`
  * Negociando (Azul Claro): `text-[#0EA5E9]`
  * Fechado - Lost (Azul Escuro): `text-[#2563EB]`
  * Fechado - vencido (Roxo): `text-[#8B5CF6]`
  * Nutrir (Rosa/Magenta): `text-[#D946EF]`

#### Tipografia
* **Família de Fontes**: Sans-serif limpa (ex: `Inter`, `Roboto` ou sistema).
* **Título "De vendas"**: `text-xl` (~20px), `font-medium` ou `font-semibold`.
* **Abas ("Colunas" / "Estágios")**: `text-sm` (~14px), `font-medium`.
* **Labels ("TEMA" / "ESTÁGIOS")**: `text-[11px]`, `font-bold`, `tracking-wider` (com espaçamento entre letras), `uppercase`.
* **Texto dos Estágios**: `text-sm` (~14px) ou `text-base` (~15px), `text-gray-800`.

#### Detalhes de Bordas, Cantos e Sombras
* **Cantos arredondados**:
  * Cards de Estágio e Dropdown de Tema: `rounded-md` (6px) ou `rounded-lg` (8px).
  * Botão "Feito": `rounded-[4px]` ou `rounded-md`.
* **Bordas**: `border` fina de `1px` em todos os elementos de formulário e cards.
* **Sombras**: A interface é majoritariamente plana (flat), sem sombras pesadas nos elementos internos. O drawer em si pode carregar uma sombra suave na lateral esquerda se sobreposto à tela de fundo (`shadow-2xl`).

---

