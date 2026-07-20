import React, { useState } from "react";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Sparkles, 
  Mail, 
  Calendar, 
  Users, 
  Cpu, 
  Database, 
  CheckCircle2, 
  Info, 
  Eye, 
  Search, 
  Layout, 
  Award,
  BookMarked
} from "lucide-react";
import { useI18n } from "../lib/i18n";

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: "home" | "batches" | "meetings" | "batch_send" | "automation") => void;
}

export default function OnboardingGuide({ isOpen, onClose, onNavigateToTab }: OnboardingGuideProps) {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState<"tour" | "docs" | "structure">("tour");
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedDocTopic, setSelectedDocTopic] = useState<string | null>(null);
  const [docSearch, setDocSearch] = useState("");

  if (!isOpen) return null;

  // Translation data
  const content = {
    pt: {
      title: "Centro de Aprendizado & Onboarding",
      subtitle: "Aprenda a dominar o seu CRM Acadêmico do zero",
      tabTour: "Tour Interativo",
      tabDocs: "Guia de Funcionalidades",
      tabStructure: "Estrutura do Planilhas",
      stepOf: "Passo {current} de {total}",
      markAsRead: "Entendi este passo!",
      readStatus: "Concluído",
      startTour: "Iniciar Tour",
      close: "Fechar Guia",
      previous: "Anterior",
      next: "Próximo",
      finish: "Concluir Onboarding",
      tryFeature: "Ir para esta ferramenta ➔",
      docSearchPlaceholder: "Pesquisar manuais...",
      spreadsheetStructureTitle: "Configuração Mandatória do Google Sheets",
      spreadsheetStructureSubtitle: "Sua planilha precisa seguir esta estrutura exata para que as automações funcionem:",
      
      // Tour Steps
      steps: [
        {
          title: "👋 Bem-vindo ao DW CRM Acadêmico!",
          description: "Esta ferramenta foi criada para centralizar e automatizar todo o funil de prospecção estudantil da sua equipe. Ele se integra nativamente ao Google Planilhas, Gmail, Calendar, Tasks e Google Contacts para que você trabalhe de forma fluida sem sair de uma única interface.",
          icon: <Layout className="w-8 h-8 text-indigo-600" />,
          tip: "Clique nos ícones laterais e superiores para descobrir as conexões.",
          targetTab: "home" as const
        },
        {
          title: "📊 Dashboard e Métricas Globais",
          description: "Na tela inicial, você acompanha o progresso geral. Aqui você vê o total de leads ativos, quantos estão aguardando contato, reuniões já agendadas e sua taxa de conversão em tempo real. O gráfico de funil mostra de forma clara em qual estágio do outreach os seus contatos estão travados.",
          icon: <Layout className="w-8 h-8 text-amber-500" />,
          tip: "Sempre comece o seu dia analisando os números para priorizar os gargalos.",
          targetTab: "home" as const
        },
        {
          title: "📋 Gestão de Leads (Batches)",
          description: "A aba 'Batches' é o coração do CRM. Ela lista todos os contatos carregados da planilha. Você pode filtrar leads por status (Lead, Contatado, Aguardando Retorno, Reunião Marcada) ou usar as 'Views Salvas' na barra esquerda (como leads sem resposta há mais de 3 dias).",
          icon: <Users className="w-8 h-8 text-indigo-500" />,
          tip: "Clique em qualquer linha da tabela para abrir o menu de detalhes à direita, salvar notas e sincronizar mudanças.",
          targetTab: "batches" as const
        },
        {
          title: "✉️ Mala Direta e Rastreamento de E-mails",
          description: "Quer prospectar dezenas de leads de uma só vez? Selecione os contatos na tabela de Batches e abra a aba 'Mala Direta'. Crie templates dinâmicos usando tags como {Name} ou {University}. O CRM envia os e-mails individualmente através do seu Gmail e insere um pixel de rastreamento invisível para avisar quando o lead abrir o e-mail!",
          icon: <Mail className="w-8 h-8 text-blue-500" />,
          tip: "Você pode escolher enviar os e-mails usando o seu alias de e-mail corporativo cadastrado na conta Google.",
          targetTab: "batch_send" as const
        },
        {
          title: "🤖 Autopreenchimento com Inteligência Artificial",
          description: "Chega de preenchimento manual massante! Ao abrir os detalhes de um lead e digitar notas sobre as conversas que teve com ele, você pode clicar no botão 'Autofill' (IA). O Gemini lerá suas anotações, atualizará o estágio do pipeline, extrairá a análise de sentimento, fará um resumo limpo e recomendará o próximo passo ideal.",
          icon: <Sparkles className="w-8 h-8 text-purple-500" />,
          tip: "Mantenha as notas ricas em detalhes (ex: 'O estudante demonstrou bastante interesse e agendou para quinta às 15h') para que o Gemini execute o preenchimento com precisão absoluta.",
          targetTab: "batches" as const
        },
        {
          title: "📅 Gestão de Reuniões e Sincronização",
          description: "Na aba 'Reuniões (Meetings)', você controla as propostas de datas enviadas aos leads. Quando o lead responde ou confirma um horário, você pode registrar aqui. O melhor: você pode clicar em 'Sincronizar Calendário' e o CRM varre o seu Google Calendar buscando convites aceitos por esses leads, atualizando automaticamente os horários agendados!",
          icon: <Calendar className="w-8 h-8 text-emerald-500" />,
          tip: "Isso economiza horas de conferência manual de agendas.",
          targetTab: "meetings" as const
        },
        {
          title: "⚙️ Automação Workspace",
          description: "Na aba de Automações, você configura o monitoramento ativo. Você pode programar lembretes automáticos baseados no tempo desde o último contato e verificar a integridade da conexão das suas planilhas integradas do Sheets.",
          icon: <Cpu className="w-8 h-8 text-red-500" />,
          tip: "Ideal para manter a equipe focada no follow-up constante dos estudantes.",
          targetTab: "automation" as const
        },
        {
          title: "🎓 Pronto para Começar!",
          description: "Parabéns! Você concluiu a introdução às ferramentas do seu CRM Acadêmico. Agora sua equipe pode gerenciar, enviar mala direta, e utilizar inteligência artificial para otimizar os processos sem perder nenhum lead estudantil de vista.",
          icon: <Award className="w-8 h-8 text-yellow-500" />,
          tip: "Se tiver dúvidas sobre os nomes das colunas da planilha, acesse a aba 'Estrutura do Planilhas' aqui no menu superior.",
          targetTab: "home" as const
        }
      ],

      // Doc manual topics
      docs: [
        {
          id: "mail_merge",
          title: "✉️ Como funciona a Mala Direta (Mail Merge)?",
          category: "Comunicação",
          content: "1. Acesse a aba **Contatos (Batches)**.\n2. Use as caixas de seleção na primeira coluna para escolher os destinatários.\n3. Vá para a aba **Mala Direta**.\n4. Selecione qual remetente deseja usar (sua conta principal ou algum Alias corporativo cadastrado).\n5. Escreva o assunto e corpo do e-mail. Você pode usar tags como `{Name}`, `{University}` ou `{Student Organization}` para personalizar cada e-mail.\n6. Clique em **Enviar Mala Direta**. Os e-mails são despachados um a um pela API do Gmail. Um pixel espião é inserido na mensagem, permitindo monitorar o status de leitura no CRM!"
        },
        {
          id: "calendar_sync",
          title: "📅 Como sincronizar automaticamente com o Google Calendar?",
          category: "Automação",
          content: "O CRM oferece sincronização bidirecional simplificada com o Google Calendar:\n1. Certifique-se de estar conectado com sua conta do Workspace.\n2. Quando o lead confirmar uma reunião, clique no botão **Sincronizar Calendário** (ícone de agenda na barra superior ou no dashboard).\n3. O sistema varre os eventos do seu Google Calendar nos próximos 30 dias buscando correspondência de e-mail com os leads cadastrados.\n4. Ao encontrar um evento confirmado, o CRM atualiza automaticamente a coluna 'booked time' (horário marcado) e o status do lead para 'Booked' (Marcado) de forma instantânea."
        },
        {
          id: "gemini_ai",
          title: "🤖 Como a Inteligência Artificial (Gemini) me ajuda?",
          category: "Inteligência Artificial",
          content: "O CRM possui o modelo Gemini integrado diretamente para reduzir seu trabalho administrativo:\n1. Na tabela de **Batches**, clique em qualquer lead para abrir a aba lateral de detalhes.\n2. No campo **Notes**, anote resumos livres de suas ligações ou conversas (ex: 'Conversamos pelo WhatsApp, o aluno adorou o programa acadêmico, mas disse que só pode fazer a entrevista semana que vem, pediu para retornar na segunda-feira').\n3. Clique no botão azul **Autofill (Gemini)**.\n4. O Gemini analisará o texto livre e determinará automaticamente:\n   - O novo **Status** sugerido (Lead, Contatado, Reunião Marcada).\n   - Um **Resumo Limpo** e profissional da anotação.\n   - O **Sentimento** do estudante (Altamente Interessado, Neutro, Pouco Interessado).\n   - A **Próxima Ação recomendada** com prazo estimado."
        },
        {
          id: "saved_views",
          title: "🎯 O que são Views Salvas (Filtros Rápidos)?",
          category: "Organização",
          content: "Na barra de navegação esquerda, você encontra a seção **Filtros Rápidos (Saved Views)**. Eles ajudam a focar nos leads certos:\n- **Pendente Equipe (We)**: Mostra leads que estão no estágio inicial e necessitam de primeiro contato por parte da equipe.\n- **Aguardando Retorno**: Filtra apenas os leads com os quais já iniciamos contato e estamos aguardando retorno de e-mail.\n- **Sem Resposta +3 Dias**: Destaca leads contatados há mais de 3 dias que ainda não retornaram. Excelente para campanhas de reengajamento.\n- **Recém Abertos**: Mostra os e-mails mais recentes monitorados pelo pixel de rastreamento que foram lidos pelos leads."
        }
      ]
    },
    en: {
      title: "Learning Center & Onboarding",
      subtitle: "Learn how to master your Academic CRM from absolute zero",
      tabTour: "Interactive Tour",
      tabDocs: "Features Guide",
      tabStructure: "Spreadsheet Setup",
      stepOf: "Step {current} of {total}",
      markAsRead: "Got it!",
      readStatus: "Completed",
      startTour: "Start Tour",
      close: "Close Guide",
      previous: "Previous",
      next: "Next",
      finish: "Finish Onboarding",
      tryFeature: "Go to this tool ➔",
      docSearchPlaceholder: "Search manuals...",
      spreadsheetStructureTitle: "Mandatory Google Sheets Configuration",
      spreadsheetStructureSubtitle: "Your spreadsheet must follow this precise structure for the automations to work correctly:",
      
      // Tour Steps
      steps: [
        {
          title: "👋 Welcome to DW Academic CRM!",
          description: "This tool was built to unify and automate your student recruitment funnel. It integrates natively with Google Sheets, Gmail, Calendar, Tasks, and Google Contacts so you can work seamlessly without leaving a single clean workspace.",
          icon: <Layout className="w-8 h-8 text-indigo-600" />,
          tip: "Click on the sidebar and top header icons to explore the integrations.",
          targetTab: "home" as const
        },
        {
          title: "📊 Dashboard & Global Metrics",
          description: "On the home screen, you track overall progress. See active leads, those waiting for follow-ups, booked meetings, and conversion rates in real time. The pipeline funnel graph clearly shows where your outreach campaigns are bottlenecked.",
          icon: <Layout className="w-8 h-8 text-amber-500" />,
          tip: "Always start your day looking at these metrics to prioritize your daily follow-ups.",
          targetTab: "home" as const
        },
        {
          title: "📋 Lead Management (Batches)",
          description: "The 'Batches' tab is the heart of the CRM. It lists all contacts synchronized from your spreadsheet. You can filter leads by status (Lead, Contacted, Waiting on them, Booked) or use the 'Saved Views' on the left sidebar (like leads with no reply for over 3 days).",
          icon: <Users className="w-8 h-8 text-indigo-500" />,
          tip: "Click any row in the table to open the sidebar details panel, save notes, or synchronize updates directly.",
          targetTab: "batches" as const
        },
        {
          title: "✉️ Mail Merge & Email Tracking",
          description: "Want to pitch dozens of leads at once? Select your desired contacts in the Batches table and go to the 'Mail Merge' tab. Draft dynamic email templates using tags like {Name} or {University}. The CRM sends emails individually through your Gmail and embeds an invisible tracker pixel so you know the exact minute they open it!",
          icon: <Mail className="w-8 h-8 text-blue-500" />,
          tip: "You can choose to send emails from your corporative aliases linked to your Google Workspace account.",
          targetTab: "batch_send" as const
        },
        {
          title: "🤖 AI Autofill (Gemini)",
          description: "No more boring spreadsheet typing! When viewing a lead's details and writing informal notes about your calls, click 'Autofill' (AI). Gemini reads your raw notes, updates the pipeline status, extracts sentiment, generates a clean summary, and recommends the next best action.",
          icon: <Sparkles className="w-8 h-8 text-purple-500" />,
          tip: "Keep notes rich and detailed (e.g., 'Student was highly interested and scheduled a call for Thursday at 3 PM') for Gemini to autofill fields with 100% accuracy.",
          targetTab: "batches" as const
        },
        {
          title: "📅 Meeting Management & Sync",
          description: "In the 'Meetings' tab, you control meeting proposals sent to leads. When a lead confirms, record it here. Better yet: click 'Sync Calendar' and the CRM automatically scans your Google Calendar for accepted meeting invitations, updating lead booking times automatically!",
          icon: <Calendar className="w-8 h-8 text-emerald-500" />,
          tip: "This saves hours of manual calendar double-checks.",
          targetTab: "meetings" as const
        },
        {
          title: "⚙️ Workspace Automation",
          description: "In the Automation tab, you configure active monitoring. Program automatic follow-up reminders based on the elapsed time since the last contact and inspect the spreadsheet connection health.",
          icon: <Cpu className="w-8 h-8 text-red-500" />,
          tip: "Great for keeping your team focused on continuous student engagement.",
          targetTab: "automation" as const
        },
        {
          title: "🎓 Ready to Begin!",
          description: "Congratulations! You have completed the introduction to your Academic CRM. Now your team is ready to scale operations, send mail merge campaigns, and leverage AI to never lose track of a potential student lead again.",
          icon: <Award className="w-8 h-8 text-yellow-500" />,
          tip: "If you have questions about the column names required in Google Sheets, check the 'Spreadsheet Setup' tab here in the top menu.",
          targetTab: "home" as const
        }
      ],

      // Doc manual topics
      docs: [
        {
          id: "mail_merge",
          title: "✉️ How does Mail Merge work?",
          category: "Communication",
          content: "1. Navigate to the **Contacts (Batches)** tab.\n2. Use the checkboxes in the first column to select the target recipients.\n3. Head to the **Mail Merge** tab.\n4. Select your preferred sender alias (your main profile or a registered company alias).\n5. Write your subject and email body. Use placeholders like `{Name}`, `{University}`, or `{Student Organization}` to personalize each email.\n6. Click **Send Mail Merge**. Emails are sent individually via Gmail API. An invisible tracking pixel is embedded to monitor open rates directly in your CRM!"
        },
        {
          id: "calendar_sync",
          title: "📅 How to auto-sync with Google Calendar?",
          category: "Automation",
          content: "The CRM provides streamlined, two-way sync with Google Calendar:\n1. Make sure you are logged in with your Google Workspace account.\n2. When a lead books/confirms a slot, click the **Sync Calendar** button (calendar icon in the top header or on the dashboard).\n3. The system scans your Google Calendar events for the next 30 days, matching attendee emails with leads registered in your CRM.\n4. Once a confirmed match is found, the CRM automatically updates the 'booked time' column and flips the lead's status to 'Booked' instantly."
        },
        {
          id: "gemini_ai",
          title: "🤖 How does the Gemini AI help me?",
          category: "Artificial Intelligence",
          content: "The CRM integrates Gemini directly to save you admin time:\n1. On the **Batches** table, click any lead row to open its details sidebar.\n2. Under the **Notes** field, write down informal summaries of your calls (e.g., 'Had a quick chat on WhatsApp, student is very interested in the scholar program but requested a follow-up call on Monday morning since they are traveling right now').\n3. Click the blue **Autofill (Gemini)** button.\n4. Gemini analyzes the raw text and automatically infers:\n   - Inferred **Pipeline Status** (Lead, Contacted, Booked, etc.).\n   - A **Clean, Professional Summary** of the call notes.\n   - Student **Sentiment** (Highly Interested, Neutral, Uninterested).\n   - Recommended **Next Step** with a recommended time frame."
        },
        {
          id: "saved_views",
          title: "🎯 What are Saved Views?",
          category: "Organization",
          content: "On the left navigation bar, you'll find **Saved Views (Quick Filters)**. They help focus your attention on critical leads:\n- **Pending Team (We)**: Leads in initial stages that need their first outreach.\n- **Waiting on Them**: Leads that have already received an email and we are currently waiting for a response.\n- **No Reply +3 Days**: Highlights leads contacted over 3 days ago with no response yet. Perfect for follow-up push campaigns.\n- **Recently Opened**: Leads who recently opened their emails tracked by our pixel espionage tool."
        }
      ]
    }
  };

  const activeLang = locale === "pt" ? content.pt : content.en;
  const steps = activeLang.steps;
  const currentTourStep = steps[currentStep] || steps[0];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      if (onNavigateToTab && steps[currentStep + 1]?.targetTab) {
        onNavigateToTab(steps[currentStep + 1].targetTab);
      }
      
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(currentStep + 1);
    } else {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      if (onNavigateToTab && steps[currentStep - 1]?.targetTab) {
        onNavigateToTab(steps[currentStep - 1].targetTab);
      }
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSelectStep = (idx: number) => {
    if (onNavigateToTab && steps[idx]?.targetTab) {
      onNavigateToTab(steps[idx].targetTab);
    }
    setCurrentStep(idx);
  };

  const filteredDocs = activeLang.docs.filter(
    (d) =>
      d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
      d.content.toLowerCase().includes(docSearch.toLowerCase())
  );

  // Compute selected document topic outside to avoid complex nested rendering
  const selectedDoc = selectedDocTopic ? activeLang.docs.find((d) => d.id === selectedDocTopic) : null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-opacity duration-300" id="onboarding-modal-overlay">
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 transition-all duration-300 transform scale-100"
        id="onboarding-guide-card"
      >
        {/* Banner header of onboarding */}
        <div className="bg-indigo-950 text-white p-6 relative overflow-hidden flex flex-col justify-between select-none shrink-0">
          {/* Subtle decorations */}
          <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-indigo-800/20 blur-2xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-10 w-44 h-44 rounded-full bg-amber-500/15 blur-xl pointer-events-none" />

          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase font-mono mb-1">
                <Sparkles className="w-4 h-4" />
                <span>{locale === "pt" ? "Central de Ajuda" : "Help Center"}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{activeLang.title}</h2>
              <p className="text-xs text-indigo-200/90 font-medium mt-1">{activeLang.subtitle}</p>
            </div>
            
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-full text-indigo-300 hover:text-white transition-all cursor-pointer border border-transparent hover:border-indigo-800"
              title={activeLang.close}
              id="close-onboarding-x-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu/Tabs in help card */}
          <div className="flex gap-2.5 mt-6 border-b border-indigo-900 z-10 pb-1">
            <button
              onClick={() => {
                setActiveTab("tour");
                if (onNavigateToTab && steps[currentStep]?.targetTab) {
                  onNavigateToTab(steps[currentStep].targetTab);
                }
              }}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "tour" 
                  ? "bg-white text-indigo-950 shadow-xs" 
                  : "text-indigo-200 hover:text-white hover:bg-white/5"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{activeLang.tabTour}</span>
            </button>

            <button
              onClick={() => setActiveTab("docs")}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "docs" 
                  ? "bg-white text-indigo-950 shadow-xs" 
                  : "text-indigo-200 hover:text-white hover:bg-white/5"
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span>{activeLang.tabDocs}</span>
            </button>

            <button
              onClick={() => setActiveTab("structure")}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "structure" 
                  ? "bg-white text-indigo-950 shadow-xs" 
                  : "text-indigo-200 hover:text-white hover:bg-white/5"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>{activeLang.tabStructure}</span>
            </button>
          </div>
        </div>

        {/* Content of the Active Tab */}
        <div className="flex-1 overflow-hidden flex bg-gray-50/50">
          {activeTab === "tour" && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Step Navigation Panel */}
              <div className="w-full md:w-64 border-r border-gray-150 bg-white flex flex-col gap-1 p-4 shrink-0 overflow-y-auto hidden md:block select-none">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-2">
                  {locale === "pt" ? "Lista de Etapas" : "Steps Checklist"}
                </div>
                
                {steps.map((s, idx) => {
                  const isCurrent = currentStep === idx;
                  const isDone = completedSteps.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectStep(idx)}
                      className={`w-full text-left py-2 px-3 rounded-xl transition-all flex items-center gap-2.5 text-xs cursor-pointer ${
                        isCurrent 
                          ? "bg-indigo-50 font-bold text-indigo-950 border border-indigo-150" 
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <span className={`w-4 h-4 rounded-full border text-[9px] font-bold flex items-center justify-center shrink-0 ${
                          isCurrent 
                            ? "border-indigo-600 text-indigo-600 bg-white" 
                            : "border-gray-300 text-gray-400"
                        }`}>
                          {idx + 1}
                        </span>
                      )}
                      <span className="truncate">{s.title.substring(s.title.indexOf(" ") + 1)}</span>
                    </button>
                  );
                })}

                {/* Completion widget at bottom */}
                <div className="mt-auto bg-indigo-50/40 border border-indigo-100 rounded-2xl p-3.5 flex flex-col gap-1.5 text-[11px] text-indigo-950 font-medium shrink-0">
                  <div className="flex justify-between items-center font-bold">
                    <span>{locale === "pt" ? "Treinamento" : "Training Progress"}</span>
                    <span>{Math.round((completedSteps.length / steps.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden w-full">
                    <div 
                      style={{ width: `${(completedSteps.length / steps.length) * 100}%` }} 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                    />
                  </div>
                </div>
              </div>

              {/* Right Interactive Presentation Stage */}
              <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-1 rounded select-none">
                      {activeLang.stepOf.replace("{current}", String(currentStep + 1)).replace("{total}", String(steps.length))}
                    </span>
                    
                    {currentTourStep.targetTab && (
                      <button
                        onClick={() => {
                          if (onNavigateToTab) {
                            onNavigateToTab(currentTourStep.targetTab);
                          }
                        }}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{activeLang.tryFeature}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl shrink-0 select-none">
                      {currentTourStep.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-indigo-950 tracking-tight">{currentTourStep.title}</h3>
                      <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed whitespace-pre-line">{currentTourStep.description}</p>
                    </div>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-100 p-4 rounded-2xl flex gap-2.5 items-start mt-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 pointer-events-none" />
                    <div className="text-xs text-amber-900 leading-relaxed font-medium">
                      <strong className="block font-bold">{locale === "pt" ? "💡 Dica Profissional:" : "💡 Pro Tip:"}</strong>
                      {currentTourStep.tip}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-gray-150 pt-5 mt-6 shrink-0">
                  <button
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{activeLang.previous}</span>
                  </button>

                  <div className="flex gap-1.5 md:hidden">
                    {steps.map((_, idx) => (
                      <span 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full transition-all ${currentStep === idx ? "bg-indigo-600 w-3" : "bg-gray-300"}`} 
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 text-xs font-bold bg-indigo-950 text-white hover:bg-indigo-900 rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <span>{currentStep === steps.length - 1 ? activeLang.finish : activeLang.next}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "docs" && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full">
              {/* Left Manual Index List */}
              <div className="w-full md:w-72 border-r border-gray-150 bg-white flex flex-col overflow-hidden shrink-0">
                <div className="p-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={activeLang.docSearchPlaceholder}
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg py-1.5 pl-8 pr-3 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1">
                  {filteredDocs.map((doc) => {
                    const isSelected = selectedDocTopic === doc.id;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDocTopic(doc.id)}
                        className={`w-full text-left py-2.5 px-3.5 rounded-xl transition-all text-xs flex flex-col gap-1 cursor-pointer ${
                          isSelected 
                            ? "bg-indigo-50 border border-indigo-150 text-indigo-950 font-semibold" 
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                        }`}
                      >
                        <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-500">{doc.category}</span>
                        <span className="truncate">{doc.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Manual Content Stage */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
                {selectedDoc ? (
                  <div className="flex flex-col gap-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded self-start select-none">
                      {selectedDoc.category}
                    </span>
                    <h3 className="text-base font-black text-indigo-950 tracking-tight">{selectedDoc.title}</h3>
                    
                    <div className="text-xs text-gray-500 font-medium leading-relaxed whitespace-pre-line bg-white p-5 rounded-2xl border border-gray-150 shadow-inner">
                      {selectedDoc.content}
                    </div>

                    <div className="flex items-center gap-2 mt-4 text-[11px] text-gray-400 select-none">
                      <Eye className="w-4 h-4 text-indigo-500" />
                      <span>{locale === "pt" ? "Dúvidas específicas? Fale com a equipe de desenvolvimento." : "Any other questions? Reach out to your development lead."}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3.5 shadow-sm border border-indigo-100 select-none">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-800">{locale === "pt" ? "Selecione um Tópico de Ajuda" : "Select a Help Topic"}</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-[280px]">
                      {locale === "pt" 
                        ? "Escolha um guia prático na lista à esquerda para ver instruções detalhadas com passo a passo."
                        : "Choose a guide on the left index to inspect complete visual step-by-step documentation."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "structure" && (
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 w-full">
              <div>
                <h3 className="text-base font-black text-indigo-950 tracking-tight flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <span>{activeLang.spreadsheetStructureTitle}</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1.5 font-medium leading-relaxed">{activeLang.spreadsheetStructureSubtitle}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* batches sheet */}
                <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-indigo-950 font-mono">1. batches</span>
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded select-none">
                      {locale === "pt" ? "Aba Contatos" : "Contacts Sheet"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-[11px] font-medium text-gray-500 font-mono">
                    <div className="p-2 bg-gray-50 rounded border border-gray-100 flex justify-between">
                      <strong className="text-indigo-950">University</strong>
                      <span>(ex: USP)</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-100 flex justify-between">
                      <strong className="text-indigo-950">Student Organization</strong>
                      <span>(ex: Atlética)</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-100 flex justify-between">
                      <strong className="text-indigo-950">Name</strong>
                      <span>(ex: João Silva)</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-100 flex justify-between">
                      <strong className="text-indigo-950">Status</strong>
                      <span>(Lead, Contacted...)</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-100 flex justify-between">
                      <strong className="text-indigo-950">Email Sent</strong>
                      <span>(ex: joao@usp.br)</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-100 flex justify-between">
                      <strong className="text-indigo-950">Notes</strong>
                      <span>(Texto Livre / AI)</span>
                    </div>
                  </div>
                </div>

                {/* meetings sheet */}
                <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-indigo-950 font-mono">2. meetings</span>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded select-none">
                      {locale === "pt" ? "Aba Reuniões" : "Meetings Sheet"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-[11px] font-medium text-gray-500 font-mono">
                    <div className="p-2 bg-gray-50 rounded border border-gray-100 flex justify-between">
                      <strong className="text-indigo-950">email</strong>
                      <span>(ex: joao@usp.br)</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-100 flex justify-between">
                      <strong className="text-indigo-950">suggested times</strong>
                      <span>(ex: Quinta 15h)</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-100 flex justify-between">
                      <strong className="text-indigo-950">booked time</strong>
                      <span>(ex: 18/07/2026 15:00)</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-100 flex justify-between">
                      <strong className="text-indigo-950">Notes</strong>
                      <span>(Notas de agendamento)</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-100 flex justify-between">
                      <strong className="text-indigo-950">Status</strong>
                      <span>(Booked, Proposed)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-150 p-4 rounded-2xl flex gap-2.5 items-start mt-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 pointer-events-none" />
                <div className="text-xs text-blue-900 leading-relaxed font-medium">
                  <strong className="block font-bold">{locale === "pt" ? "Importante: Sensibilidade a Maiúsculas/Minúsculas" : "Important: Case-Sensitivity"}</strong>
                  {locale === "pt" 
                    ? "Os nomes das abas (batches, meetings) e os nomes de suas respectivas colunas devem ser escritos exatamente como mostrado acima, respeitando letras maiúsculas e minúsculas."
                    : "The tab names (batches, meetings) and their respective column names must be written exactly as shown above, respecting capitalization (case-sensitivity)."}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="bg-gray-100 border-t border-gray-250 py-3.5 px-6 flex items-center justify-between select-none shrink-0">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>DW CRM {locale === "pt" ? "Pronto para Operar" : "Production Ready"}</span>
          </span>
          <button 
            onClick={onClose}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer uppercase tracking-wider font-mono hover:underline"
            id="finish-onboarding-btn"
          >
            {locale === "pt" ? "Começar a usar ➔" : "Start Using ➔"}
          </button>
        </div>
      </div>
    </div>
  );
}
