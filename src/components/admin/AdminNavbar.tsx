import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type AdminUser = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  picture?: string;
};

type AdminNavbarProps = {
  me: AdminUser | null;
  loadingMe?: boolean;
  onLogout: () => void;
};

const getInitials = (name?: string, email?: string) => {
  const base = (name || email || "A").trim();
  const parts = base.split(/[ ._@-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";

  return (first + last).toUpperCase() || "A";
};

const AdminNavbar = ({ me, loadingMe = false, onLogout }: AdminNavbarProps) => {
  const displayName = me?.name || me?.email || "Admin";
  const initials = getInitials(me?.name, me?.email);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-end px-6 py-4">
        <div className="flex items-center gap-4">
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
            onClick={onLogout}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Log Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;