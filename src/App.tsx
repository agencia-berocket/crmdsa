import React, { useState, useEffect, useMemo } from "react";
import {
  Database,
  Mail,
  Calendar,
  Cpu,
  Users,
  RefreshCw,
  Link2,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  Info,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Menu,
  Search,
  Settings,
  Plus,
  Grid,
  Check,
  Square,
  Home,
  ChevronDown,
  User as UserIcon,
  Sparkles,
  Eye,
  MailWarning,
  Clock,
  Send,
  X,
  TrendingUp,
  MessageSquare,
  AlertCircle as AlertIcon,
  ChevronUp,
} from "lucide-react";
import { User } from "firebase/auth";
import {
  initAuth,
  googleSignIn,
  logout,
  fetchBatches,
  fetchCalendarMeetings,
  mapConfirmationStatusLabel,
  updateSheetRow,
  addBatchLead,
  searchReplies,
} from "./lib/google-api";
import { BatchContact } from "./types";
import AuthButton from "./components/AuthButton";
import CRMTable from "./components/CRMTable";
import BatchSendTab from "./components/BatchSendTab";
import AutomationTab from "./components/AutomationTab";
import GoogleTasksSidebar from "./components/GoogleTasksSidebar";
import GoogleContactsSidebar from "./components/GoogleContactsSidebar";
import OnboardingGuide from "./components/OnboardingGuide";
import { motion, AnimatePresence } from "motion/react";
import { useI18n } from "./lib/i18n";
import faviconDark from "../assets/favicon-dark.png";
import faviconLight from "../assets/favicon-light.png";

