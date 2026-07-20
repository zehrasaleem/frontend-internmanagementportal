import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  Calendar,
  Plus,
  Check,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import api, { createTask, fetchTasks, updateTaskStatus, deleteTask, denyTaskStart } from "@/api/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster, toast } from "react-hot-toast";
import { getErrorMessage } from "@/utils/errorMessage";

type TaskStatus =
  | "Assigned"
  | "In Progress"
  | "Pending Approval"
  | "Completed"
  | "Pending Start Approval"
  | "Missed"
  | "Pending TL Approval"
  | "Pending Admin Approval"
  | "Rejected"
  | "Upcoming";

const statusStyles: Record<
  TaskStatus,
  { border: string; bg: string; text: string; badgeBg: string; badgeText: string }
> = {
  Upcoming: { border: "#E11D48", bg: "#FFF1F2", text: "#881337", badgeBg: "#FFE4E6", badgeText: "#BE123C" },
  Assigned: { border: "#A855F7", bg: "#F5F3FF", text: "#5B21B6", badgeBg: "#EDE9FE", badgeText: "#6D28D9" },
  "In Progress": { border: "#7C3AED", bg: "#F3F0FF", text: "#4C1D95", badgeBg: "#EDE9FE", badgeText: "#6D28D9" },
  "Pending Start Approval": { border: "#D97706", bg: "#FFFBEB", text: "#92400E", badgeBg: "#FEF3C7", badgeText: "#B45309" },
  "Pending Approval": { border: "#F59E0B", bg: "#FFFBEB", text: "#92400E", badgeBg: "#FEF3C7", badgeText: "#B45309" },
  "Pending Admin Approval": { border: "#F59E0B", bg: "#FFFBEB", text: "#92400E", badgeBg: "#FEF3C7", badgeText: "#B45309" },
  "Pending TL Approval": { border: "#F59E0B", bg: "#FFFBEB", text: "#92400E", badgeBg: "#FEF3C7", badgeText: "#B45309" },
  Missed: { border: "#2563EB", bg: "#EFF6FF", text: "#1E3A8A", badgeBg: "#DBEAFE", badgeText: "#1D4ED8" },
  Rejected: { border: "#DC2626", bg: "#FEF2F2", text: "#991B1B", badgeBg: "#FEE2E2", badgeText: "#B91C1C" },
  Completed: { border: "#800080", bg: "#F5E6F5", text: "#4B004B", badgeBg: "#E6BFE6", badgeText: "#800080" },
};

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin" | "teamLead";
  picture?: string;
};

type AssignedUser = {
  _id: string;
  name: string;
  email: string;
};

type Student = {
  _id: string;
  name: string;
  email: string;
  role?: "student" | "teamLead";
};

type Project = {
  _id: string;
  title: string;
  teamLead: string | { _id: string };
  assignedTo: (string | { _id: string; email: string })[];
};

