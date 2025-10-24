// src/layout/AdminLayout.tsx
import React, { useState, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./AdminSidebar";
import Topbar from "./AdminTopbar";

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  // Automatically detect current page title
  const currentTitle = useMemo(() => {
    const routeMap: Record<string, string> = {
      "/admin-dashboard": "Dashboard",
      "/intern-management": "Intern Management",
      "/task-management": "Task Management",
      "/project-management": "Project Management",
      "/attendance-reports": "Attendance Reports",
      "/program-reports": "Program Reports",
      "/admin-timetable": "Admin Timetable",
    };
    return routeMap[location.pathname] || "Admin Dashboard";
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Topbar
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          currentTitle={currentTitle}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
