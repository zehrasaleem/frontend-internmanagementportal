import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import StudentSidebar from "@/components/students/StudentSidebar";
import StudentNavbar from "@/components/students/StudentNavbar";
import { useNavigate } from "react-router-dom";
import { fetchTasks, updateTaskStatus, updateTaskProgress } from "@/api/api";
import { requestTaskStart } from "@/api/api";
import { requestTaskApproval } from "@/api/api";
import { Toaster, toast } from "react-hot-toast";

// Add inside your App component (or top-level)
function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <StudentTasks />
    </>
  );
}

// -------------------- User Type --------------------
type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
};

// -------------------- StudentTasks Component --------------------
type UserRef = {
  _id: string;
  name: string;
  email: string;
};

type AssignedUser = UserRef & { role: "student" | "teamLead" };

type TaskWithVirtual = Task & {
  virtualStatus: Task["status"];
  wasStarted: boolean;
};

type Task = {
  _id: string;
  title: string;
  subHeading?: string;
  description: string;
  status:
    | "Assigned"
    | "In Progress"
    | "Completed"
    | "Pending Approval"
    | "Pending Admin Approval"
    | "Missed"
    | "Pending Start Approval"
    | "Pending TL Approval";
  dueDate: string;
  assignedTo: AssignedUser[];
  createdByRole?: "admin" | "teamLead";
  assignedBy?: UserRef;
  adminApproved?: boolean;

  // execution
  startDate?: string | null;
  completedDate?: string | null;
  progress?: number;

  // ✅ add these (Mongoose usually provides them)
  createdAt?: string;
  updatedAt?: string;
};

type StudentUiStatus =
  | "Assigned"
  | "In Progress"
  | "Completed"
  | "Pending Approval"
  | "Pending Admin Approval"
  | "Missed"
  | "Pending Start Approval"
  | "Pending TL Approval"
  | "WaitingApproval";

const StudentTasks = () => {
  const navigate = useNavigate();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithVirtual | null>(null);
  const [progress, setProgress] = useState(0);

  const [viewTask, setViewTask] = useState<Task | null>(null);
  const STATUS_PENDING_ADMIN: Task["status"] = "Pending Admin Approval";
  const STATUS_PENDING_APPROVAL: Task["status"] = "Pending Approval";
  const [tick, setTick] = useState(0);

  // Current timestamp
  const now = new Date();

  // Dynamically treat Pending Start Approval as Assigned if dueDate is in the future
  const processedTasks: TaskWithVirtual[] = useMemo(() => {
    const now = new Date();

    return tasks.map((task) => {
      const due = new Date(task.dueDate);
      const wasStarted = !!task.startDate;

      let virtualStatus: TaskWithVirtual["virtualStatus"] = task.status;

      // 🔴 Compute Missed first: purely due + completion based
      if (
        now > due &&
        task.status !== "Completed" &&
        (task.progress ?? 0) < 100
      ) {
        virtualStatus = "Missed";
      }
      // ✅ Completed tasks
      else if (task.status === "Completed") {
        virtualStatus = "Completed";
      }
      // 🔵 Pending TL Approval overrides only after Missed check
      else if (task.status === "Pending TL Approval") {
        virtualStatus = "Pending TL Approval";
      }
      // 🟡 Pending Start Approval
      else if (task.status === "Pending Start Approval") {
        virtualStatus = "Pending Start Approval";
      }
      // 🟢 Tasks already started or in-progress
      else if (wasStarted || (task.progress ?? 0) > 0) {
        virtualStatus = "In Progress";
      }
      // 🔵 Admin approved but not started
      else if (task.adminApproved) {
        virtualStatus = "Assigned";
      } else if (task.status === "Assigned" && (task.progress ?? 0) === 0) {
        virtualStatus = "Assigned";
      }

      // ⚪ Fallback: use original status
      else {
        virtualStatus = task.status;
      }

      return { ...task, virtualStatus, wasStarted };
    });
  }, [tasks, tick]);

  // Missed tasks: dueDate passed, not completed, not Pending Start Approval in future
  const missedTasks = processedTasks.filter(
    (task) => task.virtualStatus === "Missed"
  );

  // Upcoming tasks: due in next 7 days, not completed, not missed
  const upcomingTasks = processedTasks.filter((task) => {
    const due = new Date(task.dueDate); // use exact due time from DB
    return (
      due > now &&
      due <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) &&
      task.virtualStatus !== "Missed"
    );
  });

  // Main tasks list to render (Assigned / In Progress / etc.)
  const assignedTasks = processedTasks; // Use this for main dashboard rendering

  // Is this task blocked because TL portion is pending admin approval?
  const isBlockedByTeamLeadApproval = (
    task: Task,
    me: CurrentUser | null
  ): boolean => {
    if (!me) return false;

    // Find the role of the current user in this task
    const meRoleInTask = task.assignedTo.find((u) => u._id === me._id)?.role;
    if (!meRoleInTask) return false;

    // Check if any TL is assigned to this task
    const teamLeadAssigned = task.assignedTo.some(
      (u) => u.role === "teamLead"
    );

    // Block if a TL is assigned, status is Pending Admin Approval, and current user is NOT the TL
    return (
      teamLeadAssigned &&
      task.status === STATUS_PENDING_ADMIN &&
      meRoleInTask !== "teamLead"
    );
  };

  // Can the current user request approval for a task?
  const canRequestApproval = (
    task: Task,
    me: CurrentUser | null
  ): boolean => {
    if (!me) return false;

    const meRoleInTask = task.assignedTo.find((u) => u._id === me._id)?.role;
    if (!meRoleInTask) return false;

    const teamLeadAssigned = task.assignedTo.some(
      (u) => u.role === "teamLead"
    );
    const studentAssigned = task.assignedTo.some((u) => u.role === "student");

    // Student logic
    if (meRoleInTask === "student") {
      // Student cannot request if TL portion is pending admin approval
      if (teamLeadAssigned && task.status === STATUS_PENDING_ADMIN)
        return false;

      return true; // Multiple students or single student without TL → can request directly
    }

    // Team Lead logic
    if (meRoleInTask === "teamLead") {
      // TL completing their own task alone → must go to admin first
      if (task.assignedTo.length === 1) {
        return task.status !== STATUS_PENDING_ADMIN;
      }

      // TL + students
      if (studentAssigned) {
        // Cannot request TL approval until admin approves TL portion
        if (task.status === STATUS_PENDING_ADMIN) return false;
        return true; // Otherwise can request
      }

      return true; // fallback
    }

    return false;
  };

  const handleStartTask = async (taskId: string) => {
    const task = processedTasks.find((t) => t._id === taskId);
    if (!task) return;

    // 🔒 Block only truly missed tasks
    if (task.virtualStatus === "Missed") {
      toast.error("Cannot start a missed task. Request admin approval to restart.");
      return;
    }

    const cappedProgress = 0;

    try {
      setUpdating(taskId);

      await updateTaskProgress(taskId, cappedProgress);

      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id
            ? {
                ...t,
                progress: cappedProgress,
                status: "In Progress",
                // startDate: t.startDate || new Date().toISOString(),
              }
            : t
        )
      );

      toast.success("Task started!");
    } catch (err: any) {
      console.error("Failed to start task:", err);
      toast.error(err?.response?.data?.message || "Failed to start task.");
    } finally {
      setUpdating(null);
    }
  };

  const handleRequestApproval = async (taskId: string, isMissed: boolean) => {
    try {
      await requestTaskApproval(taskId, isMissed);

      // 🔄 REFRESH TASK LIST
      await refreshTasks();

      toast.success("Approval requested successfully");
    } catch (err: any) {
      console.error("Failed to request approval:", err);
      toast.error(err?.response?.data?.message || "Something went wrong");
    }
  };

  // add new function or modify
  const handleRequestStartPermission = async (taskId: string) => {
    const task = processedTasks.find((t) => t._id === taskId);

    if (!task) return;

    // Only allow if truly missed and not already requested
    if (
      task.virtualStatus !== "Missed" ||
      task.status === "Pending Start Approval"
    ) {
      toast.error("This task is not eligible to request start permission.");
      return;
    }

    try {
      setUpdating(taskId);
      await requestTaskStart(taskId);
      await refreshTasks();
      toast.success("Start permission requested successfully");
    } catch (err: any) {
      console.error("Failed to request start permission:", err);
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setUpdating(null);
    }
  };

  // Fetch current user
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ Check if token expired or invalid
        if (!res.ok) {
          localStorage.removeItem("token");
          return navigate("/login");
        }

        const data = await res.json();
        if (!mounted) return;

        if (data?.user) setMe(data.user);
        else navigate("/login");
      } catch (err) {
        console.error("Error fetching user:", err);
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        if (mounted) setLoadingMe(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!me) return;

    (async () => {
      try {
        const { data } = await fetchTasks(me.email);
        setTasks(data.tasks || []);
      } catch (err: any) {
        console.error("Error fetching tasks:", err);

        // ✅ Handle 401 (token expired)
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          toast.error("Failed to fetch tasks. Please try again.");
        }
      }
    })();
  }, [me, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1); // trigger re-render
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  const refreshTasks = async () => {
    if (!me) return;

    try {
      const { data } = await fetchTasks(me.email);
      setTasks(data.tasks || []);
    } catch (err: any) {
      console.error("Failed to refresh tasks:", err);
      toast.error("Failed to refresh tasks");
    }
  };

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
      case "Pending Admin Approval": // <-- added
        return `${base} bg-purple-100 text-purple-800 hover:bg-purple-200`;
      case "Missed":
        return `${base} bg-red-100 text-red-800 hover:bg-red-200`;
      case "Pending TL Approval":
        return `${base} bg-orange-100 text-orange-800 hover:bg-orange-200`;
      default:
        return `${base} bg-blue-100 text-blue-800 hover:bg-blue-200`;
    }
  };

  const timeTaken = (task: Task) => {
    const startRaw = task.startDate || task.createdAt || null;
    const endRaw = task.completedDate || task.updatedAt || null;

    if (!startRaw || !endRaw) return "-";
    if (startRaw === "null" || endRaw === "null") return "-";

    const start = new Date(startRaw);
    const end = new Date(endRaw);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
      return "-";
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

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";

    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const openUpdateModal = (task: TaskWithVirtual) => {
    setSelectedTask(task);
    setProgress(task.progress ?? 0);
    setShowUpdateModal(true);
  };

  const applyUpdateStatus = async () => {
    if (!selectedTask) return;

    // Block update if task is Missed
    if (selectedTask.virtualStatus === "Missed") {
      toast.error("This task is missed. Request admin approval to start again.");
      return;
    }

    const cappedProgress = Math.min(progress, 100);

    try {
      setUpdating(selectedTask._id);
      await updateTaskProgress(selectedTask._id, cappedProgress);
      await refreshTasks();
      toast.success("Task updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update progress");
    } finally {
      setShowUpdateModal(false);
      setUpdating(null);
    }
  };

  const isTaskMissed = (task: TaskWithVirtual) =>
    task.virtualStatus === "Missed";

  const canStartTask = (task: TaskWithVirtual) =>
    task.virtualStatus === "Assigned" && !isTaskMissed(task);

  const canRequestAdminPermission = (task: TaskWithVirtual) =>
    task.virtualStatus === "Missed";

  const canUpdateProgress = (task: TaskWithVirtual) =>
    task.virtualStatus === "In Progress";

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      setUpdating(taskId);

      // 🔑 Backend sets startDate / completedDate
      await updateTaskStatus(taskId, newStatus);

      // 🔄 Always refetch fresh backend truth
      await refreshTasks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update task status.");
    } finally {
      setUpdating(null);
    }
  };

  const canRequestStartOrRestart = (task: TaskWithVirtual) =>
    task.virtualStatus === "Missed" &&
    !task.adminApproved &&
    task.status !== "Pending Start Approval";

  const getStudentUiStatus = (task: TaskWithVirtual): StudentUiStatus => {
    if (task.status === "Completed") return "Completed";
    if (task.virtualStatus === "Missed") return "Missed";

    if (task.status === "Pending TL Approval") {
      return "Pending TL Approval";
    }

    if (
      task.status === "Pending Start Approval" ||
      task.status === "Pending Admin Approval"
    ) {
      return "WaitingApproval";
    }

    if (task.wasStarted || (task.progress && task.progress > 0))
      return "In Progress";
    if (task.adminApproved) return "Assigned";

    return task.virtualStatus as StudentUiStatus;
  };

  const openViewDetails = (task: Task) => setViewTask(task);

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentSidebar activeItem="My Tasks" />

      <div className="ml-64">
        <StudentNavbar
          me={me}
          loadingMe={loadingMe}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className="min-h-[calc(100vh-73px)] p-6 overflow-auto">
          {/* Upcoming Tasks */}
          {upcomingTasks.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 text-red-600">
                ⏰ Upcoming Tasks This Week
              </h2>

              <div className="flex space-x-3 overflow-x-auto pb-2">
                {upcomingTasks.map((task) => (
                  <Card
                    key={task._id}
                    className="bg-red-50 min-w-[250px] min-h-[130px] p-4 shadow-sm rounded-xl border-l-4 border-red-500 flex-shrink-0"
                  >
                    <CardContent className="p-0">
                      <h3 className="font-bold">{task.title}</h3>
                      <p className="text-gray-700 text-sm">
                        {task.description}
                      </p>

                      {/* Assigned By */}
                      {task.assignedBy && (
                        <p className="text-gray-500 text-sm mt-1">
                          <span className="font-medium">Assigned By:</span>{" "}
                          {task.assignedBy.name}
                        </p>
                      )}

                      <p className="text-red-600 text-sm font-medium">
                        {formatDate(task.dueDate)}
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
              <h2 className="text-lg font-bold mb-3 text-red-700">
                ⚠️ Missed Tasks
              </h2>

              <div className="flex space-x-3 overflow-x-auto pb-2">
                {missedTasks.map((task) => (
                  <Card
                    key={task._id}
                    className="bg-red-50 min-w-[250px] min-h-[130px] p-4 shadow-sm rounded-xl border-l-4 border-red-500 flex-shrink-0"
                  >
                    <CardContent className="p-0">
                      <h3 className="font-bold">{task.title}</h3>
                      <p className="text-gray-700 text-sm">
                        {task.description}
                      </p>

                      {/* Assigned By */}
                      {task.assignedBy && (
                        <p className="text-gray-500 text-sm mt-1">
                          <span className="font-medium">Assigned By:</span>{" "}
                          {task.assignedBy.name}
                        </p>
                      )}

                      <p className="text-red-700 text-sm font-medium">
                        {formatDate(task.dueDate)}
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
            {processedTasks.map((task) => {
              const getLeftBorderColor = (status: StudentUiStatus) => {
                switch (status) {
                  case "Assigned":
                    return "border-l-4 border-blue-600";
                  case "In Progress":
                    return "border-l-4 border-yellow-500";
                  case "Pending Approval":
                    return "border-l-4 border-amber-700";
                  case "Pending Admin Approval":
                    return "border-l-4 border-purple-500";
                  case "Completed":
                    return "border-l-4 border-green-600";
                  case "Missed":
                    return "border-l-4 border-red-600";
                  case "Pending TL Approval":
                    return "border-l-4 border-orange-600";
                  case "Pending Start Approval":
                    return "border-l-4 border-indigo-500";
                  case "WaitingApproval":
                    return "border-l-4 border-purple-300"; // for UI only
                  default:
                    return "";
                }
              };

              const getBackgroundColor = (status: StudentUiStatus) => {
                switch (status) {
                  case "Assigned":
                    return "bg-blue-50";
                  case "In Progress":
                    return "bg-yellow-50";
                  case "Pending Approval":
                    return "bg-amber-50";
                  case "Pending Admin Approval":
                    return "bg-purple-50";
                  case "Completed":
                    return "bg-green-50";
                  case "Missed":
                    return "bg-red-50";
                  case "Pending Start Approval":
                    return "bg-indigo-50";
                  case "WaitingApproval":
                    return "bg-purple-100"; // for UI only
                  case "Pending TL Approval":
                    return "bg-orange-50";
                  default:
                    return "bg-white";
                }
              };

              const canMarkComplete = (task: Task) =>
                (task.progress ?? 0) >= 100 &&
                task.status !== "Pending Approval";

              const uiStatus: StudentUiStatus = getStudentUiStatus(task);

              return (
                <Card
                  key={task._id}
                  className={`p-5 shadow-sm rounded-xl ml-1 relative ${getLeftBorderColor(
                    uiStatus
                  )} ${getBackgroundColor(uiStatus)}`}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {task.title}
                        </h3>

                        {task.subHeading && (
                          <p className="text-gray-500 text-sm">
                            {task.subHeading}
                          </p>
                        )}
                      </div>

                      <Badge className={getStatusBadge(uiStatus)}>
                        {uiStatus}
                      </Badge>
                    </div>

                    <p className="text-gray-700 text-sm mb-3">
                      {task.description}
                    </p>

                    {task.assignedBy && (
                      <p className="text-gray-500 text-sm mt-1">
                        <span className="font-medium">Assigned By:</span>{" "}
                        {task.assignedBy.name}
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-4">
                      <p className="text-gray-600 text-sm">
                        <span className="font-medium">Due Date:</span>{" "}
                        {formatDate(task.dueDate)}
                      </p>

                      <div className="flex gap-2">
                        {/* 1️⃣ Missed or Pending Start Approval → Request Start/Restart Permission */}
                        {canRequestStartOrRestart(task) && (
                          <Button
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={() =>
                              handleRequestStartPermission(task._id)
                            }
                            disabled={
                              updating === task._id ||
                              task.virtualStatus !== "Missed" ||
                              task.adminApproved
                            }
                          >
                            Request Permission to Start
                          </Button>
                        )}

                        {uiStatus === "Assigned" &&
                          !task.wasStarted &&
                          !task.adminApproved && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-500 text-white"
                              onClick={() => handleStartTask(task._id)}
                              disabled={updating === task._id}
                            >
                              Start Task
                            </Button>
                          )}

                        {/* 3️⃣ In Progress → Update & Request Approval */}
                        {uiStatus === "In Progress" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-yellow-500 hover:bg-yellow-600 text-white"
                              onClick={() => openUpdateModal(task)}
                              disabled={updating === task._id}
                            >
                              Update Progress
                            </Button>

                            <Button
                              size="sm"
                              className="bg-amber-500 hover:bg-amber-600 text-white"
                              onClick={() =>
                                handleRequestApproval(task._id, false)
                              }
                              disabled={
                                (task.progress ?? 0) < 100 ||
                                !canRequestApproval(task, me)
                              }
                            >
                              Request Approval
                            </Button>
                          </>
                        )}

                        {uiStatus === "Pending TL Approval" && (
                          <Button disabled className="cursor-not-allowed opacity-70">
                            Waiting for Team Lead Approval
                          </Button>
                        )}

                        {uiStatus === "WaitingApproval" && (
                          <Button disabled className="cursor-not-allowed opacity-70">
                            Waiting for Admin Approval
                          </Button>
                        )}

                        {/* 5️⃣ Completed → View Details */}
                        {task.virtualStatus === "Completed" && (
                          <Button
                            size="sm"
                            className="bg-gray-500 hover:bg-gray-400 text-white"
                            onClick={() => {
                              const latestTask =
                                tasks.find((t) => t._id === task._id) || task;
                              openViewDetails(latestTask);
                            }}
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
        </main>
      </div>

      {/* -------------------- Update Progress Modal -------------------- */}
      <Dialog
        open={showUpdateModal}
        onOpenChange={(open) => setShowUpdateModal(open)}
      >
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
            min={selectedTask?.progress ?? 0} // ⬅ minimum is current progress
            max={100}
            step={1}
            disabled={
              selectedTask
                ? isBlockedByTeamLeadApproval(selectedTask, me)
                : false
            }
            className="mb-2"
          />

          {selectedTask && isBlockedByTeamLeadApproval(selectedTask, me) && (
            <p className="text-xs text-red-600 mb-3">
              Progress is locked until Admin approves the Team Lead portion.
            </p>
          )}

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
                <strong>Assigned To:</strong>{" "}
                {viewTask.assignedTo.map((a) => a.name).join(", ")}
              </p>

              {viewTask.assignedBy && (
                <p>
                  <strong>Assigned By:</strong> {viewTask.assignedBy.name}
                </p>
              )}

              <p>
                <strong>Start Date:</strong> {formatDate(viewTask.startDate)}
              </p>

              <p>
                <strong>End Date:</strong> {formatDate(viewTask.completedDate)}
              </p>

              <p>
                <strong>Due Date:</strong> {formatDate(viewTask.dueDate)}
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