import React from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  PlusCircle,
  Wallet,
  Users,
  User,
  ArrowLeftRight,
  PieChart,
  Sparkles
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import SmsListener from "./SmsListener";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <div 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className={["flex flex-col h-screen max-w-md mx-auto bg-navy relative border-x border-navy-light shadow-2xl overflow-hidden", language === 'ar' ? 'font-arabic' : 'font-sans'].join(' ')}
    >
      <SmsListener />
      {/* Top Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-navy-light/50 bg-navy z-10">
        <div className="flex items-center gap-3">
          <button onClick={toggleLanguage} className="bg-navy-light border border-slate-700 w-10 h-10 rounded-full flex items-center justify-center text-teal hover:bg-slate-800 transition">
            <span className="font-bold text-sm">{language === 'ar' ? 'EN' : 'ع'}</span>
          </button>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal to-blue-400 bg-clip-text text-transparent">
              WalletMind
            </h1>
            <p className="text-xs text-slate-400 pl-1 rtl:pr-1">{language === 'ar' ? 'الإدارة المالية' : 'Personal Finance'}</p>
          </div>
        </div>
        <button onClick={() => navigate('/assistant')} className={['relative group flex items-center justify-center overflow-hidden transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] rounded-full px-4 py-2 gap-2', location.pathname === '/assistant' ? 'scale-105' : 'hover:scale-105'].join(' ')}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 opacity-80" />
          <div className="relative bg-navy rounded-full m-[2px] p-2 flex items-center justify-center overflow-hidden gap-2 px-3">
             <div className="absolute inset-0 bg-purple-500/10" />
             <Sparkles size={18} className="text-fuchsia-400 animate-pulse" />
             <span className="text-xs font-bold bg-gradient-to-r from-fuchsia-300 to-fuchsia-100 bg-clip-text text-transparent">
                {language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
             </span>
          </div>
        </button>
      </header>

      {/* Main SCrollable Content */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 bg-navy-dark/95 backdrop-blur-md border-t border-navy-light px-6 py-2 pb-6 flex items-center justify-between z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
        <NavItem
          to="/"
          icon={<Home />}
          label={t('home')}
          active={location.pathname === "/"}
        />
        <NavItem
          to="/wallets"
          icon={<Wallet />}
          label={t('wallets')}
          active={location.pathname === "/wallets"}
        />

        {/* Floating Action Button */}
        <div className="relative -top-6">
          <NavLink
            to="/add"
            className="flex flex-col items-center justify-center w-14 h-14 bg-teal rounded-full text-navy-dark shadow-[0_0_20px_rgba(0,201,167,0.4)] hover:scale-105 transition-transform z-50"
          >
            <PlusCircle size={28} />
          </NavLink>
        </div>

        <NavItem
          to="/stats"
          icon={<PieChart />}
          label={t('stats')}
          active={location.pathname === "/stats"}
        />
        <NavItem
          to="/profile"
          icon={<User />}
          label={t('profile')}
          active={location.pathname === "/profile"}
        />
      </nav>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        navigate(to);
        if (to === "/profile") {
          window.dispatchEvent(new Event("reset-profile-view"));
        }
      }}
      className={[
        "flex flex-col items-center justify-center w-12 gap-1 outline-none cursor-pointer",
        active ? "text-teal" : "text-slate-500",
      ].join(" ")}
    >
      <div
        className={
          active ? "scale-110 transition-transform" : "transition-transform"
        }
      >
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
