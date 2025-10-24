import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Calendar,
  LogOut,
  BarChart3,
  FolderKanban,
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

const ProgramReports = () => {
  const [activeItem, setActiveItem] = useState("Program Reports");
  const navigate = useNavigate();

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
    if (item === "Dashboard") navigate("/admin-dashboard");
    else if (item === "Intern Management") navigate("/intern-management");
    else if (item === "Task Management") navigate("/task-management");
    else if (item === "Project Management") navigate("/project-management");
    else if (item === "Attendance Reports") navigate("/attendance-reports");
    else if (item === "Program Reports") navigate("/program-reports");
    else if (item === "Timetable & Scheduling") navigate("/admin-timetable");
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Users, label: "Intern Management" },
    { icon: ClipboardList, label: "Task Management" },
    { icon: FolderKanban, label: "Project Management" },
    { icon: FileText, label: "Attendance Reports" },
    { icon: BarChart3, label: "Program Reports" },
    { icon: Calendar, label: "Timetable & Scheduling" },

  ];

  const programStats = [
    {
      title: "Interns Total",
      value: "24",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
      valueColor: "text-blue-600",
    },
    {
      title: "Present Today",
      value: "22",
      bgColor: "bg-green-50",
      iconColor: "text-green-500",
      valueColor: "text-green-600",
    },
    {
      title: "Absent Today",
      value: "2",
      bgColor: "bg-red-50",
      iconColor: "text-red-500",
      valueColor: "text-red-600",
    },
    {
      title: "Pending Tasks",
      value: "6",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-500",
      valueColor: "text-orange-600",
    },
  ];

  const todaysInterns = [
    {
      name: "Ahmed Ali",
      attendance: "Present",
      tasks: "8/12",
      attendanceColor: "text-green-600",
      attendanceBg: "bg-green-100",
    },
    {
      name: "Sarah Khan",
      attendance: "Present",
      tasks: "6/10",
      attendanceColor: "text-green-600",
      attendanceBg: "bg-green-100",
    },
    {
      name: "Ali Hassan",
      attendance: "Absent",
      tasks: "4/8",
      attendanceColor: "text-red-600",
      attendanceBg: "bg-red-100",
    },
    {
      name: "Fatima Sheikh",
      attendance: "Present",
      tasks: "7/9",
      attendanceColor: "text-green-600",
      attendanceBg: "bg-green-100",
    },
    {
      name: "Omar Malik",
      attendance: "Absent",
      tasks: "3/7",
      attendanceColor: "text-red-600",
      attendanceBg: "bg-red-100",
    },
  ];

  const tasksOverview = [
    {
      task: "Database Design",
      assigned: "Ahmed, Sarah, Ali, Fatima, Omar",
      count: "5",
      taskColor: "text-blue-600",
    },
    {
      task: "API Development",
      assigned: "Ahmed, Sarah, Zain, Hassan",
      count: "4",
      taskColor: "text-green-600",
    },
    {
      task: "Frontend UI",
      assigned: "Sarah, Fatima, Ayesha, Zain",
      count: "4",
      taskColor: "text-purple-600",
    },
    {
      task: "Testing Phase",
      assigned: "Fatima, Omar, Ayesha",
      count: "3",
      taskColor: "text-red-600",
    },
    {
      task: "Documentation",
      assigned: "Ahmed, Sarah, Hassan",
      count: "3",
      taskColor: "text-blue-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div className="ml-3">
              <h1 className="font-semibold text-gray-900 text-sm">
                CSIT Admin Dashboard
              </h1>
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
                Program Reports
              </h1>
              <p className="text-xs text-gray-500">
                {loadingMe ? "…" : me?.role === "admin" ? "Admin" : "User"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {programStats.map((stat, index) => (
              <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className={`text-2xl font-bold ${stat.valueColor}`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Interns Today */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Interns (Today)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 pb-2 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-500">NAME</div>
                    <div className="text-sm font-medium text-gray-500">ATTENDANCE</div>
                    <div className="text-sm font-medium text-gray-500">TASKS</div>
                  </div>
                  {todaysInterns.map((intern, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {intern.name}
                      </div>
                      <div>
                        <Badge
                          variant="secondary"
                          className={`${intern.attendanceColor} ${intern.attendanceBg} border-0`}
                        >
                          {intern.attendance}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">{intern.tasks}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tasks Overview */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Tasks Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 pb-2 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-500 col-span-2">
                      TASKS
                    </div>
                    <div className="text-sm font-medium text-gray-500">ASSIGNED</div>
                  </div>
                  {tasksOverview.map((task, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100"
                    >
                      <div className="col-span-2">
                        <div className={`text-sm font-medium ${task.taskColor} mb-1`}>
                          {task.task}
                        </div>
                        <div className="text-xs text-gray-500">
                          Assigned To: {task.assigned}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-gray-900">{task.count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProgramReports;
