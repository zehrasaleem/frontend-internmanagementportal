// client/src/pages/StudentDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "@/api/api";
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
  Clock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
  // optional student fields:
  discipline?: string;
  batch?: string;
  rollNo?: string;
  phoneNumber?: string;
  semester?: string;
  dateOfJoining?: string;
};

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Dashboard");
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  // Fetch the signed-in user from backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (!mounted) return;
        setMe(data.user);
      } catch (e: any) {
        // If token missing/expired → send to login
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

  const firstName = useMemo(() => displayName.split(/\s+/)[0] ?? "Student", [displayName]);

  // Compute initials like "AA" from "Ahmed Ali" or email local-part
  const initials = useMemo(() => {
    const base = (me?.name || me?.email || "NA").trim();
    if (!base) return "NA";
    const parts = base.split(/[ ._@-]+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || "NA";
  }, [me?.name, me?.email]);

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/student-dashboard" },
    { icon: CheckSquare, label: "My Tasks", path: "/student-tasks" },
    { icon: Users, label: "Attendance", path: "/student-attendance" },
    { icon: Calendar, label: "Timetable & Scheduling", path: "/student-timetable" },
    { icon: UserIcon, label: "Profile", path: "/student-profile" },
  ];

  const handleNavigation = (path: string, label: string) => {
    if (
      path === "/student-tasks" ||
      path === "/student-attendance" ||
      path === "/student-timetable" ||
      path === "/student-profile"
    ) {
      navigate(path);
    } else {
      setActiveTab(label);
    }
  };

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  navigate("/");
};



  const todaysTasks = [
    { title: "Database Design Review", dueTime: "Due: 5:00 PM", status: "In Progress", statusColor: "bg-orange-100 text-orange-800" },
    { title: "API Testing", dueTime: "Due: Tomorrow", status: "Assigned", statusColor: "bg-blue-100 text-blue-800" },
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
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                  activeTab === item.label
                    ? "bg-primary/10 text-primary border-l-4 border-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm leading-tight">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                {loadingMe ? "Welcome…" : `Welcome ${firstName}!`}
              </h2>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-white border border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Task Completed</p>
                        <p className="text-3xl font-bold text-foreground">8</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Pending Tasks</p>
                        <p className="text-3xl font-bold text-foreground">4</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Timetable</p>
                        <Button variant="link" className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium">
                          View Schedule
                        </Button>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <CalendarDays className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Today's Tasks */}
                <Card className="bg-white border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">Today's Tasks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {todaysTasks.map((task, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-1">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">{task.dueTime}</p>
                        </div>
                        <Badge className={`${task.statusColor} border-0`}>{task.status}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-white border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Mark Attendance
                    </Button>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg">
                      <ClipboardList className="w-5 h-5 mr-2" />
                      View All Tasks
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
