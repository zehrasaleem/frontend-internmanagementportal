import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTimetable from "./pages/AdminTimetable";
import StudentDashboard from "./pages/StudentDashboard";
import StudentTasks from "./pages/StudentTasks";
import StudentAttendance from "./pages/StudentAttendance";
import StudentTimetable from "./pages/StudentTimetable";
import StudentProfile from "./pages/StudentProfile";
import InternManagement from "./pages/InternManagement";
import TaskManagement from "./pages/TaskManagement";
import AttendanceReports from "./pages/AttendanceReports";
import ProgramReports from "./pages/ProgramReports";
import NotFound from "./pages/NotFound";
import TeamLeadDashboard from "@/pages/TeamLeadDashboard";
import TeamLeadTaskManagement from "@/pages/TeamLeadTaskManagement";
import TeamLeadTimetable from "@/pages/TeamLeadTimetableAndScheduling";

import ProjectManagement from "./pages/ProjectManagement";

import LoginForm from "./components/LoginForm";
import GoogleSignupForm from "./components/googleSignUp";
import GoogleSignUpFail from "@/components/googleSignUpFail";
import NormalRegistrationSignUpButton from "@/components/normalRegistrationSignUpButton";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />

          {/* Admin */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-timetable" element={<AdminTimetable />} />

          {/* Student */}
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/student-tasks" element={<StudentTasks />} />
          <Route path="/student-attendance" element={<StudentAttendance />} />
          <Route path="/student-timetable" element={<StudentTimetable />} />
          <Route path="/student-profile" element={<StudentProfile />} />

          {/* Program management */}
          <Route path="/intern-management" element={<InternManagement />} />
          <Route path="/task-management" element={<TaskManagement />} />
          <Route path="/project-management" element={<ProjectManagement />} /> 
          <Route path="/attendance-reports" element={<AttendanceReports />} />
          <Route path="/program-reports" element={<ProgramReports />} />

          <Route path="/teamlead-dashboard" element={<TeamLeadDashboard />} />
          <Route path="/teamlead-task-management" element={<TeamLeadTaskManagement />} />
          <Route path="/teamlead-timetable" element={<TeamLeadTimetable />} />

          {/* Google OAuth flows */}
          <Route path="/google-signup" element={<GoogleSignupForm />} />
          <Route path="/signup-fail" element={<GoogleSignUpFail />} />
          <Route path="/normal-register" element={<NormalRegistrationSignUpButton />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
