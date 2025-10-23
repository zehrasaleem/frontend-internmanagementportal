import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Users,
  User as UserIcon,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchTasks, updateTaskStatus } from "@/api/api";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
};

type Task = {
  _id: string;
  title: string;
  description: string;
  status: "Assigned" | "In Progress" | "Completed";
  dueDate: string;
  assignedTo: string | { email: string }; // match your task structure
};

const StudentTasks = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Load current user using token
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!mounted) return;

        if (data?.user) {
          setMe(data.user);
        } else {
          navigate("/login");
        }
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

  // Fetch tasks and filter by current student
  useEffect(() => {
    if (!me) return;
    (async () => {
      try {
        const { data } = await fetchTasks();
        let allTasks: Task[] = Array.isArray(data) ? data : data.tasks || [];

        // Filter tasks for current student only
        const myTasks = allTasks.filter(
          (task: Task) =>
            task.assignedTo === me.email ||
            (typeof task.assignedTo === "object" &&
              task.assignedTo.email === me.email)
        );

        setTasks(myTasks);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoadingTasks(false);
      }
    })();
  }, [me]);

  const displayName =
    me?.name || (me?.email ? me.email.split("@")[0] : "Student");

  const initials = useMemo(() => {
    const base = (me?.name || me?.email || "NA").trim();
    const parts = base.split(/[ ._@-]+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || "NA";
  }, [me?.name, me?.email]);

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/student-dashboard" },
    { icon: CheckSquare, label: "My Tasks", path: "/student-tasks" },
    { icon: Users, label: "Attendance", path: "/student-attendance" },
    { icon: Calendar, label: "Timetable & Scheduling", path: "/student-timetable" },
    { icon: UserIcon, label: "Profile", path: "/student-profile" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (newStatus === "Completed") {
      alert("Only admins can mark tasks as Completed.");
      return;
    }

    try {
      setUpdating(taskId);
      await updateTaskStatus(taskId, newStatus, me?.role || "student");
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId ? { ...t, status: newStatus as Task["status"] } : t
        )
      );
    } catch (err) {
      console.error("Error updating task status", err);
      alert("Failed to update task status.");
    } finally {
      setUpdating(null);
    }
  };

  const getNextStatus = (currentStatus: string) => {
    if (currentStatus === "Assigned") return "In Progress";
    return "In Progress";
  };

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
                <span className="font-medium text-sm leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">My Tasks</h2>

            {loadingTasks ? (
              <p>Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="text-muted-foreground">No tasks assigned yet.</p>
            ) : (
              <div className="space-y-6">
                {tasks.map((task) => (
                  <Card key={task._id} className="bg-white border border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{task.title}</h3>
                            <Badge className={`${getStatusBadge(task.status)} border-0`}>
                              {task.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{task.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {task.status === "Assigned" && (
                            <Button
                              disabled={updating === task._id}
                              onClick={() =>
                                handleStatusChange(task._id, getNextStatus(task.status))
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                            >
                              {updating === task._id ? "Updating..." : "Start Task"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTasks;
