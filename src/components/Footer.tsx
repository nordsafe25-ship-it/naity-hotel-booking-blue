import { Link } from "react-router-dom";
import naityLogo from "@/assets/naity-logo.png";
import { useI18n } from "@/lib/i18n";

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="bg-accent text-accent-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src={naityLogo} alt="Naity" className="h-8 w-auto" />
              <span className="text-lg font-bold">Naity</span>
            </div>
            <p className="text-sm text-accent-foreground/70">{t("footer.desc")}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">{t("footer.explore")}</h4>
            <div className="flex flex-col gap-2 text-sm text-accent-foreground/70">
              <Link to="/hotels" className="hover:text-accent-foreground transition-colors">{t("nav.hotels")}</Link>
              <Link to="/how-it-works" className="hover:text-accent-foreground transition-colors">{t("nav.howItWorks")}</Link>
              <Link to="/about" className="hover:text-accent-foreground transition-colors">{t("nav.about")}</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">{t("footer.support")}</h4>
            <div className="flex flex-col gap-2 text-sm text-accent-foreground/70">
              <Link to="/contact" className="hover:text-accent-foreground transition-colors">{t("nav.contact")}</Link>
              <span>help@naity.com</span>
              <span dir="ltr">+1 800 NAITY</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">{t("footer.forHotels")}</h4>
            <p className="text-sm text-accent-foreground/70 mb-3">{t("footer.forHotelsDesc")}</p>
            <Link
              to="/contact"
              className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {t("footer.joinHajiz")}
            </Link>
          </div>
        </div>

        <div className="border-t border-accent-foreground/20 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-accent-foreground/50">© {new Date().getFullYear()} Naity. {t("footer.copyright")}</span>
          <div className="flex items-center gap-3">
            <a href="#" className="inline-flex items-center gap-1.5 bg-accent-foreground/10 hover:bg-accent-foreground/20 text-accent-foreground px-3 py-2 rounded-lg text-xs font-medium transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              App Store
            </a>
            <a href="#" className="inline-flex items-center gap-1.5 bg-accent-foreground/10 hover:bg-accent-foreground/20 text-accent-foreground px-3 py-2 rounded-lg text-xs font-medium transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M3.18 23.71c.46.27 1.03.3 1.52.1l12.13-6.97-3.04-3.04-10.61 9.91zM.53 1.33C.2 1.7 0 2.24 0 2.91v18.18c0 .67.2 1.21.53 1.58l.08.08 10.17-10.17v-.24L.61 1.25l-.08.08zM17.87 14.77l-3.4-3.4v-.24l3.4-3.4.08.04 4.02 2.28c1.15.65 1.15 1.72 0 2.37l-4.02 2.28-.08.07zM14.4 11.13L4.78.56c-.5-.27-1.12-.3-1.6-.1L14.4 11.13z"/></svg>
              Google Play
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
