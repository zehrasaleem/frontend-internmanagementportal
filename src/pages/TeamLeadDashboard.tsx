import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api, { fetchTasks } from "@/api/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TeamLeadSidebar from "@/components/teamlead/TeamLeadSidebar";
import TeamLeadNavbar from "@/components/teamlead/TeamLeadNavbar";

import {
  ClipboardCheck,
  AlertTriangle,
  Users,
  Clock3,
  ListChecks,
  CalendarDays,
} from "lucide-react";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
};

type TaskLite = {
  _id: string;
  title: string;
  status: string;
  progress?: number;
  dueDate: string;
  assignedTo: { _id: string; name: string; email: string }[];
  assignedBy?: string | { _id: string };
};

type ProjectLite = {
  _id: string;
  title: string;
  teamLead?: string | { _id: string };
  assignedTo?: (string | { _id: string })[];
};

type SlotLite = {
  _id?: string;
  day: string;
  time: string;
  date: string; // YYYY-MM-DD
  status: string;
  label?: string;
};

const TIME_SLOT_START_MINUTES: Record<string, number> = {
  "8:30 - 9:20": 8 * 60 + 30,
  "9:30 - 10:20": 9 * 60 + 30,
  "10:30 - 11:20": 10 * 60 + 30,
  "11:30 - 12:20": 11 * 60 + 30,
  "12:30 - 1:20": 12 * 60 + 30,
  "1:30 - 2:20": 13 * 60 + 30,
  "2:30 - 3:20": 14 * 60 + 30,
  "3:30 - 4:30": 15 * 60 + 30,
};

