import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";
import TeamLeadSidebar from "@/components/teamlead/TeamLeadSidebar";
import TeamLeadNavbar from "@/components/teamlead/TeamLeadNavbar";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
};

const TeamLeadDashboard = () => {
  const navigate = useNavigate();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  /* ---------------- Load current user ---------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (!mounted) return;
        setMe(data.user);
      } catch {
        navigate("/login");
      } finally {
        if (mounted) setLoadingMe(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const goBackToStudentDashboard = () => {
    navigate("/student-dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TeamLeadSidebar activeItem="Dashboard" />

      {/* Main Content */}
      <div className="ml-64">
        <TeamLeadNavbar
          me={me}
          loadingMe={loadingMe}
          onLogout={handleLogout}
        />

        {/* Dashboard Content */}
        <main className="min-h-[calc(100vh-73px)] bg-gray-50 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Team Lead Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              {loadingMe ? "…" : "Team Lead"}
            </p>
          </div>

          <div className="min-h-[calc(100vh-73px-96px)] flex items-center justify-center">
            <Button
              onClick={goBackToStudentDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-16 py-8 rounded-xl text-lg font-semibold shadow-md min-w-[420px]"
            >
              Go back to Student Dashboard
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeamLeadDashboard;