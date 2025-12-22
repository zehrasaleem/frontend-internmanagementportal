import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TeamLeadTaskManagement = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow border border-gray-200 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Team Lead Task Management
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          This page will allow team leads to review and manage tasks.
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

export default TeamLeadTaskManagement;
