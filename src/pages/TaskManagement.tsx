import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Calendar,
  LogOut,
  BarChart3,
  Plus,
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

const TaskManagement = () => {
  const [activeItem, setActiveItem] = useState("Task Management");
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
    } else if (item === "Attendance Reports") {
      navigate("/attendance-reports");
    } else if (item === "Program Reports") {
      navigate("/program-reports");
    } else if (item === "Timetable & Scheduling") {
      navigate("/admin-timetable");
    }
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Users, label: "Intern Management" },
    { icon: ClipboardList, label: "Task Management", active: true },
    { icon: FileText, label: "Attendance Reports" },
    { icon: BarChart3, label: "Program Reports" },
    { icon: Calendar, label: "Timetable & Scheduling" },
  ];

  const tasks = {
    todo: [
      {
        title: "Database Schema Design",
        description: "Design the database schema for the new project",
        assignedTo: "Ahmed Ali",
        dueDate: "Dec 25",
      },
      {
        title: "API Documentation",
        description: "Create comprehensive API documentation",
        assignedTo: "Sarah Khan",
        dueDate: "Dec 28",
      },
    ],
    inProgress: [
      {
        title: "Frontend Development",
        description: "Develop the user interface for all components",
        assignedTo: "Ali Hassan",
        dueDate: "Dec 30",
      },
      {
        title: "Testing Phase",
        description: "Conduct comprehensive testing",
        assignedTo: "Fatima Sheikh",
        dueDate: "Jan 5",
      },
    ],
    completed: [
      {
        title: "Requirements Analysis",
        description: "Analyze project requirements and document findings",
        assignedTo: "Ahmed Ali",
        completedDate: "Dec 20",
      },
      {
        title: "System Architecture",
        description: "Design system architecture",
        assignedTo: "Sarah Khan",
        completedDate: "Dec 22",
      },
    ],
  };

  const TaskCard = ({ task, status }: { task: any; status: string }) => {
    const getCardBg = () => {
      switch (status) {
        case "todo":
          return "bg-blue-50 border-blue-200";
        case "inProgress":
          return "bg-purple-50 border-purple-200";
        case "completed":
          return "bg-green-50 border-green-200";
        default:
          return "bg-gray-50 border-gray-200";
      }
    };

    return (
      <Card className={`mb-4 ${getCardBg()} hover:shadow-md transition-shadow`}>
        <CardContent className="p-4">
          <h4 className="font-semibold text-gray-900 mb-2">{task.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
          <div className="text-xs text-gray-500 mb-2">
            Assigned to: <span className="font-medium text-gray-700">{task.assignedTo}</span>
          </div>
          <div className="text-xs text-gray-500">
            {status === "completed" ? `Completed: ${task.completedDate}` : `Due: ${task.dueDate}`}
          </div>
        </CardContent>
      </Card>
    );
  };

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
              <h1 className="text-xl font-semibold text-gray-900">Task Management</h1>
              <p className="text-xs text-gray-500">
                {loadingMe ? "…" : me?.role === "admin" ? "Admin" : "User"}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create New Task
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

        {/* Task Management Content */}
        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* To Do Column */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">To Do</h2>
                <Badge variant="secondary" className="bg-blue-100 text-blue-600 border-0">
                  {tasks.todo.length}
                </Badge>
              </div>
              <div className="space-y-4">
                {tasks.todo.map((task, index) => (
                  <TaskCard key={index} task={task} status="todo" />
                ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">In Progress</h2>
                <Badge variant="secondary" className="bg-purple-100 text-purple-600 border-0">
                  {tasks.inProgress.length}
                </Badge>
              </div>
              <div className="space-y-4">
                {tasks.inProgress.map((task, index) => (
                  <TaskCard key={index} task={task} status="inProgress" />
                ))}
              </div>
            </div>

            {/* Completed Column */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Completed</h2>
                <Badge variant="secondary" className="bg-green-100 text-green-600 border-0">
                  {tasks.completed.length}
                </Badge>
              </div>
              <div className="space-y-4">
                {tasks.completed.map((task, index) => (
                  <TaskCard key={index} task={task} status="completed" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TaskManagement;
