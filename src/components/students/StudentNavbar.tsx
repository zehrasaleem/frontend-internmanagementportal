import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type StudentUser = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  picture?: string;
};

type StudentNavbarProps = {
  me: StudentUser | null;
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

const StudentNavbar = ({ me, loadingMe, onLogout }: StudentNavbarProps) => {
  const displayName =
    me?.name || (me?.email ? me.email.split("@")[0] : "Student");

  const initials = getInitials(me?.name, me?.email);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-end px-6 py-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-900">
            {loadingMe ? "Loading..." : displayName}
          </span>

          <Avatar className="w-9 h-9">
            <AvatarImage src={me?.picture || ""} alt={displayName} />
            <AvatarFallback className="bg-blue-600 text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>

          <Button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-5"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default StudentNavbar;