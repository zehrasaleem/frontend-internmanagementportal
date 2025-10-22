import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Calendar,
  LogOut,
  Search,
  ChevronDown,
  UserPlus,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
};

const InternManagement = () => {
  const [activeItem, setActiveItem] = useState("Intern Management");
  const navigate = useNavigate();

  // ---- current user state ----
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

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
    me?.name || (me?.email ? me.email.split("@")[0] : "Admin");

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

  const handleNavigation = (item: string) => {
    setActiveItem(item);
    if (item === "Dashboard") {
      navigate("/admin-dashboard");
    } else if (item === "Task Management") {
      navigate("/task-management");
    } else if (item === "Attendance Reports") {
      navigate("/attendance-reports");
    } else if (item === "Program Reports") {
      navigate("/program-reports");
    } else if (item === "Timetable & Scheduling") {
      navigate("/admin-timetable");
    }
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Users, label: "Intern Management", active: true },
    { icon: ClipboardList, label: "Task Management" },
    { icon: FileText, label: "Attendance Reports" },
    { icon: BarChart3, label: "Program Reports" },
    { icon: Calendar, label: "Timetable & Scheduling" },
  ];

  const stats = [
    {
      title: "Today's Attendance",
      value: "92%",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      borderColor: "border-green-200",
    },
    {
      title: "Weekly Average",
      value: "88%",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      title: "Late Arrivals",
      value: "3",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      borderColor: "border-orange-200",
    },
  ];

  const interns = [
    {
      id: 1,
      name: "Ahmed Ali",
      email: "ahmedali@cloud.neduet.ed",
      avatar: "AA",
      tasks: "2",
      attendance: "92%",
      status: "Active",
    },
    {
      id: 2,
      name: "Sarah Khan",
      email: "sarahkhan@cloud.neduet.ed",
      avatar: "SK",
      tasks: "6/10",
      attendance: "80%",
      status: "Active",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div className="ml-3">
              <h1 className="font-semibold text-gray-900 text-sm">CSIT Admin Dashboard</h1>
              <p className="text-xs text-gray-500">Intern Management Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item.label)}
              className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                item.label === activeItem
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="ml-3 font-medium text-sm leading-tight">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">CSIT Admin Dashboard</h1>
              <p className="text-xs text-gray-500">
                {loadingMe ? "…" : me?.role === "admin" ? "Admin" : "User"}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={me?.picture || ""} alt={displayName} />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-700">
                  {loadingMe ? "Loading..." : displayName}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Log Out
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Intern Management</h2>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Intern
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className={`${stat.borderColor} border-2 ${stat.bgColor}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search and Filter Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search Interns..." className="pl-10 bg-gray-100 border-gray-200" />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="bg-gray-100 border-gray-200">
                All Status
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Interns Table */}
          <Card className="border border-gray-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-gray-600 font-medium">INTERN</TableHead>
                    <TableHead className="text-gray-600 font-medium">EMAIL</TableHead>
                    <TableHead className="text-gray-600 font-medium">TASKS</TableHead>
                    <TableHead className="text-gray-600 font-medium">ATTENDANCE</TableHead>
                    <TableHead className="text-gray-600 font-medium">STATUS</TableHead>
                    <TableHead className="text-gray-600 font-medium">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interns.map((intern) => (
                    <TableRow key={intern.id} className="border-b border-gray-100">
                      <TableCell className="py-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                              {intern.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900">{intern.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{intern.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                          {intern.tasks}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{intern.attendance}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          {intern.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-700 p-0">
                            VIEW
                          </Button>
                          <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-700 p-0">
                            EDIT
                          </Button>
                          <Button variant="link" size="sm" className="text-red-600 hover:text-red-700 p-0">
                            REMOVE
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default InternManagement;
