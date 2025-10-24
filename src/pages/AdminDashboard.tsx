import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Calendar,
  LogOut,
  Edit,
  Check,
  BarChart3,
  FolderKanban, // ✅ added icon
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

const AdminDashboard = () => {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const navigate = useNavigate();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  // Load current user on mount
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

  // ✅ Fixed navigation handling (added Dashboard + Project Management)
  const handleNavigation = (item: string) => {
    setActiveItem(item);
    if (item === "Dashboard") {
      navigate("/admin-dashboard");
    } else if (item === "Intern Management") {
      navigate("/intern-management");
    } else if (item === "Task Management") {
      navigate("/task-management");
    } else if (item === "Project Management") {
      navigate("/project-management"); // ✅ new route
    } else if (item === "Attendance Reports") {
      navigate("/attendance-reports");
    } else if (item === "Program Reports") {
      navigate("/program-reports");
    } else if (item === "Timetable & Scheduling") {
      navigate("/admin-timetable");
    }
  };

  // ✅ Sidebar items (added Project Management)
  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Users, label: "Intern Management" },
    { icon: ClipboardList, label: "Task Management" },
    { icon: FolderKanban, label: "Project Management" }, // ✅ added here
    { icon: FileText, label: "Attendance Reports" },
    { icon: BarChart3, label: "Program Reports" },
    { icon: Calendar, label: "Timetable & Scheduling" },
  ];

  const programStats = [
    {
      title: "Total Interns",
      value: "24",
      icon: Edit,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
      valueColor: "text-blue-600",
    },
    {
      title: "Active Tasks",
      value: "47",
      icon: Check,
      bgColor: "bg-green-50",
      iconColor: "text-green-500",
      valueColor: "text-green-600",
    },
    {
      title: "Time Table & Scheduling",
      value: "Manage Schedules",
      icon: Calendar,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-500",
      valueColor: "text-purple-600",
      isAction: true,
    },
    {
      title: "Completion Rate",
      value: "78%",
      icon: BarChart3,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-500",
      valueColor: "text-orange-600",
    },
  ];

  const recentActivities = [
    { task: "Ahmed Ali completed 'Database Design' Task", time: "2 mins ago" },
    { task: "New Intern Sarah Khan joined the program", time: "1 hour ago" },
    { task: "Task 'API Development' assigned to 5 interns", time: "24 mins ago" },
  ];

  const todaysAttendance = [
    { status: "Present", count: "22 Interns", color: "text-green-600", bgColor: "bg-green-100" },
    { status: "Absent", count: "2 Interns", color: "text-red-600", bgColor: "bg-red-100" },
    { status: "Late", count: "1 Interns", color: "text-yellow-600", bgColor: "bg-yellow-100" },
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
              className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-all duration-200 ${
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
              <h1 className="text-xl font-semibold text-gray-900">CSIT Admin Dashboard</h1>
              <p className="text-xs text-gray-500">
                {loadingMe ? "…" : me?.role === "admin" ? "Admin" : "User"}
              </p>
            </div>

            <div className="flex items-center space-x-4">
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
          {/* Program Overview Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Program Overview</h2>
              <div className="text-sm text-gray-500">Last 7 days</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {programStats.map((stat, index) => (
                <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className={`text-2xl font-bold ${stat.valueColor}`}>{stat.value}</div>
                    {stat.isAction && (
                      <Button variant="link" className="p-0 h-auto text-sm text-purple-600 hover:text-purple-700">
                        Manage Schedules
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-gray-900">Recent Activities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-gray-900">{activity.task}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Today's Attendance */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-gray-900">Today's Attendance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {todaysAttendance.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${item.bgColor}`}></div>
                      <span className="text-sm font-medium text-gray-700">{item.status}</span>
                    </div>
                    <Badge variant="secondary" className={`${item.color} ${item.bgColor} border-0`}>
                      {item.count}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
