import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "hotel_manager") return <Navigate to="/hotel-panel" replace />;
  return <Navigate to="/" replace />;
};

export default Dashboard;
