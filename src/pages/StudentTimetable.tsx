// client/src/pages/StudentTimetable.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Users,
  User as UserIcon,
  CalendarDays,
  FolderKanban,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
};

const StudentTimetable = () => {
  const [activeTab, setActiveTab] = useState("Timetable & Scheduling");
  const navigate = useNavigate();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  // Updated sidebar with Project Management option
  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/student-dashboard" },
    { icon: CheckSquare, label: "My Tasks", path: "/student-tasks" },
    { icon: Users, label: "Attendance", path: "/student-attendance" },
    { icon: Calendar, label: "Timetable & Scheduling", path: "/student-timetable" },
    { icon: FolderKanban, label: "Project Management", path: "/student-projects" },
    { icon: UserIcon, label: "Profile", path: "/student-profile" },
  ];

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
    me?.name || (me?.email ? me.email.split("@")[0] : "Student");

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

  const handleNavigation = (path: string, label: string) => {
    setActiveTab(label);
    navigate(path);
  };

  const todaySchedule = [
    { title: "Project Review", time: "10:00 AM - 11:00 AM", type: "Meeting", color: "bg-purple-100 text-purple-800" },
    { title: "Task Discussion", time: "2:00 PM - 2:30 PM", type: "Internship", color: "bg-green-100 text-green-800" },
  ];

  const weeklySchedule = [
    {
      time: "8:30\nAM",
      monday: { type: "Class", color: "bg-blue-100 text-blue-800" },
      tuesday: { type: "Free Time", color: "bg-green-100 text-green-800" },
      wednesday: { type: "Class", color: "bg-blue-100 text-blue-800" },
      thursday: { type: "Class", color: "bg-blue-100 text-blue-800" },
      friday: { type: "Class", color: "bg-blue-100 text-blue-800" },
    },
    {
      time: "10:30\nAM",
      monday: { type: "Class", color: "bg-blue-100 text-blue-800" },
      tuesday: { type: "Project Review", color: "bg-purple-100 text-purple-800" },
      wednesday: { type: "Class", color: "bg-blue-100 text-blue-800" },
      thursday: { type: "Free Time", color: "bg-green-100 text-green-800" },
      friday: { type: "Class", color: "bg-blue-100 text-blue-800" },
    },
    {
      time: "1:00\nPM",
      monday: { type: "Lunch Break", color: "bg-yellow-100 text-yellow-800" },
      tuesday: { type: "Lunch Break", color: "bg-yellow-100 text-yellow-800" },
      wednesday: { type: "Lunch Break", color: "bg-yellow-100 text-yellow-800" },
      thursday: { type: "Lunch Break", color: "bg-yellow-100 text-yellow-800" },
      friday: { type: "Lunch Break", color: "bg-yellow-100 text-yellow-800" },
    },
    {
      time: "4:30\nPM",
      monday: { type: "Free Time", color: "bg-green-100 text-green-800" },
      tuesday: { type: "Free Time", color: "bg-green-100 text-green-800" },
      wednesday: { type: "Free Time", color: "bg-green-100 text-green-800" },
      thursday: { type: "Free Time", color: "bg-green-100 text-green-800" },
      friday: { type: "Task Discussion", color: "bg-purple-100 text-purple-800" },
    },
  ];

  const upcomingMeetings = [
    {
      title: "Project Review Meeting",
      time: "Tuesday, 10:00 AM - 11:00 AM",
      with: "With: Dr. Mohammad Hassan (Supervisor)",
      color: "border-l-purple-500",
    },
    {
      title: "Task Discussion",
      time: "Friday, 2:00 PM - 2:30 PM",
      with: "With: Admin Team",
      color: "border-l-blue-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Student Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              CS&IT Internship Program
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-foreground">
              {loadingMe ? "Loading..." : displayName}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={me?.picture || ""} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-border min-h-screen">
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path, item.label)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === item.label
                    ? "bg-primary/10 text-primary border-l-4 border-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">My Timetable & Schedule</h2>

            {/* Quick Actions & Today's Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="bg-white border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg">
                    <CalendarDays className="w-5 h-5 mr-2" />
                    Update My Schedule
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Today's Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todaySchedule.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.time}</p>
                      </div>
                      <Badge className={`${item.color} border-0`}>{item.type}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Weekly Schedule */}
            <Card className="bg-white border border-border mb-8">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">My Weekly Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3 font-semibold text-muted-foreground">TIME</th>
                        <th className="text-left p-3 font-semibold text-muted-foreground">MONDAY</th>
                        <th className="text-left p-3 font-semibold text-muted-foreground">TUESDAY</th>
                        <th className="text-left p-3 font-semibold text-muted-foreground">WEDNESDAY</th>
                        <th className="text-left p-3 font-semibold text-muted-foreground">THURSDAY</th>
                        <th className="text-left p-3 font-semibold text-muted-foreground">FRIDAY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklySchedule.map((row, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="p-3 font-medium text-foreground whitespace-pre-line">{row.time}</td>
                          <td className="p-3">
                            <Badge className={`${row.monday.color} border-0 px-3 py-1 text-xs`}>{row.monday.type}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={`${row.tuesday.color} border-0 px-3 py-1 text-xs`}>{row.tuesday.type}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={`${row.wednesday.color} border-0 px-3 py-1 text-xs`}>{row.wednesday.type}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={`${row.thursday.color} border-0 px-3 py-1 text-xs`}>{row.thursday.type}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={`${row.friday.color} border-0 px-3 py-1 text-xs`}>{row.friday.type}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Meetings */}
            <Card className="bg-white border border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">My Upcoming Meetings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingMeetings.map((meeting, index) => (
                  <div key={index} className={`p-4 bg-gray-50 rounded-lg border-l-4 ${meeting.color}`}>
                    <h4 className="font-semibold text-foreground mb-1">{meeting.title}</h4>
                    <p className="text-sm text-muted-foreground mb-1">{meeting.time}</p>
                    <p className="text-sm text-muted-foreground">{meeting.with}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTimetable;