const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatShortDate = (dateKey: string) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const TeamLeadDashboard = () => {
  const navigate = useNavigate();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [tasks, setTasks] = useState<TaskLite[]>([]);
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [meetingSlots, setMeetingSlots] = useState<SlotLite[]>([]);
  const [loadingWidgets, setLoadingWidgets] = useState(true);

  /* ---------------- Load current user ---------------- */
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

  /* ---------------- Load dashboard widget data ---------------- */
  useEffect(() => {
    if (!me?._id) return;

    let mounted = true;

    (async () => {
      setLoadingWidgets(true);
      try {
        const [tasksRes, projectsRes, timetableRes] = await Promise.all([
          fetchTasks(),
          api.get("/projects"),
          api.get("/timetable/student"),
        ]);

        if (!mounted) return;

        const allTasks: TaskLite[] = tasksRes.data?.tasks || tasksRes.data || [];
        setTasks(allTasks);

        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);

        const slots: SlotLite[] = timetableRes.data?.slots || [];
        setMeetingSlots(slots.filter((s) => s.status === "meeting"));
      } catch (err) {
        console.error("Failed to load Team Lead dashboard widgets", err);
      } finally {
        if (mounted) setLoadingWidgets(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [me]);

  /* ---------------- Derived: led projects & team size ---------------- */
  const leadProjects = useMemo(
    () =>
      projects.filter((p) => {
        const leadId = typeof p.teamLead === "string" ? p.teamLead : p.teamLead?._id;
        return leadId === me?._id;
      }),
    [projects, me]
  );

  const teamMemberCount = useMemo(() => {
    const ids = new Set<string>();
    leadProjects.forEach((p) => {
      (p.assignedTo || []).forEach((m) => {
        const id = typeof m === "string" ? m : m?._id;
        if (id && id !== me?._id) ids.add(id);
      });
    });
    return ids.size;
  }, [leadProjects, me]);

  /* ---------------- Derived: tasks needing this TL's approval ---------------- */
  const scopedTasks = useMemo(() => {
    return tasks.filter((t) => {
      const assignedById = typeof t.assignedBy === "string" ? t.assignedBy : t.assignedBy?._id;
      return assignedById === me?._id;
    });
  }, [tasks, me]);

  const pendingApprovalTasks = useMemo(() => {
    return scopedTasks
      .filter((t) => {
        const isPending = t.status === "Pending Approval" || t.status === "Pending TL Approval";
        const isProgress100 = (t.progress ?? 0) >= 100;
        return isPending && isProgress100;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [scopedTasks]);



  const missedTasks = useMemo(() => {
    const now = new Date();
    return scopedTasks.filter((t) => {
      const isPastDue = new Date(t.dueDate) < now;
      return (
        t.status === "Missed" ||
        t.status === "Pending Start Approval" ||
        (isPastDue && (t.status === "Assigned" || t.status === "In Progress"))
      );
    });
  }, [scopedTasks]);

  /* ---------------- Derived: this week's meetings ---------------- */
  const thisWeekMeetings = useMemo(() => {
    const today = new Date();
    const todayKey = toDateKey(today);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndKey = toDateKey(weekEnd);

    return meetingSlots
      .filter((s) => s.date >= todayKey && s.date <= weekEndKey)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (
          (TIME_SLOT_START_MINUTES[a.time] ?? 0) - (TIME_SLOT_START_MINUTES[b.time] ?? 0)
        );
      })
      .slice(0, 5);
  }, [meetingSlots]);

  const nextUpMeeting = useMemo(() => {
    const now = new Date();
    const todayKey = toDateKey(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    return (
      meetingSlots
        .filter((s) => {
          if (s.date > todayKey) return true;
          if (s.date === todayKey) {
            return (TIME_SLOT_START_MINUTES[s.time] ?? 0) >= nowMinutes;
          }
          return false;
        })
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return (
            (TIME_SLOT_START_MINUTES[a.time] ?? 0) - (TIME_SLOT_START_MINUTES[b.time] ?? 0)
          );
        })[0] || null
    );
  }, [meetingSlots]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const goBackToStudentDashboard = () => {
    navigate("/student-dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TeamLeadSidebar activeItem="Dashboard" />

      <div className="ml-64">
        <TeamLeadNavbar me={me} loadingMe={loadingMe} onLogout={handleLogout} />

        <main className="min-h-[calc(100vh-73px)] bg-gray-50 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Lead Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {loadingMe ? "…" : "Team Lead"}
              </p>
            </div>

            <Button
              onClick={goBackToStudentDashboard}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              Go back to Student Dashboard
            </Button>
          </div>

          {/* Stat cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            {/* Pending approvals */}
            <Card
              onClick={() => navigate("/teamlead-task-management")}
              className="border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition"
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingWidgets ? "…" : pendingApprovalTasks.length}
                  </p>
                  <p className="text-sm text-gray-500">Awaiting review</p>
                </div>
              </CardContent>
            </Card>

            {/* Missed tasks */}
            <Card
              onClick={() => navigate("/teamlead-task-management")}
              className="border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition"
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div
                  className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${missedTasks.length > 0 ? "bg-red-100" : "bg-gray-100"
                    }`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 ${missedTasks.length > 0 ? "text-red-600" : "text-gray-400"
                      }`}
                  />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingWidgets ? "…" : missedTasks.length}
                  </p>
                  <p className="text-sm text-gray-500">Missed tasks</p>
                </div>
              </CardContent>
            </Card>

            {/* Team size */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingWidgets ? "…" : teamMemberCount}
                  </p>
                  <p className="text-sm text-gray-500">
                    Team {teamMemberCount === 1 ? "member" : "members"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Next up */}
            <Card
              className={
                nextUpMeeting
                  ? "bg-purple-600 text-white border-0 shadow-sm"
                  : "bg-gray-100 text-gray-500 border border-gray-200 shadow-sm"
              }
            >
              <CardContent className="p-5">
                <div
                  className={`flex items-center gap-2 text-xs font-semibold mb-1 ${nextUpMeeting ? "opacity-90" : "text-gray-400"
                    }`}
                >
                  <Clock3 className="w-4 h-4" />
                  NEXT UP
                </div>
                {loadingWidgets ? (
                  <p className="font-semibold">Loading…</p>
                ) : nextUpMeeting ? (
                  <>
                    <p className="text-base font-bold leading-tight truncate">
                      {nextUpMeeting.label || "Meeting"}
                    </p>
                    <p className="text-sm opacity-90">
                      {formatShortDate(nextUpMeeting.date)} · {nextUpMeeting.time}
                    </p>
                  </>
                ) : (
                  <p className="font-semibold text-gray-500">No upcoming meetings</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Needs approval + This week */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Needs your approval */}
            <Card className="border border-gray-200 shadow-md">
              <CardContent className="p-6 min-h-[280px]">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-gray-400" />
                  Needs your approval
                </h3>

                {loadingWidgets ? (
                  <p className="text-sm text-gray-500">Loading…</p>
                ) : pendingApprovalTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
                      <ClipboardCheck className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-500">Nothing waiting on you 🎉</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingApprovalTasks.slice(0, 5).map((task) => (
                      <div
                        key={task._id}
                        onClick={() => navigate("/teamlead-task-management")}
                        className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5 cursor-pointer hover:border-gray-200 hover:bg-gray-50 transition"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {task.assignedTo?.map((u) => u.name).join(", ")}
                          </p>
                        </div>
                        <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-amber-50 text-amber-600 flex-shrink-0">
                          100%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* This week */}
            <Card className="border border-gray-200 shadow-md">
              <CardContent className="p-6 min-h-[280px]">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  This week
                </h3>

                {loadingWidgets ? (
                  <p className="text-sm text-gray-500">Loading…</p>
                ) : thisWeekMeetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <Clock3 className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No meetings this week</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {thisWeekMeetings.map((slot, i) => (
                      <div
                        key={slot._id || i}
                        className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5"
                      >
                        <div className="flex flex-col items-center justify-center bg-purple-50 text-purple-700 rounded-md w-12 h-12 flex-shrink-0">
                          <span className="text-[10px] font-semibold uppercase leading-none">
                            {formatShortDate(slot.date).split(" ")[0]}
                          </span>
                          <span className="text-sm font-bold leading-none mt-0.5">
                            {formatShortDate(slot.date).split(" ")[1]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {slot.label || "Meeting"}
                          </p>
                          <p className="text-xs text-gray-500">{slot.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeamLeadDashboard;