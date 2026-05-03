import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminNavbar from "@/components/admin/AdminNavbar";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: string;
  picture?: string;
};

type DailyAttendanceRecord = {
  student: {
    _id: string;
    name?: string;
    email?: string;
    picture?: string;
  };
  slotId: string;
  dateKey: string;
  day: string;
  time: string;
  title: string;
  status: "present" | "absent" | "open" | "upcoming" | "invalid";
  markedAt?: string | null;
  distanceMeters?: number | null;
};

type DailySummary = {
  totalMeetings: number;
  present: number;
  absent: number;
  open: number;
  upcoming: number;
  attendanceRate: number;
};

type AcademicSemester = {
  kind: "fall" | "spring";
  year: number;
  start: string;
  end: string;
};

const MIN_ALLOWED_DATE_KEY = "2026-08-17";
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/* ======================================================
   DATE / ACADEMIC HELPERS
====================================================== */

const toDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDateKeyToLocalDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const addDays = (date: Date, daysToAdd: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + daysToAdd);
  return next;
};

const addDaysKey = (dateKey: string, daysToAdd: number) => {
  return toDateKey(addDays(parseDateKeyToLocalDate(dateKey), daysToAdd));
};

const getFallSemester = (year: number): AcademicSemester | null => {
  const fixed: Record<number, { start: string; end: string }> = {
    2026: { start: "2026-08-17", end: "2026-12-18" },
    2027: { start: "2027-08-16", end: "2027-12-17" },
    2028: { start: "2028-08-15", end: "2028-12-15" },
  };

  if (fixed[year]) {
    return { kind: "fall", year, ...fixed[year] };
  }

  if (year >= 2029) {
    const yearsAfterTemplate = year - 2028;
    return {
      kind: "fall",
      year,
      start: addDaysKey("2028-08-15", yearsAfterTemplate * 364),
      end: addDaysKey("2028-12-15", yearsAfterTemplate * 364),
    };
  }

  return null;
};

const getSpringSemester = (year: number): AcademicSemester | null => {
  const fixed: Record<number, { start: string; end: string }> = {
    2027: { start: "2027-01-04", end: "2027-06-11" },
    2028: { start: "2028-01-03", end: "2028-06-09" },
    2029: { start: "2029-01-01", end: "2029-06-08" },
  };

  if (fixed[year]) {
    return { kind: "spring", year, ...fixed[year] };
  }

  if (year >= 2030) {
    const yearsAfterTemplate = year - 2029;
    return {
      kind: "spring",
      year,
      start: addDaysKey("2029-01-01", yearsAfterTemplate * 364),
      end: addDaysKey("2029-06-08", yearsAfterTemplate * 364),
    };
  }

  return null;
};

const getAcademicSemesterForDate = (date: Date): AcademicSemester | null => {
  const key = toDateKey(date);
  const year = date.getFullYear();
  const month = date.getMonth();

  // ✅ critical: block before minimum first
  if (key < MIN_ALLOWED_DATE_KEY) return null;

  // ✅ open full January + June for spring
  if (month === 0 || month === 5) {
    const spring = getSpringSemester(year);
    if (spring) return spring;
  }

  // ✅ open full August + December for fall
  if (month === 7 || month === 11) {
    const fall = getFallSemester(year);
    if (fall) return fall;
  }

  const spring = getSpringSemester(year);
  const fall = getFallSemester(year);

  if (spring && key >= spring.start && key <= spring.end) return spring;
  if (fall && key >= fall.start && key <= fall.end) return fall;

  return null;
};

const isAcademicDate = (date: Date) => {
  return Boolean(getAcademicSemesterForDate(date));
};

const startOfWeekMonday = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const isWeekday = (date: Date) => {
  const day = date.getDay();
  return day >= 1 && day <= 5;
};

const firstWeekdayOfMonth = (monthDate: Date) => {
  const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  while (!isWeekday(d)) d.setDate(d.getDate() + 1);
  return d;
};

const lastWeekdayOfMonth = (monthDate: Date) => {
  const d = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  while (!isWeekday(d)) d.setDate(d.getDate() - 1);
  return d;
};

const week1StartMonday = (monthDate: Date) => {
  return startOfWeekMonday(firstWeekdayOfMonth(monthDate));
};

const weeksInMonthReal = (monthDate: Date) => {
  const first = week1StartMonday(monthDate);
  const last = startOfWeekMonday(lastWeekdayOfMonth(monthDate));
  const diffMs = last.getTime() - first.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
};

