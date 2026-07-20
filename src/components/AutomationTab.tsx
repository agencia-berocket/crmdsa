import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  Sparkles, 
  MailWarning, 
  Clock, 
  Send, 
  Check, 
  CheckCircle,
  AlertOctagon,
  Eye,
  ArrowRight,
  Info
} from "lucide-react";
import { BatchContact, MeetingRow } from "../types";
import { searchReplies, searchBounces, updateSheetRow, sendGmailMessage } from "../lib/google-api";
import { motion } from "motion/react";
import { useI18n } from "../lib/i18n";

interface AutomationTabProps {
  spreadsheetId: string;
  batchesData: BatchContact[];
  meetingsData: MeetingRow[];
  onRefresh: () => void;
}

export default function AutomationTab({
  spreadsheetId,
  batchesData,
  meetingsData,
  onRefresh,
}: AutomationTabProps) {
  const { t, locale } = useI18n();

  // Inbox Reply Sync States
  const [isSyncingReplies, setIsSyncingReplies] = useState(false);
  const [repliesResult, setRepliesResult] = useState<string[] | null>(null);

  // Bounce Sync States
  const [isSyncingBounces, setIsSyncingBounces] = useState(false);
  const [detectedBounces, setDetectedBounces] = useState<{ recipient: string; subject: string; date: string }[]>([]);

  // Tracked Opens States
  const [isSyncingOpens, setIsSyncingOpens] = useState(false);
  const [trackedOpens, setTrackedOpens] = useState<{ email: string; row: string; openedAt: string }[]>([]);

  // Follow-up states
  const [followUpCandidates, setFollowUpCandidates] = useState<BatchContact[]>([]);
  const [isSendingFollowUp, setIsSendingFollowUp] = useState<number | null>(null); // contact row index

  // Extract Email Helper
  const extractEmail = (c: BatchContact) => {
    const emailCol = (c.email || "").trim();
    if (emailCol.includes("@")) return emailCol;
    const sentCol = (c.emailSent || "").trim();
    if (sentCol.includes("@")) return sentCol;
    const notesText = (c.notes || "").trim();
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = notesText.match(emailRegex);
    return match ? match[0] : "";
  };

  // 1. Analyze Follow-up Candidates (sent >= 3 days ago, status is waiting on them)
  useEffect(() => {
    const today = new Date();
    const candidates = batchesData.filter((contact) => {
      const status = (contact.status || "").toLowerCase().trim();
      const isWaiting = status === "waiting on them" || status === "" || !status;
      
      if (!isWaiting) return false;

      // Extract date from Notes (e.g., "Enviado em DD/MM/YYYY" or "Sent on DD/MM/YYYY")
      const match = (contact.notes || "").match(/(?:Enviado em|Sent on) (\d{2})\/(\d{2})\/(\d{4})/);
      if (!match) return false;

      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const year = parseInt(match[3]);
      
      const sentDate = new Date(year, month, day);
      const diffTime = Math.abs(today.getTime() - sentDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      return diffDays >= 3;
    });

    setFollowUpCandidates(candidates);
  }, [batchesData]);

  // Load Tracked Opens buffer from our Express backend
  const loadTrackedOpens = async () => {
    try {
      const res = await fetch(`/api/events?spreadsheetId=${spreadsheetId}`);
      if (res.ok) {
        const data = await res.json();
        setTrackedOpens(data);
      }
    } catch (err) {
      console.error(locale === "pt" ? "Erro ao carregar aberturas do pixel:" : "Error loading pixel opens:", err);
    }
  };

  useEffect(() => {
    if (spreadsheetId) {
      loadTrackedOpens();
    }
  }, [spreadsheetId]);

  // Sync Open Tracker Pixel Events to Google Sheets
  const handleSyncOpensToSheets = async () => {
    if (trackedOpens.length === 0) return;

    const confirmed = window.confirm(
      locale === "pt"
        ? `Deseja atualizar o status de ${trackedOpens.length} contatos abertos para "Opened" no Google Sheets?`
        : `Do you want to update the status of ${trackedOpens.length} opened contacts to "Opened" in Google Sheets?`
    );
    if (!confirmed) return;

    setIsSyncingOpens(true);
    try {
      let updatedCount = 0;
      for (const open of trackedOpens) {
        const rowIndex = parseInt(open.row);
        const contact = batchesData.find((c) => c.rowIndex === rowIndex);
        
        if (contact) {
          const todayStr = new Date().toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
          const notesWithOpen = contact.notes 
            ? `${contact.notes}\n[${locale === "pt" ? "Automação: E-mail aberto detectado em" : "Automation: Email open detected on"} ${todayStr}]`
            : `[${locale === "pt" ? "Automação: E-mail aberto detectado em" : "Automation: Email open detected on"} ${todayStr}]`;

          await updateSheetRow(spreadsheetId, "batches", rowIndex, {
            Status: "Opened",
            Notes: notesWithOpen,
          });
          updatedCount++;
        }
      }

      // Clear opens buffer on Express server
      await fetch("/api/events/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId, events: trackedOpens }),
      });

      alert(
        locale === "pt"
          ? `Sucesso! Status de ${updatedCount} contatos atualizado para "Opened" na planilha.`
          : `Success! Status of ${updatedCount} contacts updated to "Opened" in the spreadsheet.`
      );
      loadTrackedOpens();
      onRefresh();
    } catch (err) {
      console.error(locale === "pt" ? "Erro ao sincronizar aberturas:" : "Error syncing opens:", err);
      alert(locale === "pt" ? "Erro ao sincronizar e-mails abertos." : "Error syncing opened emails.");
    } finally {
      setIsSyncingOpens(false);
    }
  };

  // Sync Inbox Replies to Sheets (Replied - waiting)
  const handleSyncInboxReplies = async () => {
    setIsSyncingReplies(true);
    setRepliesResult(null);

    try {
      const batchEmails = batchesData.map(c => extractEmail(c)).filter(Boolean);
      const meetingEmails = meetingsData.map(m => m.email).filter(Boolean);
      const allEmails = Array.from(new Set([...batchEmails, ...meetingEmails]));

      if (allEmails.length === 0) {
        alert(
          locale === "pt"
            ? "Nenhum endereço de e-mail foi encontrado nas planilhas para buscar respostas."
            : "No email address was found in the spreadsheets to search for replies."
        );
        setIsSyncingReplies(false);
        return;
      }

      const repliedDetections = await searchReplies(allEmails);

      let sheetsUpdated = 0;
      const todayStr = new Date().toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      for (const reply of repliedDetections) {
        const email = reply.email;
        const rowIndex = reply.rowIndex;

        // Try to match batch contact by rowIndex first, then by email
        let batchContact = rowIndex ? batchesData.find(c => c.rowIndex === rowIndex) : null;
        if (!batchContact) {
          batchContact = batchesData.find(c => extractEmail(c).toLowerCase() === email.toLowerCase());
        }

        if (batchContact && batchContact.status !== "Replied - waiting") {
          const notesWithReply = batchContact.notes 
            ? `${batchContact.notes}\n[${locale === "pt" ? "Automação: Resposta recebida detectada em" : "Automation: Reply received detected on"} ${todayStr}]`
            : `[${locale === "pt" ? "Automação: Resposta recebida detectada em" : "Automation: Reply received detected on"} ${todayStr}]`;

          const updateData: any = {
            Status: "Replied - waiting",
            Notes: notesWithReply,
          };
          updateData["Alerta Retorno"] = locale === "pt" ? "Novo Retorno!" : "New Reply!";
          updateData["Email Received Alert"] = locale === "pt" ? "Novo Retorno!" : "New Reply!";
          updateData["Alerta Recebido"] = locale === "pt" ? "Novo Retorno!" : "New Reply!";
          updateData["Retorno Notificação"] = locale === "pt" ? "Novo Retorno!" : "New Reply!";

          await updateSheetRow(spreadsheetId, "batches", batchContact.rowIndex, updateData);
          sheetsUpdated++;
        }

        const meetingRow = meetingsData.find(m => m.email.toLowerCase() === email.toLowerCase());
        if (meetingRow && meetingRow.status !== "Replied - waiting") {
          const notesWithReply = meetingRow.notes 
            ? `${meetingRow.notes}\n[${locale === "pt" ? "Automação: Resposta recebida detectada em" : "Automation: Reply received detected on"} ${todayStr}]`
            : `[${locale === "pt" ? "Automação: Resposta recebida detectada em" : "Automation: Reply received detected on"} ${todayStr}]`;

          const updateData: any = {
            status: "Replied - waiting",
            Notes: notesWithReply,
          };
          updateData["Alerta Retorno"] = locale === "pt" ? "Novo Retorno!" : "New Reply!";
          updateData["Email Received Alert"] = locale === "pt" ? "Novo Retorno!" : "New Reply!";
          updateData["Alerta Recebido"] = locale === "pt" ? "Novo Retorno!" : "New Reply!";
          updateData["Retorno Notificação"] = locale === "pt" ? "Novo Retorno!" : "New Reply!";

          await updateSheetRow(spreadsheetId, "meetings", meetingRow.rowIndex, updateData);
          sheetsUpdated++;
        }
      }

      setRepliesResult(repliedDetections.map(r => r.email));
      if (sheetsUpdated > 0) {
        onRefresh();
      }
    } catch (err) {
      console.error(locale === "pt" ? "Erro ao rodar automação de respostas:" : "Error running replies automation:", err);
      alert(
        locale === "pt"
          ? "Houve um erro ao buscar e-mails de resposta no Gmail."
          : "There was an error searching for reply emails in Gmail."
      );
    } finally {
      setIsSyncingReplies(false);
    }
  };

  // Sync Bounce Emails to Sheets (Email bounced)
  const handleSyncBounces = async () => {
    setIsSyncingBounces(true);
    setDetectedBounces([]);

    try {
      const bounces = await searchBounces();
      const matchedBounces: { recipient: string; subject: string; date: string }[] = [];

      let bounceUpdates = 0;
      const todayStr = new Date().toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      for (const bounce of bounces) {
        const contact = batchesData.find(
          (c) => extractEmail(c).toLowerCase() === bounce.recipient.toLowerCase()
        );

        if (contact) {
          matchedBounces.push(bounce);

          if (contact.status !== "Email bounced") {
            const notesWithBounce = contact.notes 
              ? `${contact.notes}\n[${locale === "pt" ? `Automação: Falha de entrega (Bounce) detectada em ${todayStr}. Assunto: "${bounce.subject}"` : `Automation: Delivery failure (Bounce) detected on ${todayStr}. Subject: "${bounce.subject}"`}]`
              : `[${locale === "pt" ? `Automação: Falha de entrega (Bounce) detectada em ${todayStr}` : `Automation: Delivery failure (Bounce) detected on ${todayStr}`}]`;

            await updateSheetRow(spreadsheetId, "batches", contact.rowIndex, {
              Status: "Email bounced",
              Notes: notesWithBounce,
            });
            bounceUpdates++;
          }
        }
      }

      setDetectedBounces(matchedBounces);
      if (bounceUpdates > 0) {
        onRefresh();
      }
    } catch (err) {
      console.error(locale === "pt" ? "Erro ao rodar automação de bounces:" : "Error running bounces automation:", err);
      alert(
        locale === "pt"
          ? "Houve um erro ao buscar erros de entrega (bounces) no Gmail."
          : "There was an error searching for delivery failures (bounces) in Gmail."
      );
    } finally {
      setIsSyncingBounces(false);
    }
  };

  // Send personalized Drip Follow-up Email
  const handleSendFollowUp = async (contact: BatchContact) => {
    const recipient = extractEmail(contact);
    if (!recipient) {
      alert(
        locale === "pt"
          ? "E-mail do contato inválido ou ausente."
          : "Invalid or missing contact email."
      );
      return;
    }

    const confirmed = window.confirm(
      locale === "pt"
        ? `Deseja disparar um e-mail de Follow-up (cobrança amigável) para ${contact.name} (${contact.university})?`
        : `Do you want to send a Follow-up email (friendly nudge) to ${contact.name} (${contact.university})?`
    );
    if (!confirmed) return;

    setIsSendingFollowUp(contact.rowIndex);
    try {
      const todayStr = new Date().toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const followUpSubject = locale === "pt"
        ? `Acompanhamento: Parceria com o ${contact.studentOrganization}`
        : `Follow-up: Partnership with ${contact.studentOrganization}`;
      const followUpBody = locale === "pt"
        ? `
          <p>Olá, <strong>${contact.name}</strong>!</p>
          <p>Tudo bem?</p>
          <p>Gostaria de dar um rápido retorno sobre a proposta que te enviei há alguns dias para parceria com o <strong>${contact.studentOrganization}</strong> na <strong>${contact.university}</strong>.</p>
          <p>Caso tenha 10 minutos livres para batermos um papo curto na próxima semana, seria excelente.</p>
          <p>Abraços,<br/>Equipe de Parcerias</p>
        `
        : `
          <p>Hello, <strong>${contact.name}</strong>!</p>
          <p>Hope you are doing well.</p>
          <p>I wanted to follow up quickly on the partnership proposal I sent you a few days ago regarding <strong>${contact.studentOrganization}</strong> at <strong>${contact.university}</strong>.</p>
          <p>If you have 10 minutes for a brief call next week, that would be wonderful.</p>
          <p>Best regards,<br/>Partnership Team</p>
        `;

      const followUpBodyWithTag = followUpBody + `<br/><div style="display:none;color:transparent;font-size:0px;line-height:0;opacity:0;">[DSA-ID:${contact.rowIndex}]</div>`;
      await sendGmailMessage(recipient, followUpSubject, followUpBodyWithTag);

      const updatedNotes = contact.notes 
        ? `${contact.notes}\n[${locale === "pt" ? "Follow-up Automático Enviado em" : "Automatic Follow-up Sent on"} ${todayStr}]`
        : `[${locale === "pt" ? "Follow-up Automático Enviado em" : "Automatic Follow-up Sent on"} ${todayStr}]`;

      const updateData: any = {
        Status: "waiting on them",
        Notes: updatedNotes,
      };
      updateData["Alerta Envio"] = locale === "pt" ? "Enviado" : "Sent";
      updateData["Email Sent Alert"] = locale === "pt" ? "Enviado" : "Sent";
      updateData["Alerta Retorno"] = ""; // clear reply alert upon follow up
      updateData["Email Received Alert"] = "";
      updateData["Alerta Recebido"] = "";
      updateData["Retorno Notificação"] = "";

      await updateSheetRow(spreadsheetId, "batches", contact.rowIndex, updateData);

      alert(
        locale === "pt"
          ? "E-mail de Follow-up enviado com sucesso!"
          : "Follow-up email sent successfully!"
      );
      onRefresh();
    } catch (err) {
      console.error(locale === "pt" ? "Erro ao enviar follow-up:" : "Error sending follow-up:", err);
      alert(
        locale === "pt"
          ? "Houve um erro ao processar o envio do follow-up."
          : "There was an error processing the follow-up email."
      );
    } finally {
      setIsSendingFollowUp(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-1" id="automation-tab">
      
      {/* Control Panel (Left column) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Sync Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
            {locale === "pt" ? "Painel Central de Automação" : "Automation Control Panel"}
          </span>
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 -mt-1">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            {locale === "pt" ? "Sincronização Ativa" : "Active Synchronization"}
          </h3>

          <p className="text-xs text-gray-400 leading-relaxed">
            {locale === "pt"
              ? "Nossos robôs integrados varrem seu Workspace Gmail em tempo real para sincronizar o status da sua planilha. Clique abaixo para executar as varreduras automáticas."
              : "Our integrated robots scan your Gmail Workspace in real time to synchronize your spreadsheet status. Click below to run automatic scans."}
          </p>

          <div className="flex flex-col gap-2.5 mt-2">
            {/* Sync Replies */}
            <button
              onClick={handleSyncInboxReplies}
              disabled={isSyncingReplies}
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
              id="sync-replies-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingReplies ? "animate-spin" : ""}`} />
              <span>{locale === "pt" ? "Buscar Novas Respostas" : "Search New Replies"}</span>
            </button>

            {/* Sync Bounces */}
            <button
              onClick={handleSyncBounces}
              disabled={isSyncingBounces}
              className="w-full inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs transition-colors border border-gray-200 cursor-pointer disabled:opacity-50"
              id="sync-bounces-btn"
            >
              <MailWarning className={`w-3.5 h-3.5 ${isSyncingBounces ? "animate-spin" : ""}`} />
              <span>{locale === "pt" ? "Verificar Bounces/Erros" : "Check Bounces/Errors"}</span>
            </button>
          </div>

          {/* Sync Results reports */}
          {repliesResult && (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 text-xs">
              <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                {locale === "pt" ? "Sincronização Concluída" : "Sync Completed"}
              </p>
              <p className="mt-1.5 text-emerald-800 leading-relaxed">
                {locale === "pt"
                  ? `Encontradas ${repliesResult.length} respostas. Status atualizados para Replied - waiting na planilha.`
                  : `Found ${repliesResult.length} replies. Statuses updated to Replied - waiting in the spreadsheet.`}
              </p>
            </div>
          )}

          {detectedBounces.length > 0 && (
            <div className="bg-red-50/50 border border-red-200 rounded-xl p-4 text-xs text-red-900">
              <p className="font-bold flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-red-600" />
                {locale === "pt" ? "Falhas Identificadas" : "Delivery Failures Detected"}
              </p>
              <p className="mt-1.5 text-red-800 leading-relaxed">
                {locale === "pt"
                  ? `Detectados ${detectedBounces.length} bounces. Os status dessas linhas foram movidos para Email bounced.`
                  : `Detected ${detectedBounces.length} bounces. Statuses for these rows have been moved to Email bounced.`}
              </p>
            </div>
          )}
        </div>

        {/* Tracking opens card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
            <Eye className="w-4.5 h-4.5 text-indigo-500" />
            {locale === "pt" ? `Visualizações do Pixel (${trackedOpens.length})` : `Pixel Views (${trackedOpens.length})`}
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            {locale === "pt"
              ? "Sempre que um destinatário abrir seu e-mail, nosso pixel invisível registrará o evento instantaneamente. Grave esses dados na planilha abaixo."
              : "Whenever a recipient opens your email, our invisible pixel will record the event instantly. Save this data to the spreadsheet below."}
          </p>

          {trackedOpens.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-[10px] text-gray-700 max-h-[120px] overflow-y-auto font-mono flex flex-col gap-1.5 shadow-inner">
                {trackedOpens.map((open, idx) => (
                  <div key={idx} className="flex justify-between border-b border-gray-100 pb-1 last:border-0 truncate">
                    <span className="font-bold text-gray-800">{open.email}</span>
                    <span className="text-gray-400">{locale === "pt" ? "Linha" : "Row"} #{open.row}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSyncOpensToSheets}
                disabled={isSyncingOpens}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3 px-3 rounded-xl text-xs transition-colors cursor-pointer"
                id="sync-tracked-opens-btn"
              >
                {isSyncingOpens ? (
                  <div className="w-3.5 h-3.5 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                )}
                <span>{locale === "pt" ? `Gravar ${trackedOpens.length} Visualizações` : `Save ${trackedOpens.length} Views`}</span>
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center text-xs text-gray-400 font-medium">
              {locale === "pt" ? "Nenhuma nova abertura pendente de gravação." : "No new opens pending registration."}
            </div>
          )}
        </div>
      </div>

      {/* Drip Campaign Queue (Right column) */}
      <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-xl border border-indigo-100">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">{locale === "pt" ? "Fila Inteligente de Follow-up" : "Smart Follow-up Queue"}</h3>
              <p className="text-xs text-gray-400">{locale === "pt" ? "Contatos em silêncio há mais de 3 dias no pipeline" : "Contacts silent for over 3 days in the pipeline"}</p>
            </div>
          </div>

          <div className="text-xs font-bold bg-[#c2e7ff] text-[#001d35] px-3.5 py-1.5 rounded-full shadow-sm">
            {followUpCandidates.length} {locale === "pt" ? "pendências" : "pending"}
          </div>
        </div>

        {followUpCandidates.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-gray-50 border border-gray-100 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 flex items-center justify-center mb-3 shadow-sm border border-gray-100">
              <Check className="w-6 h-6 stroke-[3px]" />
            </div>
            <p className="text-sm font-bold text-gray-800">{locale === "pt" ? "Tudo em dia!" : "All caught up!"}</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[260px] leading-relaxed">
              {locale === "pt"
                ? "Excelente! Nenhum lead do CRM está há mais de 3 dias aguardando follow-up neste pipeline de prospecção."
                : "Excellent! No CRM lead has been waiting for follow-up for more than 3 days in this prospecting pipeline."}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-3">
            {followUpCandidates.map((contact) => {
              const email = extractEmail(contact);
              return (
                <div 
                  key={contact.rowIndex}
                  className="bg-gray-50 hover:bg-gray-100/75 border border-gray-150 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 text-sm truncate">{contact.name}</span>
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold text-[9px] px-2 py-0.5 rounded">
                        {locale === "pt" ? "Linha" : "Row"} #{contact.rowIndex}
                      </span>
                    </div>
                    <p className="text-gray-500 font-semibold text-xs mt-1">{contact.university} — {contact.studentOrganization}</p>
                    {email && <p className="text-gray-400 font-mono text-[10px] mt-1">{email}</p>}
                  </div>

                  <button
                    onClick={() => handleSendFollowUp(contact)}
                    disabled={isSendingFollowUp === contact.rowIndex}
                    className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
                    id={`send-followup-btn-${contact.rowIndex}`}
                  >
                    {isSendingFollowUp === contact.rowIndex ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{locale === "pt" ? "Disparar Follow-up" : "Send Follow-up"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
