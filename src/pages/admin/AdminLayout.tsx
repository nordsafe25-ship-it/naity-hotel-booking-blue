import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import naityLogo from "@/assets/naity-logo.png";
import {
  Hotel, Users, BookOpen, LogOut, LayoutDashboard, Settings,
  Menu, X, Globe, ChevronLeft, Activity, MessageSquare, Handshake
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { signOut } = useAuth();
  const { lang, setLang, t } = useI18n();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .then(({ count }) => setUnreadCount(count ?? 0));
  }, []);

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: lang === "ar" ? "لوحة التحكم" : "Dashboard" },
    { to: "/admin/hotels", icon: Hotel, label: lang === "ar" ? "الفنادق" : "Hotels" },
    { to: "/admin/rooms", icon: Settings, label: lang === "ar" ? "المخزون والغرف" : "Inventory" },
    { to: "/admin/managers", icon: Users, label: lang === "ar" ? "مدراء الفنادق" : "Managers" },
    { to: "/admin/partners", icon: Handshake, label: lang === "ar" ? "شركاء التقنية" : "Tech Partners" },
    { to: "/admin/bookings", icon: BookOpen, label: lang === "ar" ? "سجل الحجوزات" : "Reservations" },
    { to: "/admin/messages", icon: MessageSquare, label: lang === "ar" ? "الرسائل" : "Messages", badge: unreadCount },
    { to: "/admin/sync", icon: Activity, label: lang === "ar" ? "إعدادات المزامنة" : "Sync Settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-accent-foreground/10">
        <Link to="/" className="flex items-center gap-2">
          <img src={naityLogo} alt="Naity" className="h-8 w-auto" />
          <div>
            <span className="font-bold text-sm">Naity</span>
            <span className="block text-xs text-accent-foreground/60">
              {lang === "ar" ? "لوحة الإدارة" : "Admin Panel"}
            </span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.to)
                ? "bg-primary text-primary-foreground"
                : "text-accent-foreground/70 hover:bg-accent-foreground/10 hover:text-accent-foreground"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
            {"badge" in item && (item as any).badge > 0 && (
              <span className="ms-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {(item as any).badge > 9 ? "9+" : (item as any).badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-accent-foreground/10 space-y-2">
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-accent-foreground/70 hover:bg-accent-foreground/10 hover:text-accent-foreground transition-colors w-full"
        >
          <Globe className="w-4 h-4" />
          {lang === "ar" ? "English" : "العربية"}
        </button>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-accent-foreground/70 hover:bg-accent-foreground/10 hover:text-accent-foreground transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          {lang === "ar" ? "تسجيل الخروج" : "Sign Out"}
        </button>
      </div>
    </>
  );

  return (
    <div className={`min-h-screen flex bg-background ${lang === "ar" ? "flex-row" : "flex-row"}`} dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-accent text-accent-foreground flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[99] lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className={`fixed top-0 ${lang === "ar" ? "right-0" : "left-0"} w-64 h-full bg-accent text-accent-foreground flex flex-col z-[100]`}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden bg-card border-b border-border/50 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <img src={naityLogo} alt="Naity" className="h-6 w-auto" />
            <span className="font-bold text-sm text-foreground">Naity</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
            <Globe className="w-4 h-4" />
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
