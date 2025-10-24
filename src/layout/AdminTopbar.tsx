// src/layout/Topbar.tsx
import React from "react";
import { Menu } from "lucide-react";

interface TopbarProps {
  onMenuClick: () => void;
  currentTitle: string;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick, currentTitle }) => {
  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle */}
        <button
          className="md:hidden text-gray-600 hover:text-gray-800"
          onClick={onMenuClick}
        >
          <Menu size={22} />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">{currentTitle}</h1>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
          A
        </div>
        <span className="text-gray-700 text-sm font-medium">Admin</span>
      </div>
    </header>
  );
};

export default Topbar;
