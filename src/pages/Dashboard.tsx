import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user, role, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isPartner, setIsPartner] = useState(false);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    supabase.from("partner_users").select("partner_id")
      .eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setIsPartner(!!data);
        setChecking(false);
      });
  }, [user]);

  if (loading || checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (isPartner) return <Navigate to="/partner" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "hotel_manager") return <Navigate to="/hotel-panel" replace />;
  return <Navigate to="/" replace />;
};

export default Dashboard;
