import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Calendar,
  LogOut,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
};

const AttendanceReports = () => {
  const [activeItem, setActiveItem] = useState("Attendance Reports");
  const navigate = useNavigate();

  // ---- current user state ----
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

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
    me?.name || (me?.email ? me.email.split("@")[0] : "Admin");

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

  const handleNavigation = (item: string) => {
    setActiveItem(item);
    if (item === "Dashboard") {
      navigate("/admin-dashboard");
    } else if (item === "Intern Management") {
      navigate("/intern-management");
    } else if (item === "Task Management") {
      navigate("/task-management");
    } else if (item === "Program Reports") {
      navigate("/program-reports");
    } else if (item === "Timetable & Scheduling") {
      navigate("/admin-timetable");
    }
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Users, label: "Intern Management" },
    { icon: ClipboardList, label: "Task Management" },
    { icon: FileText, label: "Attendance Reports", active: true },
    { icon: BarChart3, label: "Program Reports" },
    { icon: Calendar, label: "Timetable & Scheduling" },
  ];

  const attendanceStats = [
    {
      title: "Today's Attendance",
      value: "92%",
      bgColor: "bg-green-50",
      iconColor: "text-green-500",
      valueColor: "text-green-600",
      indicatorColor: "bg-green-500",
    },
    {
      title: "Weekly Average",
      value: "88%",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
      valueColor: "text-blue-600",
      indicatorColor: "bg-blue-500",
    },
    {
      title: "Late Arrivals",
      value: "3",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-500",
      valueColor: "text-orange-600",
      indicatorColor: "bg-orange-500",
    },
  ];

  const attendanceData = [
    {
      intern: "Ahmed Ali",
      initials: "AA",
      checkIn: "8:25 AM",
      checkOut: "4:35 PM",
      hours: "8h 10m",
      status: "Present",
      statusColor: "bg-green-100 text-green-700",
    },
    {
      intern: "Sarah Khan",
      initials: "SK",
      checkIn: "8:45 AM",
      checkOut: "4:30 PM",
      hours: "7h 45m",
      status: "Present",
      statusColor: "bg-green-100 text-green-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div className="ml-3">
              <h1 className="font-semibold text-gray-900 text-sm">CSIT Admin Dashboard</h1>
              <p className="text-xs text-gray-500">Intern Management Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item.label)}
              className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                item.label === activeItem
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="ml-3 font-medium text-sm leading-tight">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Attendance Reports</h1>
              <p className="text-xs text-gray-500">
                {loadingMe ? "…" : me?.role === "admin" ? "Admin" : "User"}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="dd/mm/yy"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Generate Report
              </Button>
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
          {/* Stats Section */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {attendanceStats.map((stat, index) => (
                <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </CardTitle>
                      <div className={`w-3 h-3 rounded-full ${stat.indicatorColor}`}></div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className={`text-2xl font-bold ${stat.valueColor}`}>{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Daily Attendance Details */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Daily Attendance Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">INTERN</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">CHECK IN</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">CHECK OUT</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">HOURS</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((record, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                                {record.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-gray-900 text-sm">{record.intern}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{record.checkIn}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{record.checkOut}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{record.hours}</td>
                        <td className="py-4 px-4">
                          <Badge className={`${record.statusColor} border-0 text-xs`}>
                            {record.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AttendanceReports;