type Task = {
  _id: string;
  title: string;
  description: string;
  assignedTo: AssignedUser[];
  assignedBy: string | { _id: string; role: "admin" | "teamLead" };
  dueDate: string;
  status: TaskStatus; 
  project: { _id: string; title: string } | string;
  startDate?: string | null;
  completedDate?: string | null;
  progress?: number;
  approvedBy?: string | null;
  approvedByRole?: "admin" | "teamLead" | null;
  rejectionReason?: string;
  rejectedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const TeamLeadTaskManagement = () => {
  const navigate = useNavigate();

  const [activeItem, setActiveItem] = useState("Task Management");
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<Student[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);


  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: [] as string[],
    dueDate: "",
    dueTime: "00:00",
    project: "",
  });

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

  const handleNavigation = (item: string) => {
    setActiveItem(item);
    if (item === "Dashboard") navigate("/teamlead-dashboard");
    else if (item === "Task Management") navigate("/teamlead-task-management");
    else if (item === "Timetable & Scheduling") navigate("/teamlead-timetable");
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: ClipboardList, label: "Task Management" },
    { icon: Calendar, label: "Timetable & Scheduling" },
  ];

  useEffect(() => {
    if (!me) return;

    (async () => {
      setLoading(true);
      try {
        const [tasksRes, projectsRes, usersRes] = await Promise.all([
          fetchTasks(),
          api.get("/projects"),
          api.get("/users"),
        ]);

        const allTasks = tasksRes.data.tasks || tasksRes.data;
        const allProjects = projectsRes.data;
        const students = usersRes.data.filter((u: any) => u.role === "student");

        setTasks(allTasks);
        setAllProjects(allProjects);
        setAllUsers(students);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, [me]);

  const leadProjects = allProjects.filter((p) => {
    const leadId = typeof p.teamLead === "string" ? p.teamLead : p.teamLead?._id;
    return leadId === me?._id;
  });

  const leadProjectIds = leadProjects.map((p) => p._id);

  const scopedTasks = tasks.filter((t) => {
    const assignedById =
      typeof t.assignedBy === "string" ? t.assignedBy : t.assignedBy?._id;
    return assignedById === me?._id;
  });

  const assignableStudents = useMemo(() => {
    if (!formData.project) return [];

    const project = leadProjects.find((p) => String(p._id) === formData.project);
    if (!project || !Array.isArray(project.assignedTo)) return [];

    const projectMembers = project.assignedTo.map((m) =>
      typeof m === "string" ? m : m.email
    );

    let students = allUsers.filter((u) => projectMembers.includes(u.email));

    const tlSelected = formData.assignedTo.includes(me?.email || "");
    if (tlSelected) {
      students = students.filter((s) => s._id === me?._id);
    }

    return students;
  }, [formData.project, formData.assignedTo, leadProjects, allUsers, me]);

  const now = new Date();

  const upcomingTasks = scopedTasks.filter(
    (t) => t.status === "Assigned" && new Date(t.dueDate) > now
  );

  const rejectedTasks = scopedTasks.filter((t) => t.status === "Rejected");
  const missedTasks = scopedTasks.filter((t) => {
    const isPastDue = new Date(t.dueDate) < now;
    const isExplicitMissedFlow =
      t.status === "Missed" || t.status === "Pending Start Approval";

    const isPastDueMissedFlow =
      isPastDue &&
      (t.status === "Assigned" ||
        t.status === "In Progress" ||
        t.status === "Missed" ||
        t.status === "Pending Start Approval");

    return isExplicitMissedFlow || isPastDueMissedFlow;
  });

  const pendingApprovalTasks = scopedTasks.filter((t) => {
    const isNormalPending =
      t.status === "Pending Approval" || t.status === "Pending TL Approval";
    const isProgress100 = typeof t.progress === "number" ? t.progress >= 100 : false;
    return isNormalPending && isProgress100;
  });

  const todoTasks = scopedTasks.filter((t) => t.status === "Assigned");
  const inProgressTasks = scopedTasks.filter((t) => t.status === "In Progress");
  const completedTasks = scopedTasks.filter((t) => t.status === "Completed");
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "assignedTo") {
      const options = (e.target as HTMLSelectElement).options;
      const selected: string[] = [];
      for (let i = 0; i < options.length; i++)
        if (options[i].selected) selected.push(options[i].value);
      setFormData({ ...formData, assignedTo: selected });
    } else if (name === "project") {
      setFormData({ ...formData, project: value, assignedTo: [] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  const handleOpenEditModal = (task) => {
    setEditingTask(task);

    setFormData({
      title: task.title,
      description: task.description,
      project: task.project?._id || "",
      assignedTo: [], 
      dueDate: task.dueDate,
      dueTime: task.dueTime,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const due = new Date(formData.dueDate);
    const [h, m] = formData.dueTime.split(":").map(Number);
    due.setHours(h, m, 0, 0);

    const now = new Date();
    if (due < now) {
      toast.error("You cannot assign a task in the past");
      return;
    }

    const payload = {
      ...formData,
      project: String(formData.project),
      assignedTo: formData.assignedTo,
      dueDate: due.toISOString(),
    };

    try {
      if (editingTask) {
        await api.patch(`/tasks/${editingTask._id}`, payload);

        if (editingTask.status === "Missed" && due > now) {
          await api.patch(`/tasks/${editingTask._id}`, {
            dueDate: due.toISOString(),
            status: "Assigned",
            startDate: null,
            completedDate: null,
          });
          toast.success("✅ Missed task reactivated with new due date");
        }
      } else {
        await createTask(payload);
      }

      toast.success("Task saved");
      setOpen(false);
      setEditingTask(null);

      const res = await fetchTasks();
      setTasks(res.data.tasks || res.data);
    } catch (err: unknown) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed To Save Task"));
    }
  };

  type TaskCardProps = {
    task: Task;
    me?: CurrentUser | null;
    refreshTasks?: () => void;
    openEditModal?: (task: Task) => void;
    isUpcomingSection?: boolean;
    isMissedSection?: boolean;
    isInProgressSection?: boolean;
    leadProjectIds: string[];
  };

  const TaskCard: React.FC<TaskCardProps> = ({
    task,
    me,
    refreshTasks,
    openEditModal,
    isUpcomingSection = false,
    isMissedSection = false,
    isInProgressSection = false,
  }) => {
    const isAdmin = me?.role === "admin";

    const isTeamLeadTask = (() => {
      const assignedById =
        typeof task.assignedBy === "string" ? task.assignedBy : task.assignedBy?._id;
      return assignedById === me?._id;
    })();

    const canSeeActionsOwner = isAdmin || isTeamLeadTask;

    const now = new Date();
    const isPastDue = new Date(task.dueDate) < now;

    const needsNewDueDate =
      isPastDue && (task.status === "Missed" || task.status === "Pending Start Approval");

    const showApproveReject =
      canSeeActionsOwner &&
      !isUpcomingSection &&
      !task.assignedTo.some((u) => u._id === me?._id) &&
      (
        task.status === "Pending Approval" ||
        task.status === "Pending TL Approval" ||
        (isMissedSection && task.status === "Pending Start Approval")
      );


    const [showDueDateInputsFor, setShowDueDateInputsFor] = useState<string | null>(null);
    const [newDueDate, setNewDueDate] = useState<string>("");
    const [newDueTime, setNewDueTime] = useState<string>("00:00");

    const getProjectName = (project?: { title?: string } | string) => {
      if (!project) return "—";
      if (typeof project === "string") return project;
      return project.title || "—";
    };

    const formatDueDate = (dateString: string) => {
      const d = new Date(dateString);
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

    const styles =
      isUpcomingSection
        ? statusStyles["Upcoming"]
        : isMissedSection
          ? statusStyles["Missed"]
          : statusStyles[task.status];

    const handleReject = async (task: Task) => {
      if (!refreshTasks) return;
      try {
        const reason = window.prompt("Reason (optional):", "") || "";

        if (task.status === "Pending Start Approval") {
          await denyTaskStart(task._id, reason);
          toast.success("Start request denied");
        } else {
          await updateTaskStatus(task._id, "Rejected", reason);
          toast.success("Task rejected");
        }
        refreshTasks();
      } catch (err) {
        console.error(err);
        toast.error("Failed to process rejection");
      }
    };

    const handleApprove = async (task: Task) => {
      if (!refreshTasks) return;

      try {
        if (needsNewDueDate) {
          setShowDueDateInputsFor(task._id);
          return;
        }

        if (
          task.status === "Pending Approval" ||
          task.status === "Pending TL Approval"
        ) {
          await updateTaskStatus(task._id, "Completed");
          toast.success("✅ Task approved and marked Completed");
          refreshTasks();
          return;
        }

        if (task.status === "Pending Start Approval") {
          await updateTaskStatus(task._id, "Assigned");
          toast.success("✅ Start approved. Task reactivated.");
          refreshTasks();
          return;
        }

        toast.error("Cannot approve task at this stage");
      } catch (err) {
        console.error(err);
        toast.error("❌ Failed to approve task");
      }
    };

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

    return (
      <Card
        className="w-full max-w-[400px] rounded-lg shadow-sm hover:shadow-md transition-shadow relative"
        style={{
          backgroundColor: styles.bg,
          borderLeft: `4px solid ${styles.border}`,
        }}
      >
        <CardContent className="p-4 flex flex-col justify-between">
          {canSeeActionsOwner && (
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => openEditModal?.(task)}
                className="p-1 hover:bg-gray-200 rounded-full"
                title="Edit Task"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 hover:bg-gray-200 rounded-full"
                title="Delete Task"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <h4 className="font-semibold" style={{ color: styles.text }}>
              {task.title}
            </h4>

            <div className="text-xs font-medium text-purple-700">
              Project: {getProjectName(task.project)}
            </div>

            <p className="text-sm text-gray-600">{task.description}</p>

            <div className="text-xs text-gray-500">
              Assigned to:{" "}
              <span className="font-medium text-gray-700">
                {task.assignedTo?.map((u) => u.name || u.email).join(", ")}
              </span>
            </div>

            <div className="text-xs font-semibold" style={{ color: styles.text }}>
              Due: {formatDueDate(task.dueDate)}
            </div>

            {typeof task.progress === "number" && task.status === "In Progress" && isInProgressSection && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{task.progress}%</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-purple-600 transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            )}

            {task.status === "Completed" && (
              <div className="text-xs text-gray-500">
                Time Taken: {timeTaken(task)}
              </div>
            )}
            {task.status === "Rejected" && (
              <div className="mt-2 rounded-md bg-red-100 border border-red-300 px-3 py-2">
                <p className="text-xs font-semibold text-red-700">❌ Task Rejected</p>
                {task.rejectionReason && (
                  <p className="text-xs text-red-600 mt-1">Reason: {task.rejectionReason}</p>
                )}
              </div>
            )}
          </div>

          {showApproveReject &&
            (showDueDateInputsFor === task._id ? (
              <div className="mt-3 flex flex-col gap-2">
                <Label className="font-medium text-gray-700">Set New Due Date</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="rounded-lg border-gray-300 shadow-sm"
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <Input
                    type="time"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="rounded-lg border-gray-300 shadow-sm"
                  />
                </div>

                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white flex-1 mt-2"
                  disabled={!newDueDate || !newDueTime}
                  onClick={async () => {
                    if (!refreshTasks) return;

                    const due = new Date(newDueDate);
                    const [h, m] = newDueTime.split(":").map(Number);
                    due.setHours(h, m, 0, 0);

                    if (due.getTime() <= Date.now()) {
                      toast.error("New due date/time must be in the future.");
                      return;
                    }

                    try {
                      await api.patch(`/tasks/${task._id}`, {
                        dueDate: due.toISOString(),
                        status: "Assigned",
                        progress: 0,
                        startDate: null,
                        completedDate: null,
                      });
                      toast.success("✅ New due date set. Task reactivated.");
                      setShowDueDateInputsFor(null);
                      setNewDueDate("");
                      setNewDueTime("00:00");
                      refreshTasks();
                    } catch (err) {
                      console.error(err);
                      toast.error("❌ Failed to set due date and approve");
                    }
                  }}
                >
                  Save Due Date
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-600"
                  onClick={() => setShowDueDateInputsFor(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  onClick={() => handleApprove(task)}
                >
                  Approve
                </Button>

                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white flex-1"
                  onClick={() => handleReject(task)}
                >
                  Reject
                </Button>
              </div>
            ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <div className="ml-3">
              <h1 className="font-semibold text-gray-900 text-sm">Team Lead</h1>
              <p className="text-xs text-gray-500">Intern Management Portal</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item.label)}
              className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-all duration-200 ${item.label === activeItem
                ? "bg-purple-50 text-purple-600 border-l-4 border-purple-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="ml-3 font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Header + Main Content */}
      <div className="ml-64">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-xl font-semibold text-gray-900">Task Management</h1>

            <div className="flex items-center space-x-4">
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
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-2 px-4 py-2 rounded shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Task</span>
                </Button>

                <DialogContent className="sm:max-w-2xl w-full max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-xl border border-gray-200">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-purple-600 mb-2">
                      {editingTask ? "Edit Task" : "Create New Task"}
                    </DialogTitle>
                    <p className="text-sm text-gray-500">
                      Fill in the details below to create a new task.
                    </p>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-6 px-8 py-8">
                    <div>
                      <Label className="font-medium text-purple-600">Task Name</Label>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter task title"
                        className="mt-1 w-full rounded-lg border-purple-600 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-50 focus:outline-none"
                      />
                    </div>

                    <div>
                      <Label className="font-medium text-purple-600">Description</Label>
                      <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter task description"
                        className="mt-1 w-full rounded-lg border-purple-600 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-50 focus:outline-none resize-none"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label className="font-medium text-purple-600">Project</Label>
                      <select
                        name="project"
                        value={formData.project}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-lg border-purple-600 shadow-sm px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-50 focus:outline-none"
                        required
                      >
                        <option value="" disabled>
                          -- Select Project --
                        </option>
                        {leadProjects.map((p) => (
                          <option key={String(p._id)} value={String(p._id)}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Assign To */}
                    <div>
                      <Label className="font-medium text-purple-600">Assign To</Label>
                      <div className="relative mt-1">
                        {/* Selected interns chips */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.assignedTo.map((id) => {
                            const student = allUsers.find((s) => s.email === id);
                            if (!student) return null;
                            return (
                              <span
                                key={student._id}
                                className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm shadow-sm"
                              >
                                <div className="flex flex-col leading-tight">
                                  <span className="font-medium">{student.name}</span>
                                  <span className="text-xs text-purple-700">{student.email}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      assignedTo: prev.assignedTo.filter((email) => email !== student.email),
                                    }))
                                  }
                                  className="text-purple-700 hover:text-purple-900 font-bold"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>

                        {/* Checkbox list */}
                        <div className="border border-purple-300 rounded-lg shadow-sm max-h-64 overflow-auto p-2 bg-white">
                          {assignableStudents.length > 0 ? (
                            assignableStudents.map((student) => {
                              const checked = formData.assignedTo.includes(student.email);

                              const tlSelected = formData.assignedTo.includes(me?.email || "");
                              const disableOther = tlSelected && student._id !== me?._id;

                              return (
                                <label
                                  key={student._id}
                                  className={`flex items-center justify-between gap-2 p-2 mb-1 rounded cursor-pointer hover:bg-purple-50 ${checked ? "bg-purple-100" : ""
                                    } ${disableOther ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      className="accent-purple-600"
                                      checked={checked}
                                      disabled={disableOther}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          if (student._id === me?._id) {
                                            setFormData((prev) => ({ ...prev, assignedTo: [me!.email] }));
                                          } else {
                                            setFormData((prev) => ({
                                              ...prev,
                                              assignedTo: [
                                                ...prev.assignedTo.filter((email) => email !== me?.email),
                                                student.email,
                                              ],
                                            }));
                                          }
                                        } else {
                                          setFormData((prev) => ({
                                            ...prev,
                                            assignedTo: prev.assignedTo.filter((email) => email !== student.email),
                                          }));
                                        }
                                      }}
                                    />

                                    <div className="flex flex-col">
                                      <span className="font-medium text-purple-900">{student.name}</span>
                                      <span className="text-xs text-purple-500">{student.email}</span>
                                    </div>
                                  </div>
                                  {checked && <Check className="w-5 h-5 text-purple-600" />}
                                </label>
                              );
                            })
                          ) : (
                            <p className="text-gray-500 p-2">No students available.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Due Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                      />
                      <Input
                        type="time"
                        name="dueTime"
                        value={formData.dueTime}
                        onChange={handleChange}
                        min={
                          formData.dueDate === new Date().toISOString().split("T")[0]
                            ? new Date().toTimeString().slice(0, 5)
                            : "00:00"
                        }
                      />
                    </div>

                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow">
                      {editingTask ? "Update Task" : "Create Task"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Avatar className="w-8 h-8">
                <AvatarImage src={me?.picture || ""} alt={displayName} />
                <AvatarFallback className="bg-purple-200 text-purple-600 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <span className="text-sm text-gray-700">
                {loadingMe ? "Loading..." : displayName}
              </span>

              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <LogOut className="w-4 h-4 mr-1" /> Log Out
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto space-y-10">
          {upcomingTasks.length > 0 && (
            <section className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">⏰ Upcoming Tasks</h2>
                <span
                  className="text-sm px-3 py-1 rounded-full"
                  style={{ backgroundColor: statusStyles["Upcoming"].badgeBg, color: statusStyles["Upcoming"].badgeText }}
                >
                  {upcomingTasks.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    me={me}
                    refreshTasks={async () => {
                      const res = await fetchTasks();
                      setTasks(res.data.tasks || res.data);
                    }}
                    openEditModal={handleOpenEditModal}
                    isUpcomingSection
                    leadProjectIds={leadProjectIds}
                  />
                ))}
              </div>
            </section>
          )}

          {missedTasks.length > 0 && (
            <section className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">⚠️ Missed Tasks</h2>
                <span
                  className="text-sm px-3 py-1 rounded-full"
                  style={{ backgroundColor: statusStyles["Missed"].badgeBg, color: statusStyles["Missed"].badgeText }}
                >
                  {missedTasks.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {missedTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    me={me}
                    refreshTasks={async () => {
                      const res = await fetchTasks();
                      setTasks(res.data.tasks || res.data);
                    }}
                    openEditModal={handleOpenEditModal}
                    isMissedSection
                    leadProjectIds={leadProjectIds}
                  />
                ))}
              </div>
            </section>
          )}

          {pendingApprovalTasks.length > 0 && (
            <section className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Pending Approval</h2>
                <span
                  className="text-sm px-3 py-1 rounded-full"
                  style={{ backgroundColor: statusStyles["Pending Approval"].badgeBg, color: statusStyles["Pending Approval"].badgeText }}
                >
                  {pendingApprovalTasks.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingApprovalTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    me={me}
                    refreshTasks={async () => {
                      const res = await fetchTasks();
                      setTasks(res.data.tasks || res.data);
                    }}
                    openEditModal={handleOpenEditModal}
                    leadProjectIds={leadProjectIds}
                  />
                ))}
              </div>
            </section>
          )}

          {rejectedTasks.length > 0 && (
            <section className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">❌ Rejected Tasks</h2>
                <span
                  className="text-sm px-3 py-1 rounded-full"
                  style={{ backgroundColor: statusStyles["Rejected"].badgeBg, color: statusStyles["Rejected"].badgeText }}
                >
                  {rejectedTasks.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rejectedTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    me={me}
                    refreshTasks={async () => {
                      const res = await fetchTasks();
                      setTasks(res.data.tasks || res.data);
                    }}
                    openEditModal={handleOpenEditModal}
                    leadProjectIds={leadProjectIds}
                  />
                ))}
              </div>
            </section>
          )}

          {/* THREE MAIN COLUMNS */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">To Do</h2>
                <span
                  className="text-sm px-3 py-1 rounded-full"
                  style={{ backgroundColor: statusStyles["Assigned"].badgeBg, color: statusStyles["Assigned"].badgeText }}
                >
                  {todoTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {todoTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    me={me}
                    refreshTasks={async () => {
                      const res = await fetchTasks();
                      setTasks(res.data.tasks || res.data);
                    }}
                    openEditModal={handleOpenEditModal}
                    leadProjectIds={leadProjectIds}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">In Progress</h2>
                <span
                  className="text-sm px-3 py-1 rounded-full"
                  style={{ backgroundColor: statusStyles["In Progress"].badgeBg, color: statusStyles["In Progress"].badgeText }}
                >
                  {inProgressTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {inProgressTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    me={me}
                    refreshTasks={async () => {
                      const res = await fetchTasks();
                      setTasks(res.data.tasks || res.data);
                    }}
                    openEditModal={handleOpenEditModal}
                    leadProjectIds={leadProjectIds}
                    isInProgressSection
                  />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Completed</h2>
                <span
                  className="text-sm px-3 py-1 rounded-full"
                  style={{ backgroundColor: statusStyles["Completed"].badgeBg, color: statusStyles["Completed"].badgeText }}
                >
                  {completedTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    me={me}
                    refreshTasks={async () => {
                      const res = await fetchTasks();
                      setTasks(res.data.tasks || res.data);
                    }}
                    openEditModal={handleOpenEditModal}
                    leadProjectIds={leadProjectIds}
                  />
                ))}
              </div>
            </div>
          </section>

          {loading && (
            <div className="text-center text-gray-500 py-10">
              Loading tasks...
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TeamLeadTaskManagement;