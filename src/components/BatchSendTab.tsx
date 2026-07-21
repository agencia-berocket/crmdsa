import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  User,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Sliders,
  MailWarning,
} from "lucide-react";
import { BatchContact, GmailAlias } from "../types";
import {
  sendGmailMessage,
  fetchGmailAliases,
  updateSheetRow,
} from "../lib/google-api";
import { useI18n } from "../lib/i18n";
import { motion, AnimatePresence } from "motion/react";

interface BatchSendTabProps {
  spreadsheetId: string;
  selectedContacts: BatchContact[];
  onRefresh: () => void;
  onClearSelection?: () => void;
  onNavigate?: (
    tab: "home" | "batches" | "meetings" | "batch_send" | "automation",
  ) => void;
}

export default function BatchSendTab({
  spreadsheetId,
  selectedContacts,
  onRefresh,
  onClearSelection,
  onNavigate,
}: BatchSendTabProps) {
  const { t, locale } = useI18n();
  const [aliases, setAliases] = useState<GmailAlias[]>([]);
  const [selectedAlias, setSelectedAlias] = useState<string>("");
  const [loadingAliases, setLoadingAliases] = useState(false);

  // Deliverability / Spam prevention state
  const [disableTracker, setDisableTracker] = useState(false);

  // Success Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [sentDetails, setSentDetails] = useState<{
    subject: string;
    dateStr: string;
    totalSent: number;
    successCount: number;
    failedCount: number;
  } | null>(null);

  // Email Template State
  const [subject, setSubject] = useState(
    locale === "pt"
      ? "Proposta de Parceria Universitária - {{University}}"
      : "University Partnership Proposal - {{University}}",
  );
  const [bodyHtml, setBodyHtml] = useState(
    locale === "pt"
      ? `<p>Olá, <strong>{{Name}}</strong>!</p>\n\n<p>Tudo bem? Escrevo a você em nome da nossa equipe, pois temos muito interesse em apoiar as atividades desenvolvidas pelo <strong>{{Student Organization}}</strong> na <strong>{{University}}</strong>.</p>\n\n<p>Gostaria de saber se você teria 15 minutos livres na próxima semana para batermos um papo rápido e apresentar algumas ideias.</p>\n\n<p>Abraços,<br/>Equipe de Parcerias</p>`
      : `<p>Hello, <strong>{{Name}}</strong>!</p>\n\n<p>I hope this email finds you well. I am writing to you on behalf of our team, as we are highly interested in supporting the activities developed by <strong>{{Student Organization}}</strong> at <strong>{{University}}</strong>.</p>\n\n<p>I was wondering if you would have 15 minutes to spare next week for a brief chat to discuss some collaboration ideas.</p>\n\n<p>Best regards,<br/>Partnerships Team</p>`,
  );

  // Send Process States
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [currentSendingName, setCurrentSendingName] = useState("");
  const [sendSummary, setSendSummary] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  // Live Preview Navigation State
  const [previewIndex, setPreviewIndex] = useState(0);

  // Test Send State Variables
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      alert(
        locale === "pt"
          ? "Por favor, insira um e-mail de teste válido."
          : "Please enter a valid test email address.",
      );
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const contactToUse =
        currentPreviewContact ||
        ({
          name: locale === "pt" ? "[Nome de Teste]" : "[Test Name]",
          university:
            locale === "pt" ? "[Universidade de Teste]" : "[Test University]",
          studentOrganization:
            locale === "pt" ? "[Organização de Teste]" : "[Test Organization]",
          status: "New",
          rowIndex: 0,
          email: testEmail,
          notes: "",
        } as BatchContact);

      const personalSubject = parseTemplate(subject, contactToUse);
      let compiledBody = parseTemplate(bodyHtml, contactToUse);

      // Append test indicator line
      compiledBody += `<br/><hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" /><p style="font-size: 11px; color: #999;">${
        locale === "pt"
          ? "Este é um e-mail de teste enviado a partir do CRM The Data Savings Act."
          : "This is a test email sent from The Data Savings Act CRM."
      }</p>`;

      const activeAlias = aliases.find((a) => a.sendAsEmail === selectedAlias);
      const aliasName = activeAlias ? activeAlias.displayName : "";

      await sendGmailMessage(
        testEmail,
        `[TEST] ${personalSubject}`,
        compiledBody,
        selectedAlias,
        aliasName,
      );

      setTestResult({
        success: true,
        message: t("testSuccess", { email: testEmail }),
      });
    } catch (err: any) {
      console.error("Error sending test email:", err);
      setTestResult({
        success: false,
        message: t("testError", { error: err?.message || String(err) }),
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Fetch aliases on load
  useEffect(() => {
    async function loadAliases() {
      setLoadingAliases(true);
      try {
        const loaded = await fetchGmailAliases();
        setAliases(loaded);
        if (loaded.length > 0) {
          const def = loaded.find((a) => a.isDefault) || loaded[0];
          setSelectedAlias(def.sendAsEmail);
        }
      } catch (err) {
        console.error("Erro ao carregar aliases:", err);
      } finally {
        setLoadingAliases(false);
      }
    }
    loadAliases();
  }, []);

  // Update default subject and body if language changes
  useEffect(() => {
    setSubject(
      locale === "pt"
        ? "Proposta de Parceria Universitária - {{University}}"
        : "University Partnership Proposal - {{University}}",
    );
    setBodyHtml(
      locale === "pt"
        ? `<p>Olá, <strong>{{Name}}</strong>!</p>\n\n<p>Tudo bem? Escrevo a você em nome da nossa equipe, pois temos muito interesse em apoiar as atividades desenvolvidas pelo <strong>{{Student Organization}}</strong> na <strong>{{University}}</strong>.</p>\n\n<p>Gostaria de saber se você teria 15 minutos livres na próxima semana para batermos um papo rápido e apresentar algumas ideias.</p>\n\n<p>Abraços,<br/>Equipe de Parcerias</p>`
        : `<p>Hello, <strong>{{Name}}</strong>!</p>\n\n<p>I hope this email finds you well. I am writing to you on behalf of our team, as we are highly interested in supporting the activities developed by <strong>{{Student Organization}}</strong> at <strong>{{University}}</strong>.</p>\n\n<p>I was wondering if you would have 15 minutes to spare next week for a brief chat to discuss some collaboration ideas.</p>\n\n<p>Best regards,<br/>Partnerships Team</p>`,
    );
  }, [locale]);

  // Replace variables in templates
  const parseTemplate = (text: string, contact: BatchContact) => {
    if (!contact) return text;
    return text
      .replace(/{{Name}}/g, contact.name || "")
      .replace(/{{University}}/g, contact.university || "")
      .replace(/{{Student Organization}}/g, contact.studentOrganization || "")
      .replace(/{{Status}}/g, contact.status || "");
  };

  const extractEmailAddress = (c: BatchContact) => {
    if (!c) return "";
    const emailCol = (c.email || "").trim();
    if (emailCol.includes("@")) return emailCol;

    const sentCol = (c.emailSent || "").trim();
    if (sentCol.includes("@")) return sentCol;

    const notesText = (c.notes || "").trim();
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = notesText.match(emailRegex);
    if (match) return match[0];

    return "";
  };

  // Preview computed templates
  const currentPreviewContact = selectedContacts[previewIndex];
  const previewSubject = currentPreviewContact
    ? parseTemplate(subject, currentPreviewContact)
    : "";
  const previewBody = currentPreviewContact
    ? parseTemplate(bodyHtml, currentPreviewContact)
    : "";

  // Perform Batch Send
  const handleBatchSend = async () => {
    if (selectedContacts.length === 0) {
      alert(t("recipientNotFound"));
      return;
    }

    const confirmText = t("sendConfirm", {
      count: selectedContacts.length,
      alias: selectedAlias,
    });
    const confirmed = window.confirm(confirmText);
    if (!confirmed) return;

    setIsSending(true);
    setSendProgress(0);
    setSendSummary(null);
    let successCount = 0;
    let failedCount = 0;

    const todayStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const activeAlias = aliases.find((a) => a.sendAsEmail === selectedAlias);
    const aliasName = activeAlias ? activeAlias.displayName : "";

    for (let i = 0; i < selectedContacts.length; i++) {
      const contact = selectedContacts[i];
      setCurrentSendingName(contact.name || contact.university);

      try {
        const personalSubject = parseTemplate(subject, contact);

        // Extract email address
        const recipientEmail = extractEmailAddress(contact);

        if (!recipientEmail) {
          throw new Error(t("recipientNotFound"));
        }

        let compiledBody = parseTemplate(bodyHtml, contact);

        if (!disableTracker) {
          // Inject invisible tracking pixel (loads /api/track from our server!)
          const trackingPixelUrl = `${window.location.origin}/api/track?email=${encodeURIComponent(recipientEmail)}&spreadsheetId=${spreadsheetId}&row=${contact.rowIndex}`;
          compiledBody += `<br/><img src="${trackingPixelUrl}" width="1" height="1" style="display:none;width:1px;height:1px;" alt="" referrerPolicy="no-referrer" />`;
        }

        // Inject invisible DSA identification tag. Includes the recipient email
        // alongside the row so a reply can only be matched back to THIS specific
        // send — a row number alone can be reused by a different lead later and
        // stale test emails would otherwise get attributed to the wrong row.
        compiledBody += `<div style="display:none;color:transparent;font-size:0px;line-height:0;opacity:0;">[DSA-ID:${contact.rowIndex}:${recipientEmail.toLowerCase()}]</div>`;

        // Send email via Gmail API
        await sendGmailMessage(
          recipientEmail,
          personalSubject,
          compiledBody,
          selectedAlias,
          aliasName,
        );

        // Update Sheet Row Status to 'waiting on them' and write DSA notes
        const notesWithDate = contact.notes
          ? `${contact.notes}\n[DSA CRM: Sent on ${todayStr} via ${selectedAlias}]`
          : `[DSA CRM: Sent on ${todayStr} via ${selectedAlias}]`;

        const updateData: any = {
          Status: "waiting on them",
          Notes: notesWithDate,
          "data do envio": todayStr,
          "notif. envio": locale === "pt" ? "Enviado" : "Sent",
          // Clear reply/open alerts upon a fresh send - they must wait for a new
          // pixel hit / reply before being marked again.
          "notif. retorno": "",
          "abertura": "",
        };

        await updateSheetRow(
          spreadsheetId,
          "batches",
          contact.rowIndex,
          updateData,
        );

        successCount++;
      } catch (err: any) {
        console.error(`Error sending email to ${contact.name}:`, err);
        failedCount++;
      }

      setSendProgress(Math.round(((i + 1) / selectedContacts.length) * 100));
    }

    setIsSending(false);

    // Save details for mass send success modal
    const timeNow = new Date().toLocaleTimeString(
      locale === "pt" ? "pt-BR" : "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );
    setSentDetails({
      subject,
      dateStr: `${todayStr} às ${timeNow}`,
      totalSent: selectedContacts.length,
      successCount,
      failedCount,
    });
    setShowSuccessModal(true);

    setSendSummary({ success: successCount, failed: failedCount });
    onRefresh(); // reload sheet in parent
  };

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-1"
      id="batch-send-tab"
    >
      {/* Compose Panel (Left side) */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-xl border border-indigo-100">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">
                {t("batchSend")}
              </h3>
              <p className="text-xs text-gray-400">
                {locale === "pt"
                  ? "Crie e dispare campanhas integradas com o Gmail e rastreador"
                  : "Create and send customized mass email campaigns with built-in open trackers"}
              </p>
            </div>
          </div>

          <div className="text-xs font-bold bg-[#c2e7ff] text-[#001d35] px-3 py-1.5 rounded-full shadow-sm">
            {t("selectedCount", { count: selectedContacts.length })}
          </div>
        </div>

        {/* Alias Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-600 flex items-center justify-between">
            <span>{t("senderLabel")}</span>
            {loadingAliases && (
              <span className="text-[10px] text-indigo-600 animate-pulse">
                {t("loadingAliases")}
              </span>
            )}
          </label>
          <select
            value={selectedAlias}
            onChange={(e) => setSelectedAlias(e.target.value)}
            disabled={isSending}
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer disabled:opacity-50"
            id="sender-alias-select"
          >
            {aliases.length === 0 ? (
              <option value="">{t("defaultEmail")}</option>
            ) : (
              aliases.map((alias) => (
                <option key={alias.sendAsEmail} value={alias.sendAsEmail}>
                  {alias.displayName
                    ? `${alias.displayName} <${alias.sendAsEmail}>`
                    : alias.sendAsEmail}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Spam Prevention & Deliverability Section */}
        <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-col">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <MailWarning className="w-4 h-4 text-amber-500" />
              {locale === "pt"
                ? "Ajuste de Entregabilidade (Anti-Spam)"
                : "Spam Prevention & Deliverability Settings"}
            </h4>
            <p className="text-[10px] text-amber-700 leading-normal mt-0.5">
              {locale === "pt"
                ? "Configure opções adicionais para maximizar as chances do e-mail chegar na Caixa de Entrada do Lead."
                : "Adjust tracking and parameters to optimize inbox deliverability and prevent Gmail spam flagging."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="disable-tracker-checkbox"
              checked={disableTracker}
              onChange={(e) => setDisableTracker(e.target.checked)}
              disabled={isSending}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="disable-tracker-checkbox"
              className="text-xs font-bold text-gray-700 cursor-pointer select-none"
            >
              {locale === "pt"
                ? "Desativar Pixel de Rastreamento (Evita Spam)"
                : "Disable Tracking Pixel (Greatly Reduces Spam Risk)"}
            </label>
          </div>

          <p className="text-[9px] text-gray-400 leading-relaxed pl-6">
            {locale === "pt"
              ? "💡 Provedores de e-mail (especialmente Gmail corporativo) costumam identificar imagens remotas invisíveis de 1x1 pixel como rastreadores de spam. Desmarcar o rastreador melhora as taxas de entrega!"
              : "💡 Email providers (especially custom corporate Gmail targets) often flag remote 1x1 image trackers as tracking spam. Disabling the pixel improves direct inbox delivery rates!"}
          </p>
        </div>

        {/* Template Variables Explainer */}
        <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-xl p-4 text-xs">
          <span className="font-bold text-indigo-900 flex items-center gap-1.5 text-[10px] uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            {t("varsTitle")}
          </span>
          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-center">
            <div className="bg-white p-2 rounded border border-indigo-100/60 text-gray-700">
              {"{{Name}}"}
            </div>
            <div className="bg-white p-2 rounded border border-indigo-100/60 text-gray-700">
              {"{{University}}"}
            </div>
            <div className="bg-white p-2 rounded border border-indigo-100/60 text-gray-700">
              {"{{Student Organization}}"}
            </div>
          </div>
        </div>

        {/* Template Inputs */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-600">
            {t("subjectLabel")}
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isSending}
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            id="email-subject-template"
          />
        </div>

        <div className="flex-1 flex flex-col gap-1.5 min-h-[200px]">
          <label className="text-xs font-bold text-gray-600">
            {t("bodyLabel")}
          </label>
          <textarea
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            disabled={isSending}
            className="flex-1 w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono leading-relaxed"
            id="email-body-template"
          />
        </div>

        {/* Delivery Progress Bar */}
        {isSending && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-blue-950">
              <span className="flex items-center gap-1.5 text-[11px]">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                {t("sendingNow", { name: currentSendingName })}
              </span>
              <span className="font-mono">{sendProgress}%</span>
            </div>
            <div className="w-full bg-blue-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${sendProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Send Summary Notification */}
        {sendSummary && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-bold text-emerald-950">
                  {locale === "pt"
                    ? "Mala Direta concluída!"
                    : "Mail Merge Campaign Finished!"}
                </p>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  {t("sendSuccess", {
                    success: sendSummary.success,
                    failed: sendSummary.failed,
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSendSummary(null)}
              className="text-xs bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              {locale === "pt" ? "Fechar" : "Dismiss"}
            </button>
          </div>
        )}

        {/* Test Email Section */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-col">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
              {t("testSectionTitle")}
            </h4>
            <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
              {t("testSectionDesc")}
            </p>
          </div>

          {selectedContacts.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {locale === "pt"
                  ? "Buscar e-mail cadastrado:"
                  : "Search registered email:"}
              </span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    setTestEmail(e.target.value);
                  }
                }}
                value=""
                disabled={isSending || isSendingTest}
                className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 focus:outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="">
                  --{" "}
                  {locale === "pt"
                    ? "Selecione para preencher..."
                    : "Select to autofill..."}{" "}
                  --
                </option>
                {selectedContacts.map((contact, idx) => {
                  const email = extractEmailAddress(contact);
                  if (!email) return null;
                  const label = contact.name
                    ? `${contact.name} (${email})`
                    : `${contact.university || `Lead #${contact.rowIndex}`} - ${email}`;
                  return (
                    <option
                      key={`${contact.rowIndex}-${idx}-${email}`}
                      value={email}
                    >
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={isSending || isSendingTest}
                placeholder={t("testEmailPlaceholder")}
                className="w-full text-xs bg-white border border-gray-200 rounded-xl pl-3.5 pr-10 py-2.5 text-gray-800 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                id="test-email-input"
              />
              {currentPreviewContact && (
                <button
                  type="button"
                  onClick={() => {
                    const email = extractEmailAddress(currentPreviewContact);
                    if (email) setTestEmail(email);
                  }}
                  title={t("fillWithCurrentBtn")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={handleSendTest}
              disabled={isSending || isSendingTest || !testEmail}
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
              id="send-test-email-btn"
            >
              {isSendingTest ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              <span>{t("sendTestBtn")}</span>
            </button>
          </div>

          {/* Test Send Feedback */}
          {testResult && (
            <div
              className={`text-[11px] font-medium p-2.5 rounded-lg border ${
                testResult.success
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                  : "bg-rose-50 border-rose-100 text-rose-800"
              }`}
            >
              {testResult.message}
            </div>
          )}
        </div>

        {/* Trigger Send Button */}
        <button
          onClick={handleBatchSend}
          disabled={isSending || selectedContacts.length === 0}
          className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all text-xs cursor-pointer disabled:opacity-50"
          id="trigger-batch-send-btn"
        >
          <Send className="w-4 h-4" />
          <span>
            {t("batchSend")} ({selectedContacts.length}{" "}
            {locale === "pt" ? "Selecionados" : "Selected"})
          </span>
        </button>
      </div>

      {/* Live Preview Panel (Right side) */}
      <div className="lg:col-span-5 bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            {locale === "pt"
              ? "Visualização em Tempo Real"
              : "Real-time Template Preview"}
          </span>

          {selectedContacts.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewIndex((prev) => Math.max(0, prev - 1))}
                disabled={previewIndex === 0}
                className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-gray-600">
                {previewIndex + 1} de {selectedContacts.length}
              </span>
              <button
                onClick={() =>
                  setPreviewIndex((prev) =>
                    Math.min(selectedContacts.length - 1, prev + 1),
                  )
                }
                disabled={previewIndex === selectedContacts.length - 1}
                className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {selectedContacts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl border border-dashed border-gray-300 min-h-[300px]">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mb-3">
              <User className="w-6 h-6 text-indigo-500" />
            </div>
            <p className="text-xs font-semibold text-gray-700">
              {locale === "pt"
                ? "Nenhum contato selecionado"
                : "No Contacts Selected"}
            </p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-[200px] leading-relaxed">
              {locale === "pt"
                ? "Vá na tabela e selecione os contatos com caixas de seleção. Os e-mails personalizados gerados aparecerão instantaneamente aqui."
                : "Go to the pipeline table, select one or more contacts using the checkboxes, and their personalized preview will render here in real-time."}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 bg-white border border-gray-200 rounded-xl p-5 text-xs shadow-sm">
            {/* Meta headers */}
            <div className="flex flex-col gap-2 border-b border-gray-100 pb-3 text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-400 w-14 shrink-0 text-[10px] uppercase tracking-wide">
                  De:
                </span>
                <span className="font-mono text-[11px] bg-gray-50 text-gray-700 px-2 py-1 rounded border border-gray-200 truncate min-w-0 flex-1">
                  {selectedAlias || "suaconta@gmail.com"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-400 w-14 shrink-0 text-[10px] uppercase tracking-wide">
                  Para:
                </span>
                <span className="font-medium text-indigo-600 font-mono text-[11px] truncate min-w-0 flex-1">
                  {extractEmailAddress(currentPreviewContact) ||
                    `[E-mail na linha #${currentPreviewContact.rowIndex}]`}
                </span>
              </div>
              <div className="flex items-start gap-2 pt-1 mt-0.5 border-t border-gray-100">
                <span className="font-bold text-gray-400 w-14 shrink-0 text-[10px] uppercase tracking-wide mt-0.5">
                  Assunto:
                </span>
                <span className="font-semibold text-gray-800 text-xs leading-snug flex-1 min-w-0 break-words">
                  {previewSubject || "(Sem Assunto)"}
                </span>
              </div>
            </div>

            {/* Rendered HTML body */}
            <div className="flex-1 overflow-y-auto min-h-[220px] p-3.5 bg-gray-50/50 border border-gray-100 rounded-lg">
              <div
                className="prose prose-sm max-w-none text-gray-800 leading-relaxed text-xs font-sans"
                dangerouslySetInnerHTML={{ __html: previewBody }}
              />
              {/* Fake Tracking Pixel representation */}
              <div className="mt-4 border-t border-dashed border-gray-200 pt-3 text-[10px] font-bold text-gray-400 flex items-center gap-1.5 select-none uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                <span>{t("trackingLabel")}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SENDING PROGRESS OVERLAY */}
      {isSending && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[3px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full border border-gray-200 shadow-2xl p-6 flex flex-col gap-5 text-center items-center">
            <div className="p-4 bg-indigo-50 rounded-full border border-indigo-100 shadow-sm flex items-center justify-center text-indigo-600">
              <RefreshCw className="w-10 h-10 animate-spin" />
            </div>
            <h3 className="text-base font-extrabold text-indigo-950 font-sans tracking-tight mt-2">
              {locale === "pt"
                ? "Enviando E-mails... 🚀"
                : "Sending Emails... 🚀"}
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              {locale === "pt"
                ? "Por favor, não feche esta janela enquanto os disparos estão sendo processados."
                : "Please do not close this window while the email dispatch is in progress."}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200 mt-2">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${sendProgress}%` }}
              ></div>
            </div>

            <div className="flex justify-between w-full text-[10px] font-bold text-gray-400 uppercase font-mono">
              <span>{locale === "pt" ? "Progresso:" : "Progress:"}</span>
              <span>{sendProgress}%</span>
            </div>

            {currentSendingName && (
              <p className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-150 rounded-lg px-3 py-2 w-full truncate">
                {locale === "pt" ? "Enviando para:" : "Sending to:"}{" "}
                <span className="text-indigo-600">{currentSendingName}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* SUCCESS MODAL FOR MASS SENDING */}
      {showSuccessModal && sentDetails && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full border border-gray-200 shadow-2xl p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Icon */}
            <div className="flex flex-col items-center gap-2 select-none text-center">
              <div className="p-4 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-base font-extrabold text-emerald-950 font-sans tracking-tight mt-2">
                {locale === "pt"
                  ? "E-mails Enviados com Sucesso! 🎉"
                  : "Emails Dispatched Successfully! 🎉"}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {locale === "pt"
                  ? "Sua campanha de mala direta foi enviada."
                  : "Your mass email merge campaign was successfully processed."}
              </p>
            </div>

            {/* Campaign details */}
            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 flex flex-col gap-3 text-xs text-gray-600 font-sans">
              <div className="flex justify-between items-start border-b border-gray-200/50 pb-2">
                <span className="font-bold text-gray-400 text-[10px] uppercase">
                  {locale === "pt" ? "Assunto:" : "Subject:"}
                </span>
                <span
                  className="font-bold text-gray-800 text-right max-w-[240px] truncate"
                  title={sentDetails.subject}
                >
                  {sentDetails.subject}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                <span className="font-bold text-gray-400 text-[10px] uppercase">
                  {locale === "pt" ? "Data/Hora:" : "Sent On:"}
                </span>
                <span className="font-semibold text-gray-700">
                  {sentDetails.dateStr}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                <span className="font-bold text-gray-400 text-[10px] uppercase">
                  {locale === "pt" ? "Total Selecionado:" : "Total Selected:"}
                </span>
                <span className="font-mono bg-gray-200/60 font-bold px-2 py-0.5 rounded text-gray-700">
                  {sentDetails.totalSent}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                <span className="font-bold text-gray-400 text-[10px] uppercase">
                  {locale === "pt"
                    ? "Disparos com Sucesso:"
                    : "Successfully Sent:"}
                </span>
                <span className="font-bold text-emerald-700 flex items-center gap-1 font-mono">
                  <span>●</span> {sentDetails.successCount}
                </span>
              </div>
              {sentDetails.failedCount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-400 text-[10px] uppercase">
                    {locale === "pt" ? "Falhas:" : "Failed:"}
                  </span>
                  <span className="font-bold text-red-600 flex items-center gap-1 font-mono">
                    <span>●</span> {sentDetails.failedCount}
                  </span>
                </div>
              )}
            </div>

            {/* Close / Action button */}
            <button
              onClick={() => {
                setShowSuccessModal(false);
                if (onClearSelection) onClearSelection();
                if (onNavigate) onNavigate("batches");
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {locale === "pt"
                  ? "Voltar para o Funil de Leads ➔"
                  : "Go to Leads Pipeline ➔"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
