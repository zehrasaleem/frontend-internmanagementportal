import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type TeamLeadUser = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  picture?: string;
};

type TeamLeadNavbarProps = {
  me: TeamLeadUser | null;
  loadingMe: boolean;
  onLogout: () => void;
};

const getInitials = (name?: string, email?: string) => {
  const base = (name || email || "NA").trim();
  const parts = base.split(/[ ._@-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";

  return (first + last).toUpperCase() || "NA";
};

const TeamLeadNavbar = ({
  me,
  loadingMe,
  onLogout,
}: TeamLeadNavbarProps) => {
  const displayName =
    me?.name || (me?.email ? me.email.split("@")[0] : "Team Lead");

  const initials = getInitials(me?.name, me?.email);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-end px-6 py-4">
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
            onClick={onLogout}
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

export default TeamLeadNavbar;