import React, { useState, useMemo, useEffect } from "react";
import { useI18n } from "../lib/i18n";
import { 
  Search,
  SlidersHorizontal,
  Calendar,
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Save,
  Clock,
  Mail,
  UserPlus,
  CloudUpload,
  X,
  AlertTriangle,
  MailCheck,
  MessageSquareReply,
  CalendarPlus,
  CheckCheck,
  CalendarCheck,
  CalendarX,
  CalendarClock
} from "lucide-react";
import { BatchContact, MeetingRow } from "../types";
import { updateSheetRow, createCalendarEvent, fetchFreeBusySlots } from "../lib/google-api";
import { motion, AnimatePresence } from "motion/react";

interface CRMTableProps {
  type: "batches" | "meetings";
  spreadsheetId: string;
  batchesData: BatchContact[];
  selectedRowIndexes: number[];
  onSelectRowChange: (indexes: number[]) => void;
  onRefresh: () => void;
  savedViewFilter?: string | null;
  onClearSavedViewFilter?: () => void;
  autoOpenRowIndex?: number | null;
  onClearAutoOpenRowIndex?: () => void;
  globalSearch?: string;
  onGlobalSearchChange?: (val: string) => void;
}

export default function CRMTable({
  type,
  spreadsheetId,
  batchesData,
  selectedRowIndexes,
  onSelectRowChange,
  onRefresh,
  savedViewFilter,
  onClearSavedViewFilter,
  autoOpenRowIndex,
  onClearAutoOpenRowIndex,
  globalSearch = "",
  onGlobalSearchChange,
}: CRMTableProps) {
  const { t, locale } = useI18n();
  const [searchTerm, setSearchTerm] = useState(globalSearch);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    setSearchTerm(globalSearch);
  }, [globalSearch]);
  const [selectedRow, setSelectedRow] = useState<BatchContact | MeetingRow | null>(null);

  // Meetings now live natively on the Lead record. The "meetings" view derives its
  // rows from batchesData instead of the legacy meetings sheet, so rowIndex still
  // points at the correct row in "batches". Only confirmed meetings count here —
  // same criteria as the Home dashboard's "scheduled" metric — so this count stays
  // consistent everywhere instead of also including merely suggested times.
  const meetingsFromLeads = useMemo<MeetingRow[]>(() => {
    return batchesData
      .filter((b) => b.statusMeetings === "Scheduled" || b.statusMeetings === "booked" || (b.bookedTime && b.bookedTime.trim()))
      .map((b) => ({
        rowIndex: b.rowIndex,
        name: b.name || "",
        email: b.email || "",
        suggestedTimes: b.suggestedTimes || "",
        bookedTime: b.bookedTime || "",
        notes: b.notesMeetings || "",
        status: b.statusMeetings || "",
        emailSentAlert: b.emailSentAlert,
        emailReceivedAlert: b.emailReceivedAlert,
        emailOpenedAlert: b.emailOpenedAlert,
        meetingConfirmationStatus: b.meetingConfirmationStatus,
        meetingDateTime: b.meetingDateTime,
      }));
  }, [batchesData]);

  // Deep linking auto-open handler
  useEffect(() => {
    if (autoOpenRowIndex) {
      const rowToOpen = (type === "batches" ? batchesData : meetingsFromLeads).find(
        (item) => item.rowIndex === autoOpenRowIndex
      );
      if (rowToOpen) {
        // Trigger details open
        setSelectedRow(rowToOpen);
        setEditedStatus(rowToOpen.status || "");
        setEditedNotes(rowToOpen.notes || "");
        setSaveSuccess(false);
        setShowMeetingForm(false);
        setMeetingDateTime("");
        setMeetingCreated(false);

        if (type === "batches") {
          const b = rowToOpen as BatchContact;
          setEditedUniversity(b.university || "");
          setEditedStudentOrg(b.studentOrganization || "");
          setEditedName(b.name || "");
          setEditedEmail(b.email || "");
        } else {
          const m = rowToOpen as MeetingRow;
          setEditedEmail(m.email || "");
          setEditedTimes(m.suggestedTimes || "");
          setEditedBooked(m.bookedTime || "");
        }
        
        if (onClearAutoOpenRowIndex) {
          onClearAutoOpenRowIndex();
        }
      }
    }
  }, [autoOpenRowIndex, batchesData, meetingsFromLeads, type]);

  // State for Copied Link feedback

  // States for Add Meeting (Google Calendar) card
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingDateTime, setMeetingDateTime] = useState("");
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [meetingCreated, setMeetingCreated] = useState(false);
  const [freeSlots, setFreeSlots] = useState<{ start: string; end: string }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(false);

  // States for row editing
  const [isSaving, setIsSaving] = useState(false);
  const [editedStatus, setEditedStatus] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  const [editedTimes, setEditedTimes] = useState(""); // Suggested meeting times (batches & meetings)
  const [editedBooked, setEditedBooked] = useState(""); // Booked meeting time (batches & meetings)
  const [editedStatusMeetings, setEditedStatusMeetings] = useState(""); // For batches meeting pipeline status
  const [editedNotesMeetings, setEditedNotesMeetings] = useState(""); // For batches meeting-specific notes
  const [editedUniversity, setEditedUniversity] = useState(""); // For batches university
  const [editedStudentOrg, setEditedStudentOrg] = useState(""); // For batches student organization
  const [editedName, setEditedName] = useState(""); // For batches name
  const [editedEmail, setEditedEmail] = useState(""); // For meetings email
  const [editedEmailSent, setEditedEmailSent] = useState(""); // For batches dispatch date
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Core pipeline stages definition
  const stages = useMemo(() => {
    if (type === "batches") {
      const counts = {
        Lead: batchesData.filter(b => !b.status || b.status.toLowerCase().trim() === "lead" || b.status.toLowerCase().trim() === "").length,
        Contactado: batchesData.filter(b => b.status?.toLowerCase().trim() === "waiting on them" || b.status?.toLowerCase().trim() === "aguardando").length,
        Inclinado: batchesData.filter(b => b.status?.toLowerCase().trim() === "replied - waiting" || b.status?.toLowerCase().trim() === "respondeu" || b.status?.toLowerCase().trim() === "replied").length,
        Demonstracao: batchesData.filter(b => b.status?.toLowerCase().trim() === "opened" || b.status?.toLowerCase().trim() === "visualizado").length,
        Bounce: batchesData.filter(b => b.status?.toLowerCase().trim() === "email bounced" || b.status?.toLowerCase().trim() === "bounced" || b.status?.toLowerCase().trim() === "bounce").length,
        Nutrir: batchesData.filter(b => b.status?.toLowerCase().trim() === "nurture" || b.status?.toLowerCase().trim() === "nutrir").length,
      };

      return [
        { key: "Lead", label: locale === "pt" ? "Conduzir" : "Lead", count: counts.Lead, color: "#EF4444", statusValue: "Lead" },
        { key: "Contactado", label: locale === "pt" ? "Contactado" : "Contacted", count: counts.Contactado, color: "#F97316", statusValue: "waiting on them" },
        { key: "Inclinado", label: locale === "pt" ? "Inclinado" : "Interested", count: counts.Inclinado, color: "#84CC16", statusValue: "Replied - waiting" },
        { key: "Demonstracao", label: locale === "pt" ? "Demonstração" : "Opened", count: counts.Demonstracao, color: "#0D9488", statusValue: "Opened" },
        { key: "Bounce", label: locale === "pt" ? "Perdido/Bounce" : "Lost/Bounced", count: counts.Bounce, color: "#2563EB", statusValue: "Email bounced" },
        { key: "Nutrir", label: locale === "pt" ? "Nutrir" : "Nurture", count: counts.Nutrir, color: "#D946EF", statusValue: "nurture" },
      ];
    } else {
      const counts = {
        New: meetingsFromLeads.filter(m => !m.status || m.status.toLowerCase().trim() === "new" || m.status.toLowerCase().trim() === "").length,
        Sugerido: meetingsFromLeads.filter(m => m.status?.toLowerCase().trim() === "waiting on them" || m.status?.toLowerCase().trim() === "sugerido").length,
        Scheduled: meetingsFromLeads.filter(m => m.status?.toLowerCase().trim() === "scheduled" || m.status?.toLowerCase().trim() === "booked").length,
        Done: meetingsFromLeads.filter(m => m.status?.toLowerCase().trim() === "completed" || m.status?.toLowerCase().trim() === "realizada" || m.status?.toLowerCase().trim() === "done").length,
      };

      return [
        { key: "New", label: locale === "pt" ? "Novos Convites" : "New Invites", count: counts.New, color: "#3F51B5", statusValue: "New" },
        { key: "Sugerido", label: locale === "pt" ? "Horário Sugerido" : "Suggested Time", count: counts.Sugerido, color: "#FF9800", statusValue: "waiting on them" },
        { key: "Scheduled", label: locale === "pt" ? "Agendado" : "Scheduled", count: counts.Scheduled, color: "#4CAF50", statusValue: "Scheduled" },
        { key: "Done", label: locale === "pt" ? "Realizada" : "Completed", count: counts.Done, color: "#9C27B0", statusValue: "Completed" },
      ];
    }
  }, [type, batchesData, meetingsFromLeads, locale]);

  // Status colors mapping for row lists
  const getStatusBadgeClass = (status: string) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "waiting on them" || s === "aguardando") {
      return "bg-orange-50 text-orange-700 border-orange-200";
    }
    if (s.includes("reply") || s.includes("replied") || s.includes("respondeu")) {
      return "bg-lime-50 text-lime-800 border-lime-200";
    }
    if (s === "opened" || s === "visualizado") {
      return "bg-teal-50 text-teal-800 border-teal-200";
    }
    if (s.includes("bounced") || s.includes("bounce") || s.includes("falhou")) {
      return "bg-red-50 text-red-800 border-red-200";
    }
    if (s === "booked" || s.includes("marcado") || s.includes("agendado") || s === "scheduled" || s === "completed") {
      return "bg-indigo-50 text-indigo-800 border-indigo-200";
    }
    if (!s) {
      return "bg-gray-50 text-gray-500 border-gray-200";
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const renderEmailSentAlert = (item: BatchContact | MeetingRow) => {
    const isSent = 
      item.emailSentAlert?.toLowerCase().includes("sent") || 
      item.emailSentAlert?.toLowerCase().includes("env") || 
      item.emailSentAlert?.toLowerCase().includes("sim") || 
      item.emailSentAlert?.toLowerCase().includes("yes") ||
      ("emailSent" in item && !!item.emailSent) ||
      ["waiting on them", "replied - waiting", "opened", "booked"].includes(item.status?.toLowerCase().trim());

    if (isSent) {
      const dataEnvio = ("dataEnvio" in item ? item.dataEnvio : undefined) || ("emailSent" in item ? item.emailSent : undefined);
      return (
        <span className="inline-flex flex-col items-center gap-0.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 shadow-sm" title={dataEnvio ? `${locale === "pt" ? "E-mail Enviado" : "Email Sent"} (${dataEnvio})` : (locale === "pt" ? "E-mail Enviado" : "Email Sent")}>
            <MailCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{locale === "pt" ? "Enviado" : "Sent"}</span>
          </span>
          {dataEnvio && (
            <span className="text-[9px] text-emerald-500 font-mono leading-none">{dataEnvio}</span>
          )}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50/50 text-gray-400 text-[10px] font-semibold border border-gray-100" title={locale === "pt" ? "Não Enviado" : "Not Sent"}>
        <span>{locale === "pt" ? "Não" : "No"}</span>
      </span>
    );
  };

  const renderEmailReceivedAlert = (item: BatchContact | MeetingRow) => {
    const isRead =
      item.emailReceivedAlert?.toLowerCase().trim() === "lido" ||
      item.emailReceivedAlert?.toLowerCase().trim() === "read";
    const hasReceived = !isRead && hasPendingReplyAlert(item);

    if (hasReceived) {
      const dataRetorno = "dataRetorno" in item ? item.dataRetorno : undefined;
      return (
        <span className="inline-flex flex-col items-center gap-0.5">
          <span className="inline-flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-extrabold border border-amber-200 shadow-sm animate-pulse" title={dataRetorno ? `${locale === "pt" ? "Novo E-mail de Retorno!" : "New Reply Received!"} (${dataRetorno})` : (locale === "pt" ? "Novo E-mail de Retorno!" : "New Reply Received!")}>
              <MessageSquareReply className="w-3.5 h-3.5 text-amber-600" />
              <span>{locale === "pt" ? "Novo Retorno!" : "New Reply!"}</span>
            </span>
            <button
              onClick={(e) => handleMarkReplyAsRead(item, e)}
              className="p-0.5 text-amber-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all cursor-pointer"
              title={locale === "pt" ? "Marcar como lido" : "Mark as read"}
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          </span>
          {dataRetorno && (
            <span className="text-[9px] text-amber-500 font-mono leading-none">{dataRetorno}</span>
          )}
        </span>
      );
    }
    if (isRead) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 text-[10px] font-semibold border border-gray-200" title={locale === "pt" ? "Retorno Lido" : "Reply Read"}>
          <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
          <span>{locale === "pt" ? "Lido" : "Read"}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50/50 text-gray-300 text-[10px]">
        <span>—</span>
      </span>
    );
  };

  const renderEmailOpenedAlert = (item: BatchContact | MeetingRow) => {
    // Only trust the real pixel-tracked "opened" alert column - never infer
    // "opened" from a pipeline status like "replied - waiting" or "booked",
    // since a client can reply or book without the tracking pixel ever firing.
    const isOpened =
      item.emailOpenedAlert?.toLowerCase().includes("aberto") ||
      item.emailOpenedAlert?.toLowerCase().includes("open") ||
      item.emailOpenedAlert?.toLowerCase().includes("sim") ||
      item.emailOpenedAlert?.toLowerCase().includes("yes");

    if (isOpened) {
      const dataAbertura = "dataAbertura" in item ? item.dataAbertura : undefined;
      return (
        <span className="inline-flex flex-col items-center gap-0.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-100 shadow-sm" title={dataAbertura ? `${locale === "pt" ? "E-mail Aberto" : "Email Opened"} (${dataAbertura})` : (locale === "pt" ? "E-mail Aberto" : "Email Opened")}>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
            <span>{locale === "pt" ? "Aberto" : "Opened"}</span>
          </span>
          {dataAbertura && (
            <span className="text-[9px] text-teal-500 font-mono leading-none">{dataAbertura}</span>
          )}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50/50 text-gray-300 text-[10px]">
        <span>—</span>
      </span>
    );
  };

  const renderMeetingConfirmationBadge = (item: BatchContact | MeetingRow) => {
    const raw = (item.meetingConfirmationStatus || "").toLowerCase().trim();

    if (!raw) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50/50 text-gray-300 text-[10px]">
          <span>—</span>
        </span>
      );
    }

    const isAccepted = raw.includes("confirmada") || raw.includes("confirmed") || raw.includes("accepted");
    const isDeclined = raw.includes("recusada") || raw.includes("declined");
    const isTentative = raw.includes("talvez") || raw.includes("tentative");

    if (isAccepted) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 shadow-sm" title={item.meetingConfirmationStatus}>
          <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{locale === "pt" ? "Confirmada" : "Confirmed"}</span>
        </span>
      );
    }
    if (isDeclined) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold border border-red-100 shadow-sm" title={item.meetingConfirmationStatus}>
          <CalendarX className="w-3.5 h-3.5 text-red-600" />
          <span>{locale === "pt" ? "Recusada" : "Declined"}</span>
        </span>
      );
    }
    if (isTentative) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100 shadow-sm" title={item.meetingConfirmationStatus}>
          <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
          <span>{locale === "pt" ? "Talvez" : "Tentative"}</span>
        </span>
      );
    }
    // Pendente / needsAction / any other value
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50/60 text-amber-600 text-[10px] font-semibold border border-amber-100" title={item.meetingConfirmationStatus}>
        <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
        <span>{locale === "pt" ? "Pendente" : "Pending"}</span>
      </span>
    );
  };

  // List of all unique statuses found to populate filter pills
  const availableStatuses = useMemo(() => {
    const rawList = type === "batches"
      ? batchesData.map(c => c.status)
      : meetingsFromLeads.map(m => m.status);

    const unique = Array.from(new Set(rawList.map(s => s?.trim() || ""))).filter(Boolean);
    return ["All", ...unique];
  }, [type, batchesData, meetingsFromLeads]);

  // Filter & Search application
  const filteredData = useMemo(() => {
    if (type === "batches") {
      let data = batchesData;

      // Apply Saved View filter if any
      if (savedViewFilter) {
        if (savedViewFilter === "waiting_on_them") {
          data = data.filter(item => {
            const s = (item.status || "").toLowerCase().trim();
            return s === "waiting on them" || s === "aguardando";
          });
        } else if (savedViewFilter === "no_reply_3_days") {
          data = data.filter(item => {
            const s = (item.status || "").toLowerCase().trim();
            const isWaiting = s === "waiting on them" || s === "aguardando" || s === "lead" || s === "";
            if (!isWaiting) return false;

            if (!item.emailSent) return false;
            const sentDate = new Date(item.emailSent);
            if (isNaN(sentDate.getTime())) return false;
            
            const diffTime = Date.now() - sentDate.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            return diffDays >= 3;
          });
        } else if (savedViewFilter === "recently_opened") {
          data = data.filter(item => {
            const s = (item.status || "").toLowerCase().trim();
            return s === "opened" || s === "visualizado";
          });
        }
      }

      return data.filter((item) => {
        const matchesSearch = 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.studentOrganization.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.emailSent || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.notes.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesStatus = statusFilter === "All";
        if (!matchesStatus) {
          if (statusFilter === "Lead") {
            matchesStatus = !item.status || item.status.toLowerCase().trim() === "lead" || item.status.toLowerCase().trim() === "";
          } else {
            matchesStatus = (item.status || "").trim().toLowerCase() === statusFilter.toLowerCase();
          }
        }
        return matchesSearch && matchesStatus;
      });
    } else {
      let data = meetingsFromLeads;

      if (savedViewFilter) {
        if (savedViewFilter === "waiting_on_us") {
          data = data.filter(item => {
            const s = (item.status || "").toLowerCase().trim();
            const isScheduled = s === "scheduled" || s === "booked" || s === "completed" || s === "done";
            return !isScheduled && (s === "waiting on them" || s === "sugerido" || s === "new" || s === "" || item.suggestedTimes);
          });
        }
      }

      return data.filter((item) => {
        const matchesSearch =
          (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.suggestedTimes.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.bookedTime.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesStatus = statusFilter === "All";
        if (!matchesStatus) {
          if (statusFilter === "New") {
            matchesStatus = !item.status || item.status.toLowerCase().trim() === "new" || item.status.toLowerCase().trim() === "";
          } else {
            matchesStatus = (item.status || "").trim().toLowerCase() === statusFilter.toLowerCase();
          }
        }
        return matchesSearch && matchesStatus;
      });
    }
  }, [type, batchesData, meetingsFromLeads, searchTerm, statusFilter, savedViewFilter]);

  // Selection toggles
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allFilteredIndexes = filteredData.map((item) => item.rowIndex);
      onSelectChange([...new Set([...selectedRowIndexes, ...allFilteredIndexes])]);
    } else {
      const filteredIndexes = filteredData.map((item) => item.rowIndex);
      onSelectChange(selectedRowIndexes.filter((idx) => !filteredIndexes.includes(idx)));
    }
  };

  const handleSelectRow = (rowIndex: number, checked: boolean) => {
    if (checked) {
      onSelectChange([...selectedRowIndexes, rowIndex]);
    } else {
      onSelectChange(selectedRowIndexes.filter((idx) => idx !== rowIndex));
    }
  };

  const onSelectChange = (indexes: number[]) => {
    onSelectRowChange(indexes);
  };

  // Mark a "new reply" alert as read/seen. Triggered explicitly via the
  // "mark as read" button, and automatically when the row's detail modal is opened.
  const handleMarkReplyAsRead = (item: BatchContact | MeetingRow, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const readLabel = locale === "pt" ? "Lido" : "Read";
    const updates: { [key: string]: string } = {};
    updates["Alerta Retorno"] = readLabel;
    updates["Email Received Alert"] = readLabel;
    updates["Alerta Recebido"] = readLabel;
    updates["Retorno Notificação"] = readLabel;
    updates["Notif. Retorno"] = readLabel;

    // Meetings now live natively on the Lead record, so both views write to "batches".
    updateSheetRow(spreadsheetId, "batches", item.rowIndex, updates)
      .then(() => {
        onRefresh();
        setSelectedRow((prev) => {
          if (!prev || prev.rowIndex !== item.rowIndex) return prev;
          return { ...prev, emailReceivedAlert: readLabel };
        });
      })
      .catch((err) => {
        console.error("Failed to mark reply notification as read:", err);
        alert(
          locale === "pt"
            ? "Houve um erro ao marcar a notificação como lida. Tente novamente."
            : "There was an error marking the notification as read. Please try again."
        );
      });
  };

  const hasPendingReplyAlert = (item: BatchContact | MeetingRow) =>
    item.emailReceivedAlert?.toLowerCase().includes("retorno") ||
    item.emailReceivedAlert?.toLowerCase().includes("reply") ||
    item.emailReceivedAlert?.toLowerCase().includes("sim") ||
    item.emailReceivedAlert?.toLowerCase().includes("yes") ||
    item.emailReceivedAlert?.toLowerCase().includes("recebido");

  // Open Edit drawer
  const handleOpenRowDetail = (item: BatchContact | MeetingRow) => {
    // Clone the item to prevent modifying frozen state/prop objects
    const clonedItem = { ...item };
    setSelectedRow(clonedItem);
    setEditedStatus(clonedItem.status || "");
    setEditedNotes(clonedItem.notes || "");
    setSaveSuccess(false);

    if (type === "batches") {
      const b = clonedItem as BatchContact;
      setEditedUniversity(b.university || "");
      setEditedStudentOrg(b.studentOrganization || "");
      setEditedName(b.name || "");
      setEditedEmail(b.email || "");
      setEditedEmailSent(b.emailSent || "");
      setEditedTimes(b.suggestedTimes || "");
      setEditedBooked(b.bookedTime || "");
      setEditedStatusMeetings(b.statusMeetings || "");
      setEditedNotesMeetings(b.notesMeetings || "");
    } else {
      const m = clonedItem as MeetingRow;
      setEditedEmail(m.email || "");
      setEditedTimes(m.suggestedTimes || "");
      setEditedBooked(m.bookedTime || "");
      setEditedEmailSent("");
    }
    setShowMeetingForm(false);
    setMeetingDateTime("");
    setFreeSlots([]);
    setSlotsError(false);

    // Opening a client's reply email marks the pending "new reply" alert as read.
    if (hasPendingReplyAlert(clonedItem)) {
      handleMarkReplyAsRead(clonedItem);
    }
  };

  // Check if current row has duplicates in the database
  const hasDuplicity = useMemo(() => {
    if (!selectedRow) return false;
    if (type === "batches") {
      const row = selectedRow as BatchContact;
      if (!row.name) return false;
      return batchesData.filter(b => b.name && b.name.toLowerCase().trim() === row.name.toLowerCase().trim()).length > 1;
    } else {
      const row = selectedRow as MeetingRow;
      if (!row.email) return false;
      return meetingsFromLeads.filter(m => m.email && m.email.toLowerCase().trim() === row.email.toLowerCase().trim()).length > 1;
    }
  }, [selectedRow, batchesData, meetingsFromLeads, type]);

  // Open the meeting scheduling form and fetch real free/busy slots from Google Calendar
  const handleOpenMeetingForm = async () => {
    setShowMeetingForm(true);
    setSlotsError(false);
    setIsLoadingSlots(true);
    try {
      const slots = await fetchFreeBusySlots({});
      setFreeSlots(slots);
    } catch (error) {
      console.error("Erro ao buscar horários livres no Google Calendar:", error);
      setSlotsError(true);
      setFreeSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Create a Google Calendar event/invite for the current lead
  const handleCreateMeeting = async () => {
    if (!selectedRow || !meetingDateTime) return;

    const attendeeEmail = type === "batches" ? (selectedRow as BatchContact).email : (selectedRow as MeetingRow).email;
    if (!attendeeEmail || !attendeeEmail.includes("@")) {
      alert(
        locale === "pt"
          ? "Este lead não possui um e-mail de contato válido para enviar o convite."
          : "This lead doesn't have a valid contact email to send the invite to."
      );
      return;
    }

    const leadName = type === "batches" ? (selectedRow as BatchContact).name : attendeeEmail;
    const leadOrg = type === "batches"
      ? ((selectedRow as BatchContact).university || (selectedRow as BatchContact).studentOrganization)
      : "";

    const summary = leadOrg
      ? `Reunião com ${leadName} - ${leadOrg}`
      : `Reunião com ${leadName}`;

    setIsCreatingMeeting(true);
    setMeetingCreated(false);

    try {
      await createCalendarEvent({
        summary,
        description: editedNotes || undefined,
        attendeeEmail,
        startDateTime: meetingDateTime,
      });

      const nowStr = new Date().toLocaleString(locale === "pt" ? "pt-BR" : "en-US");
      const scheduledStr = new Date(meetingDateTime).toLocaleString(locale === "pt" ? "pt-BR" : "en-US");
      // Meetings now live natively on the Lead record, so both views write to "batches".
      const sheetName = "batches";
      const meetingUpdates: { [key: string]: string } = {
        "Meeting Invitation Sent On": nowStr,
        "booked time": scheduledStr,
        "status meetings": "Scheduled",
        // Initial RSVP state: the invite was just sent, so the confirmation
        // starts as pending. The background calendar sync flips it to
        // Confirmada/Recusada as soon as the lead responds to the invite.
        "Meeting Confirmation": locale === "pt" ? "Pendente" : "Pending",
      };
      await updateSheetRow(spreadsheetId, sheetName, selectedRow.rowIndex, meetingUpdates);

      setMeetingCreated(true);
      setShowMeetingForm(false);
      setMeetingDateTime("");
      setFreeSlots([]);
      setEditedBooked(scheduledStr);
      if (type === "batches") setEditedStatusMeetings("Scheduled");
      setSelectedRow((prev) => (prev ? { ...prev, meetingDateTime: scheduledStr, bookedTime: scheduledStr } : null));
      onRefresh();

      alert(
        locale === "pt"
          ? "Convite de reunião enviado com sucesso! O lead receberá o e-mail do Google Calendar."
          : "Meeting invite sent successfully! The lead will receive the Google Calendar email."
      );

      setTimeout(() => setMeetingCreated(false), 2500);
    } catch (error) {
      console.error("Erro ao criar evento no Google Calendar:", error);
      alert(
        locale === "pt"
          ? "Houve um erro ao criar o evento no Google Calendar. Verifique sua conexão e permissões e tente novamente."
          : "There was an error creating the Google Calendar event. Please check your connection and permissions and try again."
      );
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  // Save changes to Sheet
  const handleSaveDetails = async () => {
    if (!selectedRow) return;

    // Workspace guidelines: ask user before updating spreadsheet data (MANDATORY rule)
    const confirmed = window.confirm(
      locale === "pt"
        ? `Deseja atualizar os dados da linha ${selectedRow.rowIndex} na sua planilha do Google Sheets?`
        : `Do you want to update the data for row ${selectedRow.rowIndex} in your Google Sheets spreadsheet?`
    );
    if (!confirmed) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Meetings now live natively on the Lead record, so both views write to "batches".
      const sheetName = "batches";

      const updates: { [key: string]: string } = {
        "suggested times": editedTimes,
        "booked time": editedBooked,
      };

      if (type === "batches") {
        updates["Status"] = editedStatus;
        updates["Notes"] = editedNotes;
        updates["university"] = editedUniversity;
        updates["student organization"] = editedStudentOrg;
        updates["name"] = editedName;
        updates["email"] = editedEmail;
        // The drawer field is the dispatch date ("Data do Envio") — write it to
        // the "Date Sent" column. Never use the key "email sent" here: in this
        // sheet the "Email Sent" header is the actual address column.
        updates["date sent"] = editedEmailSent;
        updates["status meetings"] = editedStatusMeetings;
        updates["notes meetings"] = editedNotesMeetings;
      } else {
        // Meetings view: editedStatus/editedNotes here represent the meeting's own
        // status/notes, not the Lead's prospecting pipeline — map them accordingly.
        updates["email"] = editedEmail;
        updates["status meetings"] = editedStatus;
        updates["notes meetings"] = editedNotes;
      }

      await updateSheetRow(spreadsheetId, sheetName, selectedRow.rowIndex, updates);

      setSaveSuccess(true);
      onRefresh(); // reload data in parent

      // Update local drawer state view
      setSelectedRow((prev) => {
        if (!prev) return null;
        if (type === "batches") {
          return {
            ...prev,
            university: editedUniversity,
            studentOrganization: editedStudentOrg,
            name: editedName,
            status: editedStatus,
            notes: editedNotes,
            email: editedEmail,
            emailSent: editedEmailSent,
            suggestedTimes: editedTimes,
            bookedTime: editedBooked,
            statusMeetings: editedStatusMeetings,
            notesMeetings: editedNotesMeetings,
          } as BatchContact;
        } else {
          return {
            ...prev,
            email: editedEmail,
            status: editedStatus,
            notes: editedNotes,
            suggestedTimes: editedTimes,
            bookedTime: editedBooked,
          } as MeetingRow;
        }
      });

      // Clear success indicator after 2.5s
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (error) {
      console.error("Erro ao salvar detalhes na planilha:", error);
      alert(
        locale === "pt"
          ? "Houve um erro ao gravar na planilha do Google Sheets. Verifique a conexão e tente novamente."
          : "There was an error writing to the Google Sheets spreadsheet. Please check your connection and try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden relative" id={`${type}-crm-table`}>
      
      {/* 1. CRM Pipeline Chevron Progress Bar (As in references) */}
      <div className="flex items-center w-full bg-gray-50 border-b border-gray-100 p-1 select-none overflow-x-auto scrollbar-none gap-[1px]">
        {stages.map((stage, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === stages.length - 1;
          const clipClass = isFirst 
            ? "clip-chevron-first" 
            : isLast 
            ? "clip-chevron-last" 
            : "clip-chevron";

          const isActive = statusFilter === stage.statusValue;

          return (
            <button
              key={stage.key}
              onClick={() => setStatusFilter(isActive ? "All" : stage.statusValue)}
              style={{ backgroundColor: stage.color }}
              className={`flex-1 min-w-[95px] h-12 flex flex-col items-center justify-center text-white relative cursor-pointer hover:brightness-95 transition-all py-1 px-4 ${clipClass} ${
                isActive ? "ring-2 ring-indigo-500 ring-offset-2 scale-[0.98] font-bold" : "opacity-90"
              }`}
            >
              <span className="text-sm font-black leading-none drop-shadow">{stage.count}</span>
              <span className="text-[10px] font-semibold tracking-wide uppercase drop-shadow truncate max-w-full mt-0.5">{stage.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Saved View Banner */}
      {savedViewFilter && (
        <div className="bg-indigo-50 border-b border-indigo-150 py-2.5 px-4 flex items-center justify-between text-xs text-indigo-900 font-medium select-none">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span>
              {locale === "pt" ? "Filtrado por Visualização Salva: " : "Filtered by Saved View: "} <strong>{
                savedViewFilter === "waiting_on_us" ? (locale === "pt" ? "Pendente Equipe (We)" : "Team Pending") :
                savedViewFilter === "waiting_on_them" ? (locale === "pt" ? "Aguardando Retorno" : "Awaiting Reply") :
                savedViewFilter === "no_reply_3_days" ? (locale === "pt" ? "Sem Resposta +3 Dias" : "No Reply 3+ Days") :
                savedViewFilter === "recently_opened" ? (locale === "pt" ? "Recém Abertos (Opened)" : "Recently Opened") :
                savedViewFilter
              }</strong>
            </span>
          </div>
          <button
            onClick={onClearSavedViewFilter}
            className="text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider text-[10px] bg-white border border-indigo-200 py-1 px-2.5 rounded-md hover:bg-indigo-100/50 transition-all cursor-pointer"
          >
            {locale === "pt" ? "Limpar Filtro" : "Clear Filter"}
          </button>
        </div>
      )}

      {/* 2. Operations Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col gap-3 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder={type === "batches" ? (locale === "pt" ? "Pesquisar por universidade, nome, observações..." : "Search by university, student org, name, notes...") : (locale === "pt" ? "Pesquisar por e-mail, notas..." : "Search by email, notes...")}
              value={searchTerm}
              onChange={(e) => {
                const val = e.target.value;
                setSearchTerm(val);
                if (onGlobalSearchChange) {
                  onGlobalSearchChange(val);
                }
              }}
              className="w-full bg-[#f1f3f4]/70 border border-transparent rounded-full py-2 pl-10 pr-4 text-xs text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
              id="search-input"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{locale === "pt" ? `Exibindo ${filteredData.length} registros` : `Showing ${filteredData.length} records`}</span>
              {selectedRowIndexes.length > 0 && (
                <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                  {selectedRowIndexes.length} {locale === "pt" ? "selecionados" : "selected"}
                </span>
              )}
            </div>

          </div>
        </div>

        {/* Clear filter indicator if filter is active */}
        {statusFilter !== "All" && (
          <div className="flex items-center gap-2 self-start bg-indigo-50 text-indigo-700 rounded px-2 py-0.5 text-[10px] font-bold">
            <span>{locale === "pt" ? `Filtro Ativo: ${statusFilter}` : `Active Filter: ${statusFilter}`}</span>
            <button onClick={() => setStatusFilter("All")} className="hover:text-indigo-900 cursor-pointer">
              ✕ {locale === "pt" ? "Limpar" : "Clear"}
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Split Grid (Table and Sidebar Details) */}
      <div className="flex-1 flex overflow-hidden relative bg-white">
        {/* Table View */}
        <div className="flex-1 overflow-auto">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3 border border-gray-100">
                <Info className="w-5 h-5 text-indigo-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">{locale === "pt" ? "Nenhum lead encontrado" : "No leads found"}</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {locale === "pt" 
                  ? "Não há contatos neste estágio ou que correspondam à sua pesquisa. Toque nos chevrons coloridos acima para mudar o filtro ou adicione leads."
                  : "There are no contacts in this stage or matching your search. Click on the colored chevrons above to change filters or add leads."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500 font-bold uppercase tracking-wider select-none">
                  {type === "batches" && (
                    <th className="py-2.5 px-4 w-10 text-center border-r border-gray-200">
                      <input
                        type="checkbox"
                        checked={filteredData.length > 0 && filteredData.every((item) => selectedRowIndexes.includes(item.rowIndex))}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        id="select-all-checkbox"
                      />
                    </th>
                  )}
                  <th className="py-2.5 px-3 w-12 text-center border-r border-gray-200">{locale === "pt" ? "Linha" : "Row"}</th>
                  {type === "batches" ? (
                    <>
                      <th className="py-2.5 px-4 border-r border-gray-200">{locale === "pt" ? "Universidade" : "University"}</th>
                      <th className="py-2.5 px-4 border-r border-gray-200">{locale === "pt" ? "Organização Estudantil" : "Student Organization"}</th>
                      <th className="py-2.5 px-4 border-r border-gray-200">{locale === "pt" ? "Nome do Aluno" : "Student Name"}</th>
                      <th className="py-2.5 px-4 w-36 border-r border-gray-200">{locale === "pt" ? "Status Pipeline" : "Pipeline Status"}</th>
                      <th className="py-2.5 px-4 w-32 border-r border-gray-200">{locale === "pt" ? "Data do Envio" : "Date Sent"}</th>
                      <th className="py-2.5 px-4 w-28 border-r border-gray-200">{locale === "pt" ? "Notif. Envio" : "Sent Alert"}</th>
                      <th className="py-2.5 px-4 w-28 border-r border-gray-200">{locale === "pt" ? "Abertura" : "Open Alert"}</th>
                      <th className="py-2.5 px-4 w-28 border-r border-gray-200">{locale === "pt" ? "Notif. Retorno" : "Reply Alert"}</th>
                      <th className="py-2.5 px-4 w-28">{locale === "pt" ? "Confirmação Reunião" : "Meeting Confirmation"}</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2.5 px-4 border-r border-gray-200">{locale === "pt" ? "Nome do Lead" : "Lead Name"}</th>
                      <th className="py-2.5 px-4 border-r border-gray-200">{locale === "pt" ? "E-mail de Contato" : "Contact Email"}</th>
                      <th className="py-2.5 px-4 border-r border-gray-200">{locale === "pt" ? "Horários Sugeridos" : "Suggested Times"}</th>
                      <th className="py-2.5 px-4 border-r border-gray-200">{locale === "pt" ? "Horário Confirmado" : "Confirmed Time"}</th>
                      <th className="py-2.5 px-4 w-36 border-r border-gray-200">{locale === "pt" ? "Status" : "Status"}</th>
                      <th className="py-2.5 px-4 w-28 border-r border-gray-200">{locale === "pt" ? "Notif. Envio" : "Sent Alert"}</th>
                      <th className="py-2.5 px-4 w-28 border-r border-gray-200">{locale === "pt" ? "Abertura" : "Open Alert"}</th>
                      <th className="py-2.5 px-4 w-28 border-r border-gray-200">{locale === "pt" ? "Notif. Retorno" : "Reply Alert"}</th>
                      <th className="py-2.5 px-4 w-28">{locale === "pt" ? "Confirmação Reunião" : "Meeting Confirmation"}</th>
                    </>
                  )}
                  <th className="py-2.5 px-4 w-14 text-center border-l border-gray-200">{locale === "pt" ? "Ver" : "View"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((item) => {
                  const isSelected = selectedRowIndexes.includes(item.rowIndex);
                  const isDrawerOpen = selectedRow?.rowIndex === item.rowIndex;

                  return (
                    <tr
                      key={item.rowIndex}
                      onClick={() => handleOpenRowDetail(item)}
                      className={`group hover:bg-indigo-50/20 cursor-pointer transition-colors text-xs text-gray-700 ${
                        isDrawerOpen ? "bg-indigo-50/40 font-medium" : ""
                      }`}
                    >
                      {type === "batches" && (
                        <td className="py-2 px-4 w-10 text-center border-r border-gray-100" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(item.rowIndex, e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            id={`row-checkbox-${item.rowIndex}`}
                          />
                        </td>
                      )}
                      <td className="py-2 px-3 w-12 text-center font-mono text-[10px] text-gray-400 border-r border-gray-100 bg-gray-50/20">
                        #{item.rowIndex}
                      </td>

                      {type === "batches" ? (
                        <>
                          <td className="py-2 px-4 font-semibold text-gray-900 border-r border-gray-100 truncate max-w-[150px]">
                            {(item as BatchContact).university}
                          </td>
                          <td className="py-2 px-4 text-gray-600 border-r border-gray-100 truncate max-w-[150px]">
                            {(item as BatchContact).studentOrganization}
                          </td>
                          <td className="py-2 px-4 font-medium text-gray-800 border-r border-gray-100">
                            {(item as BatchContact).name}
                          </td>
                          <td className="py-2 px-4 border-r border-gray-100">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border shadow-sm ${getStatusBadgeClass(item.status)}`}>
                              {item.status || "Sem Status"}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-gray-500 font-mono text-[10px] border-r border-gray-100">
                            {(item as BatchContact).emailSent || "—"}
                          </td>
                          <td className="py-2 px-4 border-r border-gray-100 text-center">
                            {renderEmailSentAlert(item as BatchContact)}
                          </td>
                          <td className="py-2 px-4 border-r border-gray-100 text-center">
                            {renderEmailOpenedAlert(item as BatchContact)}
                          </td>
                          <td className="py-2 px-4 border-r border-gray-100 text-center">
                            {renderEmailReceivedAlert(item as BatchContact)}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {renderMeetingConfirmationBadge(item as BatchContact)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-4 font-medium text-gray-800 border-r border-gray-100">
                            {(item as MeetingRow).name || "—"}
                          </td>
                          <td className="py-2 px-4 font-semibold text-gray-900 border-r border-gray-100">
                            {(item as MeetingRow).email}
                          </td>
                          <td className="py-2 px-4 text-gray-600 border-r border-gray-100 truncate max-w-[180px]" title={(item as MeetingRow).suggestedTimes}>
                            {(item as MeetingRow).suggestedTimes || "—"}
                          </td>
                          <td className="py-2 px-4 text-indigo-700 font-semibold border-r border-gray-100 flex items-center gap-1">
                            {(item as MeetingRow).bookedTime ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="font-mono text-[11px]">{(item as MeetingRow).bookedTime}</span>
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-2 px-4 border-r border-gray-100">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border shadow-sm ${getStatusBadgeClass(item.status)}`}>
                              {item.status || "Sem Status"}
                            </span>
                          </td>
                          <td className="py-2 px-4 border-r border-gray-100 text-center">
                            {renderEmailSentAlert(item as MeetingRow)}
                          </td>
                          <td className="py-2 px-4 border-r border-gray-100 text-center">
                            {renderEmailOpenedAlert(item as MeetingRow)}
                          </td>
                          <td className="py-2 px-4 border-r border-gray-100 text-center">
                            {renderEmailReceivedAlert(item as MeetingRow)}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {renderMeetingConfirmationBadge(item as MeetingRow)}
                          </td>
                        </>
                      )}

                      <td className="py-2 px-4 text-center border-l border-gray-100 bg-gray-50/10" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenRowDetail(item)}
                          className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                          title="Ver Detalhes"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Details Drawer */}
        <AnimatePresence>
          {selectedRow && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute md:relative top-0 right-0 w-full md:w-[360px] h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col z-20 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {locale === "pt" ? "Linha" : "Row"} #{selectedRow.rowIndex}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 truncate max-w-[180px]">
                    {type === "batches" 
                      ? (selectedRow as BatchContact).name || (locale === "pt" ? "Visualizar Contato" : "View Contact")
                      : (selectedRow as MeetingRow).email || (locale === "pt" ? "Detalhes da Reunião" : "Meeting Details")
                    }
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedRow(null)}
                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors cursor-pointer"
                    title={locale === "pt" ? "Fechar" : "Close"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {/* Duplicity Alert Warning */}
                {hasDuplicity && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs flex items-start gap-2.5 animate-pulse select-none">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <span className="font-bold">{locale === "pt" ? "Alerta de Duplicidade:" : "Duplicity Alert:"}</span>
                      <p className="text-[10px] mt-0.5 leading-relaxed text-amber-700">
                        {locale === "pt"
                          ? `Este ${type === "batches" ? "lead" : "e-mail"} já possui outros registros na sua planilha! Evite contatos em duplicidade para manter seu CRM limpo.`
                          : `This ${type === "batches" ? "lead" : "email"} already has other entries in your spreadsheet! Avoid duplicates to keep your CRM clean.`
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Contact Context Card */}
                <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-4 text-xs flex flex-col gap-3">
                  <h4 className="font-bold text-indigo-900 flex items-center gap-1.5 text-[10px] uppercase tracking-wider mb-0.5">
                    <Info className="w-3.5 h-3.5 text-indigo-500" />
                    {locale === "pt" ? "Editar Informações do Lead" : "Edit Lead Information"}
                  </h4>
                  {type === "batches" ? (
                    <>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500 font-bold text-[10px]">{locale === "pt" ? "Universidade:" : "University:"}</span>
                        <input
                          type="text"
                          value={editedUniversity}
                          onChange={(e) => setEditedUniversity(e.target.value)}
                          className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                          id="edit-lead-university"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500 font-bold text-[10px]">{locale === "pt" ? "Organização Estudantil:" : "Student Org:"}</span>
                        <input
                          type="text"
                          value={editedStudentOrg}
                          onChange={(e) => setEditedStudentOrg(e.target.value)}
                          className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                          id="edit-lead-student-org"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500 font-bold text-[10px]">{locale === "pt" ? "Nome:" : "Name:"}</span>
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                          id="edit-lead-name"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500 font-bold text-[10px]">{locale === "pt" ? "Contato (E-mail):" : "Contact (Email):"}</span>
                        <input
                          type="text"
                          value={editedEmail}
                          onChange={(e) => setEditedEmail(e.target.value)}
                          className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900 focus:outline-none focus:border-indigo-500 transition-all font-medium font-mono"
                          placeholder={locale === "pt" ? "ex: estudante@universidade.edu" : "e.g. student@university.edu"}
                          id="edit-lead-email"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500 font-bold text-[10px]">{locale === "pt" ? "Data do Envio:" : "Date Sent:"}</span>
                        <input
                          type="text"
                          value={editedEmailSent}
                          onChange={(e) => setEditedEmailSent(e.target.value)}
                          className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900 focus:outline-none focus:border-indigo-500 transition-all font-medium font-mono"
                          placeholder={locale === "pt" ? "ex: DD/MM/AAAA" : "e.g. MM/DD/YYYY"}
                          id="edit-lead-emailsent"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500 font-bold text-[10px]">{locale === "pt" ? "E-mail de Contato:" : "Contact Email:"}</span>
                        <input
                          type="email"
                          value={editedEmail}
                          onChange={(e) => setEditedEmail(e.target.value)}
                          className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                          id="edit-lead-email"
                        />
                      </div>
                      <div>
                        <span className="text-gray-500 font-bold text-[10px]">{locale === "pt" ? "Horários Sugeridos:" : "Suggested Times:"}</span>
                        <p className="font-medium text-gray-700 bg-white px-2.5 py-2 border border-gray-200 rounded mt-1 whitespace-pre-wrap font-mono text-[10px]">
                          {(selectedRow as MeetingRow).suggestedTimes || (locale === "pt" ? "Nenhum horário sugerido" : "No suggested times")}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-bold text-[10px]">{locale === "pt" ? "Data Confirmada no Calendário:" : "Confirmed Date on Calendar:"}</span>
                        {editedBooked ? (
                          <p className="font-mono text-[10px] text-purple-700 font-bold bg-purple-50 px-2.5 py-1.5 border border-purple-200 rounded mt-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {editedBooked}
                          </p>
                        ) : (
                          <p className="text-gray-400 italic mt-1 text-[11px]">{locale === "pt" ? "Nenhuma data confirmada" : "No confirmed date"}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Status Editor Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                    {locale === "pt" ? "Status do Pipeline:" : "Pipeline Status:"}
                  </label>
                  <select
                    value={editedStatus}
                    onChange={(e) => setEditedStatus(e.target.value)}
                    className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                    id="status-select-editor"
                  >
                    <option value="">{locale === "pt" ? "Sem Status" : "No Status"}</option>
                    {type === "batches" ? (
                      <>
                        <option value="Lead">{locale === "pt" ? "Conduzir (Lead)" : "Lead"}</option>
                        <option value="waiting on them">{locale === "pt" ? "Contactado (waiting on them)" : "Contacted"}</option>
                        <option value="Replied - waiting">{locale === "pt" ? "Inclinado (Replied)" : "Interested"}</option>
                        <option value="Opened">{locale === "pt" ? "Demonstração (Opened)" : "Opened"}</option>
                        <option value="Email bounced">{locale === "pt" ? "Perdido/Bounce (Email bounced)" : "Lost/Bounced"}</option>
                        <option value="nurture">{locale === "pt" ? "Nutrir (nurture)" : "Nurture"}</option>
                      </>
                    ) : (
                      <>
                        <option value="New">{locale === "pt" ? "Novos Convites (New)" : "New Invites"}</option>
                        <option value="waiting on them">{locale === "pt" ? "Horário Sugerido (waiting on them)" : "Suggested Time"}</option>
                        <option value="Scheduled">{locale === "pt" ? "Agendado (Scheduled)" : "Scheduled"}</option>
                        <option value="Completed">{locale === "pt" ? "Realizada (Completed)" : "Completed"}</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Meeting Section — now native to the Lead record */}
                <div className="border border-gray-200 rounded-2xl p-3.5 flex flex-col gap-2.5 bg-gray-50/60">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    {locale === "pt" ? "Reunião" : "Meeting"}
                  </span>

                  {type === "batches" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
                        {locale === "pt" ? "Status da Reunião:" : "Meeting Status:"}
                      </label>
                      <select
                        value={editedStatusMeetings}
                        onChange={(e) => setEditedStatusMeetings(e.target.value)}
                        className="w-full text-xs font-medium bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                        id="status-meetings-select-editor"
                      >
                        <option value="">{locale === "pt" ? "Sem Reunião" : "No Meeting"}</option>
                        <option value="New">{locale === "pt" ? "Novos Convites (New)" : "New Invites"}</option>
                        <option value="waiting on them">{locale === "pt" ? "Horário Sugerido (waiting on them)" : "Suggested Time"}</option>
                        <option value="Scheduled">{locale === "pt" ? "Agendado (Scheduled)" : "Scheduled"}</option>
                        <option value="Completed">{locale === "pt" ? "Realizada (Completed)" : "Completed"}</option>
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      {locale === "pt" ? "Horários Sugeridos:" : "Suggested Times:"}
                    </label>
                    <textarea
                      value={editedTimes}
                      onChange={(e) => setEditedTimes(e.target.value)}
                      placeholder={locale === "pt" ? "Ex: Seg 10:00, Ter 14:00" : "Ex: Mon 10:00 AM, Tue 2:00 PM"}
                      className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                      rows={2}
                      id="suggested-times-editor"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                      {locale === "pt" ? "Horário Confirmado (Manual/Calendar):" : "Confirmed Time (Manual/Calendar):"}
                    </label>
                    <input
                      type="text"
                      value={editedBooked}
                      onChange={(e) => setEditedBooked(e.target.value)}
                      placeholder="Ex: 16/07/2026 14:00"
                      className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                      id="booked-time-editor"
                    />
                  </div>

                  {type === "batches" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        {locale === "pt" ? "Notas da Reunião:" : "Meeting Notes:"}
                      </label>
                      <textarea
                        value={editedNotesMeetings}
                        onChange={(e) => setEditedNotesMeetings(e.target.value)}
                        placeholder={locale === "pt" ? "Notas específicas sobre a reunião..." : "Meeting-specific notes..."}
                        className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        rows={2}
                        id="notes-meetings-editor"
                      />
                    </div>
                  )}
                </div>

                {/* Notes Text Area Editor */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <label className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      {locale === "pt" ? "Notas de Prospecção (Notes):" : "Prospecting Notes:"}
                    </label>
                    {selectedRow && hasPendingReplyAlert(selectedRow) && (
                      <button
                        onClick={() => handleMarkReplyAsRead(selectedRow)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-emerald-50 text-amber-700 hover:text-emerald-700 border border-amber-200 hover:border-emerald-200 text-[10px] font-bold transition-all cursor-pointer select-none"
                        title={locale === "pt" ? "Marcar notificação de retorno como lida" : "Mark reply notification as read"}
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        {locale === "pt" ? "Marcar retorno como lido" : "Mark reply as read"}
                      </button>
                    )}
                  </div>
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder={locale === "pt" ? "Adicione anotações sobre o contato, reuniões, respostas do Gmail..." : "Add notes about contact, meetings, Gmail replies..."}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                    rows={6}
                    id="notes-textarea-editor"
                  />
                </div>

                {/* Add Meeting - Google Calendar invite */}
                <div className="border border-dashed border-indigo-200 rounded-2xl p-3.5 flex flex-col gap-2.5 bg-indigo-50/10">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                      {locale === "pt" ? "Agendar Convite" : "Schedule Invite"}
                    </span>
                    {renderMeetingConfirmationBadge(selectedRow)}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {locale === "pt"
                      ? "Crie um evento no Google Calendar e envie o convite automaticamente por e-mail para este lead."
                      : "Create a Google Calendar event and automatically email the invite to this lead."}
                  </p>

                  {(selectedRow as BatchContact | MeetingRow).meetingDateTime && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {locale === "pt" ? "Agendada para: " : "Scheduled for: "}
                        {(selectedRow as BatchContact | MeetingRow).meetingDateTime}
                      </span>
                    </div>
                  )}

                  {!showMeetingForm ? (
                    <button
                      onClick={handleOpenMeetingForm}
                      className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-[10px] font-bold py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer select-none"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-indigo-500" />
                      {locale === "pt" ? "Adicionar Reunião" : "Add Meeting"}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                        {locale === "pt" ? "Agendando para: " : "Scheduling for: "}
                        <span className="text-indigo-700">
                          {type === "batches" ? (selectedRow as BatchContact).name || "" : ""}
                          {" "}({type === "batches" ? (selectedRow as BatchContact).email : (selectedRow as MeetingRow).email})
                        </span>
                      </div>

                      <label className="text-[10px] font-bold text-gray-500">
                        {locale === "pt" ? "Horários Disponíveis (Google Calendar):" : "Available Slots (Google Calendar):"}
                      </label>

                      {isLoadingSlots ? (
                        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 py-3">
                          <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                          {locale === "pt" ? "Buscando horários..." : "Fetching available slots..."}
                        </div>
                      ) : slotsError ? (
                        <p className="text-[10px] text-red-500">
                          {locale === "pt"
                            ? "Não foi possível buscar os horários do Google Calendar."
                            : "Could not fetch slots from Google Calendar."}
                        </p>
                      ) : freeSlots.length === 0 ? (
                        <p className="text-[10px] text-gray-400 italic">
                          {locale === "pt" ? "Nenhum horário livre encontrado." : "No free slots found."}
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                          {freeSlots.map((slot) => (
                            <button
                              key={slot.start}
                              onClick={() => setMeetingDateTime(slot.start.slice(0, 16))}
                              className={`text-[10px] font-bold py-1.5 px-2 rounded-lg border transition-all cursor-pointer select-none ${
                                meetingDateTime === slot.start.slice(0, 16)
                                  ? "bg-indigo-600 text-white border-indigo-600"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                              }`}
                            >
                              {new Date(slot.start).toLocaleString(locale === "pt" ? "pt-BR" : "en-US", {
                                weekday: "short",
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={handleCreateMeeting}
                          disabled={isCreatingMeeting || !meetingDateTime}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer select-none disabled:opacity-50"
                        >
                          {isCreatingMeeting ? (
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <CalendarPlus className="w-3.5 h-3.5" />
                          )}
                          {locale === "pt" ? "Enviar Convite" : "Send Invite"}
                        </button>
                        <button
                          onClick={() => {
                            setShowMeetingForm(false);
                            setMeetingDateTime("");
                            setFreeSlots([]);
                          }}
                          disabled={isCreatingMeeting}
                          className="flex-1 bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 text-[10px] font-bold py-2 px-2.5 rounded-lg transition-all cursor-pointer select-none disabled:opacity-50"
                        >
                          {locale === "pt" ? "Cancelar" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  )}

                  {meetingCreated && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{locale === "pt" ? "Convite enviado com sucesso!" : "Invite sent successfully!"}</span>
                    </motion.div>
                  )}
                </div>

              </div>

              {/* Drawer Footer Buttons */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col gap-2">
                <button
                  onClick={handleSaveDetails}
                  disabled={isSaving}
                  className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all text-xs cursor-pointer disabled:opacity-50"
                  id="save-details-btn"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{locale === "pt" ? "Gravar no Google Sheets" : "Save to Google Sheets"}</span>
                </button>

                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 justify-center text-emerald-600 text-[11px] font-bold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{locale === "pt" ? "Planilha atualizada com sucesso!" : "Spreadsheet updated successfully!"}</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
