import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { RefreshCcw } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminNavbar from "@/components/admin/AdminNavbar";

/* ================= TYPES ================= */

type Slot = {
  _id: string;
  day: string;
  time: string;
  date?: string;
  status: "free" | "busy" | "task" | "meeting";
  label?: string;
  meetingDate?: string;
};

type Student = {
  _id: string;
  name: string;
  email: string;
};

type Timetable = {
  _id: string;
  student: Student;
  slots: Slot[];
};

type AdminUser = {
  _id: string;
  name?: string;
  email?: string;
  picture?: string;
};

/* ================= CONSTANTS ================= */

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const times = [
  "8:30 - 9:20",
  "9:30 - 10:20",
  "10:30 - 11:20",
  "11:30 - 12:20",
  "12:30 - 1:20",
  "1:30 - 2:20",
  "2:30 - 3:20",
  "3:30 - 4:30",
];

/* ================= DATE HELPERS ================= */

const dateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseDateKeyToLocalDate = (yyyyMmDd: string) => {
  const [y, m, d] = yyyyMmDd.split("-").map((n) => Number(n));
  return new Date(y, (m || 1) - 1, d || 1);
};

const makeLocalDate = (year: number, month: number, day: number) =>
  new Date(year, month, day);

const addDays = (date: Date, daysToAdd: number) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + daysToAdd);
  return d;
};

const MIN_ALLOWED_DATE_KEY = "2026-08-17";
const MIN_ALLOWED_MONTH = makeLocalDate(2026, 7, 1);

type AcademicSemester = {
  label: "Spring Semester" | "Fall Semester";
  start: Date;
  end: Date;
};

const getFallSemester = (year: number): AcademicSemester | null => {
  const fixed: Record<number, { start: Date; end: Date }> = {
    2026: { start: makeLocalDate(2026, 7, 17), end: makeLocalDate(2026, 11, 18) },
    2027: { start: makeLocalDate(2027, 7, 16), end: makeLocalDate(2027, 11, 17) },
    2028: { start: makeLocalDate(2028, 7, 15), end: makeLocalDate(2028, 11, 15) },
  };

  if (fixed[year]) return { label: "Fall Semester", ...fixed[year] };

  if (year >= 2029) {
    const yearsAfterTemplate = year - 2028;

    return {
      label: "Fall Semester",
      start: addDays(makeLocalDate(2028, 7, 15), yearsAfterTemplate * 364),
      end: addDays(makeLocalDate(2028, 11, 15), yearsAfterTemplate * 364),
    };
  }

  return null;
};

const getSpringSemester = (year: number): AcademicSemester | null => {
  const fixed: Record<number, { start: Date; end: Date }> = {
    2027: { start: makeLocalDate(2027, 0, 4), end: makeLocalDate(2027, 5, 11) },
    2028: { start: makeLocalDate(2028, 0, 3), end: makeLocalDate(2028, 5, 9) },
    2029: { start: makeLocalDate(2029, 0, 1), end: makeLocalDate(2029, 5, 8) },
  };

  if (fixed[year]) return { label: "Spring Semester", ...fixed[year] };

  if (year >= 2030) {
    const yearsAfterTemplate = year - 2029;

    return {
      label: "Spring Semester",
      start: addDays(makeLocalDate(2029, 0, 1), yearsAfterTemplate * 364),
      end: addDays(makeLocalDate(2029, 5, 8), yearsAfterTemplate * 364),
    };
  }

  return null;
};

const getAcademicSemesterForDate = (date: Date): AcademicSemester | null => {
  const key = dateKey(date);
  const year = date.getFullYear();
  const month = date.getMonth();

  // ✅ ONLY CHANGE: open full January and June
  if (month === 0 || month === 5) {
    const spring = getSpringSemester(year);
    if (spring) return spring;
  }

  // ✅ ONLY CHANGE: open full August and December
  if (month === 7 || month === 11) {
    const fall = getFallSemester(year);
    if (fall) return fall;
  }

  if (key < MIN_ALLOWED_DATE_KEY) return null;

  const semesters = [
    getSpringSemester(year),
    getFallSemester(year),
  ].filter(Boolean) as AcademicSemester[];

  return (
    semesters.find(
      (semester) =>
        key >= dateKey(semester.start) && key <= dateKey(semester.end)
    ) || null
  );
};

