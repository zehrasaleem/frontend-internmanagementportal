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
  FolderKanban, // ✅ Added
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import api, { createTask, fetchTasks } from "@/api/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subHeading: "",
    description: "",
    assignedTo: "",
    dueDate: "",
  });
  const [tasksData, setTasksData] = useState<Record<string, any[]>>({});
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // ---- Fetch current user ----
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

  // ---- Fetch and dynamically group tasks ----
  const loadTasks = async () => {
    try {
      setLoadingTasks(true);
      const { data } = await fetchTasks();
      const tasks = data?.tasks || data?.data || data || [];

      if (!Array.isArray(tasks) || tasks.length === 0) {
        setTasksData({});
        return;
      }

      const grouped = tasks.reduce((acc: Record<string, any[]>, task: any) => {
        const key =
          task.status === "Assigned"
            ? "To Do"
            : task.status === "In Progress"
            ? "In Progress"
            : task.status === "Completed"
            ? "Completed"
            : task.status || "Other";
        acc[key] = acc[key] || [];
        acc[key].push(task);
        return acc;
      }, {});

      setTasksData(grouped);
    } catch (err) {
      console.error("Error fetching tasks", err);
      setTasksData({});
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // ---- Handle form ----
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask(formData);
      alert("✅ Task created successfully!");
      setOpen(false);
      setFormData({
        title: "",
        subHeading: "",
        description: "",
        assignedTo: "",
        dueDate: "",
      });
      loadTasks();
    } catch (err) {
      console.error(err);
      alert("❌ Error creating task");
    }
  };

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

  // ✅ UPDATED navigation with Project Management route
  const handleNavigation = (item: string) => {
    setActiveItem(item);
    if (item === "Dashboard") navigate("/admin-dashboard");
    else if (item === "Intern Management") navigate("/intern-management");
    else if (item === "Task Management") navigate("/task-management");
    else if (item === "Project Management") navigate("/project-management"); // ✅ Added
    else if (item === "Attendance Reports") navigate("/attendance-reports");
    else if (item === "Program Reports") navigate("/program-reports");
    else if (item === "Timetable & Scheduling") navigate("/admin-timetable");
  };

  // ---- TaskCard Component ----
  const TaskCard = ({ task, status }: { task: any; status: string }) => {
    const getCardBg = () => {
      if (status.includes("Progress")) return "bg-purple-50 border-purple-200";
      if (status.includes("Completed")) return "bg-green-50 border-green-200";
      return "bg-blue-50 border-blue-200";
    };

    const markCompleted = async () => {
      if (!me) return;
      setUpdatingTaskId(task._id);
      try {
        await api.put(`/tasks/${task._id}/status`, {
          status: "Completed",
          role: me.role,
        });
        loadTasks();
      } catch (err) {
        console.error(err);
        alert("Failed to mark task as completed");
      } finally {
        setUpdatingTaskId(null);
      }
    };

    const deleteTask = async () => {
      if (!me) return;
      if (!window.confirm("Are you sure you want to delete this task?")) return;
      setUpdatingTaskId(task._id);
      try {
        await api.delete(`/tasks/${task._id}`);
        loadTasks();
      } catch (err) {
        console.error(err);
        alert("Failed to delete task");
      } finally {
        setUpdatingTaskId(null);
      }
    };

    return (
      <Card className={`mb-4 ${getCardBg()} hover:shadow-md transition-shadow`}>
        <CardContent className="p-4">
          <h4 className="font-semibold text-gray-900 mb-2">{task.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
          <div className="text-xs text-gray-500 mb-2">
            Assigned to:{" "}
            <span className="font-medium text-gray-700">
              {task.assignedTo?.email || task.assignedTo || "N/A"}
            </span>
          </div>
          <div className="text-xs text-gray-500 mb-3">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </div>

          {me?.role === "admin" && (
            <div className="flex gap-2">
              {task.status !== "Completed" && (
                <Button
                  size="sm"
                  onClick={markCompleted}
                  disabled={updatingTaskId === task._id}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {updatingTaskId === task._id ? "Updating..." : "Mark Completed"}
                </Button>
              )}
              <Button
                size="sm"
                onClick={deleteTask}
                disabled={updatingTaskId === task._id}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {updatingTaskId === task._id ? "Deleting..." : "Delete"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200">
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

        {/* ✅ Added Project Management to Sidebar */}
        <nav className="p-4 space-y-1">
          {[
            { icon: LayoutDashboard, label: "Dashboard" },
            { icon: Users, label: "Intern Management" },
            { icon: ClipboardList, label: "Task Management" },
            { icon: FolderKanban, label: "Project Management" }, // ✅ Added
            { icon: FileText, label: "Attendance Reports" },
            { icon: BarChart3, label: "Program Reports" },
            { icon: Calendar, label: "Timetable & Scheduling" },
          ].map((item, index) => (
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
                Task Management
              </h1>
              <p className="text-xs text-gray-500">
                {loadingMe ? "…" : me?.role === "admin" ? "Admin" : "User"}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Dialog open={open} onOpenChange={setOpen}>
                <Button
                  onClick={() => setOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Task
                </Button>

                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Label>Sub Heading</Label>
                      <Input
                        name="subHeading"
                        value={formData.subHeading}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <Label>Assigned To (Student Email)</Label>
                      <Input
                        name="assignedTo"
                        type="email"
                        placeholder="e.g. student@example.com"
                        value={formData.assignedTo}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Create Task
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

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

        {/* Task Content */}
        <main className="p-6">
          {loadingTasks ? (
            <p className="text-gray-500">Loading tasks...</p>
          ) : Object.keys(tasksData).length === 0 ? (
            <p className="text-gray-500">No tasks available.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Object.entries(tasksData).map(([status, tasks]) => (
                <div key={status}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {status}
                    </h2>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-600 border-0"
                    >
                      {(tasks as any[]).length}
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {(tasks as any[]).map((task, i) => (
                      <TaskCard key={i} task={task} status={status} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TaskManagement;
