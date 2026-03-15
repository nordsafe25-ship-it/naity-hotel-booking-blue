import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Globe, LogIn, LayoutDashboard, Ticket } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import naityLogo from "@/assets/naity-logo.png";
import { useI18n } from "@/lib/i18n";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { t, lang, setLang } = useI18n();
  const { user, role } = useAuth();

  const navLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/hotels", label: t("nav.hotels") },
    { to: "/how-it-works", label: t("nav.howItWorks") },
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
    { to: "/join", label: lang === "ar" ? "🏠 أضف عقارك" : "🏠 List Property", highlight: true },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={naityLogo} alt="Naity" className="h-10 w-auto" />
          <span className="text-xl font-bold text-accent">Naity</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                (link as any).highlight
                  ? "text-primary font-semibold"
                  : location.pathname === link.to
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {/* My Bookings */}
          <Link
            to="/my-bookings"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold border transition-colors ms-1 ${
              location.pathname === "/my-bookings"
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
            }`}
          >
            <Ticket className="w-4 h-4" />
            {t("nav.myBookings")}
          </Link>
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ms-2"
          >
            <Globe className="w-4 h-4" />
            {lang === "ar" ? "EN" : "عربي"}
          </button>
          {user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium gradient-cta text-primary-foreground ms-1"
            >
              <LayoutDashboard className="w-4 h-4" />
              {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium gradient-cta text-primary-foreground ms-1"
            >
              <LogIn className="w-4 h-4" />
              {lang === "ar" ? "تسجيل الدخول" : "Login"}
            </Link>
          )}
        </div>

        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="p-2 rounded-lg hover:bg-muted text-sm font-medium text-muted-foreground"
          >
            {lang === "ar" ? "EN" : "عربي"}
          </button>
          <button
            className="p-2 rounded-lg hover:bg-muted"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-card animate-fade-in overflow-hidden">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1 overflow-x-hidden">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors text-right w-full ${
                  location.pathname === link.to
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/my-bookings" onClick={() => setOpen(false)}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary/5 border border-primary/20 text-primary flex items-center gap-2">
              <Ticket className="w-4 h-4" /> {t("nav.myBookings")}
            </Link>
            {user ? (
              <Link to="/dashboard" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium gradient-cta text-primary-foreground flex items-center gap-2 mt-1">
                <LayoutDashboard className="w-4 h-4" /> {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
              </Link>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium gradient-cta text-primary-foreground flex items-center gap-2 mt-1">
                <LogIn className="w-4 h-4" /> {lang === "ar" ? "تسجيل الدخول" : "Login"}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