const isAcademicDate = (date: Date) => Boolean(getAcademicSemesterForDate(date));

const startOfWeekMonday = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const jsDay = d.getDay();
  const diffToMonday = (jsDay + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d;
};

const weeksBetweenMondays = (aMonday: Date, bMonday: Date) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((bMonday.getTime() - aMonday.getTime()) / msPerDay);
  return Math.floor(diffDays / 7);
};

const isWeekday = (d: Date) => {
  const day = d.getDay();
  return day >= 1 && day <= 5;
};

const firstWeekdayOfMonth = (year: number, month: number) => {
  for (let i = 1; i <= 31; i++) {
    const d = new Date(year, month, i);
    if (d.getMonth() !== month) break;
    if (isWeekday(d)) return d;
  }

  return new Date(year, month, 1);
};

const lastWeekdayOfMonth = (year: number, month: number) => {
  const lastDay = new Date(year, month + 1, 0).getDate();

  for (let i = lastDay; i >= 1; i--) {
    const d = new Date(year, month, i);
    if (isWeekday(d)) return d;
  }

  return new Date(year, month + 1, 0);
};

const week1StartMonday = (year: number, month: number) => {
  const firstWd = firstWeekdayOfMonth(year, month);
  return startOfWeekMonday(firstWd);
};

const weeksInMonthReal = (year: number, month: number) => {
  const start = week1StartMonday(year, month);
  const lastWd = lastWeekdayOfMonth(year, month);
  const lastStart = startOfWeekMonday(lastWd);
  return weeksBetweenMondays(start, lastStart) + 1;
};

const weekStartForMonth = (year: number, month: number, weekIndex: number) => {
  const ws = new Date(week1StartMonday(year, month));
  ws.setDate(ws.getDate() + (weekIndex - 1) * 7);
  return ws;
};

const dateForCell = (year: number, month: number, activeWeek: number, dayName: string) => {
  const dayIndex = days.indexOf(dayName);
  const ws = weekStartForMonth(year, month, activeWeek);
  const cell = new Date(ws);
  cell.setDate(ws.getDate() + dayIndex);
  return cell;
};

const weekIndexForDateInItsMonth = (date: Date) => {
  const y = date.getFullYear();
  const m = date.getMonth();
  const start = week1StartMonday(y, m);
  const dateStart = startOfWeekMonday(date);
  return weeksBetweenMondays(start, dateStart) + 1;
};

const getAcademicSemesterForWeek = (
  year: number,
  month: number,
  activeWeek: number
) => {
  const ws = weekStartForMonth(year, month, activeWeek);

  for (let i = 0; i < days.length; i++) {
    const cell = new Date(ws);
    cell.setDate(ws.getDate() + i);

    if (cell.getFullYear() !== year || cell.getMonth() !== month) continue;

    const semester = getAcademicSemesterForDate(cell);
    if (semester) return semester;
  }

  return null;
};

const getAcademicSemesterForMonth = (year: number, month: number) => {
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= totalDays; d++) {
    const semester = getAcademicSemesterForDate(new Date(year, month, d));
    if (semester) return semester;
  }

  return null;
};

const getBaseWeekStartForSemester = (semester: AcademicSemester) => {
  const weekStart = startOfWeekMonday(semester.start);

  return dateKey(weekStart) < dateKey(semester.start)
    ? addDays(weekStart, 7)
    : weekStart;
};

const getSemesterLabel = (year: number, month: number, activeWeek: number) => {
  const semester =
    getAcademicSemesterForWeek(year, month, activeWeek) ||
    getAcademicSemesterForMonth(year, month);

  return semester?.label || "No Active Semester";
};

