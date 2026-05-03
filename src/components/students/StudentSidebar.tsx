import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Calendar,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type StudentSidebarProps = {
  activeItem: string;
};

const StudentSidebar = ({ activeItem }: StudentSidebarProps) => {
  const navigate = useNavigate();

  const handleNavigation = (item: string) => {
    if (item === "Dashboard") {
      navigate("/student-dashboard");
    } else if (item === "My Tasks") {
      navigate("/student-tasks");
    } else if (item === "Attendance") {
      navigate("/student-attendance");
    } else if (item === "Timetable & Scheduling") {
      navigate("/student-timetable");
    } else if (item === "Profile") {
      navigate("/student-profile");
    }
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: CheckSquare, label: "My Tasks" },
    { icon: Users, label: "Attendance" },
    { icon: Calendar, label: "Timetable & Scheduling" },
    { icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>

          <div className="ml-3">
            <h1 className="font-semibold text-gray-900 text-sm">
              Student Dashboard
            </h1>
            <p className="text-xs text-gray-500">
              CS&amp;IT Internship Program
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
                ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
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

export default StudentSidebar;