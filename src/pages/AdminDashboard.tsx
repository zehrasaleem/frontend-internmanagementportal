import { useEffect, useMemo, useState } from "react";
import {
  Users,
  ClipboardList,
  Calendar,
  FolderKanban,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminNavbar from "@/components/admin/AdminNavbar";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin" | string;
  picture?: string;
};

type Student = {
  _id: string;
  name?: string;
  email?: string;
  picture?: string;
};

type SignupRequest = {
  _id: string;
  name?: string;
  email?: string;
  discipline?: string;
  batch?: string;
  rollNo?: string;
  phoneNumber?: string;
  semester?: string;
  dateOfJoining?: string;
  supervisorEmail?: string;
  approvalRequestedAt?: string;
};

type Task = {
  _id: string;
  title?: string;
  name?: string;
  status?: string;
  completed?: boolean;
  isCompleted?: boolean;
};

type Project = {
  _id: string;
  title?: string;
  name?: string;
  status?: string;
};

type Slot = {
  _id?: string;
  day: string;
  time: string;
  date?: string;
  meetingDate?: string;
  status: "free" | "busy" | "task" | "meeting" | string;
  label?: string;
};

type Timetable = {
  _id: string;
  student: Student | string;
  slots: Slot[];
};

const toDateKey = (value: string | Date | undefined | null) => {
  if (!value) return "";

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    return "";
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const extractArray = <T,>(payload: any, keys: string[]): T[] => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (payload?.data && payload.data !== payload) {
    return extractArray<T>(payload.data, keys);
  }

  return [];
};

const isTaskCompleted = (task: Task) => {
  const status = String(task.status || "").toLowerCase();

  return (
    task.completed === true ||
    task.isCompleted === true ||
    status === "completed" ||
    status === "complete" ||
    status === "done"
  );
};

const isProjectActive = (project: Project) => {
  const status = String(project.status || "").toLowerCase();

  if (!status) return true;

  return !["completed", "complete", "done", "closed", "archived"].includes(
    status
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [interns, setInterns] = useState<Student[]>([]);
  const [signupRequests, setSignupRequests] = useState<SignupRequest[]>([]);
  const [signupActionLoading, setSignupActionLoading] = useState<string | null>(
    null
  );

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const todayKey = useMemo(() => toDateKey(new Date()), []);

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

  const loadDashboardData = async () => {
    setDashboardLoading(true);
    setDashboardError("");

    const [
      studentsResult,
      signupRequestsResult,
      tasksResult,
      projectsResult,
      timetablesResult,
    ] = await Promise.allSettled([
      api.get("/users/students"),
      api.get("/users/signup-requests"),
      api.get("/tasks"),
      api.get("/projects"),
      api.get("/admin/timetable/all"),
    ]);

    if (studentsResult.status === "fulfilled") {
      setInterns(
        extractArray<Student>(studentsResult.value.data, [
          "students",
          "users",
          "interns",
          "data",
        ])
      );
    }

    if (signupRequestsResult.status === "fulfilled") {
      setSignupRequests(
        extractArray<SignupRequest>(signupRequestsResult.value.data, [
          "requests",
          "signupRequests",
          "users",
          "data",
        ])
      );
    }

    if (tasksResult.status === "fulfilled") {
      setTasks(
        extractArray<Task>(tasksResult.value.data, [
          "tasks",
          "data",
          "items",
          "results",
        ])
      );
    }

    if (projectsResult.status === "fulfilled") {
      setProjects(
        extractArray<Project>(projectsResult.value.data, [
          "projects",
          "data",
          "items",
          "results",
        ])
      );
    }

    if (timetablesResult.status === "fulfilled") {
      setTimetables(
        extractArray<Timetable>(timetablesResult.value.data, [
          "timetables",
          "data",
          "items",
          "results",
        ])
      );
    }

    const allFailed =
      studentsResult.status === "rejected" &&
      signupRequestsResult.status === "rejected" &&
      tasksResult.status === "rejected" &&
      projectsResult.status === "rejected" &&
      timetablesResult.status === "rejected";

    if (allFailed) {
      setDashboardError("Dashboard data could not be loaded.");
    }

    setDashboardLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const displayName =
    me?.name || (me?.email ? me.email.split("@")[0] : "Admin");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const handleApproveSignup = async (id: string) => {
    setSignupActionLoading(id);
    setDashboardError("");

    try {
      await api.patch(`/users/signup-requests/${id}/approve`);
      await loadDashboardData();
    } catch (error: any) {
      setDashboardError(
        error?.response?.data?.message || "Could not approve signup request."
      );
    } finally {
      setSignupActionLoading(null);
    }
  };

  const handleRejectSignup = async (id: string) => {
    setSignupActionLoading(id);
    setDashboardError("");

    try {
      await api.delete(`/users/signup-requests/${id}/reject`);
      await loadDashboardData();
    } catch (error: any) {
      setDashboardError(
        error?.response?.data?.message || "Could not reject signup request."
      );
    } finally {
      setSignupActionLoading(null);
    }
  };

  const totalInterns = interns.length;
  const activeProjects = projects.filter(isProjectActive).length;
  const pendingTasks = tasks.filter((task) => !isTaskCompleted(task)).length;

  const todayMeetingsCount = useMemo(() => {
    let count = 0;

    timetables.forEach((timetable) => {
      timetable.slots?.forEach((slot) => {
        const slotDate = toDateKey(slot.meetingDate || slot.date);

        if (slot.status === "meeting" && slotDate === todayKey) {
          count += 1;
        }
      });
    });

    return count;
  }, [timetables, todayKey]);

  const programStats = [
    {
      title: "Total Interns",
      value: dashboardLoading ? "…" : totalInterns.toString(),
      icon: Users,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
      valueColor: "text-blue-600",
      path: "/intern-management",
    },
    {
      title: "Active Projects",
      value: dashboardLoading ? "…" : activeProjects.toString(),
      icon: FolderKanban,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-500",
      valueColor: "text-purple-600",
      path: "/project-management",
    },
    {
      title: "Pending Tasks",
      value: dashboardLoading ? "…" : pendingTasks.toString(),
      icon: ClipboardList,
      bgColor: "bg-green-50",
      iconColor: "text-green-500",
      valueColor: "text-green-600",
      path: "/task-management",
    },
    {
      title: "Today's Meetings",
      value: dashboardLoading ? "…" : todayMeetingsCount.toString(),
      icon: Calendar,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-500",
      valueColor: "text-orange-600",
      path: "/admin-timetable",
    },
  ];

  const quickActions = [
    {
      title: "Manage Interns",
      description: "View intern records and profiles",
      icon: Users,
      path: "/intern-management",
    },
    {
      title: "Manage Tasks",
      description: "Assign and track intern tasks",
      icon: ClipboardList,
      path: "/task-management",
    },
    {
      title: "Manage Projects",
      description: "View and update assigned projects",
      icon: FolderKanban,
      path: "/project-management",
    },
    {
      title: "Schedule Meeting",
      description: "Open timetable and scheduling",
      icon: Calendar,
      path: "/admin-timetable",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activeItem="Dashboard" />

      <div className="ml-64">
        <AdminNavbar
          me={me}
          loadingMe={loadingMe}
          onLogout={handleLogout}
        />

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              Welcome back, {loadingMe ? "Admin" : displayName}
            </h1>
            <p className="text-xs text-gray-500">
              Overview of interns, tasks, projects, and meetings.
            </p>
          </div>

          {dashboardError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {dashboardError}
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Program Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {programStats.map((stat, index) => (
                <Card
                  key={index}
                  onClick={() => navigate(stat.path)}
                  className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </CardTitle>

                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className={`text-2xl font-bold ${stat.valueColor}`}>
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border border-gray-200 mb-8">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900">
                Pending Student Signup Requests
              </CardTitle>
            </CardHeader>

            <CardContent>
              {dashboardLoading ? (
                <p className="text-sm text-gray-500">Loading requests...</p>
              ) : signupRequests.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No pending student signup requests.
                </p>
              ) : (
                <div className="space-y-4">
                  {signupRequests.map((request) => (
                    <div
                      key={request._id}
                      className="rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {request.name || "Unnamed Student"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.email || "No email"}
                          </p>

                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
                            <p>
                              <span className="font-medium">
                                Supervisor/Admin Email:
                              </span>{" "}
                              {request.supervisorEmail || "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Discipline:</span>{" "}
                              {request.discipline || "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Batch:</span>{" "}
                              {request.batch || "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Roll No:</span>{" "}
                              {request.rollNo || "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Semester:</span>{" "}
                              {request.semester || "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Phone:</span>{" "}
                              {request.phoneNumber || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveSignup(request._id)}
                            disabled={signupActionLoading === request._id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectSignup(request._id)}
                            disabled={signupActionLoading === request._id}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900">
                Quick Actions
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 text-left hover:bg-gray-50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                        <action.icon className="w-4 h-4 text-blue-600" />
                      </div>

                      <div className="ml-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {action.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {action.description}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;