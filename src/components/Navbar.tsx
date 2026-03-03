import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Globe } from "lucide-react";
import naityLogo from "@/assets/naity-logo.png";
import { useI18n } from "@/lib/i18n";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { t, lang, setLang } = useI18n();

  const navLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/hotels", label: t("nav.hotels") },
    { to: "/how-it-works", label: t("nav.howItWorks") },
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border/50">
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
                location.pathname === link.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ms-2"
          >
            <Globe className="w-4 h-4" />
            {lang === "ar" ? "EN" : "عربي"}
          </button>
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
        <div className="md:hidden border-t border-border bg-card animate-fade-in">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
