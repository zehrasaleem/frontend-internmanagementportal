import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "@/api/api";
import { Card, CardContent } from "@/components/ui/card";
import StudentSidebar from "@/components/students/StudentSidebar";
import StudentNavbar from "@/components/students/StudentNavbar";

import { ClipboardList } from "lucide-react";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
};

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  // ✅ REAL TEAM LEAD FLAG (from backend)
  const [isTeamLead, setIsTeamLead] = useState(false);

  /* ---------------- Fetch logged-in user ---------------- */
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

  /* ---------------- Check if user is team lead ---------------- */
  useEffect(() => {
    if (!me?._id) return;

    let mounted = true;

    (async () => {
      try {
        const res = await api.get("/projects/my/lead-projects");
        if (mounted) {
          setIsTeamLead(Array.isArray(res.data) && res.data.length > 0);
        }
      } catch {
        if (mounted) setIsTeamLead(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [me]);

  const displayName =
    me?.name || (me?.email ? me.email.split("@")[0] : "Student");

  const firstName = useMemo(
    () => displayName.split(/\s+/)[0] ?? "Student",
    [displayName]
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentSidebar activeItem="Dashboard" />

      <div className="ml-64">
        <StudentNavbar
          me={me}
          loadingMe={loadingMe}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className="min-h-[calc(100vh-73px)] p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-6">
            {loadingMe ? "Welcome…" : `Welcome ${firstName}!`}
          </h2>

          <div className="flex justify-center">
            {isTeamLead && (
              <Card
                onClick={() => navigate("/teamlead-dashboard")}
                className="w-full max-w-3xl bg-purple-600 text-white cursor-pointer hover:bg-purple-700 transition border-0"
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-2">
                      Team Lead Access
                    </p>
                    <p className="text-2xl font-bold">
                      Go to Team Lead Dashboard
                    </p>
                  </div>

                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                    <ClipboardList className="w-7 h-7 text-white" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;