export default function App() {
  const { t, locale } = useI18n();

  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Onboarding Guide state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    try {
      return localStorage.getItem("dw_crm_onboarding_completed") !== "true";
    } catch (e) {
      console.warn("Storage access blocked:", e);
      return true;
    }
  });

  // Connection states
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    try {
      return localStorage.getItem("dw_crm_spreadsheet_id") || "";
    } catch (e) {
      console.warn("Storage access blocked:", e);
      return "";
    }
  });
  const [isConnectingSheet, setIsConnectingSheet] = useState(false);
  const [isSheetConnected, setIsSheetConnected] = useState(false);

  // Active loaded data
  const [batchesData, setBatchesData] = useState<BatchContact[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Active CRM table selections
  const [selectedRowIndexes, setSelectedRowIndexes] = useState<number[]>([]);

  // Custom confirmation and alert dialog states to replace native browser window.confirm/alert
  const [customConfirm, setCustomConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [customAlert, setCustomAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  } | null>(null);

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setCustomConfirm({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  const showAlert = (title: string, message: string) => {
    setCustomAlert({
      isOpen: true,
      title,
      message,
    });
  };

  // Navigation state
  // We include "home" as the active tab for global visual metrics
  const [activeTab, setActiveTab] = useState<
    "home" | "batches" | "meetings" | "batch_send" | "automation"
  >("home");

  // New Lead Modal State
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [newLeadUniversity, setNewLeadUniversity] = useState("");
  const [newLeadStudentOrg, setNewLeadStudentOrg] = useState("");
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadStatus, setNewLeadStatus] = useState("Lead");
  const [newLeadNotes, setNewLeadNotes] = useState("");

  // Saved View filter state
  const [savedViewFilter, setSavedViewFilter] = useState<string | null>(null);

  // Auto-open row state for deep-linked CRM Share URLs
  const [autoOpenRowIndex, setAutoOpenRowIndex] = useState<number | null>(null);

  // Google Calendar Automation states
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [calendarSyncResult, setCalendarSyncResult] = useState<string | null>(
    null,
  );

  // Side Drawer Panels (Right Add-ons Sidebar)
  const [activeRightPanel, setActiveRightPanel] = useState<
    "tasks" | "contacts" | null
  >(null);

  // Pipelines Accordion open state in sidebar
  const [pipelinesOpen, setPipelinesOpen] = useState(true);

  // Left navigation sidebar visibility (toggled by hamburger menu)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Search input state in Gmail top search bar
  const [globalSearch, setGlobalSearch] = useState("");

  // Initialize Auth state on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const rowParam = params.get("row");
    if (tabParam && (tabParam === "batches" || tabParam === "meetings")) {
      setActiveTab(tabParam as any);
      if (rowParam) {
        setAutoOpenRowIndex(parseInt(rowParam, 10));
      }
    }

    const unsubscribe = initAuth(
      (loadedUser, loadedToken) => {
        setUser(loadedUser);
        setToken(loadedToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      },
    );
    return () => unsubscribe();
  }, []);

  // Clear saved view filter whenever the user switches tabs manually
  useEffect(() => {
    setSavedViewFilter(null);
  }, [activeTab]);

  // Sync data whenever sheet is connected or refreshed
  const handleRefreshAllData = async (silent = false) => {
    if (!spreadsheetId) return;
    if (!silent) setIsLoadingData(true);

    try {
      const batches = await fetchBatches(spreadsheetId).catch((err) => {
        console.warn("Could not load batches tab, returning empty:", err);
        return [];
      });

      setBatchesData(batches);
      setIsSheetConnected(true);
      try {
        localStorage.setItem("dw_crm_spreadsheet_id", spreadsheetId);
      } catch (e) {
        console.warn("Storage write blocked:", e);
      }

      // Trigger background sync silently to update tracking (opens and replies) automatically!
      setTimeout(() => {
        runAutomaticSync(batches);
      }, 300);
    } catch (err) {
      console.error("Erro ao sincronizar dados da planilha:", err);
      if (!silent) {
        showAlert(
          locale === "pt" ? "Erro ao carregar" : "Loading Error",
          locale === "pt"
            ? "Não foi possível carregar a aba 'batches'. Verifique se a planilha possui a aba com o nome correto e se sua conta possui permissão de leitura."
            : "Could not load the 'batches' sheet. Please verify your spreadsheet has a sheet named 'batches', and that your account has read permissions.",
        );
      }
      setIsSheetConnected(false);
    } finally {
      if (!silent) setIsLoadingData(false);
    }
  };

  // Background Automatic Sync for email opens and email replies (automatic tracking)
  const runAutomaticSync = async (
    currentBatches: BatchContact[],
  ) => {
    if (!spreadsheetId) return;
    try {
      let hasUpdates = false;

      // 1. Check Tracked Opens from Express /api/events buffer
      const opensRes = await fetch(
        `/api/events?spreadsheetId=${spreadsheetId}`,
      );
      if (opensRes.ok) {
        const opens = await opensRes.json();
        if (opens && opens.length > 0) {
          console.log(`[AutoSync] Found ${opens.length} email open events.`);
          for (const open of opens) {
            const rowIndex = parseInt(open.row, 10);
            const contact = currentBatches.find((c) => c.rowIndex === rowIndex);
            // Autocorrect legacy rows too: reprocess whenever the actual
            // "Abertura" column is still empty, regardless of Status.
            if (contact && !contact.emailOpenedAlert) {
              const todayStr = new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
              const notesWithOpen = contact.notes
                ? `${contact.notes}\n[${locale === "pt" ? "Automação: E-mail aberto detectado em" : "Automation: Email open detected on"} ${todayStr}]`
                : `[${locale === "pt" ? "Automação: E-mail aberto detectado em" : "Automation: Email open detected on"} ${todayStr}]`;

              const updateData: any = {
                Status: "Opened",
                Notes: notesWithOpen,
                "abertura": locale === "pt" ? "Aberto" : "Opened",
              };

              await updateSheetRow(
                spreadsheetId,
                "batches",
                rowIndex,
                updateData,
              );
              hasUpdates = true;
            }
          }
          // Clear the opens buffer on our server
          await fetch("/api/events/clear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ spreadsheetId, events: opens }),
          });
        }
      }

      // 2. Check Inbox Replies from Gmail API
      const batchEmails = currentBatches
        .map((c) => {
          const emailCol = (c.email || "").trim();
          if (emailCol.includes("@")) return emailCol;
          const sentCol = (c.emailSent || "").trim();
          if (sentCol.includes("@")) return sentCol;
          return "";
        })
        .filter(Boolean);

      const allEmails = Array.from(new Set(batchEmails));

      if (allEmails.length > 0) {
        const replies = await searchReplies(allEmails);
        if (replies && replies.length > 0) {
          console.log(
            `[AutoSync] Found ${replies.length} email reply detections.`,
          );
          for (const reply of replies) {
            const email = reply.email.toLowerCase();
            const rowIndex = reply.rowIndex;

            // Match batch contact by rowIndex or email
            let batchContact = rowIndex
              ? currentBatches.find((c) => c.rowIndex === rowIndex)
              : null;
            if (!batchContact) {
              batchContact = currentBatches.find((c) => {
                const emailCol = (c.email || "").trim().toLowerCase();
                const sentCol = (c.emailSent || "").trim().toLowerCase();
                return emailCol === email || sentCol === email;
              });
            }

            // Autocorrect legacy rows too: reprocess whenever the actual
            // "Notif. Retorno" column is still empty, regardless of Status.
            if (batchContact && !batchContact.emailReceivedAlert) {
              const todayStr = new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
              const notesWithReply = batchContact.notes
                ? `${batchContact.notes}\n[${locale === "pt" ? "Automação: Resposta recebida detectada em" : "Automation: Reply received detected on"} ${todayStr}]`
                : `[${locale === "pt" ? "Automação: Resposta recebida detectada em" : "Automation: Reply received detected on"} ${todayStr}]`;

              const updateData: any = {
                Status: "Replied - waiting",
                Notes: notesWithReply,
                "notif. retorno": locale === "pt" ? "Novo Retorno!" : "New Reply!",
              };

              await updateSheetRow(
                spreadsheetId,
                "batches",
                batchContact.rowIndex,
                updateData,
              );
              hasUpdates = true;
            }
          }
        }
      }

      // If updates were written to the sheet in the background, reload the clean data silently
      if (hasUpdates) {
        console.log("[AutoSync] Background changes saved. Reloading data...");
        const batches = await fetchBatches(spreadsheetId).catch(() => []);
        setBatchesData(batches);
      }
    } catch (err) {
      console.warn(
        "[AutoSync] Error checking email tracking in background:",
        err,
      );
    }
  };

  // Automatically check for opens/replies periodically in the background when the page remains open
  useEffect(() => {
    if (!spreadsheetId || !isSheetConnected || batchesData.length === 0) return;

    const intervalId = setInterval(() => {
      console.log(
        "[AutoSync] Running periodic background tracker synchronization...",
      );
      runAutomaticSync(batchesData);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [spreadsheetId, isSheetConnected, batchesData]);

  // Trigger Sheet Connection
  const handleConnectSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spreadsheetId) return;

    let cleanedId = spreadsheetId.trim();
    if (cleanedId.includes("docs.google.com/spreadsheets")) {
      const match = cleanedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        cleanedId = match[1];
      }
    }

    setSpreadsheetId(cleanedId);
    setIsConnectingSheet(true);
    try {
      const batches = await fetchBatches(cleanedId);

      setBatchesData(batches);
      setIsSheetConnected(true);
      try {
        localStorage.setItem("dw_crm_spreadsheet_id", cleanedId);
      } catch (e) {
        console.warn("Storage write blocked:", e);
      }
      setActiveTab("home"); // default to home statistics first
    } catch (err) {
      console.error("Erro ao conectar planilha:", err);
      showAlert(
        locale === "pt" ? "Erro de Conexão" : "Connection Error",
        locale === "pt"
          ? "Falha ao conectar com a Planilha do Google. Verifique se o ID ou URL está correto e se sua conta possui permissão de acesso."
          : "Failed to connect to the Google Spreadsheet. Please verify that the URL or ID is correct and that your account has access permissions.",
      );
      setIsSheetConnected(false);
    } finally {
      setIsConnectingSheet(false);
    }
  };

  // Execute Auth Login Flow
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error("Login failed:", err);

      // Ignore benign cases where the user closed the popup or cancelled themselves.
      if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request"
      ) {
        return;
      }

      let message =
        locale === "pt"
          ? "Não foi possível fazer login com o Google. Tente novamente."
          : "Could not sign in with Google. Please try again.";

      if (err?.code === "auth/unauthorized-domain") {
        message =
          locale === "pt"
            ? "Este domínio (" +
              window.location.hostname +
              ") não está autorizado no Firebase Authentication. Peça para adicionar este domínio em Authorized domains (Firebase Console) e nas Authorized JavaScript origins do OAuth Client (Google Cloud Console)."
            : "This domain (" +
              window.location.hostname +
              ") is not authorized in Firebase Authentication. Ask to add this domain under Authorized domains (Firebase Console) and to the OAuth Client's Authorized JavaScript origins (Google Cloud Console).";
      } else if (err?.code === "auth/popup-blocked") {
        message =
          locale === "pt"
            ? "O navegador bloqueou a janela de login. Permita pop-ups para este site e tente novamente."
            : "Your browser blocked the sign-in popup. Please allow pop-ups for this site and try again.";
      } else if (err?.code === "auth/operation-not-allowed") {
        message =
          locale === "pt"
            ? "O login com Google não está habilitado no Firebase Authentication deste projeto."
            : "Google sign-in is not enabled in this project's Firebase Authentication.";
      } else if (err?.message) {
        message += " (" + err.code + ": " + err.message + ")";
      }

      showAlert(locale === "pt" ? "Erro de Login" : "Login Error", message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Execute Auth Logout Flow
  const handleLogout = async () => {
    showConfirm(
      locale === "pt" ? "Sair da Conta" : "Log Out",
      t("logoutConfirm"),
      async () => {
        await logout();
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
        setIsSheetConnected(false);
        setBatchesData([]);
      },
    );
  };

  // Google Calendar Auto-Scheduler Integration (Sync Calendar)
  const handleSyncCalendar = async () => {
    if (!isSheetConnected) return;

    showConfirm(
      locale === "pt" ? "Sincronizar Calendário" : "Sync Calendar",
      locale === "pt"
        ? "Deseja escanear o Google Calendar em busca de reuniões agendadas pelos leads para atualizar automaticamente a coluna de horários confirmados?"
        : "Do you want to scan Google Calendar for lead-scheduled meetings to automatically update the booked times column?",
      async () => {
        setIsSyncingCalendar(true);
        setCalendarSyncResult(null);

        try {
          const calendarEvents = await fetchCalendarMeetings();
          let matchedCount = 0;

          // Meetings now live natively on the Lead record (batches tab) — sync
          // booked time and confirmation status directly from Calendar responses.
          for (const contact of batchesData) {
            const contactEmail = (contact.email || "").toLowerCase();
            if (!contactEmail) continue;

            const match = calendarEvents.find(
              (evt) => evt.email.toLowerCase() === contactEmail,
            );
            if (match) {
              const confirmationLabel = mapConfirmationStatusLabel(
                match.responseStatus,
                locale === "pt" ? "pt" : "en",
              );
              const needsBookedUpdate = contact.bookedTime !== match.startTime;
              const needsConfirmationUpdate = contact.meetingConfirmationStatus !== confirmationLabel;

              if (needsBookedUpdate || needsConfirmationUpdate) {
                await updateSheetRow(
                  spreadsheetId,
                  "batches",
                  contact.rowIndex,
                  {
                    "booked time": match.startTime,
                    "status meetings": "Scheduled",
                    "Meeting Confirmation": confirmationLabel,
                  },
                );
                matchedCount++;
              }
            }
          }

          setCalendarSyncResult(
            locale === "pt"
              ? `Agenda escaneada! ${matchedCount} horários confirmados e sincronizados.`
              : `Calendar scanned! ${matchedCount} confirmed bookings synchronized.`,
          );
          handleRefreshAllData(true);
          setTimeout(() => setCalendarSyncResult(null), 5000);
        } catch (err) {
          console.error("Erro ao sincronizar com calendário:", err);
          showAlert(locale === "pt" ? "Erro" : "Error", t("syncCalendarError"));
        } finally {
          setIsSyncingCalendar(false);
        }
      },
    );
  };

  const handleOpenNewLeadModal = () => {
    setNewLeadUniversity("");
    setNewLeadStudentOrg("");
    setNewLeadName("");
    setNewLeadEmail("");
    setNewLeadStatus("Lead");
    setNewLeadNotes("");
    setIsNewLeadModalOpen(true);
  };

  const handleSubmitNewLead = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation
    if (!newLeadUniversity.trim() || !newLeadName.trim()) {
      showAlert(
        locale === "pt" ? "Aviso" : "Warning",
        locale === "pt"
          ? "Universidade e Nome do Aluno são campos obrigatórios."
          : "University and Student Name are required.",
      );
      return;
    }

    setIsLoadingData(true);
    setIsNewLeadModalOpen(false);

    try {
      await addBatchLead(spreadsheetId, "batches", batchesData.length + 2, {
        university: newLeadUniversity.trim(),
        studentOrganization: newLeadStudentOrg.trim(),
        name: newLeadName.trim(),
        status: newLeadStatus || "Lead",
        notes: newLeadNotes.trim(),
        email: newLeadEmail.trim(),
      });

      await handleRefreshAllData(true);
      showAlert(
        locale === "pt" ? "Sucesso" : "Success",
        locale === "pt"
          ? "O novo lead foi gravado com sucesso no Google Sheets!"
          : "The new lead has been successfully saved to Google Sheets!",
      );
    } catch (err) {
      console.error(err);
      showAlert(
        locale === "pt" ? "Erro" : "Error",
        locale === "pt"
          ? "Não foi possível gravar na planilha."
          : "Could not write to the spreadsheet.",
      );
    } finally {
      setIsLoadingData(false);
    }
  };

  // Extract contact details for selected contacts in Mala Direta
  const selectedContactsList = useMemo(() => {
    return batchesData.filter((c) => selectedRowIndexes.includes(c.rowIndex));
  }, [batchesData, selectedRowIndexes]);

  // Global counts for metrics
  const globalMetrics = useMemo(() => {
    const totalLeads = batchesData.length;
    const waitingResponse = batchesData.filter(
      (b) => b.status === "waiting on them" || b.status === "aguardando",
    ).length;
    const interested = batchesData.filter(
      (b) => b.status === "Replied - waiting" || b.status === "respondeu",
    ).length;
    const scheduled = batchesData.filter(
      (b) => b.statusMeetings === "Scheduled" || b.statusMeetings === "booked" || b.bookedTime,
    ).length;

    // Percentage calculated
    const conversionRate =
      totalLeads > 0 ? Math.round((scheduled / totalLeads) * 100) : 0;
    const responseRate =
      totalLeads > 0
        ? Math.round(((interested + scheduled) / totalLeads) * 100)
        : 0;

    return {
      totalLeads,
      waitingResponse,
      interested,
      scheduled,
      conversionRate,
      responseRate,
    };
  }, [batchesData]);

  return (
    <div
      className={`${isSheetConnected && !needsAuth ? "h-screen overflow-hidden" : "min-h-screen"} bg-[#f6f8fc] flex flex-col font-sans text-gray-800`}
      id="app-container"
    >
      {/* ==================== 1. GMAIL MAIN HEADER ==================== */}
      <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between sticky top-0 z-30 shadow-sm h-16">
        {/* Left branding area */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors hidden md:block"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 select-none">
            {/* Rebranded CRM Logo */}
            <div className="flex items-center gap-2 bg-[#f0f4f9] hover:bg-[#e1e9f1] border border-[#d2e3fc] rounded-full py-1.5 px-4 shadow-sm transition-colors duration-200">
              <img
                src={faviconLight}
                className="w-5.5 h-5.5 object-contain"
                alt="The Data Savings Act Logo"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-extrabold tracking-tight text-[#041e49] font-sans">
                {t("appName")}
              </span>
            </div>
            <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
            <span className="text-xs font-bold text-gray-500 hidden sm:block truncate max-w-[150px]">
              {t("appSubName")}
            </span>
          </div>
        </div>

        {/* Middle Search & Status Bar */}
        <div className="flex-1 max-w-xl mx-4 flex items-center gap-3">
          {isSheetConnected && (
            /* Active Live Connection Status Widget (Screen 9 highlight!) */
            <div className="flex items-center gap-2 bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] px-3.5 py-1.5 rounded-full shadow-sm text-xs select-none">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-bold tracking-tight">{t("tagActive")}</span>
              <span className="h-3 w-[1px] bg-[#1a73e8]/30"></span>
              <span className="text-[10px] uppercase font-bold tracking-wider">
                {t("tagAddon")}
              </span>
            </div>
          )}
        </div>

        {/* Right operations area */}
        <div className="flex items-center gap-2.5">
          {isSheetConnected && (
            <button
              onClick={() => handleRefreshAllData()}
              disabled={isLoadingData}
              className="p-2 hover:bg-gray-100 text-gray-600 rounded-full transition-all cursor-pointer disabled:opacity-50"
              title={t("forceSync")}
              id="global-sync-btn"
            >
              <RefreshCw
                className={`w-5 h-5 ${isLoadingData ? "animate-spin text-indigo-600" : ""}`}
              />
            </button>
          )}

          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 cursor-pointer"
            title={
              locale === "pt"
                ? "Central de Aprendizado e Tutoriais"
                : "Learning Center & Tutorials"
            }
            id="global-help-btn"
          >
            <HelpCircle className="w-5 h-5 text-indigo-600" />
          </button>

          <button
            onClick={() => setActiveTab("batches")}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hidden sm:block cursor-pointer"
            title={t("batches")}
            id="global-batches-btn"
          >
            <Grid className="w-5 h-5" />
          </button>

          <AuthButton
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            isLoading={isLoggingIn}
          />
        </div>
      </header>

      {/* ==================== 2. MAIN SPLIT BODY ==================== */}
      {needsAuth ? (
        /* Welcome / Onboarding Screen 1 & 2 representation */
        <main className="flex-1 flex items-center justify-center p-6 bg-[#f6f8fc]">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-[28px] p-8 max-w-lg w-full text-center shadow-xl flex flex-col items-center gap-6"
            id="welcome-card"
          >
            {/* Logo container */}
            <div className="flex flex-col items-center gap-3 select-none">
              <div className="p-4 bg-[#f0f4f9] rounded-full border border-indigo-100 shadow-sm flex items-center justify-center">
                <img
                  src={faviconLight}
                  className="w-12 h-12 object-contain"
                  alt="The Data Savings Act Logo"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-sm font-extrabold tracking-widest text-[#041e49] font-sans uppercase">
                {t("appName")}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {t("welcomeTitle")}
              </h2>
              <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
                {t("welcomeDesc")}
              </p>
            </div>

            {/* Pipeline Mock illustration for Onboarding as analyzed in referential documentation */}
            <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 shadow-inner">
              <div className="flex items-center gap-1">
                <div className="h-6 bg-red-500 text-white font-bold text-[9px] px-2 rounded-l flex items-center justify-center flex-1">
                  Leads (14)
                </div>
                <div className="h-6 bg-orange-500 text-white font-bold text-[9px] px-2 flex items-center justify-center flex-1">
                  {locale === "pt" ? "Contato (5)" : "Contact (5)"}
                </div>
                <div className="h-6 bg-green-500 text-white font-bold text-[9px] px-2 rounded-r flex items-center justify-center flex-1">
                  {locale === "pt" ? "Marcado (3)" : "Booked (3)"}
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold px-1 uppercase tracking-wider font-mono">
                <span>
                  ⚡ {locale === "pt" ? "Automação Ativa" : "Active Automation"}
                </span>
                <span className="text-emerald-600">
                  {locale === "pt"
                    ? "Planilha Conectada"
                    : "Spreadsheet Connected"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full border-t border-gray-100 pt-5">
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-5 rounded-2xl shadow-md transition-all text-sm cursor-pointer disabled:opacity-50"
                id="welcome-login-btn"
              >
                {isLoggingIn ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-5 h-5 shrink-0"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                )}
                <span>{t("welcomeButton")}</span>
              </button>

              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-1 select-none">
                {t("welcomeHint")}
              </span>
            </div>
          </motion.div>
        </main>
      ) : !isSheetConnected ? (
        /* Spreadsheet Link Form */
        <main className="flex-1 flex items-center justify-center p-6 bg-[#f6f8fc]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-[28px] p-8 max-w-xl w-full shadow-lg flex flex-col gap-6"
            id="sheet-connection-wizard"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {t("linkSpreadsheet")}
                </h2>
                <p className="text-xs text-gray-400 font-medium">
                  {t("linkSpreadsheetDesc")}
                </p>
              </div>
            </div>

            <form onSubmit={handleConnectSheet} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600">
                  {locale === "pt"
                    ? "ID ou Link do Google Sheets:"
                    : "Google Sheets ID or URL:"}
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder={t("inputPlaceholder")}
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                    id="sheet-id-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isConnectingSheet || !spreadsheetId}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all text-xs cursor-pointer disabled:opacity-50"
                id="connect-sheet-btn"
              >
                {isConnectingSheet ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>{t("syncAndOpen")}</span>
              </button>
            </form>

            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 text-xs text-gray-500 flex flex-col gap-3">
              <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5 select-none">
                <Info className="w-4 h-4 text-indigo-500" />
                {t("requiredSheets")}
              </span>
              <div className="flex flex-col gap-2.5 font-mono text-[10px]">
                <div className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                  <span className="font-bold text-indigo-600">
                    batches (Outreach)
                  </span>
                  <p className="text-gray-400 mt-1">{t("batchesSheetInfo")}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      ) : (
        /* ==================== 3. MAIN FUNCTIONAL DASHBOARD WORKSPACE ==================== */
        <main className="flex-1 flex overflow-hidden relative">
          {/* A. Gmail Sidebar 1: App Rail (Thin w-16, dark bluish gray) */}
          <aside className="w-16 bg-[#eaeef6] border-r border-gray-200 flex flex-col items-center py-4 gap-4 shrink-0 select-none">
            {/* Rebranded CRM Logo / Home Button */}
            <button
              onClick={() => setActiveTab("home")}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "home"
                  ? "bg-[#c2e7ff] text-[#001d35] scale-105 shadow-sm"
                  : "text-gray-500 hover:bg-gray-200/60 hover:text-gray-700"
              }`}
              title={t("homeTitle")}
            >
              <img
                src={faviconLight}
                className="w-5.5 h-5.5 object-contain"
                alt="Home"
                referrerPolicy="no-referrer"
              />
            </button>

            {/* Grid / Leads Database Button (Screenshot 1!) */}
            <button
              onClick={() => setActiveTab("batches")}
              className={`p-3 rounded-xl transition-all cursor-pointer border-2 ${
                activeTab === "batches"
                  ? "bg-[#c2e7ff] text-[#1a73e8] border-[#1a73e8] scale-105 shadow-sm"
                  : "text-gray-500 hover:bg-gray-200/60 hover:text-gray-700 border-transparent"
              }`}
              title={t("batches")}
              id="rail-batches-btn"
            >
              <Grid className="w-5 h-5 stroke-[2.2px]" />
            </button>

            {/* Calendar / Agenda Button (Screenshot 2!) */}
            <button
              onClick={() => setActiveTab("meetings")}
              className={`p-3 rounded-xl transition-all cursor-pointer border-2 ${
                activeTab === "meetings"
                  ? "bg-[#c2e7ff] text-[#1a73e8] border-[#1a73e8] scale-105 shadow-sm"
                  : "text-gray-500 hover:bg-gray-200/60 hover:text-gray-700 border-transparent"
              }`}
              title={t("meetings")}
              id="rail-meetings-btn"
            >
              <Calendar className="w-5 h-5 stroke-[2.2px]" />
            </button>

            {/* Mail Icon Button */}
            <button
              onClick={() => setActiveTab("batch_send")}
              className={`p-3 rounded-xl transition-all cursor-pointer relative ${
                activeTab === "batch_send"
                  ? "bg-[#c2e7ff] text-[#001d35]"
                  : "text-gray-500 hover:bg-gray-200/60 hover:text-gray-700"
              }`}
              title={t("batchSend")}
            >
              <Mail className="w-5 h-5 stroke-[2px]" />
              {selectedRowIndexes.length > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {selectedRowIndexes.length}
                </span>
              )}
            </button>

            {/* Automation/Sync Button */}
            <button
              onClick={() => setActiveTab("automation")}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "automation"
                  ? "bg-[#c2e7ff] text-[#001d35]"
                  : "text-gray-500 hover:bg-gray-200/60 hover:text-gray-700"
              }`}
              title={t("automation")}
            >
              <Cpu className="w-5 h-5" />
            </button>

            <div className="w-8 h-[1px] bg-gray-300 my-1"></div>

            {/* Google Calendar trigger shortcut (runs Sync, keeps feedback) */}
            <button
              onClick={handleSyncCalendar}
              disabled={isSyncingCalendar}
              className={`p-3 rounded-xl transition-all text-gray-500 hover:bg-gray-200/60 hover:text-gray-700 cursor-pointer disabled:opacity-40`}
              title={
                locale === "pt"
                  ? "Sincronizar Google Calendar"
                  : "Sync Google Calendar"
              }
            >
              <RefreshCw
                className={`w-5 h-5 ${isSyncingCalendar ? "animate-spin text-indigo-600" : ""}`}
              />
            </button>
          </aside>

          {/* B. Gmail Sidebar 2: Navigation Drawer (w-64, light `#f6f8fc` or white) */}
          <AnimatePresence initial={false}>
          {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 220 }}
            className="bg-[#f6f8fc] border-r border-gray-200 shrink-0 overflow-y-auto overflow-x-hidden"
          >
            <div className="w-64 p-4 flex flex-col gap-4">
            {/* Material You '+ Novo pipeline' Button (Screen 9 highlight!) */}
            <button
              onClick={handleOpenNewLeadModal}
              className="bg-[#c2e7ff] hover:bg-[#b0d8f0] text-[#001d35] font-bold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer border border-transparent hover:border-blue-100"
              id="novo-pipeline-btn"
            >
              <Plus className="w-5 h-5 text-[#001d35] stroke-[3px]" />
              <span className="text-sm">{t("newLeadBtn")}</span>
            </button>

            {/* Main Navigation List */}
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab("home")}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "home"
                    ? "bg-[#d3e3fd] text-[#041e49]"
                    : "text-gray-600 hover:bg-gray-200/50"
                }`}
              >
                <Home className="w-4 h-4 text-gray-500" />
                <span>{t("homeTitle")}</span>
              </button>

              <button
                onClick={() => setActiveTab("batch_send")}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "batch_send"
                    ? "bg-[#d3e3fd] text-[#041e49]"
                    : "text-gray-600 hover:bg-gray-200/50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{t("batchSend")}</span>
                </span>
                {selectedRowIndexes.length > 0 && (
                  <span className="bg-red-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    {selectedRowIndexes.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("automation")}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "automation"
                    ? "bg-[#d3e3fd] text-[#041e49]"
                    : "text-gray-600 hover:bg-gray-200/50"
                }`}
              >
                <Cpu className="w-4 h-4 text-gray-500" />
                <span>{t("automationTitle")}</span>
              </button>

              {/* Pipelines Accordion Section (CRM style) */}
              <div className="mt-4 flex flex-col gap-1">
                <button
                  onClick={() => setPipelinesOpen(!pipelinesOpen)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600"
                >
                  <span>{t("academicPipelines")}</span>
                  {pipelinesOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>

                {pipelinesOpen && (
                  <div className="flex flex-col gap-0.5 pl-1.5 mt-1 border-l border-gray-200">
                    <button
                      onClick={() => setActiveTab("batches")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === "batches"
                          ? "bg-amber-100/65 text-amber-900 font-bold"
                          : "text-gray-600 hover:bg-gray-200/40"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>🔥</span>
                        <span className="truncate">{t("batches")}</span>
                      </span>
                      <span className="text-[10px] bg-gray-200/60 font-bold px-1.5 py-0.5 rounded text-gray-500 font-mono">
                        {batchesData.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab("meetings")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === "meetings"
                          ? "bg-amber-100/65 text-amber-900 font-bold"
                          : "text-gray-600 hover:bg-gray-200/40"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>📅</span>
                        <span className="truncate">{t("meetings")}</span>
                      </span>
                      <span className="text-[10px] bg-gray-200/60 font-bold px-1.5 py-0.5 rounded text-gray-500 font-mono">
                        {globalMetrics.scheduled}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Filtros Rápidos (Saved Views) Section (CRM style) */}
              <div className="mt-4 flex flex-col gap-1">
                <span className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                  {locale === "pt"
                    ? "Filtros Rápidos (Saved Views)"
                    : "Saved Views"}
                </span>

                <div className="flex flex-col gap-0.5 pl-1.5 mt-1 border-l border-gray-200">
                  {/* View 1: Waiting on Us */}
                  <button
                    onClick={() => {
                      setActiveTab("meetings");
                      setTimeout(() => setSavedViewFilter("waiting_on_us"), 50);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      savedViewFilter === "waiting_on_us"
                        ? "bg-indigo-100 text-indigo-900 font-bold"
                        : "text-gray-600 hover:bg-gray-200/40"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>🎯</span>
                      <span className="truncate">{t("viewWaitingUs")}</span>
                    </span>
                  </button>

                  {/* View 2: Waiting on Them */}
                  <button
                    onClick={() => {
                      setActiveTab("batches");
                      setTimeout(
                        () => setSavedViewFilter("waiting_on_them"),
                        50,
                      );
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      savedViewFilter === "waiting_on_them"
                        ? "bg-indigo-100 text-indigo-900 font-bold"
                        : "text-gray-600 hover:bg-gray-200/40"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>⏳</span>
                      <span className="truncate">{t("viewWaitingThem")}</span>
                    </span>
                  </button>

                  {/* View 3: No Reply +3 Days */}
                  <button
                    onClick={() => {
                      setActiveTab("batches");
                      setTimeout(
                        () => setSavedViewFilter("no_reply_3_days"),
                        50,
                      );
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      savedViewFilter === "no_reply_3_days"
                        ? "bg-indigo-100 text-indigo-900 font-bold"
                        : "text-gray-600 hover:bg-gray-200/40"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span className="truncate">{t("viewNoReply3Days")}</span>
                    </span>
                  </button>

                  {/* View 4: Recently Opened */}
                  <button
                    onClick={() => {
                      setActiveTab("batches");
                      setTimeout(
                        () => setSavedViewFilter("recently_opened"),
                        50,
                      );
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      savedViewFilter === "recently_opened"
                        ? "bg-indigo-100 text-indigo-900 font-bold"
                        : "text-gray-600 hover:bg-gray-200/40"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>👀</span>
                      <span className="truncate">
                        {t("viewRecentlyOpened")}
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </nav>

            {/* Quick Sheet stats details info */}
            <div className="mt-auto bg-gray-100/70 border border-gray-200 rounded-2xl p-3 text-[11px] text-gray-500 flex flex-col gap-1.5">
              <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 block font-mono">
                {locale === "pt" ? "Planilha de Base" : "Base Spreadsheet"}
              </span>
              <p
                className="font-bold text-gray-700 truncate"
                title={spreadsheetId}
              >
                {locale === "pt" ? "Sincronizada" : "Synchronized"}
              </p>
              <button
                onClick={() => {
                  showConfirm(
                    locale === "pt" ? "Alterar Planilha" : "Change Spreadsheet",
                    t("changeSpreadsheetConfirm"),
                    () => {
                      setIsSheetConnected(false);
                      setSpreadsheetId("");
                    },
                  );
                }}
                className="text-[10px] text-red-600 hover:text-red-700 font-bold text-left cursor-pointer uppercase tracking-wide mt-1 font-mono"
              >
                {t("changeSpreadsheet")} ▾
              </button>
            </div>
            </div>
          </motion.aside>
          )}
          </AnimatePresence>

          {/* C. GMAIL CENTRAL FLOATING PANEL (rounded-[24px], contains active view) */}
          <section className="flex-1 overflow-hidden p-4 md:p-5 flex flex-col gap-4 bg-[#f6f8fc]">
            {isLoadingData ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-200 shadow-sm">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-bold text-gray-600">
                  {locale === "pt"
                    ? "Sincronizando com as planilhas do Workspace..."
                    : "Synchronizing with Workspace spreadsheets..."}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {locale === "pt"
                    ? "Lendo a aba batches."
                    : "Reading the batches tab."}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 overflow-hidden"
                >
                  {activeTab === "home" && (
                    /* Global Stats dashboard "Casa" (summary overview!) */
                    <div
                      className="bg-white rounded-3xl border border-gray-200 shadow-sm h-full overflow-y-auto p-6 flex flex-col gap-6"
                      id="home-stats-dashboard"
                    >
                      {/* Greetings */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                        <div>
                          <h2 className="text-lg font-bold text-gray-800">
                            {t("greetings", {
                              name:
                                user?.displayName ||
                                (locale === "pt" ? "Usuário" : "User"),
                            })}
                          </h2>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {t("dashboardDesc")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSyncCalendar}
                            disabled={isSyncingCalendar}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all border border-indigo-150 shadow-sm"
                          >
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <span>{t("syncCalendar")}</span>
                          </button>
                        </div>
                      </div>

                      {/* Statistics Bento Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-amber-50/40 border border-amber-100/70 p-4 rounded-2xl flex flex-col justify-between min-h-[110px] shadow-sm relative overflow-hidden">
                          <div className="w-2.5 h-full bg-amber-500 absolute left-0 top-0" />
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block pl-1.5">
                            {t("leadsLoaded")}
                          </span>
                          <span className="text-3xl font-black text-amber-950 mt-1 pl-1.5">
                            {globalMetrics.totalLeads}
                          </span>
                          <span
                            className="text-[10px] text-amber-600 mt-2 block pl-1.5 font-bold cursor-pointer hover:underline"
                            onClick={() => setActiveTab("batches")}
                          >
                            {locale === "pt" ? "Ver tabela ➔" : "View table ➔"}
                          </span>
                        </div>

                        <div className="bg-orange-50/40 border border-orange-100/70 p-4 rounded-2xl flex flex-col justify-between min-h-[110px] shadow-sm relative overflow-hidden">
                          <div className="w-2.5 h-full bg-orange-500 absolute left-0 top-0" />
                          <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block pl-1.5">
                            {t("waitingResponse")}
                          </span>
                          <span className="text-3xl font-black text-orange-950 mt-1 pl-1.5">
                            {globalMetrics.waitingResponse}
                          </span>
                          <span className="text-[10px] text-orange-600 mt-2 block pl-1.5 font-bold">
                            {locale === "pt"
                              ? "Respostas pendentes"
                              : "Pending responses"}
                          </span>
                        </div>

                        <div className="bg-indigo-50/40 border border-indigo-100/70 p-4 rounded-2xl flex flex-col justify-between min-h-[110px] shadow-sm relative overflow-hidden">
                          <div className="w-2.5 h-full bg-indigo-500 absolute left-0 top-0" />
                          <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block pl-1.5">
                            {t("meetingsScheduled")}
                          </span>
                          <span className="text-3xl font-black text-indigo-950 mt-1 pl-1.5">
                            {globalMetrics.scheduled}
                          </span>
                          <span
                            className="text-[10px] text-indigo-600 mt-2 block pl-1.5 font-bold cursor-pointer hover:underline"
                            onClick={() => setActiveTab("meetings")}
                          >
                            {locale === "pt"
                              ? "Ver reuniões ➔"
                              : "View meetings ➔"}
                          </span>
                        </div>

                        <div className="bg-purple-50/40 border border-purple-100/70 p-4 rounded-2xl flex flex-col justify-between min-h-[110px] shadow-sm relative overflow-hidden">
                          <div className="w-2.5 h-full bg-purple-500 absolute left-0 top-0" />
                          <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block pl-1.5">
                            {t("conversionRate")}
                          </span>
                          <span className="text-3xl font-black text-purple-950 mt-1 pl-1.5">
                            {globalMetrics.conversionRate}%
                          </span>
                          <span className="text-[10px] text-purple-600 mt-2 block pl-1.5 font-bold">
                            {locale === "pt"
                              ? "Leads agendados"
                              : "Scheduled leads"}
                          </span>
                        </div>
                      </div>

                      {/* Visual Pipeline Funnel overview bar */}
                      <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 flex flex-col gap-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          {t("activePipelineFunnel")}
                        </span>
                        <div className="flex h-5 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 select-none">
                          <div
                            style={{
                              width: `${Math.max(15, ((globalMetrics.totalLeads - globalMetrics.waitingResponse) / (globalMetrics.totalLeads || 1)) * 100)}%`,
                            }}
                            className="bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center truncate"
                          >
                            {t("stageNewLeads")}
                          </div>
                          <div
                            style={{
                              width: `${Math.max(15, (globalMetrics.waitingResponse / (globalMetrics.totalLeads || 1)) * 100)}%`,
                            }}
                            className="bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center truncate"
                          >
                            {t("stageWaiting")}
                          </div>
                          <div
                            style={{
                              width: `${Math.max(15, (globalMetrics.scheduled / (globalMetrics.totalLeads || 1)) * 100)}%`,
                            }}
                            className="bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center truncate"
                          >
                            {t("stageScheduled")}
                          </div>
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-400 font-bold mt-1">
                          <span>{t("stageStartOutreach")}</span>
                          <span>{t("stageContactsEst")}</span>
                          <span>{t("stageMeetingClosed")}</span>
                        </div>
                      </div>

                      {/* Instructions panel */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-gray-150 rounded-2xl flex flex-col gap-2 bg-gray-50/40">
                          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                            <span>⚡</span>
                            <span>
                              {locale === "pt"
                                ? "Mala Direta Eficiente"
                                : "Efficient Mail Merge"}
                            </span>
                          </h4>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {t("mailMergeTip")}
                          </p>
                        </div>
                        <div className="p-4 border border-gray-150 rounded-2xl flex flex-col gap-2 bg-gray-50/40">
                          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                            <span>📅</span>
                            <span>
                              {locale === "pt"
                                ? "Integração com Calendar"
                                : "Calendar Integration"}
                            </span>
                          </h4>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {t("calendarTip")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "batches" && (
                    <CRMTable
                      type="batches"
                      spreadsheetId={spreadsheetId}
                      batchesData={batchesData}
                      selectedRowIndexes={selectedRowIndexes}
                      onSelectRowChange={setSelectedRowIndexes}
                      onRefresh={handleRefreshAllData}
                      savedViewFilter={savedViewFilter}
                      onClearSavedViewFilter={() => setSavedViewFilter(null)}
                      autoOpenRowIndex={autoOpenRowIndex}
                      onClearAutoOpenRowIndex={() => setAutoOpenRowIndex(null)}
                      globalSearch={globalSearch}
                      onGlobalSearchChange={setGlobalSearch}
                    />
                  )}

                  {activeTab === "meetings" && (
                    <CRMTable
                      type="meetings"
                      spreadsheetId={spreadsheetId}
                      batchesData={batchesData}
                      selectedRowIndexes={selectedRowIndexes}
                      onSelectRowChange={setSelectedRowIndexes}
                      onRefresh={handleRefreshAllData}
                      savedViewFilter={savedViewFilter}
                      onClearSavedViewFilter={() => setSavedViewFilter(null)}
                      autoOpenRowIndex={autoOpenRowIndex}
                      onClearAutoOpenRowIndex={() => setAutoOpenRowIndex(null)}
                      globalSearch={globalSearch}
                      onGlobalSearchChange={setGlobalSearch}
                    />
                  )}

                  {activeTab === "batch_send" && (
                    <BatchSendTab
                      spreadsheetId={spreadsheetId}
                      selectedContacts={selectedContactsList}
                      onRefresh={handleRefreshAllData}
                      onClearSelection={() => setSelectedRowIndexes([])}
                      onNavigate={(tab) => setActiveTab(tab)}
                    />
                  )}

                  {activeTab === "automation" && (
                    <AutomationTab
                      spreadsheetId={spreadsheetId}
                      batchesData={batchesData}
                      onRefresh={handleRefreshAllData}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </section>

          {/* D. GMAIL RIGHT ADD-ONS SIDEBAR & DRAWERS (Tasks / Keep / Contacts) */}
          {/* Narrow Vertical Sidebar bar */}
          <aside className="w-12 bg-white border-l border-gray-200 flex flex-col items-center py-4 gap-4 shrink-0 select-none">
            {/* Google Calendar Logo (external or triggers calendar sync) */}
            <button
              onClick={handleSyncCalendar}
              className="w-9 h-9 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors text-blue-600 cursor-pointer"
              title="Google Calendar Sync"
            >
              <Calendar className="w-5 h-5 stroke-[2px]" />
            </button>

            {/* Google Tasks Logo (blue circle checklist - triggers Drawer) */}
            <button
              onClick={() =>
                setActiveRightPanel(
                  activeRightPanel === "tasks" ? null : "tasks",
                )
              }
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                activeRightPanel === "tasks"
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "hover:bg-gray-100 text-[#1a73e8]"
              }`}
              title="Google Tasks"
              id="google-tasks-sidebar-trigger"
            >
              <CheckCircle className="w-5 h-5 stroke-[2px]" />
            </button>

            {/* Google Contacts Logo (blue outline person - triggers Drawer) */}
            <button
              onClick={() =>
                setActiveRightPanel(
                  activeRightPanel === "contacts" ? null : "contacts",
                )
              }
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                activeRightPanel === "contacts"
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "hover:bg-gray-100 text-blue-500"
              }`}
              title="Google Contacts"
              id="google-contacts-sidebar-trigger"
            >
              <Users className="w-5 h-5 stroke-[2px]" />
            </button>
          </aside>

          {/* Drawer container representing Google Sidebar slideout panels */}
          <AnimatePresence>
            {activeRightPanel && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 360 }}
                exit={{ width: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 220 }}
                className="h-full bg-white border-l border-gray-200 shadow-2xl relative shrink-0 overflow-hidden z-20"
              >
                {activeRightPanel === "tasks" ? (
                  <GoogleTasksSidebar
                    onClose={() => setActiveRightPanel(null)}
                  />
                ) : (
                  <GoogleContactsSidebar
                    contactsData={batchesData}
                    onClose={() => setActiveRightPanel(null)}
                    onOpenContactDetail={(index) => {
                      setActiveTab("batches");
                      setAutoOpenRowIndex(index);
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Onboarding Guide & Help Center */}
          <OnboardingGuide
            isOpen={isOnboardingOpen}
            onClose={() => {
              setIsOnboardingOpen(false);
              try {
                localStorage.setItem("dw_crm_onboarding_completed", "true");
              } catch (e) {
                console.warn("Storage write blocked:", e);
              }
            }}
            onNavigateToTab={(tab) => {
              setActiveTab(tab);
            }}
          />
        </main>
      )}

      {/* Custom Confirmation Modal Overlay */}
      {customConfirm && customConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-[#041e49] font-sans tracking-tight">
              {customConfirm.title}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed font-sans">
              {customConfirm.message}
            </p>
            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                onClick={() => setCustomConfirm(null)}
                className="px-4 py-2 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-500 cursor-pointer transition-all"
              >
                {t("cancelBtn")}
              </button>
              <button
                onClick={() => {
                  const callback = customConfirm.onConfirm;
                  setCustomConfirm(null);
                  callback();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
              >
                {locale === "pt" ? "Confirmar" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal Overlay */}
      {customAlert && customAlert.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-[#041e49] font-sans tracking-tight">
              {customAlert.title}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed font-sans">
              {customAlert.message}
            </p>
            <div className="flex items-center justify-end mt-2">
              <button
                onClick={() => setCustomAlert(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom New Lead Creation Form Modal */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="bg-[#f0f4f9] px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                <h3 className="text-sm font-extrabold text-[#041e49] font-sans tracking-tight">
                  {locale === "pt"
                    ? "Criar Novo Lead / Pipeline"
                    : "Create New Lead / Pipeline"}
                </h3>
              </div>
              <button
                onClick={() => setIsNewLeadModalOpen(false)}
                className="p-1.5 hover:bg-gray-200/60 rounded-full text-gray-500 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form
              onSubmit={handleSubmitNewLead}
              className="flex-1 overflow-y-auto p-6 flex flex-col gap-4"
            >
              <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-600">
                      {locale === "pt"
                        ? "Universidade (Obrigatório):"
                        : "University (Required):"}
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: USP, UNICAMP, FGV..."
                      value={newLeadUniversity}
                      onChange={(e) => setNewLeadUniversity(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-600">
                      {locale === "pt"
                        ? "Organização Estudantil:"
                        : "Student Organization:"}
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: DCE, Atlética, Centro Acadêmico..."
                      value={newLeadStudentOrg}
                      onChange={(e) => setNewLeadStudentOrg(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-600">
                      {locale === "pt"
                        ? "Nome do Aluno (Obrigatório):"
                        : "Student Name (Required):"}
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: João Silva"
                      value={newLeadName}
                      onChange={(e) => setNewLeadName(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-600">
                      {locale === "pt"
                        ? "E-mail de Contato:"
                        : "Contact Email:"}
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: estudante@universidade.edu"
                      value={newLeadEmail}
                      onChange={(e) => setNewLeadEmail(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-600">
                      {locale === "pt"
                        ? "Etapa Inicial do Pipeline:"
                        : "Initial Pipeline Stage:"}
                    </label>
                    <select
                      value={newLeadStatus}
                      onChange={(e) => setNewLeadStatus(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                    >
                      <option value="Lead">
                        {locale === "pt" ? "Conduzir (Lead)" : "Lead"}
                      </option>
                      <option value="waiting on them">
                        {locale === "pt"
                          ? "Contactado (waiting on them)"
                          : "Contacted"}
                      </option>
                      <option value="Replied - waiting">
                        {locale === "pt" ? "Inclinado (Replied)" : "Interested"}
                      </option>
                      <option value="Opened">
                        {locale === "pt" ? "Demonstração (Opened)" : "Opened"}
                      </option>
                      <option value="Email bounced">
                        {locale === "pt" ? "Perdido/Bounce" : "Lost/Bounced"}
                      </option>
                      <option value="nurture">
                        {locale === "pt" ? "Nutrir" : "Nurture"}
                      </option>
                    </select>
                  </div>
                </>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600">
                  {locale === "pt"
                    ? "Notas / Observações:"
                    : "Notes / Remarks:"}
                </label>
                <textarea
                  placeholder={
                    locale === "pt"
                      ? "Adicione anotações sobre este lead..."
                      : "Add notes about this lead..."
                  }
                  value={newLeadNotes}
                  onChange={(e) => setNewLeadNotes(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 mt-4 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewLeadModalOpen(false)}
                  className="px-4 py-2.5 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-500 cursor-pointer transition-all"
                >
                  {t("cancelBtn")}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{locale === "pt" ? "Criar Lead" : "Create Lead"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
