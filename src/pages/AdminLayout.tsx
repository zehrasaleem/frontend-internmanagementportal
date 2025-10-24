// src/pages/AdminLayout.tsx
import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FolderKanban,
  FileText,
  Briefcase,
  Calendar,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const sidebarItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin-dashboard" },
    { label: "Intern Management", icon: Users, path: "/intern-management" },
    { label: "Task Management", icon: ClipboardList, path: "/task-management" },
    { label: "Project Management", icon: FolderKanban, path: "/project-management" },
    { label: "Attendance Reports", icon: FileText, path: "/attendance-reports" },
    { label: "Program Reports", icon: Briefcase, path: "/program-reports" },
    { label: "Timetable", icon: Calendar, path: "/admin-timetable" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ===== Sidebar ===== */}
      <aside
        className={`fixed md:static z-40 top-0 left-0 h-full bg-white shadow-md flex flex-col justify-between transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-0 md:w-64"
        }`}
      >
        <div className={`${isSidebarOpen ? "block" : "hidden md:block"} flex flex-col h-full`}>
          {/* Sidebar Header */}
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-blue-500" />
              Admin Panel
            </h2>
            {/* Close on mobile */}
            <button
              className="md:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.label}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    isActive ? "text-blue-600 font-semibold bg-blue-50" : "text-gray-700"
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={() => navigate("/")}
            >
              <LogOut className="mr-2 h-5 w-5" /> Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* ===== Main Content Area ===== */}
      <div className="flex-1 flex flex-col">
        {/* ===== Topbar ===== */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle Button (Mobile) */}
            <button
              className="md:hidden text-gray-600 hover:text-gray-800"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={22} />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              Admin Dashboard
            </h1>
          </div>

          {/* Right Side (User Info or Settings) */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
              A
            </div>
            <span className="text-gray-700 text-sm font-medium">Admin</span>
          </div>
        </header>

        {/* ===== Page Content ===== */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
