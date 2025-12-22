import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
};

const TeamLeadDashboard = () => {
  const [activeItem, setActiveItem] = useState("Dashboard");
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

  const displayName =
    me?.name || (me?.email ? me.email.split("@")[0] : "Team Lead");

  const initials = useMemo(() => {
    const base = (me?.name || me?.email || "NA").trim();
    const parts = base.split(/[ ._@-]+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || "NA";
  }, [me?.name, me?.email]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const goBackToStudentDashboard = () => {
    navigate("/student-dashboard");
  };

  /* ---------------- Navigation ---------------- */
  const handleNavigation = (item: string) => {
    setActiveItem(item);
    if (item === "Dashboard") {
      navigate("/teamlead-dashboard");
    } else if (item === "Task Management") {
      navigate("/teamlead-task-management");
    } else if (item === "Timetable & Scheduling") {
      navigate("/teamlead-timetable");
    }
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: ClipboardList, label: "Task Management" },
    { icon: Calendar, label: "Timetable & Scheduling" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <div className="ml-3">
              <h1 className="font-semibold text-gray-900 text-sm">
                Team Lead Dashboard
              </h1>
              <p className="text-xs text-gray-500">
                Intern Management Portal
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item.label)}
              className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                item.label === activeItem
                  ? "bg-purple-50 text-purple-600 border-l-4 border-purple-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="ml-3 font-medium text-sm leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Team Lead Dashboard
              </h1>
              <p className="text-xs text-gray-500">
                {loadingMe ? "…" : "Team Lead"}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={me?.picture || ""} alt={displayName} />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-700">
                  {loadingMe ? "Loading..." : displayName}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Log Out
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Tasks Under Review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600">—</p>
                <p className="text-sm text-gray-500">
                  Tasks awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Upcoming Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">View Timetable</Badge>
              </CardContent>
            </Card>
          </div>

          {/* 🔙 GO BACK BUTTON */}
          <div className="mt-8 flex justify-center">
            <Button
              onClick={goBackToStudentDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
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
