import React, { useState } from "react";
import { 
  UserPlus, 
  Search, 
  X, 
  Trash2, 
  Plus, 
  Mail, 
  Building,
  GraduationCap,
  ExternalLink
} from "lucide-react";
import { BatchContact } from "../types";
import { useI18n } from "../lib/i18n";

interface GoogleContactsSidebarProps {
  contactsData: BatchContact[];
  onClose: () => void;
  onOpenContactDetail?: (rowIndex: number) => void;
}

export default function GoogleContactsSidebar({ contactsData, onClose, onOpenContactDetail }: GoogleContactsSidebarProps) {
  const { locale } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Local state for manually added contacts
  const [localContacts, setLocalContacts] = useState<BatchContact[]>([]);
  const [newContact, setNewContact] = useState({
    name: "",
    university: "",
    studentOrganization: "",
    status: "Lead",
    emailSent: "",
    notes: ""
  });

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim()) return;

    const contact: BatchContact = {
      rowIndex: 999 + localContacts.length,
      university: newContact.university || (locale === "pt" ? "Universidade Não Especificada" : "Unspecified University"),
      studentOrganization: newContact.studentOrganization || (locale === "pt" ? "Organização Estudantil" : "Student Organization"),
      name: newContact.name,
      status: "Lead",
      email: newContact.emailSent || "",
      emailSent: "",
      notes: newContact.notes || ""
    };

    setLocalContacts([contact, ...localContacts]);
    setNewContact({ name: "", university: "", studentOrganization: "", status: "Lead", emailSent: "", notes: "" });
    setShowAddForm(false);
  };

  const handleDeleteLocalContact = (index: number) => {
    setLocalContacts(localContacts.filter((_, i) => i !== index));
  };

  // Combine sheets data and manual contacts
  const allContacts = [...localContacts, ...contactsData];

  // Filter contacts by search
  const filteredContacts = allContacts.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(term) ||
      (c.university || "").toLowerCase().includes(term) ||
      (c.studentOrganization || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="w-full h-full bg-white flex flex-col font-sans" id="google-contacts-drawer">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between bg-white">
        <h3 className="text-base font-medium text-gray-800">{locale === "pt" ? "Contatos" : "Contacts"}</h3>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          title={locale === "pt" ? "Fechar" : "Close"}
          id="close-contacts-btn"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Top Search Bar */}
      <div className="p-3 border-b border-gray-50 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={locale === "pt" ? "Pesquisar contatos..." : "Search contacts..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-lg py-1.5 pl-9 pr-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`p-1.5 rounded-lg border transition-all ${
            showAddForm 
              ? "bg-blue-50 text-blue-600 border-blue-200" 
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
          title={locale === "pt" ? "Criar novo contato" : "Create new contact"}
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto">
        {showAddForm ? (
          <form onSubmit={handleCreateContact} className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{locale === "pt" ? "Novo Contato" : "New Contact"}</h4>
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-400">{locale === "pt" ? "Nome:" : "Name:"}</label>
              <input
                type="text"
                required
                placeholder={locale === "pt" ? "Ex: João Silva" : "e.g. John Doe"}
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-400">{locale === "pt" ? "Universidade:" : "University:"}</label>
              <input
                type="text"
                placeholder={locale === "pt" ? "Ex: USP" : "e.g. Stanford"}
                value={newContact.university}
                onChange={(e) => setNewContact({ ...newContact, university: e.target.value })}
                className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-400">{locale === "pt" ? "Organização:" : "Organization:"}</label>
              <input
                type="text"
                placeholder={locale === "pt" ? "Ex: Atletica Poli" : "e.g. Student Senate"}
                value={newContact.studentOrganization}
                onChange={(e) => setNewContact({ ...newContact, studentOrganization: e.target.value })}
                className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-400">{locale === "pt" ? "E-mail de Contato:" : "Contact Email:"}</label>
              <input
                type="email"
                placeholder={locale === "pt" ? "Ex: joao@poli.usp.br" : "e.g. john@stanford.edu"}
                value={newContact.emailSent}
                onChange={(e) => setNewContact({ ...newContact, emailSent: e.target.value })}
                className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 justify-end mt-1 text-xs">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 rounded"
              >
                {locale === "pt" ? "Cancelar" : "Cancel"}
              </button>
              <button 
                type="submit" 
                className="px-3.5 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
              >
                {locale === "pt" ? "Salvar Contato" : "Save Contact"}
              </button>
            </div>
          </form>
        ) : null}

        {filteredContacts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-24 h-24 rounded-full bg-blue-50/50 flex items-center justify-center text-blue-400 mb-4">
              <svg viewBox="0 0 24 24" className="w-14 h-14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 12c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-800">{locale === "pt" ? "Nenhum contato ainda" : "No contacts yet"}</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px] leading-relaxed">
              {locale === "pt" 
                ? "Os contatos e leads da sua planilha 'Base de Automação DW' serão listados automaticamente aqui."
                : "Contacts and leads from your 'Base de Automação DW' spreadsheet will be listed automatically here."}
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded-full shadow-sm transition-colors"
              id="create-contact-empty-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{locale === "pt" ? "Criar contato" : "Create contact"}</span>
            </button>
          </div>
        ) : (
          <div className="py-2 divide-y divide-gray-50">
            {filteredContacts.map((contact, idx) => {
              const hasDetail = contact.rowIndex && contact.rowIndex < 999;
              return (
                <div 
                  key={`${contact.name}-${idx}`} 
                  className={`p-3.5 flex items-start gap-3 transition-colors group ${
                    hasDetail && onOpenContactDetail ? "hover:bg-blue-50/50 cursor-pointer" : "hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    if (hasDetail && onOpenContactDetail) {
                      onOpenContactDetail(contact.rowIndex);
                    }
                  }}
                >
                  {/* Contact Avatar Circle */}
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs select-none shrink-0 relative">
                    {contact.name ? contact.name.charAt(0).toUpperCase() : "U"}
                    {hasDetail && onOpenContactDetail && (
                      <span className="absolute -bottom-1 -right-1 bg-white border border-gray-150 rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-2 h-2 text-blue-600" />
                      </span>
                    )}
                  </div>
                  
                  {/* Contact details info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors flex items-center gap-1">
                      <span className="truncate">{contact.name || (locale === "pt" ? "Sem Nome" : "Unnamed")}</span>
                    </p>
                    
                    <div className="flex flex-col gap-0.5 mt-1">
                      <p className="text-[10px] text-gray-500 flex items-center gap-1 truncate">
                        <GraduationCap className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate">{contact.university || (locale === "pt" ? "Universidade Não Encontrada" : "University Not Specified")}</span>
                      </p>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1 truncate">
                        <Building className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate">{contact.studentOrganization || (locale === "pt" ? "Organização Estudantil" : "Student Organization")}</span>
                      </p>
                      {contact.emailSent && contact.emailSent.includes("@") && (
                        <p className="text-[10px] text-blue-600 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="truncate font-mono">{contact.emailSent}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Local deletion option */}
                  {idx < localContacts.length && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLocalContact(idx);
                      }}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 shrink-0 self-center"
                      title={locale === "pt" ? "Excluir contato" : "Delete contact"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