const getBasePeriodKey = (year: number, month: number, activeWeek: number) => {
  const semester = getAcademicSemesterForWeek(year, month, activeWeek);
  if (!semester) return "";

  const baseWeekStart = getBaseWeekStartForSemester(semester);

  return `${baseWeekStart.getFullYear()}-${baseWeekStart.getMonth()}-${weekIndexForDateInItsMonth(
    baseWeekStart
  )}`;
};

const isAllowedCellDate = (date: Date, year: number, month: number) => {
  return date.getFullYear() === year && date.getMonth() === month && isAcademicDate(date);
};

const getInitialTimetableMonth = () => {
  const today = new Date();
  if (dateKey(today) < MIN_ALLOWED_DATE_KEY) return MIN_ALLOWED_MONTH;
  return new Date(today.getFullYear(), today.getMonth(), 1);
};

const getOrdinalSuffix = (day: number) => {
  if (day >= 11 && day <= 13) return "th";

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const formatHeaderDate = (date: Date) => {
  const day = date.getDate();
  const monthName = date.toLocaleDateString("en-US", { month: "long" });
  return `${day}${getOrdinalSuffix(day)} ${monthName} ${date.getFullYear()}`;
};

const timeOrder = (time: string) => times.indexOf(time);

/* ================= COMPONENT ================= */

export default function AdminTimetable() {
  const navigate = useNavigate();

  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(getInitialTimetableMonth);
  const [activeWeek, setActiveWeek] = useState(1);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const weeksInMonth = weeksInMonthReal(year, month);
  const semesterLabel = getSemesterLabel(year, month, activeWeek);
  const canGoPrev = dateKey(new Date(year, month, 1)) > dateKey(MIN_ALLOWED_MONTH);

  useEffect(() => {
    setActiveWeek(1);
  }, [currentMonth]);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setAdmin(res.data.user))
      .catch(() => navigate("/login"));
  }, [navigate]);

  const loadTimetables = async () => {
    setLoading(true);

    try {
      const res = await api.get("/admin/timetable/all");
      setTimetables(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load timetables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetables();
  }, []);

  const selectedTimetable = timetables.find((t) => t._id === selectedIntern);

  const findExactSlot = (
    timetable: Timetable,
    day: string,
    time: string,
    targetDate: string
  ) => {
    return timetable.slots.find((slot) => {
      const slotDate =
        typeof slot.date === "string"
          ? slot.date.slice(0, 10)
          : slot.date
          ? dateKey(new Date(slot.date))
          : "";

      return slot.day === day && slot.time === time && slotDate === targetDate;
    });
  };

  const findSlotForCell = (timetable: Timetable, day: string, time: string) => {
    const cellDate = dateForCell(year, month, activeWeek, day);

    if (!isAllowedCellDate(cellDate, year, month)) return undefined;

    const targetDate = dateKey(cellDate);

    const exactSlot = findExactSlot(timetable, day, time, targetDate);
    if (exactSlot) return { ...exactSlot, date: targetDate };

    const baseKey = getBasePeriodKey(year, month, activeWeek);
    if (!baseKey) return undefined;

    const [baseYear, baseMonth, baseWeek] = baseKey.split("-").map(Number);
    const baseCellDate = dateForCell(baseYear, baseMonth, baseWeek, day);
    const baseDate = dateKey(baseCellDate);

    const baseSlot = findExactSlot(timetable, day, time, baseDate);

    if (!baseSlot) return undefined;

    // ✅ ONLY NECESSARY CHANGE:
    // free/busy stays mapped as before, and meeting is now also shown across semester.
    // task is still not projected.
    if (
      baseSlot.status !== "free" &&
      baseSlot.status !== "busy" &&
      baseSlot.status !== "meeting"
    ) {
      return undefined;
    }

    return {
      ...baseSlot,
      date: targetDate,
    };
  };

  const freeSlotsForDropdown = useMemo(() => {
    if (!selectedTimetable) return [];

    const available: Slot[] = [];

    days.forEach((day) => {
      times.forEach((time) => {
        const slot = findSlotForCell(selectedTimetable, day, time);

        if (slot?.status === "free") {
          available.push(slot);
        }
      });
    });

    return available.sort((a, b) => {
      const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
      if (dateCompare !== 0) return dateCompare;
      return timeOrder(a.time) - timeOrder(b.time);
    });
  }, [selectedTimetable, year, month, activeWeek]);

  const scheduleMeeting = async () => {
    if (!selectedTimetable || !selectedSlotId || !meetingTitle.trim()) {
      alert("Please select intern, slot, and meeting title");
      return;
    }

    const selectedSlot = freeSlotsForDropdown.find((slot) => slot._id === selectedSlotId);

    if (!selectedSlot) {
      alert("Selected slot is not available");
      return;
    }

    try {
      await api.post("/admin/timetable/schedule", {
        timetableId: selectedTimetable._id,
        slotId: selectedSlot._id,
        title: meetingTitle,
        date: selectedSlot.date,
        day: selectedSlot.day,
        time: selectedSlot.time,
      });

      setOpen(false);
      setSelectedIntern("");
      setSelectedSlotId("");
      setMeetingTitle("");

      await loadTimetables();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to schedule meeting");
    }
  };

  const deleteMeeting = async (timetable: Timetable, slot: Slot) => {
    if (!slot.date) return;

    const confirmDelete = window.confirm(
      `Delete this meeting only for ${slot.date} at ${slot.time}?`
    );

    if (!confirmDelete) return;

    try {
      await api.post("/admin/timetable/cancel-meeting", {
        timetableId: timetable._id,
        slotId: slot._id,
        date: slot.date,
        day: slot.day,
        time: slot.time,
      });

      await loadTimetables();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete meeting");
    }
  };

  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const prevMonth = () => {
    if (!canGoPrev) return;
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

 return (
  <div className="min-h-screen bg-background">
    <AdminSidebar activeItem="Timetable & Scheduling" />

    <div className="ml-64">
      <AdminNavbar me={admin} onLogout={logout} />

      <div className="min-h-[calc(100vh-73px)] p-6 bg-gray-50">

        {/* Sticky Header + Quick Actions */}
        <div className="sticky top-[73px] z-20 bg-gray-50 pb-4">

          <div className="space-y-4">

            <h2 className="text-2xl font-bold">
              Timetable & Scheduling
            </h2>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevMonth}
                disabled={!canGoPrev}
              >
                ← Previous
              </Button>

              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  {monthLabel}
                </h3>

                <p className="text-xl font-bold text-black">
                  {semesterLabel}
                </p>
              </div>

              <Button
                variant="outline"
                onClick={nextMonth}
              >
                Next →
              </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {Array.from(
                { length: weeksInMonth },
                (_, i) => i + 1
              ).map((w) => (
                <button
                  key={w}
                  onClick={() => setActiveWeek(w)}
                  className={`px-3 py-1 rounded text-sm ${
                    activeWeek === w
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Week {w}
                </button>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  Quick Actions
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={loadTimetables}
                    disabled={loading}
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    {loading
                      ? "Refreshing..."
                      : "Refresh"}
                  </Button>

                  <Dialog
                    open={open}
                    onOpenChange={setOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        Schedule Meeting
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Schedule Meeting
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4">

                        <div>
                          <label className="text-sm font-medium">
                            Select Intern
                          </label>

                          <Select
                            value={selectedIntern}
                            onValueChange={(value) => {
                              setSelectedIntern(value);
                              setSelectedSlotId("");
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose intern" />
                            </SelectTrigger>

                            <SelectContent>
                              {timetables.map((timetable) => (
                                <SelectItem
                                  key={timetable._id}
                                  value={timetable._id}
                                >
                                  {timetable.student?.name ||
                                    timetable.student?.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium">
                            Select Free Slot
                          </label>

                          <Select
                            value={selectedSlotId}
                            onValueChange={setSelectedSlotId}
                            disabled={!selectedIntern}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose free slot" />
                            </SelectTrigger>

                            <SelectContent>
                              {freeSlotsForDropdown.length === 0 ? (
                                <SelectItem
                                  value="no-slots"
                                  disabled
                                >
                                  No free slots available
                                </SelectItem>
                              ) : (
                                freeSlotsForDropdown.map((slot) => (
                                  <SelectItem
                                    key={`${slot._id}-${slot.date}`}
                                    value={slot._id}
                                  >
                                    {slot.day} — {slot.date} — {slot.time}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium">
                            Meeting Title
                          </label>

                          <Input
                            value={meetingTitle}
                            onChange={(e) =>
                              setMeetingTitle(
                                e.target.value
                              )
                            }
                            placeholder="Enter meeting title"
                          />
                        </div>

                        <Button
                          className="w-full"
                          onClick={scheduleMeeting}
                        >
                          Schedule Meeting
                        </Button>

                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        <div className="mt-6">


          <Card>
  <CardHeader>
    <CardTitle>Weekly Schedule</CardTitle>
  </CardHeader>

  <CardContent>
    <table className="w-full border text-sm">
      <thead>
        <tr>
          <th className="border p-2">Time</th>

          {days.map((day) => {
            const cellDate = dateForCell(year, month, activeWeek, day);
            const showDate =
              cellDate.getFullYear() === year &&
              cellDate.getMonth() === month;

            return (
              <th key={day} className="border p-2">
                <div>{day}</div>

                {showDate && (
                  <div className="text-xs font-normal text-muted-foreground mt-1">
                    {formatHeaderDate(cellDate)}
                  </div>
                )}
              </th>
            );
          })}
        </tr>
      </thead>

      <tbody>
        {times.map((time) => (
          <tr key={time}>
            <td className="border p-2 font-medium">
              {time}
            </td>

            {days.map((day) => {
              const cellDate = dateForCell(
                year,
                month,
                activeWeek,
                day
              );

              const inMonth = isAllowedCellDate(
                cellDate,
                year,
                month
              );

              return (
                <td
                  key={day}
                  className={`border p-2 text-center ${
                    !inMonth
                      ? "bg-gray-50 text-gray-300"
                      : ""
                  }`}
                >
                  {inMonth && (
                    <div className="space-y-2">
                      {timetables.map((timetable) => {
                        const slot = findSlotForCell(
                          timetable,
                          day,
                          time
                        );

                        if (!slot) return null;

                        return (
                          <div
                            key={`${timetable._id}-${slot._id}-${slot.date}`}
                            className="flex flex-col items-center gap-1"
                          >
                            <span className="text-xs font-medium">
                              {timetable.student?.name ||
                                timetable.student?.email}
                            </span>

                            <span
                         className={`inline-flex items-center justify-center min-w-[72px] px-3 py-1 rounded-lg text-xs font-semibold ${
  slot.status === "free"
    ? "bg-blue-700 text-white"
    : slot.status === "busy"
    ? "bg-blue-100 text-blue-700"
    : slot.status === "task"
    ? "bg-cyan-100 text-cyan-700"
   : "bg-blue-50 border-2 border-blue-900 text-blue-900 shadow-sm"
}`}  
                            >
                              {slot.label || slot.status}
                            </span>

                            {slot.status === "meeting" && (
                            <Button
  size="sm"
  className="h-7 px-3:bg-blue-900 hover:text-white text-xs font-medium shadow-sm transition-all"
                                onClick={() =>
                                  deleteMeeting(
                                    timetable,
                                    slot
                                  )
                                }
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>

    {timetables.length === 0 && (
      <div className="p-6 text-center text-muted-foreground">
        No timetables found.
      </div>
    )}
  </CardContent>
</Card>

        </div>
      </div>
    </div>
  </div>
);
}