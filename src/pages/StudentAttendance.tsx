import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  MapPin,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";
import StudentSidebar from "@/components/students/StudentSidebar";
import StudentNavbar from "@/components/students/StudentNavbar";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: string;
  picture?: string;
};

type MeetingAttendance = {
  slotId: string;
  timetableId: string;
  dateKey: string;
  day: string;
  time: string;
  title: string;
  status: "present" | "absent" | "open" | "upcoming" | "invalid";
  markedAt?: string | null;
  distanceMeters?: number | null;
};

const formatDate = (dateKey: string) => {
  if (!dateKey) return "-";

  const date = new Date(`${dateKey}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatTime = (value?: string | null) => {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getStatusLabel = (status: MeetingAttendance["status"]) => {
  if (status === "present") return "Present";
  if (status === "absent") return "Absent";
  if (status === "open") return "Open Now";
  if (status === "upcoming") return "Upcoming";
  return "Invalid";
};

const getStatusColor = (status: MeetingAttendance["status"]) => {
  if (status === "present") return "bg-green-100 text-green-800";
  if (status === "absent") return "bg-red-100 text-red-800";
  if (status === "open") return "bg-blue-100 text-blue-800";
  if (status === "upcoming") return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-800";
};

const getCurrentPosition = () => {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
};

const StudentAttendance = () => {
  const navigate = useNavigate();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [todayDate, setTodayDate] = useState("");
  const [todayMeetings, setTodayMeetings] = useState<MeetingAttendance[]>([]);
  const [history, setHistory] = useState<MeetingAttendance[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [markingSlotId, setMarkingSlotId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  const loadAttendance = async () => {
    try {
      setLoadingAttendance(true);
      setError("");
      setMessage("");

      const [todayRes, historyRes] = await Promise.all([
        api.get("/attendance/my/today"),
        api.get("/attendance/my/history?limit=30"),
      ]);

      setTodayDate(todayRes.data.dateKey || "");
      setTodayMeetings(todayRes.data.meetings || []);
      setHistory(historyRes.data.history || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to load attendance details"
      );
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const handleMarkAttendance = async (meeting: MeetingAttendance) => {
    try {
      setMarkingSlotId(meeting.slotId);
      setError("");
      setMessage("");

      if (meeting.status !== "open") {
        setError("Attendance can only be marked during the meeting slot time");
        return;
      }

      const position = await getCurrentPosition();

      const { latitude, longitude, accuracy } = position.coords;

      const { data } = await api.post("/attendance/mark", {
        slotId: meeting.slotId,
        latitude,
        longitude,
        accuracy,
      });

      setMessage(data.message || "Attendance marked successfully");
      await loadAttendance();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to mark attendance"
      );
    } finally {
      setMarkingSlotId(null);
    }
  };

  const presentCount = history.filter((record) => record.status === "present")
    .length;

  const totalCompleted = history.filter(
    (record) => record.status === "present" || record.status === "absent"
  ).length;

  const absentCount = history.filter((record) => record.status === "absent")
    .length;

  const attendanceRate =
    totalCompleted === 0 ? 0 : Math.round((presentCount / totalCompleted) * 100);

  const activeMeeting = todayMeetings.find((meeting) => meeting.status === "open");
  const markedMeeting = todayMeetings.find(
    (meeting) => meeting.status === "present"
  );

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar activeItem="Attendance" />

      <div className="ml-64">
        <StudentNavbar
          me={me}
          loadingMe={loadingMe}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className="min-h-[calc(100vh-73px)] p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Attendance Management
                </h2>
                <p className="text-sm text-muted-foreground">
                  Attendance is available only during your scheduled meeting slot
                </p>
              </div>

              <Button
                onClick={loadAttendance}
                variant="outline"
                className="border-gray-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {message && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <span className="text-sm">{message}</span>
              </div>
            )}

            {/* Attendance Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Today's Attendance */}
              <Card className="bg-white border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Today's Attendance
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                      <Clock className="w-10 h-10 text-green-600" />
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        Date:{" "}
                        <span className="font-medium text-foreground">
                          {todayDate ? formatDate(todayDate) : "-"}
                        </span>
                      </p>

                      <p className="text-sm text-muted-foreground mb-4">
                        Current Status:{" "}
                        <span className="font-medium text-green-600">
                          {markedMeeting
                            ? "Attendance marked"
                            : activeMeeting
                            ? "Slot open now"
                            : "No active slot"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {loadingAttendance ? (
                      <p className="text-sm text-muted-foreground text-center">
                        Loading attendance...
                      </p>
                    ) : todayMeetings.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center">
                        No meeting scheduled for today.
                      </p>
                    ) : (
                      todayMeetings.map((meeting) => (
                        <div
                          key={meeting.slotId}
                          className="border border-border rounded-lg p-4 flex items-center justify-between gap-4"
                        >
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {meeting.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {meeting.day} • {meeting.time}
                            </p>
                            {meeting.markedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Marked at {formatTime(meeting.markedAt)}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge
                              className={`${getStatusColor(
                                meeting.status
                              )} border-0`}
                            >
                              {getStatusLabel(meeting.status)}
                            </Badge>

                            <Button
                              onClick={() => handleMarkAttendance(meeting)}
                              disabled={
                                meeting.status !== "open" ||
                                markingSlotId === meeting.slotId
                              }
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <MapPin className="w-4 h-4 mr-2" />
                              {markingSlotId === meeting.slotId
                                ? "Marking..."
                                : "Mark"}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* This Week Summary */}
              <Card className="bg-white border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Attendance Summary
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Completed Meetings
                    </span>
                    <span className="font-semibold text-foreground">
                      {totalCompleted}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Present</span>
                    <span className="font-semibold text-green-600">
                      {presentCount}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Absent</span>
                    <span className="font-semibold text-red-600">
                      {absentCount}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Attendance Rate
                    </span>
                    <span className="font-semibold text-blue-600">
                      {attendanceRate}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance History */}
            <Card className="bg-white border border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Attendance History
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          DATE
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          MEETING
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          SLOT
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          MARKED AT
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          STATUS
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {history.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center text-sm text-muted-foreground"
                          >
                            No attendance history found.
                          </td>
                        </tr>
                      ) : (
                        history.map((record) => (
                          <tr
                            key={`${record.dateKey}-${record.slotId}`}
                            className="border-b border-border hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 text-sm text-foreground">
                              {formatDate(record.dateKey)}
                            </td>

                            <td className="py-3 px-4 text-sm text-foreground">
                              {record.title}
                            </td>

                            <td className="py-3 px-4 text-sm text-foreground">
                              {record.day}, {record.time}
                            </td>

                            <td className="py-3 px-4 text-sm text-foreground">
                              {formatTime(record.markedAt)}
                            </td>

                            <td className="py-3 px-4">
                              <Badge
                                className={`${getStatusColor(
                                  record.status
                                )} border-0`}
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentAttendance;