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
            <p className="text-xs font-medium text-primary">{t("footer.slogan")}</p>
            <p className="text-sm text-accent-foreground/70">{t("footer.desc")}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">{t("footer.explore")}</h4>
            <div className="flex flex-col gap-2 text-sm text-accent-foreground/70">
              <Link to="/hotels" className="hover:text-accent-foreground transition-colors">{t("nav.hotels")}</Link>
              <Link to="/how-it-works" className="hover:text-accent-foreground transition-colors">{t("nav.howItWorks")}</Link>
              <Link to="/about" className="hover:text-accent-foreground transition-colors">{t("nav.about")}</Link>
              <Link to="/my-bookings" className="hover:text-accent-foreground transition-colors">{t("nav.myBookings")}</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">{t("footer.support")}</h4>
            <div className="flex flex-col gap-2 text-sm text-accent-foreground/70">
              <Link to="/contact" className="hover:text-accent-foreground transition-colors">{t("nav.contact")}</Link>
              <span>support@naity.net</span>
              <span>{t("contact.office")}</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">{t("footer.forHotels")}</h4>
            <p className="text-sm text-accent-foreground/70 mb-3">{t("footer.forHotelsDesc")}</p>
            <Link
              to="/contact"
              className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {t("footer.joinNaity")}
            </Link>
          </div>
        </div>

        <div className="border-t border-accent-foreground/20 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-accent-foreground/50">© {new Date().getFullYear()} Naity. {t("footer.copyright")}</span>
          <div className="flex items-center gap-4 text-sm text-accent-foreground/50">
            <Link to="/terms" className="hover:text-accent-foreground transition-colors">{t("footer.terms")}</Link>
            <Link to="/privacy" className="hover:text-accent-foreground transition-colors">{t("footer.privacy")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
