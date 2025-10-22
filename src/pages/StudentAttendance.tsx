// client/src/pages/StudentAttendance.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Users,
  User as UserIcon,
  Clock,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/api/api";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
};

const StudentAttendance = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/student-dashboard" },
    { icon: CheckSquare, label: "My Tasks", path: "/student-tasks" },
    { icon: Users, label: "Attendance", path: "/student-attendance" },
    { icon: Calendar, label: "Timetable & Scheduling", path: "/student-timetable" },
    { icon: UserIcon, label: "Profile", path: "/student-profile" },
  ];

  // Load current user from backend
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
    me?.name || (me?.email ? me.email.split("@")[0] : "Student");

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

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const attendanceHistory = [
    {
      date: "Dec 23, 2024",
      checkIn: "09:05 AM",
      checkOut: "-",
      hours: "-",
      status: "Present",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      date: "Dec 22, 2024",
      checkIn: "09:15 AM",
      checkOut: "05:00 PM",
      hours: "7h 45m",
      status: "Late",
      statusColor: "bg-yellow-100 text-yellow-800",
    },
    {
      date: "Dec 21, 2024",
      checkIn: "08:55 AM",
      checkOut: "05:00 PM",
      hours: "8h 5m",
      status: "Present",
      statusColor: "bg-green-100 text-green-800",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Student Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              CS&IT Internship Program
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-foreground">
              {loadingMe ? "Loading..." : displayName}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={me?.picture || ""} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-border min-h-screen">
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary border-l-4 border-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm leading-tight">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">Attendance Management</h2>

            {/* Attendance Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Today's Attendance */}
              <Card className="bg-white border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Today's Attendance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                      <Clock className="w-10 h-10 text-green-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        Current Status: <span className="text-green-600 font-medium">Checked in</span>
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">Check in Time: 09:00 AM</p>
                      <Button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2">
                        Check Out
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* This Week Summary */}
              <Card className="bg-white border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">This Week Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Days Present</span>
                    <span className="font-semibold text-foreground">4/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Hours</span>
                    <span className="font-semibold text-foreground">32h 15m</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average Check-in</span>
                    <span className="font-semibold text-foreground">09:05 AM</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance History */}
            <Card className="bg-white border border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Attendance History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">DATE</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">CHECK IN</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">CHECK OUT</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">HOURS</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.map((record, index) => (
                        <tr key={index} className="border-b border-border hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-foreground">{record.date}</td>
                          <td className="py-3 px-4 text-sm text-foreground">{record.checkIn}</td>
                          <td className="py-3 px-4 text-sm text-foreground">{record.checkOut}</td>
                          <td className="py-3 px-4 text-sm text-foreground">{record.hours}</td>
                          <td className="py-3 px-4">
                            <Badge className={`${record.statusColor} border-0`}>{record.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;
