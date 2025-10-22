import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

type Step = "collect" | "otp" | "profile";
type Role = "student" | "admin";

export default function NormalRegistrationSignUpButton() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("collect");

  // auth basics
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  // profile fields
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [discipline, setDiscipline] = useState("");
  const [batch, setBatch] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [semester, setSemester] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState<string>("");

  // ui flags
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const requestOtp = async () => {
    setSending(true);
    setMessage(null);
    try {
      await api.post("/auth/request-otp", {
        email: email.toLowerCase().trim(),
        password,
      });
      setStep("otp");
      setMessage("We’ve emailed you a 6-digit code.");
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Could not send OTP");
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    setVerifying(true);
    setMessage(null);
    try {
      const cleanedOtp = (otp || "").replace(/\D/g, "").trim();
      await api.post("/auth/verify-otp", {
        email: email.toLowerCase().trim(),
        otp: cleanedOtp,
      });
      setStep("profile");
      setMessage(null);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Invalid OTP");
    } finally {
      setVerifying(false);
    }
  };

  const completeProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // require student-only core fields
      if (role === "student" && (!discipline || !batch || !rollNo)) {
        setMessage("Please fill discipline, batch, and roll number.");
        setSaving(false);
        return;
      }

      const { data } = await api.post("/auth/register/complete", {
        email: email.toLowerCase().trim(),
        fullName,
        role,
        discipline: role === "student" ? discipline : undefined,
        batch: role === "student" ? batch : undefined,
        rollNo: role === "student" ? rollNo : undefined,
        phoneNumber,
        // ⬇️ only send these when role is student
        semester: role === "student" ? semester : undefined,
        dateOfJoining: role === "student" && dateOfJoining ? dateOfJoining : undefined,
      });

      // ✅ Save JWT for /auth/me interceptor
      if (data?.token) {
        localStorage.setItem("token", data.token);
      }


      // ✅ Save user so dashboards can read name/initials
      if (data?.user) {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
      }

      const userRole: Role = data?.user?.role || "student";
      navigate(userRole === "admin" ? "/admin-dashboard" : "/student-dashboard");
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Could not complete registration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {step === "collect" && "Create your account"}
            {step === "otp" && "Verify your email"}
            {step === "profile" && "Complete your profile"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === "collect" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@cloud.neduet.edu.pk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button
                className="w-full"
                onClick={requestOtp}
                disabled={sending || !email || !password}
              >
                {sending ? "Sending code..." : "Send OTP"}
              </Button>
            </>
          )}

          {step === "otp" && (
            <>
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  We sent a 6-digit code to <strong>{email}</strong>.
                </p>
                <label className="block text-sm font-medium mb-1">Enter OTP</label>
                <Input
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit code"
                />
              </div>

              <Button
                className="w-full"
                onClick={verifyOtp}
                disabled={verifying || otp.replace(/\D/g, "").length < 6}
              >
                {verifying ? "Verifying..." : "Verify"}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={requestOtp}
                disabled={sending}
              >
                Resend OTP
              </Button>
            </>
          )}

          {step === "profile" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <Select value={role} onValueChange={(v: Role) => setRole(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === "student" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Discipline</label>
                    <Select value={discipline} onValueChange={setDiscipline}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your discipline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CT">CT</SelectItem>
                        <SelectItem value="AI">AI</SelectItem>
                        <SelectItem value="DS">DS</SelectItem>
                        <SelectItem value="GA">GA</SelectItem>
                        <SelectItem value="CY">CY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Batch</label>
                    <Input
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      placeholder="e.g., 2023-2027"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Roll Number</label>
                    <Input
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      placeholder="e.g., CT-210001"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., 03xx-xxxxxxx"
                />
              </div>

              {/* ⬇️ Show only for students */}
              {role === "student" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Semester</label>
                    <Input
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      placeholder="e.g., 6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Date of Joining</label>
                    <Input
                      type="date"
                      value={dateOfJoining}
                      onChange={(e) => setDateOfJoining(e.target.value)}
                    />
                  </div>
                </>
              )}

              <Button
                className="w-full"
                onClick={completeProfile}
                disabled={saving || !fullName}
              >
                {saving ? "Saving..." : "Complete Registration"}
              </Button>
            </>
          )}

          {message && <p className="text-sm text-red-600">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
