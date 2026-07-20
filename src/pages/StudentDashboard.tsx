import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api, { fetchTasks } from "@/api/api";
import { Card, CardContent } from "@/components/ui/card";
import StudentSidebar from "@/components/students/StudentSidebar";
import StudentNavbar from "@/components/students/StudentNavbar";

import {
  ClipboardList,
  CheckSquare,
  CalendarCheck2,
  Clock3,
  ListTodo,
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
  dueDate: string;
};

type SlotLite = {
  _id?: string;
  day: string;
  time: string;
  date: string; // YYYY-MM-DD
  status: string; // "free" | "busy" | "task" | "meeting"
  label?: string;
};

type AttendanceHistoryItem = {
  status: "present" | "absent" | "upcoming" | "open" | "invalid";
};

// Must match backend's TIME_SLOT_MINUTES order in attendance.controller.js
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

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  // ✅ REAL TEAM LEAD FLAG (from backend)
  const [isTeamLead, setIsTeamLead] = useState(false);

  // ---- Dashboard widget data ----
  const [tasks, setTasks] = useState<TaskLite[]>([]);
  const [meetingSlots, setMeetingSlots] = useState<SlotLite[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistoryItem[]>([]);
  const [loadingWidgets, setLoadingWidgets] = useState(true);

  /* ---------------- Fetch logged-in user ---------------- */
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

  /* ---------------- Check if user is team lead ---------------- */
  useEffect(() => {
    if (!me?._id) return;

    let mounted = true;

    (async () => {
      try {
        const res = await api.get("/projects/my/lead-projects");
        if (mounted) {
          setIsTeamLead(Array.isArray(res.data) && res.data.length > 0);
        }
      } catch {
        if (mounted) setIsTeamLead(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [me]);

  /* ---------------- Fetch dashboard widget data ---------------- */
  useEffect(() => {
    if (!me?.email) return;

    let mounted = true;

    (async () => {
      setLoadingWidgets(true);
      try {
        const [tasksRes, timetableRes, attendanceRes] = await Promise.all([
          fetchTasks(me.email),
          api.get("/timetable/student"),
          api.get("/attendance/my/history?limit=60"),
        ]);

        if (!mounted) return;

        const allTasks: TaskLite[] = tasksRes.data?.tasks || [];
        setTasks(allTasks);

        const slots: SlotLite[] = timetableRes.data?.slots || [];
        setMeetingSlots(slots.filter((s) => s.status === "meeting"));

        setAttendanceHistory(attendanceRes.data?.history || []);
      } catch (err) {
        console.error("Failed to load dashboard widgets", err);
      } finally {
        if (mounted) setLoadingWidgets(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [me]);

  const displayName =
    me?.name || (me?.email ? me.email.split("@")[0] : "Student");

  const firstName = useMemo(
    () => displayName.split(/\s+/)[0] ?? "Student",
    [displayName]
  );

  /* ---------------- Derived: Tasks ---------------- */
  const tasksDone = useMemo(
    () => tasks.filter((t) => t.status === "Completed").length,
    [tasks]
  );
  const tasksTotal = tasks.length;

  const upcomingTasks = useMemo(() => {
    const now = new Date();
    return tasks
      .filter((t) => {
        if (t.status === "Completed" || t.status === "Rejected") return false;
        const due = new Date(t.dueDate);
        return due.getTime() >= now.getTime();
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4);
  }, [tasks]);

  const urgency = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysLeft <= 2) return { dot: "bg-red-500", badge: "bg-red-50 text-red-600" };
    if (daysLeft <= 5) return { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-600" };
    return { dot: "bg-gray-400", badge: "bg-gray-100 text-gray-500" };
  };

  /* ---------------- Derived: Attendance ---------------- */
  const attendanceRate = useMemo(() => {
    const counted = attendanceHistory.filter(
      (h) => h.status === "present" || h.status === "absent"
    );
    if (counted.length === 0) return null;
    const present = counted.filter((h) => h.status === "present").length;
    return Math.round((present / counted.length) * 100);
  }, [attendanceHistory]);

  /* ---------------- Derived: This week's meetings ---------------- */
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
          (TIME_SLOT_START_MINUTES[a.time] ?? 0) -
          (TIME_SLOT_START_MINUTES[b.time] ?? 0)
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
            const start = TIME_SLOT_START_MINUTES[s.time] ?? 0;
            return start >= nowMinutes;
          }
          return false;
        })
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return (
            (TIME_SLOT_START_MINUTES[a.time] ?? 0) -
            (TIME_SLOT_START_MINUTES[b.time] ?? 0)
          );
        })[0] || null
    );
  }, [meetingSlots]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentSidebar activeItem="Dashboard" />

      <div className="ml-64">
        <StudentNavbar me={me} loadingMe={loadingMe} onLogout={handleLogout} />

        {/* Main Content */}
        <main className="min-h-[calc(100vh-73px)] p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-6">
            {loadingMe ? "Welcome…" : `Welcome ${firstName}!`}
          </h2>

          {isTeamLead && (
            <div className="flex justify-center mb-6">
              <Card
                onClick={() => navigate("/teamlead-dashboard")}
                className="w-full max-w-3xl bg-purple-600 text-white cursor-pointer hover:bg-purple-700 transition border-0"
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-2">Team Lead Access</p>
                    <p className="text-2xl font-bold">Go to Team Lead Dashboard</p>
                  </div>

                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                    <ClipboardList className="w-7 h-7 text-white" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stat cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Tasks done */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {loadingWidgets ? "…" : `${tasksDone}/${tasksTotal}`}
                    </p>
                    <p className="text-sm text-gray-500">Tasks done</p>
                  </div>
                </div>
                {tasksTotal > 0 && (
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(tasksDone / tasksTotal) * 100}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div
                  className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${attendanceRate === null ? "bg-gray-100" : "bg-green-100"
                    }`}
                >
                  <CalendarCheck2
                    className={`w-5 h-5 ${attendanceRate === null ? "text-gray-400" : "text-green-600"
                      }`}
                  />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingWidgets
                      ? "…"
                      : attendanceRate === null
                        ? "N/A"
                        : `${attendanceRate}%`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {attendanceRate === null ? "No attendance recorded yet" : "Attendance"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Next up */}
            <Card
              className={
                nextUpMeeting
                  ? "bg-blue-600 text-white border-0 shadow-sm"
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
                    <p className="text-lg font-bold leading-tight">
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

          {/* Upcoming tasks + This week */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming tasks */}
            <Card className="border border-gray-200 shadow-md">
              <CardContent className="p-6 min-h-[280px]">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-gray-400" />
                  Upcoming tasks
                </h3>

                {loadingWidgets ? (
                  <p className="text-sm text-gray-500">Loading…</p>
                ) : upcomingTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
                      <CheckSquare className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-500">You're all caught up 🎉</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingTasks.map((task) => {
                      const { dot, badge } = urgency(task.dueDate);
                      return (
                        <div
                          key={task._id}
                          onClick={() => navigate("/student-tasks")}
                          className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5 cursor-pointer hover:border-gray-200 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {task.title}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-medium rounded-full px-2 py-0.5 flex-shrink-0 ${badge}`}
                          >
                            {new Date(task.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      );
                    })}
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
                        <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 rounded-md w-12 h-12 flex-shrink-0">
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

export default StudentDashboard;