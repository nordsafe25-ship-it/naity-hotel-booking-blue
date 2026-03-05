import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import naityLogo from "@/assets/naity-logo.png";
import { Hotel, Users, BookOpen, LogOut, LayoutDashboard } from "lucide-react";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "لوحة التحكم" },
  { to: "/admin/hotels", icon: Hotel, label: "الفنادق" },
  { to: "/admin/managers", icon: Users, label: "مدراء الفنادق" },
  { to: "/admin/bookings", icon: BookOpen, label: "الحجوزات" },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-accent text-accent-foreground flex flex-col shrink-0">
        <div className="p-4 border-b border-accent-foreground/10">
          <div className="flex items-center gap-2">
            <img src={naityLogo} alt="Naity" className="h-8 w-auto" />
            <div>
              <span className="font-bold text-sm">Naity</span>
              <span className="block text-xs text-accent-foreground/60">لوحة الإدارة</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.to
                  ? "bg-primary text-primary-foreground"
                  : "text-accent-foreground/70 hover:bg-accent-foreground/10 hover:text-accent-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-accent-foreground/10">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-accent-foreground/70 hover:bg-accent-foreground/10 hover:text-accent-foreground transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
