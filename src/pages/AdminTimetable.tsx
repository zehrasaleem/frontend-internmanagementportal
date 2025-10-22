import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Calendar,
  LogOut,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
};

const AdminTimetable = () => {
  const [activeItem, setActiveItem] = useState("Timetable & Scheduling");
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
    me?.name || (me?.email ? me.email.split("@")[0] : "Admin User");

  const initials = useMemo(() => {
    const base = (me?.name || me?.email || "AU").trim();
    const parts = base.split(/[ ._@-]+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || "AU";
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
    } else if (item === "Intern Management") {
      navigate("/intern-management");
    } else if (item === "Task Management") {
      navigate("/task-management");
    } else if (item === "Attendance Reports") {
      navigate("/attendance-reports");
    } else if (item === "Program Reports") {
      navigate("/program-reports");
    }
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Users, label: "Intern Management" },
    { icon: ClipboardList, label: "Task Management" },
    { icon: FileText, label: "Attendance Reports" },
    { icon: BarChart3, label: "Program Reports" },
    { icon: Calendar, label: "Timetable & Scheduling" },
  ];

  const weeklySchedule = [
    {
      time: "8:30-\n9:20 AM",
      monday: [
        { text: "Class: Ahmed, Sarah", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
      tuesday: [
        { text: "Class: Sarah, Ali", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Ahmed: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
      wednesday: [
        { text: "Class: Ahmed, Ali + 1 more", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
      thursday: [
        { text: "Class: Ahmed, Sarah + 1 more", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
      friday: [
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
    },
    {
      time: "9:30-\n10:20 AM",
      monday: [
        { text: "Class: Ahmed", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Internship: Fatima", type: "internship", color: "bg-purple-100 text-purple-800" },
      ],
      tuesday: [
        { text: "Meeting: Ahmed", type: "meeting", color: "bg-orange-100 text-orange-800" },
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Class: Ali", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Internship: Fatima", type: "internship", color: "bg-purple-100 text-purple-800" },
      ],
      wednesday: [
        { text: "Class: Ahmed, Sarah", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
      thursday: [
        { text: "Ahmed: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Class: Sarah, Ali", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Internship: Fatima", type: "internship", color: "bg-purple-100 text-purple-800" },
      ],
      friday: [
        { text: "Class: Ahmed", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
    },
    {
      time: "10:30-\n11:20 AM",
      monday: [
        { text: "Class: Ahmed", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Internship", type: "internship", color: "bg-purple-100 text-purple-800" },
      ],
      tuesday: [
        { text: "Class: Ahmed", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Class", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Fatima: Internship", type: "internship", color: "bg-purple-100 text-purple-800" },
      ],
      wednesday: [
        { text: "Class: Ahmed", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Class: Sarah, Ali", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
      thursday: [
        { text: "Class: Ahmed", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Internship", type: "internship", color: "bg-purple-100 text-purple-800" },
      ],
      friday: [
        { text: "Meeting: Ahmed", type: "meeting", color: "bg-orange-100 text-orange-800" },
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
    },
    { time: "11:00-\n11:30 AM", monday: { type: "break", text: "LUNCH BREAK" }, tuesday: { type: "break", text: "LUNCH BREAK" }, wednesday: { type: "break", text: "LUNCH BREAK" }, thursday: { type: "break", text: "LUNCH BREAK" }, friday: { type: "break", text: "LUNCH BREAK" } },
    {
      time: "12:30-\n1:20 PM",
      monday: [
        { text: "Sarah: Class", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Internship", type: "internship", color: "bg-purple-100 text-purple-800" },
      ],
      tuesday: [
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Class", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Fatima: Internship", type: "internship", color: "bg-purple-100 text-purple-800" },
      ],
      wednesday: [
        { text: "Class: Ahmed", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Class: Sarah, Ali", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
      thursday: [
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Internship", type: "internship", color: "bg-purple-100 text-purple-800" },
      ],
      friday: [
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
    },
    { time: "1:10 -2:00\nPM", monday: { type: "break", text: "LUNCH BREAK" }, tuesday: { type: "break", text: "LUNCH BREAK" }, wednesday: { type: "break", text: "LUNCH BREAK" }, thursday: { type: "break", text: "LUNCH BREAK" }, friday: { type: "break", text: "LUNCH BREAK" } },
    {
      time: "2:00-\n2:50 PM",
      monday: [
        { text: "Class: Ahmed", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Sarah: Class", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Internship", type: "internship", color: "bg-purple-100 text-purple-800" },
      ],
      tuesday: [
        { text: "Class: Ahmed", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Class", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Fatima: Internship", type: "internship", color: "bg-purple-100 text-purple-800" },
      ],
      wednesday: [
        { text: "Class: Ahmed", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Class: Sarah, Ali", type: "class", color: "bg-blue-100 text-blue-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
      thursday: [
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Internship", type: "internship", color: "bg-purple-100 text-purple-800" },
      ],
      friday: [
        { text: "Meeting: Ahmed", type: "meeting", color: "bg-orange-100 text-orange-800" },
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
    },
    {
      time: "2:50-\n3:40 PM",
      monday: [
        { text: "Ahmed: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
      tuesday: [
        { text: "Ahmed: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
      wednesday: [
        { text: "Ahmed: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
      thursday: [
        { text: "Ahmed: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
      friday: [
        { text: "Ahmed: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Sarah: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Ali: Free", type: "free", color: "bg-gray-100 text-gray-800" },
        { text: "Fatima: Free", type: "free", color: "bg-gray-100 text-gray-800" },
      ],
    },
  ];

  const allInterns = [
    { name: "Ahmed Ali", initials: "AA", date: "Dec 2027-23" },
    { name: "Sarah Khan", initials: "SK", date: "" },
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
              <p className="text-xs text-gray-500">Internship Program Management</p>
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
              <item.icon className="w-5 h-5" />
              <span className="ml-3 font-medium">{item.label}</span>
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
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Page Title */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Weekly Schedule - Intern Availability
            </h2>
            <p className="text-sm text-gray-500">
              Week of December 23-27, 2025 (50-minute periods)
            </p>
          </div>

          {/* Weekly Schedule Table */}
          <Card className="border border-gray-200 mb-8">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        TIME
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        MONDAY
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        TUESDAY
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        WEDNESDAY
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        THURSDAY
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        FRIDAY
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {weeklySchedule.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 font-semibold text-sm text-gray-700 whitespace-pre-line">
                          {row.time}
                        </td>

                        {/* Monday */}
                        <td className="px-4 py-4">
                          {Array.isArray(row.monday) ? (
                            <div className="space-y-1">
                              {row.monday.map((item, i) => (
                                <Badge
                                  key={i}
                                  className={`${item.color} border-0 text-xs px-2 py-1 block w-fit`}
                                >
                                  {item.text}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-center font-semibold text-sm">
                              {row.monday.text}
                            </div>
                          )}
                        </td>

                        {/* Tuesday */}
                        <td className="px-4 py-4">
                          {Array.isArray(row.tuesday) ? (
                            <div className="space-y-1">
                              {row.tuesday.map((item, i) => (
                                <Badge
                                  key={i}
                                  className={`${item.color} border-0 text-xs px-2 py-1 block w-fit`}
                                >
                                  {item.text}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-center font-semibold text-sm">
                              {row.tuesday.text}
                            </div>
                          )}
                        </td>

                        {/* Wednesday */}
                        <td className="px-4 py-4">
                          {Array.isArray(row.wednesday) ? (
                            <div className="space-y-1">
                              {row.wednesday.map((item, i) => (
                                <Badge
                                  key={i}
                                  className={`${item.color} border-0 text-xs px-2 py-1 block w-fit`}
                                >
                                  {item.text}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-center font-semibold text-sm">
                              {row.wednesday.text}
                            </div>
                          )}
                        </td>

                        {/* Thursday */}
                        <td className="px-4 py-4">
                          {Array.isArray(row.thursday) ? (
                            <div className="space-y-1">
                              {row.thursday.map((item, i) => (
                                <Badge
                                  key={i}
                                  className={`${item.color} border-0 text-xs px-2 py-1 block w-fit`}
                                >
                                  {item.text}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-center font-semibold text-sm">
                              {row.thursday.text}
                            </div>
                          )}
                        </td>

                        {/* Friday */}
                        <td className="px-4 py-4">
                          {Array.isArray(row.friday) ? (
                            <div className="space-y-1">
                              {row.friday.map((item, i) => (
                                <Badge
                                  key={i}
                                  className={`${item.color} border-0 text-xs px-2 py-1 block w-fit`}
                                >
                                  {item.text}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-center font-semibold text-sm">
                              {row.friday.text}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* All Interns Section */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                All Interns (24 Total)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                {allInterns.map((intern, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback
                        className={`text-white text-sm font-semibold ${
                          intern.initials === "AA" ? "bg-blue-500" : "bg-pink-500"
                        }`}
                      >
                        {intern.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {intern.name}
                      </div>
                      {intern.date && (
                        <div className="text-xs text-gray-500">{intern.date}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminTimetable;
