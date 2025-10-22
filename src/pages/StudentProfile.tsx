// client/src/pages/StudentProfile.tsx
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
  Edit,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/api/api";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
  phoneNumber?: string;
  discipline?: string;
  semester?: string;
  rollNo?: string;
  dateOfJoining?: string; // ISO string
};

const StudentProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/student-dashboard" },
    { icon: CheckSquare, label: "My Tasks", path: "/student-tasks" },
    { icon: Users, label: "Attendance", path: "/student-attendance" },
    { icon: Calendar, label: "Timetable & Scheduling", path: "/student-timetable" },
    { icon: UserIcon, label: "Profile", path: "/student-profile" },
  ];

  // Fetch current user
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

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };

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
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  location.pathname === item.path
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
            <h2 className="text-2xl font-bold text-foreground mb-6">My Profile</h2>

            {/* Profile Header */}
            <div className="flex items-center space-x-4 mb-8">
              <Avatar className="h-16 w-16">
                <AvatarImage src={me?.picture || ""} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {loadingMe ? "…" : displayName}
                </h3>
              </div>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Personal Information */}
              <Card className="bg-white border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email:</p>
                    <p className="text-sm font-medium text-foreground">
                      {me?.email || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Phone:</p>
                    <p className="text-sm font-medium text-foreground">
                      {me?.phoneNumber || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Department / Discipline:</p>
                    <p className="text-sm font-medium text-foreground">
                      {me?.discipline || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Semester:</p>
                    <p className="text-sm font-medium text-foreground">
                      {me?.semester || "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Student Info */}
              <Card className="bg-white border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Student Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Roll No:</p>
                    <p className="text-sm font-medium text-foreground">
                      {me?.rollNo || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Joined:</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(me?.dateOfJoining)}
                    </p>
                  </div>

                  {/* Keep room for supervisor, if you add it later to the model */}
                  <div>
                    <p className="text-sm text-muted-foreground">Supervisor:</p>
                    <p className="text-sm font-medium text-foreground">—</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Edit Profile Button */}
            <div className="flex justify-start">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
                <Edit className="w-4 h-4 mr-2" />
                EDIT PROFILE
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