const weekStartForMonth = (monthDate: Date, weekIndex: number) => {
  return addDays(week1StartMonday(monthDate), (weekIndex - 1) * 7);
};

const dateForCell = (monthDate: Date, weekIndex: number, dayIndex: number) => {
  const weekStart = weekStartForMonth(monthDate, weekIndex);
  return addDays(weekStart, dayIndex);
};

const weekIndexForDateInItsMonth = (date: Date) => {
  const firstWeekStart = week1StartMonday(date);
  const currentWeekStart = startOfWeekMonday(date);
  const diffMs = currentWeekStart.getTime() - firstWeekStart.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
};

const isAllowedCellDate = (date: Date, currentMonth: Date) => {
  const sameMonth =
    date.getMonth() === currentMonth.getMonth() &&
    date.getFullYear() === currentMonth.getFullYear();

  return sameMonth && isWeekday(date) && isAcademicDate(date);
};

const getInitialMonth = () => {
  const today = new Date();
  if (isAcademicDate(today)) {
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }
  return new Date(2026, 7, 1); // August 2026
};

const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const formatDayChipDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatTime = (value?: string | null) => {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getInitials = (name?: string, email?: string) => {
  const base = (name || email || "NA").trim();
  const parts = base.split(/[ ._@-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "NA";
};

const getStatusLabel = (status: DailyAttendanceRecord["status"]) => {
  if (status === "present") return "Present";
  if (status === "absent") return "Absent";
  if (status === "open") return "Open Now";
  if (status === "upcoming") return "Upcoming";
  return "Invalid";
};

const getStatusColor = (status: DailyAttendanceRecord["status"]) => {
  if (status === "present") return "bg-green-100 text-green-700";
  if (status === "absent") return "bg-red-100 text-red-700";
  if (status === "open") return "bg-blue-100 text-blue-700";
  if (status === "upcoming") return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-700";
};

const AttendanceReports = () => {
  const navigate = useNavigate();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [currentMonth, setCurrentMonth] = useState(getInitialMonth());

  const [activeWeek, setActiveWeek] = useState(() => {
    const today = new Date();
    if (isAcademicDate(today)) {
      const week = weekIndexForDateInItsMonth(today);
      return Math.max(1, week);
    }
    return 1;
  });

  const visibleWeekCount = useMemo(
    () => weeksInMonthReal(currentMonth),
    [currentMonth]
  );

  const visibleDates = useMemo(() => {
    return days.map((_, index) => dateForCell(currentMonth, activeWeek, index));
  }, [currentMonth, activeWeek]);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();

    if (isAcademicDate(today)) {
      return toDateKey(today);
    }

    const fallbackDate = dateForCell(new Date(2026, 7, 1), 1, 0);
    return toDateKey(fallbackDate);
  });

  const [summary, setSummary] = useState<DailySummary>({
    totalMeetings: 0,
    present: 0,
    absent: 0,
    open: 0,
    upcoming: 0,
    attendanceRate: 0,
  });

  const [records, setRecords] = useState<DailyAttendanceRecord[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (activeWeek > visibleWeekCount) {
      setActiveWeek(visibleWeekCount);
    }
  }, [activeWeek, visibleWeekCount]);

  useEffect(() => {
    const allowedDatesInWeek = visibleDates.filter((date) =>
      isAllowedCellDate(date, currentMonth)
    );

    const allowedKeys = allowedDatesInWeek.map((date) => toDateKey(date));

    if (!allowedKeys.includes(selectedDate)) {
      if (allowedDatesInWeek.length > 0) {
        setSelectedDate(toDateKey(allowedDatesInWeek[0]));
      }
    }
  }, [currentMonth, activeWeek, visibleDates, selectedDate]);

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

  const loadReport = async () => {
    try {
      setLoadingReport(true);
      setError("");

      const { data } = await api.get(
        `/attendance/admin/daily?date=${selectedDate}`
      );

      setSummary(
        data.summary || {
          totalMeetings: 0,
          present: 0,
          absent: 0,
          open: 0,
          upcoming: 0,
          attendanceRate: 0,
        }
      );

      setRecords(data.records || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to load attendance report"
      );
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
    setActiveWeek(1);
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
    setActiveWeek(1);
  };

  const attendanceStats = [
    {
      title: "Attendance Rate",
      value: `${summary.attendanceRate}%`,
      valueColor: "text-green-600",
      indicatorColor: "bg-green-500",
    },
    {
      title: "Present",
      value: String(summary.present),
      valueColor: "text-blue-600",
      indicatorColor: "bg-blue-500",
    },
    {
      title: "Absent",
      value: String(summary.absent),
      valueColor: "text-red-600",
      indicatorColor: "bg-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activeItem="Attendance Reports" />

      {/* Main Content */}
      <div className="ml-64">
        <AdminNavbar
          me={me}
          loadingMe={loadingMe}
          onLogout={handleLogout}
        />

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Page Controls / Header moved from navbar */}
          <div className="mb-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Attendance Reports
                    </h1>
                    <p className="text-sm text-gray-500">
                      {loadingMe ? "…" : me?.role === "admin" ? "Admin" : "User"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevMonth}
                      className="border-gray-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg min-w-[180px] text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {formatMonthYear(currentMonth)}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextMonth}
                      className="border-gray-300"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>

                    <Button
                      onClick={loadReport}
                      disabled={loadingReport || !selectedDate}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {loadingReport ? "Loading..." : "Generate Report"}
                    </Button>
                  </div>
                </div>

                {/* Week Controls */}
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: visibleWeekCount }, (_, index) => {
                    const weekNumber = index + 1;
                    const isActive = activeWeek === weekNumber;

                    return (
                      <button
                        key={weekNumber}
                        onClick={() => setActiveWeek(weekNumber)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Week {weekNumber}
                      </button>
                    );
                  })}
                </div>

                {/* Day Selection */}
                <div className="flex flex-wrap gap-2">
                  {visibleDates.map((date, index) => {
                    const allowed = isAllowedCellDate(date, currentMonth);
                    const key = toDateKey(date);
                    const selected = selectedDate === key;

                    return (
                      <button
                        key={key}
                        onClick={() => allowed && setSelectedDate(key)}
                        disabled={!allowed}
                        className={`min-w-[110px] rounded-lg border px-3 py-2 text-left transition-colors ${
                          !allowed
                            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                            : selected
                            ? "bg-blue-50 border-blue-500 text-blue-700"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="text-xs font-medium">{days[index]}</div>
                        <div className="text-sm">{formatDayChipDate(date)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Stats Section */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {attendanceStats.map((stat, index) => (
                <Card
                  key={index}
                  className="border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </CardTitle>
                      <div
                        className={`w-3 h-3 rounded-full ${stat.indicatorColor}`}
                      ></div>
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

          {/* Summary Row */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-gray-200">
              <CardContent className="py-4">
                <p className="text-sm text-gray-500">Total Scheduled Meetings</p>
                <p className="text-xl font-bold text-gray-900">
                  {summary.totalMeetings}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="py-4">
                <p className="text-sm text-gray-500">Open Now</p>
                <p className="text-xl font-bold text-blue-600">
                  {summary.open}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="py-4">
                <p className="text-sm text-gray-500">Upcoming</p>
                <p className="text-xl font-bold text-yellow-600">
                  {summary.upcoming}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Attendance Details */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Daily Attendance Details
              </CardTitle>
              <p className="text-sm text-gray-500">
                Selected Date:{" "}
                <span className="font-medium text-gray-700">{selectedDate}</span>
              </p>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                        INTERN
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                        MEETING
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                        SLOT
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                        MARKED AT
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                        DISTANCE
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                        STATUS
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {records.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-sm text-gray-500"
                        >
                          No scheduled meeting attendance found for this date.
                        </td>
                      </tr>
                    ) : (
                      records.map((record) => (
                        <tr
                          key={`${record.student._id}-${record.slotId}`}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage
                                  src={record.student.picture || ""}
                                  alt={
                                    record.student.name || record.student.email
                                  }
                                />
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                                  {getInitials(
                                    record.student.name,
                                    record.student.email
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-medium text-gray-900 text-sm block">
                                  {record.student.name ||
                                    record.student.email ||
                                    "Student"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {record.student.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-sm text-gray-600">
                            {record.title}
                          </td>

                          <td className="py-4 px-4 text-sm text-gray-600">
                            {record.day}, {record.time}
                          </td>

                          <td className="py-4 px-4 text-sm text-gray-600">
                            {formatTime(record.markedAt)}
                          </td>

                          <td className="py-4 px-4 text-sm text-gray-600">
                            {typeof record.distanceMeters === "number"
                              ? `${Math.round(record.distanceMeters)} m`
                              : "-"}
                          </td>

                          <td className="py-4 px-4">
                            <Badge
                              className={`${getStatusColor(
                                record.status
                              )} border-0 text-xs`}
                            >
                              {getStatusLabel(record.status)}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AttendanceReports;