import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TeamLeadTimetable = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow border border-gray-200 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Team Lead Timetable & Scheduling
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Scheduling and timetable features will be added here.
        </p>

        <Button
          onClick={() => navigate("/teamlead-dashboard")}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default TeamLeadTimetable;
