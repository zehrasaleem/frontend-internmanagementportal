import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchTasks, updateTaskStatus, updateTaskProgress } from "@/api/api";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Users,
  User as UserIcon,
} from "lucide-react";
import { requestTaskApproval } from "@/api/api";
import { Toaster, toast } from 'react-hot-toast';

// Add inside your App component (or top-level)
function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <StudentTasks />
    </>
  );
}



// -------------------- Sidebar Component --------------------
type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
};

interface SidebarProps {
  user: CurrentUser | null;
  loadingUser: boolean;
}

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/student-dashboard" },
  { icon: CheckSquare, label: "My Tasks", path: "/student-tasks" },
  { icon: Users, label: "Attendance", path: "/student-attendance" },
  { icon: Calendar, label: "Timetable & Scheduling", path: "/student-timetable" },
  { icon: UserIcon, label: "Profile", path: "/student-profile" },
];

const Sidebar = ({ user, loadingUser }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => navigate(path);

  return (
    <div className="w-64 bg-white border-r border-border min-h-screen flex flex-col">
      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNavigation(item.path)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${location.pathname === item.path
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
  );
};

// -------------------- StudentTasks Component --------------------
type UserRef = {
  _id: string;
  name: string;
  email: string;
};

type Task = {
  _id: string;
  title: string;
  subHeading?: string;
  description: string;
  status: "Assigned" | "In Progress" | "Completed" | "Pending Approval";
  dueDate: string;
  assignedTo: UserRef[];
  assignedBy?: UserRef;
  createdAt: string;
  startDate?: string;
  completedDate?: string;
  progress?: number;
};

const StudentTasks = () => {
  const navigate = useNavigate();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [progress, setProgress] = useState(0);

  const [viewTask, setViewTask] = useState<Task | null>(null);

  const handleRequestApproval = async (taskId: string, progress: number) => {
    if (progress < 90) {
      toast.error("You must reach at least 90% progress before requesting approval.");
      return;
    }

    try {
      const { data } = await requestTaskApproval(taskId);
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId ? { ...t, status: "Pending Approval" } : t
        )
      );
      toast.success("Approval requested successfully!");
    } catch (err: any) {
      console.error("Failed to request approval:", err);
      toast.error(err.response?.data?.message || "Failed to request approval.");
    }
  };

  // Fetch current user
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

        if (data?.user) setMe(data.user);
        else navigate("/login");
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

  // Fetch tasks
  useEffect(() => {
    if (!me) return;
    (async () => {
      try {
        const { data } = await fetchTasks();
        const allTasks: Task[] = Array.isArray(data) ? data : data.tasks || [];
        const myTasks = allTasks.filter((task) =>
          task.assignedTo.some((u) => u.email === me.email)
        );
        setTasks(myTasks);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    })();
  }, [me]);

  const displayName = me?.name || me?.email?.split("@")[0] || "Student";

  const initials = useMemo(() => {
    const base = (me?.name || me?.email || "NA").trim();
    const parts = base.split(/[ ._@-]+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || "NA";
  }, [me?.name, me?.email]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    let base = "rounded-full px-3 py-1 transition-all duration-150";
    switch (status) {
      case "Completed":
        return `${base} bg-green-100 text-green-800 hover:bg-green-200`;
      case "In Progress":
        return `${base} bg-yellow-100 text-yellow-800 hover:bg-yellow-200`;
      default:
        return `${base} bg-blue-100 text-blue-800 hover:bg-blue-200`;
    }
  };

  const timeTaken = (task: Task) => {
    if (!task.startDate || !task.completedDate) return "-";
    const start = new Date(task.startDate);
    const end = new Date(task.completedDate);
    let diff = Math.floor((end.getTime() - start.getTime()) / 1000);
    const days = Math.floor(diff / (3600 * 24));
    diff -= days * 3600 * 24;
    const hours = Math.floor(diff / 3600);
    diff -= hours * 3600;
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (seconds) parts.push(`${seconds}s`);
    return parts.join(" ") || "0s";
  };

  const openUpdateModal = (task: Task) => {
    setSelectedTask(task);
    setProgress(task.progress ?? 0);
    setShowUpdateModal(true);
  };

  const applyUpdateStatus = async () => {
    if (!selectedTask) return;

    const cappedProgress = Math.min(progress, 90); // student cannot exceed 90%

    try {
      setUpdating(selectedTask._id);

      // Only update PROGRESS, not status
      await updateTaskProgress(selectedTask._id, cappedProgress);

      setTasks((prev) =>
        prev.map((t) =>
          t._id === selectedTask._id
            ? {
              ...t,
              progress: cappedProgress,
              status: "In Progress", // always stay in progress
              startDate: t.startDate || new Date().toISOString(),
            }
            : t
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update progress");
    } finally {
      setShowUpdateModal(false);
      setUpdating(null);
    }
  };
  const handleMarkComplete = (taskId: string, progress: number) => {
    if (progress < 90) {
      toast.error("You must reach at least 90% progress before marking complete.");
      return;
    }

    toast.success("Task is ready for approval. An admin will review it.");
  };


  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      setUpdating(taskId);
      await updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId
            ? {
              ...t,
              status: newStatus as Task["status"],
              startDate: t.startDate || new Date().toISOString(),
              completedDate:
                newStatus === "Completed" ? new Date().toISOString() : t.completedDate,
            }
            : t
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update task status.");
    } finally {
      setUpdating(null);
    }
  };

  const openViewDetails = (task: Task) => setViewTask(task);

  const now = new Date();

  const upcomingTasks = tasks.filter((task) => {
    const due = new Date(task.dueDate);
    return due > now && due <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) && task.status !== "Completed";
  });

  const missedTasks = tasks.filter((task) => {
    const due = new Date(task.dueDate);
    return due < now && task.status !== "Completed";
  });


  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Student Dashboard</h1>
            <p className="text-sm text-muted-foreground">CS&IT Internship Program</p>
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

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar user={me} loadingUser={loadingMe} />

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Upcoming Tasks */}
          {upcomingTasks.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 text-red-600">⏰ Upcoming Tasks This Week</h2>
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {upcomingTasks.map((task) => (
                  <Card
                    key={task._id}
                    className="bg-red-50 min-w-[250px] min-h-[130px] p-4 shadow-sm rounded-xl border-l-4 border-red-500 flex-shrink-0"
                  >
                    <CardContent className="p-0">
                      <h3 className="font-bold">{task.title}</h3>
                      <p className="text-gray-700 text-sm">{task.description}</p>
                      {/* Assigned By */}
                      {task.assignedBy && (
                        <p className="text-gray-500 text-sm mt-1">
                          <span className="font-medium">Assigned By:</span> {task.assignedBy.name}
                        </p>
                      )}
                      <p className="text-red-600 text-sm font-medium">
                        {new Date(task.dueDate).toLocaleString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Missed Tasks */}
          {missedTasks.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 text-red-700">⚠️ Missed Tasks</h2>
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {missedTasks.map((task) => (
                  <Card
                    key={task._id}
                    className="bg-red-50 min-w-[250px] min-h-[130px] p-4 shadow-sm rounded-xl border-l-4 border-red-500 flex-shrink-0"
                  >
                    <CardContent className="p-0">
                      <h3 className="font-bold">{task.title}</h3>
                      <p className="text-gray-700 text-sm">{task.description}</p>
                      {/* Assigned By */}
                      {task.assignedBy && (
                        <p className="text-gray-500 text-sm mt-1">
                          <span className="font-medium">Assigned By:</span> {task.assignedBy.name}
                        </p>
                      )}
                      <p className="text-red-700 text-sm font-medium">
                        {new Date(task.dueDate).toLocaleString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}


          {/* My Tasks */}
          <h2 className="text-2xl font-bold mb-4">My Tasks</h2>
          <div className="space-y-4">
            {tasks.map((task) => {
              const getLeftBorderColor = (status: Task["status"]) => {
                switch (status) {
                  case "Assigned":
                    return "border-l-4 border-blue-600";
                  case "In Progress":
                    return "border-l-4 border-yellow-500";
                  case "Pending Approval":
                    return "border-l-4 border-amber-700";
                  case "Completed":
                    return "border-l-4 border-green-600";
                  default:
                    return "";
                }
              };

              const getBackgroundColor = (status: Task["status"]) => {
                switch (status) {
                  case "Assigned":
                    return "bg-blue-50"; // light blue
                  case "In Progress":
                    return "bg-yellow-50"; // light yellow
                  case "Pending Approval":
                    return "bg-amber-50";
                  case "Completed":
                    return "bg-green-50"; // light green
                  default:
                    return "bg-white";
                }
              };

              const canMarkComplete = (task: Task) =>
                (task.progress ?? 0) >= 90 && task.status !== "Pending Approval";

              return (
                <Card
                  key={task._id}
                  className={`p-5 shadow-sm rounded-xl ml-1 relative ${getLeftBorderColor(
                    task.status
                  )} ${getBackgroundColor(task.status)}`}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                        {task.subHeading && (
                          <p className="text-gray-500 text-sm">{task.subHeading}</p>
                        )}
                      </div>
                      <Badge className={getStatusBadge(task.status)}>{task.status}</Badge>
                    </div>

                    <p className="text-gray-700 text-sm mb-3">{task.description}</p>

                    <div className="flex justify-between items-center mt-4">
                      <p className="text-gray-600 text-sm">
                        <span className="font-medium">Due Date:</span>{" "}
                        {new Date(task.dueDate).toLocaleString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>

                      <div className="flex gap-2">
                        {task.status === "Assigned" && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                            onClick={() => handleStatusChange(task._id, "In Progress")}
                          >
                            Start Task
                          </Button>
                        )}

                        {(task.status === "In Progress" || task.status === "Pending Approval") && (
                          <>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-500 text-white"
                              onClick={() => openUpdateModal(task)}
                              disabled={task.status === "Pending Approval"}
                            >
                              Update Status
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleRequestApproval(task._id, task.progress ?? 0)}
                              disabled={!canMarkComplete(task)}
                              className={`text-white ${task.status === "Pending Approval"
                                ? "bg-amber-500 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-500"
                                }`}
                            >
                              {task.status === "Pending Approval" ? "Pending Approval" : "Mark Complete"}
                            </Button>
                          </>
                        )}

                        {task.status === "Completed" && (
                          <Button
                            size="sm"
                            className="bg-gray-500 hover:bg-gray-400 text-white"
                            onClick={() => openViewDetails(task)}
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* -------------------- Update Progress Modal -------------------- */}
      <Dialog open={showUpdateModal} onOpenChange={(open) => setShowUpdateModal(open)}>
        <DialogContent className="sm:max-w-md w-full p-6">
          <DialogHeader>
            <DialogTitle>Update Task Progress</DialogTitle>
          </DialogHeader>

          {/* Task Title */}
          <p className="text-sm text-gray-600 mb-3 font-semibold">
            {selectedTask ? selectedTask.title : "Loading..."}
          </p>

          {/* Slider */}
          <Slider
            value={[progress]}
            onValueChange={(v: number[]) => setProgress(v[0])}
            max={90}
            step={5}
            className="mb-2"
          />

          {/* Progress Display */}
          <p className="text-sm mb-4 text-gray-700">{progress}% completed</p>

          {/* Save Button */}
          <Button
            className="bg-blue-600 hover:bg-blue-500 text-white w-full"
            onClick={applyUpdateStatus}
            disabled={!selectedTask} // prevent click if no task selected
          >
            Save Progress
          </Button>
        </DialogContent>
      </Dialog>


      {/* View Details Modal */}
      <Dialog open={!!viewTask} onOpenChange={() => setViewTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {viewTask && (
            <div className="space-y-2">
              <p>
                <strong>Title:</strong> {viewTask.title}
              </p>
              <p>
                <strong>Description:</strong> {viewTask.description}
              </p>
              <p>
                <strong>Assigned To:</strong> {viewTask.assignedTo.map((a) => a.name).join(", ")}
              </p>
              {viewTask.assignedBy && (
                <p>
                  <strong>Assigned By:</strong> {viewTask.assignedBy.name}
                </p>
              )}

              <p>
                <strong>Start Date:</strong>{" "}
                {viewTask.startDate
                  ? new Date(viewTask.startDate).toLocaleString([], {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                  : "-"}
              </p>

              <p>
                <strong>End Date:</strong>{" "}
                {viewTask.completedDate
                  ? new Date(viewTask.completedDate).toLocaleString([], {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                  : "-"}
              </p>

              <p>
                <strong>Due Date:</strong>{" "}
                {new Date(viewTask.dueDate).toLocaleString([], {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>


              <p>
                <strong>Progress:</strong> {viewTask.progress ?? 0}%
              </p>
              <p>
                <strong>Status:</strong> {viewTask.status}
              </p>
              <p>
                <strong>Time Taken:</strong> {timeTaken(viewTask)}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentTasks;
