import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type TeamLeadSidebarProps = {
  activeItem: string;
};

const TeamLeadSidebar = ({ activeItem }: TeamLeadSidebarProps) => {
  const navigate = useNavigate();

  const handleNavigation = (item: string) => {
    if (item === "Dashboard") {
      navigate("/teamlead-dashboard");
    } else if (item === "Task Management") {
      navigate("/teamlead-task-management");
    } else if (item === "Timetable & Scheduling") {
      navigate("/teamlead-timetable");
    }
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: ClipboardList, label: "Task Management" },
    { icon: Calendar, label: "Timetable & Scheduling" },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>

          <div className="ml-3">
            <h1 className="font-semibold text-gray-900 text-sm">
              Team Lead Dashboard
            </h1>
            <p className="text-xs text-gray-500">
              Intern Management Portal
            </p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-1">
        {sidebarItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleNavigation(item.label)}
            className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-all duration-200 ${
              item.label === activeItem
                ? "bg-purple-50 text-purple-600 border-l-4 border-purple-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="ml-3 font-medium text-sm leading-tight">
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TeamLeadSidebar;