import React from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import { User } from "firebase/auth";
import { useI18n } from "../lib/i18n";

interface AuthButtonProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoading: boolean;
}

export default function AuthButton({ user, onLogin, onLogout, isLoading }: AuthButtonProps) {
  const { t } = useI18n();

  if (user) {
    return (
      <div className="flex items-center gap-3 bg-[#FDFDFB] border border-[#D9D7D0] rounded-none px-4 py-2">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "User"}
            className="w-7 h-7 rounded-full border border-[#D9D7D0]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#E6E4DD] text-[#1A1A1A] flex items-center justify-center border border-[#D9D7D0]">
            <UserIcon className="w-4 h-4" />
          </div>
        )}
        <div className="text-left hidden md:block">
          <p className="text-xs font-bold text-[#1A1A1A] leading-none uppercase tracking-wide">
            {user.displayName || "User"}
          </p>
          <p className="text-[10px] text-[#4A4945] font-mono mt-1 truncate max-w-[150px]">
            {user.email}
          </p>
        </div>
        <button
          onClick={onLogout}
          title={t("logout")}
          className="text-[#4A4945] hover:text-red-700 transition-colors p-1.5 hover:bg-[#F3F2EE] rounded-none ml-1 cursor-pointer"
          id="logout-btn"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onLogin}
      disabled={isLoading}
      className="inline-flex items-center gap-3 bg-[#1A1A1A] hover:bg-[#FF5A1F] text-[#F3F2EE] font-mono uppercase tracking-widest py-2.5 px-5 border border-[#1A1A1A] rounded-none transition-colors text-xs cursor-pointer disabled:opacity-50"
      id="gsi-login-btn"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          <path fill="none" d="M0 0h48v48H0z"></path>
        </svg>
      )}
      <span>{t("welcomeButton")}</span>
    </button>
  );
}
