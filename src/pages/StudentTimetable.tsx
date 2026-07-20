import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import StudentSidebar from "@/components/students/StudentSidebar";
import StudentNavbar from "@/components/students/StudentNavbar";

/* ================= TYPES ================= */

type Slot = {
  _id?: string;
  day: string;
  time: string;
  date: string;
  status: "free" | "busy" | "task" | "meeting";
  label?: string;
};

type CurrentUser = {
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

/* ================= HELPERS ================= */

const toDateKey = (d: Date) => {
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
  const key = toDateKey(date);
  const year = date.getFullYear();
  const month = date.getMonth();

  // ✅ open full January and June
  if (month === 0 || month === 5) {
    const spring = getSpringSemester(year);
    if (spring) return spring;
  }

  // ✅ open full August and December
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
        key >= toDateKey(semester.start) && key <= toDateKey(semester.end)
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

const dateForCell = (
  year: number,
  month: number,
  activeWeek: number,
  dayName: string
) => {
  const dayIndex = days.indexOf(dayName);
  const ws = weekStartForMonth(year, month, activeWeek);
  const cell = new Date(ws);
  cell.setDate(ws.getDate() + dayIndex);
  return cell;
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

  return toDateKey(weekStart) < toDateKey(semester.start)
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
  return (
    date.getFullYear() === year &&
    date.getMonth() === month &&
    isAcademicDate(date)
  );
};

const getInitialTimetableMonth = () => {
  const today = new Date();
  if (toDateKey(today) < MIN_ALLOWED_DATE_KEY) return MIN_ALLOWED_MONTH;
  return new Date(today.getFullYear(), today.getMonth(), 1);
};

const slotKey = (slot: Slot) => `${slot.day}__${slot.time}__${slot.date}`;

const getDayNameFromDate = (date: Date) => {
  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][date.getDay()];
};

const getAcademicProjectionPeriod = (date: Date) => {
  const semester = getAcademicSemesterForDate(date);
  if (!semester) return null;

  const year = date.getFullYear();
  const month = date.getMonth();

  if (month >= 0 && month <= 5 && getSpringSemester(year)) {
    return {
      start: makeLocalDate(year, 0, 1),
      end: makeLocalDate(year, 5, 30),
    };
  }

  if (month >= 7 && month <= 11 && getFallSemester(year)) {
    return {
      start: makeLocalDate(year, 7, 1),
      end: makeLocalDate(year, 11, 31),
    };
  }

  return null;
};

const getAllSameDayDatesInAcademicPeriod = (
  selectedDate: Date,
  selectedDay: string
) => {
  const period = getAcademicProjectionPeriod(selectedDate);
  if (!period) return [];

  const dates: Date[] = [];
  let current = new Date(period.start);

  while (toDateKey(current) <= toDateKey(period.end)) {
    if (isAcademicDate(current) && getDayNameFromDate(current) === selectedDay) {
      dates.push(new Date(current));
    }

    current = addDays(current, 1);
  }

  return dates;
};

const availabilityPatternKey = (slot: Slot) => {
  if (!slot.date) return "";

  const slotDate = parseDateKeyToLocalDate(slot.date);
  const period = getAcademicProjectionPeriod(slotDate);

  if (!period) return "";

  return `${toDateKey(period.start)}__${toDateKey(period.end)}__${slot.day}__${slot.time}`;
};

const projectAvailabilitySlotsToSemester = (slots: Slot[]) => {
  const map = new Map<string, Slot>();

  slots.forEach((slot) => {
    if (slot.status !== "free" && slot.status !== "busy") return;
    if (!slot.date) return;

    const slotDate = parseDateKeyToLocalDate(slot.date);
    if (!isAcademicDate(slotDate)) return;

    const projectedDates = getAllSameDayDatesInAcademicPeriod(slotDate, slot.day);

    projectedDates.forEach((projectedDate) => {
      const projectedSlot: Slot = {
        day: slot.day,
        time: slot.time,
        date: toDateKey(projectedDate),
        status: slot.status,
      };

      map.set(slotKey(projectedSlot), projectedSlot);
    });
  });

  return Array.from(map.values());
};

export default function StudentTimetable() {
  const navigate = useNavigate();

  const [savedSchedules, setSavedSchedules] = useState<Record<string, Slot[]>>({});
  const [visibleSlots, setVisibleSlots] = useState<Slot[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<CurrentUser | null>(null);

  const [currentMonth, setCurrentMonth] = useState(getInitialTimetableMonth);
  const [activeWeek, setActiveWeek] = useState(1);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const weeksInMonth = weeksInMonthReal(year, month);
  const weekKey = `${year}-${month}-${activeWeek}`;
  const semesterLabel = getSemesterLabel(year, month, activeWeek);
  const canGoPrev =
    toDateKey(new Date(year, month, 1)) > toDateKey(MIN_ALLOWED_MONTH);

  useEffect(() => {
    setActiveWeek(1);
  }, [currentMonth]);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setMe(res.data.user))
      .catch(() => navigate("/login"));
  }, [navigate]);

  const loadTimetable = async () => {
    const res = await api.get("/timetable/student");
    const timetable = res.data?.timetable || res.data;

    if (!timetable?.slots) {
      setSavedSchedules({});
      setVisibleSlots([]);
      return;
    }

    const grouped: Record<string, Slot[]> = {};

    timetable.slots.forEach((slot: Slot) => {
      if (!slot.date) return;

      const dk =
        typeof slot.date === "string"
          ? slot.date.slice(0, 10)
          : toDateKey(new Date(slot.date));

      const d = parseDateKeyToLocalDate(dk);
      if (!isAcademicDate(d)) return;

      const wk = weekIndexForDateInItsMonth(d);
      const k = `${d.getFullYear()}-${d.getMonth()}-${wk}`;

      if (!grouped[k]) grouped[k] = [];
      grouped[k].push({ ...slot, date: dk });
    });

    setSavedSchedules(grouped);
    setVisibleSlots(grouped[weekKey] || []);
  };

  useEffect(() => {
    loadTimetable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setEditMode(false);

    const currentKey = `${year}-${month}-${activeWeek}`;
    const exactSlots = savedSchedules[currentKey] || [];

    const baseKey = getBasePeriodKey(year, month, activeWeek);
    const baseSlots = baseKey ? savedSchedules[baseKey] || [] : [];

    const exactKeys = new Set(exactSlots.map((slot) => slotKey(slot)));

    const mapped = baseSlots
      .map((slot) => {
        const cellDate = dateForCell(year, month, activeWeek, slot.day);

        return {
          ...slot,
          date: toDateKey(cellDate),
        };
      })
      .filter((slot) => {
        const d = parseDateKeyToLocalDate(slot.date);
        return isAllowedCellDate(d, year, month);
      })
      .filter((slot) => {
        // exact saved slot for this date/time wins
        return !exactKeys.has(slotKey(slot));
      });

    setVisibleSlots([...mapped, ...exactSlots]);
  }, [activeWeek, currentMonth, savedSchedules, year, month]);

  const toggleSlot = (day: string, time: string) => {
    if (!editMode) return;

    const cellDate = dateForCell(year, month, activeWeek, day);

    if (!isAllowedCellDate(cellDate, year, month)) return;

    const dk = toDateKey(cellDate);

    setVisibleSlots((prev) => {
      const existing = prev.find(
        (s) => s.day === day && s.time === time && s.date === dk
      );

      if (existing?.status === "task" || existing?.status === "meeting") return prev;

      if (!existing) {
        return [...prev, { day, time, date: dk, status: "free" }];
      }

      return prev.map((s) =>
        s.day === day && s.time === time && s.date === dk
          ? { ...s, status: s.status === "free" ? "busy" : "free" }
          : s
      );
    });
  };

  const saveSchedule = async () => {
    setSaving(true);

    try {
      const currentKey = `${year}-${month}-${activeWeek}`;

      const updatedSchedules = {
        ...savedSchedules,
        [currentKey]: visibleSlots,
      };

      const allSavedFreeBusySlots = (
        Object.values(updatedSchedules).flat() as Slot[]
      ).filter((s) => {
        if (s.status !== "free" && s.status !== "busy") return false;
        if (!s.date) return false;
        return isAcademicDate(parseDateKeyToLocalDate(s.date));
      });

      const currentVisibleFreeBusySlots = visibleSlots.filter((s) => {
        if (s.status !== "free" && s.status !== "busy") return false;
        if (!s.date) return false;
        return isAcademicDate(parseDateKeyToLocalDate(s.date));
      });

      const currentVisiblePatternKeys = new Set(
        currentVisibleFreeBusySlots.map((slot) => availabilityPatternKey(slot))
      );

      const slotsWithoutOldCurrentPatterns = allSavedFreeBusySlots.filter((slot) => {
        return !currentVisiblePatternKeys.has(availabilityPatternKey(slot));
      });

      const finalSlotsToProject = [
        ...slotsWithoutOldCurrentPatterns,
        ...currentVisibleFreeBusySlots,
      ];

      const projectedSlots = projectAvailabilitySlotsToSemester(finalSlotsToProject);

      await api.post("/timetable/student", { slots: projectedSlots });

      await loadTimetable();
      setEditMode(false);
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setSaving(false);
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
    <StudentSidebar activeItem="Timetable & Scheduling" />

    <div className="ml-64">
      <StudentNavbar me={me} loadingMe={false} onLogout={logout} />

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

              <Button variant="outline" onClick={nextMonth}>
                Next →
              </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: weeksInMonth }, (_, i) => i + 1).map((w) => (
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

            {/* Quick Actions now moves with the sticky header */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>

              <CardContent>
                <Button onClick={() => setEditMode(!editMode)}>
                  {editMode ? "Cancel Edit" : "Edit Availability"}
                </Button>

                {editMode && (
                  <Button
                    className="ml-2"
                    onClick={saveSchedule}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Schedule"}
                  </Button>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Weekly Schedule */}
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
                      const cellDate = dateForCell(
                        year,
                        month,
                        activeWeek,
                        day
                      );

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

                        const dk = toDateKey(cellDate);

                        const slot = visibleSlots.find(
                          (s) =>
                            s.day === day &&
                            s.time === time &&
                            s.date === dk
                        );

                        return (
                          <td
                            key={day}
                            onClick={() =>
                              inMonth && toggleSlot(day, time)
                            }
                            className={`border p-2 text-center ${
                              !inMonth
                                ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                                : editMode
                                ? "cursor-pointer hover:bg-gray-100"
                                : ""
                            }`}
                          >
                          {inMonth && slot && (
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
)}                       {inMonth && !slot && (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  </div>
); }