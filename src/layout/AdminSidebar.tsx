// src/layout/Sidebar.tsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FolderKanban,
  FileText,
  Briefcase,
  Calendar,
  LogOut,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
    <aside
      className={`fixed md:static z-40 top-0 left-0 h-full bg-white shadow-md flex flex-col justify-between transition-all duration-300 ${
        isOpen ? "w-64" : "w-0 md:w-64"
      }`}
    >
      <div className={`${isOpen ? "block" : "hidden md:block"} flex flex-col h-full`}>
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-500" />
            Admin Panel
          </h2>
          <button
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
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
  );
};

export default Sidebar;
