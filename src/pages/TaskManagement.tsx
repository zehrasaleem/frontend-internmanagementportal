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
  FolderKanban,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import api, { createTask, fetchTasks, updateTaskStatus } from "@/api/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteTask } from "@/api/api"; // adjust path
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@headlessui/react";
import { Toaster, toast } from 'react-hot-toast';
import { Edit2, Trash2 } from "lucide-react"; // small icons


type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
};

type Student = {
  _id: string;
  name: string;
  email: string;
};

type Project = {
  _id: string;
  title: string;
  teamLead?: Student; // or User type if you have one
};


type Task = {
  _id: string;
  title: string;
  description: string;
  assignedTo: Student[];
  dueDate: string;
  status:
  | "Assigned"
  | "In Progress"
  | "Pending Approval"
  | "Pending Admin Approval"
  | "Completed"
  | "Pending Start Approval"
  | "Missed";
  assignedBy: string;
  project?: string;
  createdByRole?: "admin" | "teamLead";
  approvals?: string[];
  // execution
  startDate?: string | null;
  completedDate?: string | null;
  progress?: number;

  // ✅ add these (Mongoose usually provides them)
  createdAt?: string;
  updatedAt?: string;
};



const TaskManagement = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [showDueDateInputsFor, setShowDueDateInputsFor] = useState<string | null>(null);


  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: [] as Student[],
    dueDate: "",
    dueTime: "00:00", // default 12:00 AM
    project: "",
  });

  const [query, setQuery] = useState("");

  const filteredStudents =
    query === ""
      ? students
      : students.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.email.toLowerCase().includes(query.toLowerCase())
      );
  const isBlockedByTeamLeadApproval = (task: Task, me: CurrentUser | null, users: CurrentUser[]) => {
    if (!task.project || !me) return false;
    if (me.role === "admin") return false; // admins not blocked
    if (!task.assignedTo.some(s => s._id === me._id)) return false; // not assigned

    const assigner = users.find(u => u._id === task.assignedBy);
    return assigner && task.status === "Pending Admin Approval";

  };



  // Fetch current user
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


  // Load tasks
  const loadTasks = async () => {
    setLoadingTasks(true);
    try {
      console.log("👤 Current user:", me);
      const { data } = await fetchTasks();
      const allTasks: Task[] = Array.isArray(data) ? data : data.tasks || [];
      console.log("📦 All tasks from API:", allTasks);

      if (!me) return;

      let filteredTasks: Task[] = [];

      if (me.role === "admin") {
        filteredTasks = allTasks.filter((task) => {
          const meId = String(me._id);

          // ✅ SAFELY extract assignedById
          const assignedById =
            task.assignedBy && typeof task.assignedBy === "object"
              ? String(task.assignedBy._id)
              : task.assignedBy
                ? String(task.assignedBy)
                : null;

          // ✅ SAFELY extract assignedToIds
          const assignedToIds = (task.assignedTo ?? []).map((u: any) =>
            typeof u === "object" ? String(u._id) : String(u)
          );

          console.log("🧪 ADMIN FILTER", {
            task: task.title,
            assignedById,
            assignedToIds,
            meId,
          });

          // 🟢 1. Legacy tasks (assignedBy = null)
          if (!assignedById) return true;

          // 🟢 2. Admin created tasks
          if (assignedById === meId) return true;

          // 🟢 3. TL self-assigned tasks
          if (
            assignedToIds.length === 1 &&
            assignedToIds[0] === assignedById
          ) {
            return true;
          }

          return false;
        });
      }

      else {
        filteredTasks = allTasks.filter((task) => {
          const assignedToIds = task.assignedTo?.map((u: any) =>
            String(u?._id ?? u)
          );

          return (
            assignedToIds?.includes(String(me._id)) ||
            String(task.assignedBy) === String(me._id)
          );
        });
      }

      setTasks(filteredTasks);
      console.log("✅ Filtered tasks:", filteredTasks);
    } catch (err) {
      console.error("❌ Error fetching tasks", err);
    } finally {
      setLoadingTasks(false);
    }
  };


  // Load projects
  const loadProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching projects", err);
    }
  };

  // Load students (interns only)
  const loadStudents = async () => {
    try {
      const res = await api.get("/users"); // Make sure this endpoint returns all users
      console.log("Users fetched:", res.data);

      const interns = Array.isArray(res.data)
        ? res.data.filter((user: any) => user.role === "student")
        : [];

      console.log("Filtered interns:", interns);
      setStudents(interns);
    } catch (err) {
      console.error("Error fetching students:", err);
      setStudents([]);
    }
  };

  useEffect(() => {
    if (!me) return;

    loadTasks();
    loadProjects();
    loadStudents();
  }, [me]);

  useEffect(() => {
    const project = projects.find(p => p._id === formData.project);
    if (project?.teamLead) {
      setFormData(f => ({ ...f, assignedTo: [project.teamLead] }));
    } else {
      setFormData(f => ({ ...f, assignedTo: [] }));
    }
  }, [formData.project, projects]);

  const displayName = me?.name || (me?.email ? me.email.split("@")[0] : "Admin");
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
    const routes: Record<string, string> = {
      Dashboard: "/admin-dashboard",
      "Intern Management": "/intern-management",
      "Task Management": "/task-management",
      "Project Management": "/project-management",
      "Attendance Reports": "/attendance-reports",
      "Program Reports": "/program-reports",
      "Timetable & Scheduling": "/admin-timetable",
    };
    navigate(routes[item]);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);

    const due = new Date(task.dueDate);

    setFormData({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      dueDate: due.toISOString().split("T")[0],
      dueTime: due.toTimeString().slice(0, 5),
      project: task.project || "",
    });

    setOpen(true);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.assignedTo.length) {
      toast.error("Please assign at least one student");
      return;
    }

    if (!formData.project) {
      toast.error("Please select a project");
      return;
    }

    if (!formData.dueDate) {
      toast.error("Please select a due date");
      return;
    }

    // Combine date and time
    const timeParts = formData.dueTime ? formData.dueTime.split(":").map(Number) : [0, 0];
    const dueDateWithTime = new Date(formData.dueDate);
    dueDateWithTime.setHours(timeParts[0], timeParts[1], 0, 0);
    const selectedProject = projects.find(p => p._id === formData.project || p.title === formData.project);
    if (!selectedProject.teamLead) {
      toast.error("Selected project does not have a team lead!");
      return;
    }

    // Check for past datetime
    if (dueDateWithTime.getTime() < new Date().getTime()) {
      toast.error("Due date/time cannot be in the past!");
      return;
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        assignedTo: [selectedProject.teamLead?.email], // send email instead of _id
        assignedBy: me?._id,
        project: selectedProject._id,

        dueDate: dueDateWithTime.toISOString()
      };


      console.log("Selected Project:", selectedProject);
      console.log("Team Lead:", selectedProject.teamLead);
      console.log("Payload:", {
        ...payload,
        assignedTo: [selectedProject.teamLead?._id],
        assignedBy: me?._id,
        project: selectedProject._id
      });

      if (editingTask) {
        await api.patch(`/tasks/${editingTask._id}`, payload); // update
        toast.success("✅ Task updated successfully!");
      } else {
        await createTask(payload); // create
        toast.success("✅ Task created successfully!");
      }

      setOpen(false);
      setEditingTask(null);
      setFormData({ title: "", description: "", assignedTo: [], dueDate: "", dueTime: "00:00", project: "" });
      setQuery("");
      loadTasks();
    } catch (err: any) {
      console.error(err);
      toast.error(`❌ ${editingTask ? "Updating" : "Creating"} task failed`);
    }

  };

  const isUpcoming = (task: Task) => {
    const today = new Date();
    const due = new Date(task.dueDate);
    const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    return (
      diff >= 0 &&
      diff <= 7 &&
      (task.status === "Assigned" || task.status === "In Progress")
    );
  };


  const isUrgent = (task: Task) => {
    const today = new Date();
    const due = new Date(task.dueDate);
    const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 2;
  };

  const formatDueDate = (dateString: string) => {
    const d = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    return d.toLocaleString("en-US", options); // shows actual time
  };



  type TaskCardProps = {
    task: Task;
    me?: CurrentUser | null;
    refreshTasks?: () => void;
    openEditModal?: (task: Task) => void;
    isUpcomingSection?: boolean;
    isMissedSection?: boolean; // new prop
    updatingTaskId?: string | null;
    showProgressOnly?: boolean;
  };
  const TaskCard: React.FC<TaskCardProps> = ({
    task,
    me,
    refreshTasks,
    openEditModal,
    isUpcomingSection = false, // true only for Upcoming Tasks section
    isMissedSection = false,
    updatingTaskId,
    showProgressOnly = false,
  }) => {
    const isAdmin = me?.role === "admin";
    const showApproveReject =
      isAdmin &&
      !isUpcomingSection &&
      (
        task.status === "Pending Approval" ||
        task.status === "Pending Admin Approval" ||
        task.status === "Pending Start Approval"
      );
    // only show for missed tasks if section

    // Status-based colors ONLY
    const statusStyles = {
      Assigned: { bg: "bg-blue-50", border: "border-l-blue-500", text: "text-gray-900" },
      "In Progress": { bg: "bg-yellow-50", border: "border-l-yellow-500", text: "text-gray-900" },
      "Pending Approval": { bg: "bg-amber-50", border: "border-l-amber-500", text: "text-gray-900" },
      "Pending Admin Approval": {
        bg: "bg-amber-50",
        border: "border-l-amber-500",
        text: "text-gray-900",
      },
      "Pending Start Approval": { bg: "bg-red-50", border: "border-l-red-500", text: "text-red-700" },
      Missed: { bg: "bg-red-50", border: "border-l-red-500", text: "text-red-700" },
      Completed: { bg: "bg-green-50", border: "border-l-green-500", text: "text-gray-900" },
    };

    if (!isUpcomingSection && !statusStyles[task.status]) {
      console.error("❌ Missing statusStyles for:", task.status);
    }
    const upcomingStyles = {
      bg: "bg-red-50",
      border: "border-l-red-500",
      text: "text-red-700",
    };



    if (!statusStyles[task.status]) {
      console.warn("⚠️ Unknown task status:", task.status);
    }

    // Decide colors
    const cardColors =
      isMissedSection
        ? statusStyles["Missed"]       // 🔴 RED only in Missed section
        : isUpcomingSection
          ? upcomingStyles
          : statusStyles[task.status] ?? statusStyles["Assigned"];

    const handleEdit = () => openEditModal?.(task);

    const handleDelete = async () => {
      if (!refreshTasks) return;

      const confirmed = window.confirm(
        `Are you sure you want to delete "${task.title}"?\nThis action cannot be undone.`
      );

      if (!confirmed) return;

      try {
        await deleteTask(task._id);
        toast.success("🗑️ Task deleted successfully");
        refreshTasks();
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete task");
      }
    };
    // Correct version for missed tasks
    const handleApprove = async (task: Task) => {
  if (!refreshTasks) return;

  try {
    const now = new Date();
    const due = new Date(task.dueDate);
    const isOverdue = due.getTime() < now.getTime() && task.status !== "Completed";

    // Only show new due date picker if task is overdue AND NOT fully done
    if (isOverdue && (task.progress ?? 0) < 100) {
      setEditingTask(task);
      setFormData({
        ...formData,
        dueDate: due.toISOString().split("T")[0],
        dueTime: due.toTimeString().slice(0, 5),
      });
      setShowDueDateInputsFor(task._id);
      return;
    }

    if (task.status === "Completed") {
      toast("✅ Task already completed");
      return;
    }

    // ✅ Approve the task
    await updateTaskStatus(task._id, "Completed");
    toast.success("✅ Task approved and completed");
    refreshTasks();
  } catch (err) {
    console.error("Approve task error:", err);
    toast.error("❌ Failed to approve task");
  }
};
    const handleReject = async () => {
      if (!refreshTasks) return;
      try {
        const fallbackStatus =
          task.status === "Pending Approval" ? "In Progress" : "Assigned";

        await updateTaskStatus(task._id, fallbackStatus);
        toast.success("Request rejected");
        refreshTasks();
      } catch (err) {
        console.error(err);
        toast.error("Failed to reject task");
      }
    };

    const formatDueDate = (dateString: string) => {
      const d = new Date(dateString);

      // Format date like "Nov 16, 5:00 PM"
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      };

      return d.toLocaleString("en-US", options);
    };


    const timeTaken = (task: Task) => {
      const startRaw = task.startDate || task.createdAt || null;
      const endRaw = task.completedDate || task.updatedAt || null;

      if (!startRaw || !endRaw) return "-";
      if (startRaw === "null" || endRaw === "null") return "-";

      const start = new Date(startRaw);
      const end = new Date(endRaw);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "-";
      if (end.getTime() < start.getTime()) return "-";

      let diff = Math.floor((end.getTime() - start.getTime()) / 1000);

      const days = Math.floor(diff / (3600 * 24));
      diff -= days * 3600 * 24;
      const hours = Math.floor(diff / 3600);
      diff -= hours * 3600;
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;

      const parts: string[] = [];
      if (days) parts.push(`${days}d`);
      if (hours) parts.push(`${hours}h`);
      if (minutes) parts.push(`${minutes}m`);
      if (seconds) parts.push(`${seconds}s`);

      return parts.join(" ") || "0s";
    };

    return (
      <Card
        className={`w-full max-w-[400px] ${cardColors.bg} ${cardColors.border} border-l-4 rounded-lg shadow-sm hover:shadow-md transition-shadow relative`}
      >
        <CardContent className="p-4 flex flex-col justify-between">
          {isAdmin && (
            <div className="absolute top-2 right-2 flex gap-2">
              <button onClick={handleEdit} className="p-1 hover:bg-gray-200 rounded-full" title="Edit Task">
                <Edit2 size={16} />
              </button>
              <button onClick={handleDelete} className="p-1 hover:bg-gray-200 rounded-full" title="Delete Task">
                <Trash2 size={16} />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <h4 className={`font-semibold ${cardColors.text}`}>{task.title}</h4>
            <p className="text-sm text-gray-600">{task.description}</p>

            <div className="text-xs text-gray-500">
              Assigned to:{" "}
              <span className="font-medium text-gray-700">{task.assignedTo.map((s) => s.name).join(", ")}</span>
            </div>

            <div className={`text-xs font-semibold ${cardColors.text}`}>Due: {formatDueDate(task.dueDate)}</div>

            {task.status === "Completed" && (
              <div className="text-xs text-gray-500">Time Taken: {timeTaken(task)}</div>
            )}
          </div>

          {showProgressOnly ? (
            <div className="mt-3">
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-3 rounded-full"
                  style={{ width: `${task.progress ?? 0}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">{task.progress ?? 0}% Completed</div>
            </div>
          ) : (
            <>
              {isMissedSection && showDueDateInputsFor === task._id ? (
                <div className="mt-3 flex flex-col gap-2">
                  {/* New due date picker */}
                  <Label className="font-medium text-gray-700">Set New Due Date</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      min={new Date().toISOString().split("T")[0]}
                    />
                    <Input
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                      className="rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const [h, m] = formData.dueTime.split(":").map(Number);
                      const newDue = new Date(formData.dueDate);
                      newDue.setHours(h, m, 0, 0);

                      api.patch(`/tasks/${task._id}`, {
                        dueDate: newDue.toISOString(),
                        status: "Assigned",
                        progress: 0,
                        startDate: null,
                        completedDate: null,
                      })
                        .then(() => {
                          toast.success("✅ New due date set. Task reactivated.");
                          setShowDueDateInputsFor(null);
                          refreshTasks?.();
                        })
                        .catch(() => toast.error("❌ Failed to set due date"));
                    }}
                  >
                    Save Due Date
                  </Button>

                </div>
              ) : (
                showApproveReject && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={() => handleApprove(task)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                      disabled={updatingTaskId === task._id}
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={handleReject}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white flex-1"
                      disabled={updatingTaskId === task._id}
                    >
                      Reject
                    </Button>
                  </div>
                )
              )}

            </>
          )}

        </CardContent>
      </Card>
    );
  };
  const tasksByStatus = {
    "To Do": tasks.filter((t) => t.status === "Assigned"),
    "In Progress": tasks.filter((t) => t.status === "In Progress"),
    "Pending Approval": tasks.filter(
      (t) =>
        t.status === "Pending Approval" ||
        t.status === "Pending Admin Approval" // ✅ ADD
    ),
    Completed: tasks.filter((t) => t.status === "Completed"),
  };
  const missedTasks = tasks.filter((t) => {
    const now = new Date();
    const due = new Date(t.dueDate);

    const isOverdue = due.getTime() < now.getTime();
    const notCompleted = t.status !== "Completed";

    // ✅ Exclude tasks that are fully done by student but pending admin approval
    const excludePendingAdmin =
      t.status === "Pending Admin Approval" && (t.progress ?? 0) === 100;

    return isOverdue && notCompleted && !excludePendingAdmin;
  });


  const upcomingTasks = tasks.filter(isUpcoming);
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" reverseOrder={false} />
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200">
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

        <nav className="p-4 space-y-1">
          {[
            { icon: LayoutDashboard, label: "Dashboard" },
            { icon: Users, label: "Intern Management" },
            { icon: ClipboardList, label: "Task Management" },
            { icon: FolderKanban, label: "Project Management" },
            { icon: FileText, label: "Attendance Reports" },
            { icon: BarChart3, label: "Program Reports" },
            { icon: Calendar, label: "Timetable & Scheduling" },
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item.label)}
              className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${item.label === "Task Management"
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
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Task Management</h1>
              <p className="text-xs text-gray-500">{loadingMe ? "…" : me?.role === "admin" ? "Admin" : "User"}</p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Create Task Dialog */}
              <Dialog open={open} onOpenChange={setOpen}>
                <Button
                  onClick={() => {
                    setEditingTask(null);
                    setFormData({
                      title: "",
                      description: "",
                      assignedTo: [],
                      dueDate: "",
                      dueTime: "00:00",
                      project: "",
                    });
                    setOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2 px-4 py-2 rounded shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Task</span>
                </Button>


                <DialogContent className="sm:max-w-2xl w-full max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-xl border border-gray-200">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                      {editingTask ? "Edit Task" : "Create New Task"}
                    </DialogTitle>

                    <p className="text-sm text-gray-500">Fill in the details below to create a new task.</p>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-6 px-8 py-8">


                    {/* Task Name */}
                    <div>
                      <Label className="font-medium text-gray-700">Task Name</Label>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter task title"
                        className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <Label className="font-medium text-gray-700">Description</Label>
                      <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter task description"
                        className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={3}
                        required
                      />
                    </div>

                    {/* Assign To (Interns list with improved UI/UX) */}
                    <div>
                      <Label className="font-medium text-gray-700">Assign To</Label>
                      <div className="relative mt-1">
                        {/* Selected interns as chips */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.assignedTo.map((s) => (
                            <span
                              key={s._id}
                              className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm shadow-sm"
                            >
                              <div className="flex flex-col leading-tight">
                                <span className="font-medium">{s.name}</span>
                                <span className="text-xs text-blue-700">{s.email}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    assignedTo: formData.assignedTo.filter((stu) => stu._id !== s._id),
                                  })
                                }
                                className="text-blue-700 hover:text-blue-900 font-bold"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* List of interns with checkboxes */}
                        <div className="border border-gray-300 rounded-lg shadow-sm max-h-64 overflow-auto p-2 bg-white">
                          {(() => {
                            // Determine options based on role
                            let options: Student[] = [];
                            if (me?.role === "admin") {
                              const project = projects.find((p) => p._id === formData.project);
                              if (project && project.teamLead) {
                                options = [project.teamLead];
                              }
                            } else {
                              // Team lead or others
                              options = students;
                            }

                            if (options.length === 0) {
                              return <p className="text-gray-500 p-2">No interns found.</p>;
                            }

                            return options.map((student) => {
                              const checked = formData.assignedTo.some((s) => s._id === student._id);
                              return (
                                <label
                                  key={student._id}
                                  className={`flex items-center justify-between gap-2 p-2 mb-1 rounded cursor-pointer hover:bg-blue-50 ${checked ? "bg-blue-100" : ""
                                    }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      className="accent-blue-600"
                                      checked={checked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setFormData({
                                            ...formData,
                                            assignedTo: [...formData.assignedTo, student],
                                          });
                                        } else {
                                          setFormData({
                                            ...formData,
                                            assignedTo: formData.assignedTo.filter((s) => s._id !== student._id),
                                          });
                                        }
                                      }}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium text-gray-900">{student.name}</span>
                                      <span className="text-xs text-gray-500">{student.email}</span>
                                    </div>
                                  </div>
                                  {checked && <Check className="w-5 h-5 text-blue-600" />}
                                </label>
                              );
                            });
                          })()}
                        </div>

                      </div>
                    </div>


                    {/* Due Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Date */}
                      <div>
                        <Label className="font-medium text-gray-700">Due Date</Label>
                        <Input
                          type="date"
                          name="dueDate"
                          value={formData.dueDate.split("T")[0] || ""}
                          onChange={(e) => handleChange(e)}
                          className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          min={new Date().toISOString().split("T")[0]} // prevents past dates
                          required
                        />
                      </div>

                      {/* Time */}
                      <div>
                        <Label className="font-medium text-gray-700">Due Time</Label>
                        <Input
                          type="time"
                          name="dueTime"
                          value={formData.dueTime || "00:00"}
                          onChange={(e) =>
                            setFormData({ ...formData, dueTime: e.target.value })
                          }
                          className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>



                    {/* Project */}
                    <div>
                      <Label className="font-medium text-gray-700">Project</Label>
                      <select
                        name="project"
                        value={formData.project}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-lg border-gray-300 shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">-- Select Project --</option>
                        {projects.map((p) => (
                          <option key={p._id} value={p._id}>{p.title}</option>

                        ))}
                      </select>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow"
                      >
                        {editingTask ? "Update Task" : "Create Task"}
                      </Button>

                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={me?.picture || ""} alt={displayName} />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-700">{displayName}</span>
                <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:text-red-600 p-2">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto space-y-10">

          {/* UPCOMING TASKS (FULL WIDTH LIKE YOUR SCREENSHOT STYLE) */}
          {upcomingTasks.length > 0 && (
            <section className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">⏰Upcoming Tasks This Week</h2>
                <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full">
                  {upcomingTasks.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    me={me}
                    refreshTasks={loadTasks}
                    openEditModal={handleOpenEditModal}
                    isUpcomingSection={true} // ✅ force red ONLY here
                    updatingTaskId={updatingTaskId}
                  />
                ))}

              </div>
            </section>
          )}
          {me?.role === "admin" && missedTasks.length > 0 && (
            <section className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">⚠️ Missed Tasks</h2>
                <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full">
                  {missedTasks.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {missedTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    me={me}
                    refreshTasks={loadTasks}
                    openEditModal={handleOpenEditModal}
                    isUpcomingSection={false} // not upcoming
                    isMissedSection={true}    // NEW prop
                    updatingTaskId={updatingTaskId}
                  />
                ))}

              </div>
            </section>
          )}



          {/* PENDING APPROVAL (FULL WIDTH LIKE YOUR SS) */}
          {tasksByStatus["Pending Approval"].length > 0 && (
            <section className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Pending Approval</h2>
                <span className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                  {tasksByStatus["Pending Approval"].length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasksByStatus["Pending Approval"].map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    me={me}
                    refreshTasks={loadTasks}
                    openEditModal={handleOpenEditModal} // see next step
                    isUpcomingSection={false}
                    updatingTaskId={updatingTaskId}
                  />

                ))}
              </div>
            </section>
          )}

          {/* MAIN 3 COLUMNS EXACTLY LIKE YOUR SCREENSHOT */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* TO DO */}
            <div className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">To Do</h2>
                <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                  {tasksByStatus["To Do"].length}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {tasksByStatus["To Do"].map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    me={me}
                    refreshTasks={loadTasks}
                    openEditModal={handleOpenEditModal} // see next step
                    isUpcomingSection={false}
                    updatingTaskId={updatingTaskId}
                  />

                ))}
              </div>
            </div>

            {/* IN PROGRESS */}
            <div className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">In Progress</h2>
                <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  {tasksByStatus["In Progress"].length}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {tasksByStatus["In Progress"].map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    me={me}
                    refreshTasks={loadTasks}
                    openEditModal={handleOpenEditModal} // see next step
                    isUpcomingSection={false}
                    updatingTaskId={updatingTaskId}
                    showProgressOnly={true}
                  />

                ))}
              </div>
            </div>

            {/* COMPLETED */}
            <div className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Completed</h2>
                <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  {tasksByStatus["Completed"].length}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {tasksByStatus["Completed"].map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    me={me}
                    refreshTasks={loadTasks}
                    openEditModal={handleOpenEditModal} // see next step
                    isUpcomingSection={false}
                    updatingTaskId={updatingTaskId}
                  />
                ))}
              </div>
            </div>

          </section>
        </main>
      </div>
    </div>
  );
};

export default TaskManagement;
