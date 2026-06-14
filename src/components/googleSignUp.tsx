import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  User as UserIcon,
  GraduationCap,
  Users,
  Hash,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { completeGoogleSignup } from "../api/api";

/* --------------------------- Schema --------------------------- */
const formSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    role: z.enum(["student", "admin"], {
      required_error: "Please select a role",
    }),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    discipline: z.string().optional(),
    batch: z.string().optional(),
    rollNo: z.string().optional(),
    supervisorEmail: z.string().optional(),
    phoneNumber: z.string().min(1, "Phone number is required"),
    semester: z.string().optional(),
    dateOfJoining: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (d) =>
      d.role === "student"
        ? !!d.discipline &&
          !!d.batch &&
          !!d.rollNo &&
          !!d.supervisorEmail &&
          !!d.semester
        : true,
    {
      message: "All student fields are required",
      path: ["discipline"],
    }
  )
  .refine(
    (d) =>
      d.role === "student"
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.supervisorEmail || "")
        : true,
    {
      message: "Enter a valid supervisor/admin email",
      path: ["supervisorEmail"],
    }
  );

type FormData = z.infer<typeof formSchema>;

/* ------------------------- Component -------------------------- */
const GoogleSignupForm: React.FC<{
  onSubmit?: (d: FormData) => void;
  onCancel?: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [selectedRole, setSelectedRole] = useState<"student" | "admin">(
    "student"
  );

  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      role: "student",
      password: "",
      confirmPassword: "",
      discipline: "",
      batch: "",
      rollNo: "",
      supervisorEmail: "",
      phoneNumber: "",
      semester: "",
      dateOfJoining: "",
    },
  });

  /* ------------------------ Submit ------------------------ */
  const handleSubmit = async (data: FormData) => {
    try {
      const payload = {
        fullName: data.fullName.trim(),
        role: data.role,
        password: data.password,
        discipline: data.role === "student" ? data.discipline : undefined,
        batch: data.role === "student" ? data.batch : undefined,
        rollNo: data.role === "student" ? data.rollNo : undefined,
        supervisorEmail:
          data.role === "student"
            ? data.supervisorEmail?.toLowerCase().trim()
            : undefined,
        phoneNumber: data.phoneNumber,
        semester: data.role === "student" ? data.semester : undefined,
        dateOfJoining:
          data.role === "student" && data.dateOfJoining
            ? data.dateOfJoining
            : undefined,
      };

      const res = await completeGoogleSignup(payload, {
        withCredentials: true,
      });

      /*
        IMPORTANT:
        Google signup should NEVER log the user in.
        It should only submit the approval request.
        After approval, user must login from normal login form.
      */
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");

      alert(
        res.data?.message ||
          "Signup request submitted. You can login with normal email/password after approval."
      );

      onSubmit?.(data);

      // Use "/" if your normal login page is at "/".
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Registration failed:", err);

      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");

      alert(
        "Registration failed: " +
          (err?.response?.data?.message || err.message)
      );
    }
  };

  /* ---------------------- Role Change ---------------------- */
  const handleRoleChange = (value: "student" | "admin") => {
    setSelectedRole(value);
    form.setValue("role", value);

    if (value === "admin") {
      form.setValue("discipline", "");
      form.setValue("batch", "");
      form.setValue("rollNo", "");
      form.setValue("supervisorEmail", "");
      form.setValue("semester", "");
      form.setValue("dateOfJoining", "");
    }
  };

  /* --------------------------- UI --------------------------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-form-background p-4">
      <Card className="w-full max-w-lg shadow-lg border-form-border">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-2">
            <UserIcon className="w-6 h-6 text-primary-foreground" />
          </div>

          <CardTitle className="text-2xl font-semibold text-foreground">
            Complete Your Profile
          </CardTitle>

          <p className="text-muted-foreground text-sm">
            Please provide additional information to complete your registration
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              {/* Full Name */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Full Name *
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your full name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Create a password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Confirm your password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" /> Role
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v: "student" | "admin") => {
                        field.onChange(v);
                        handleRoleChange(v);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="03xx-xxxxxxx" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Student Fields */}
              {selectedRole === "student" && (
                <div className="space-y-4">
                  {/* Supervisor Email */}
                  <FormField
                    control={form.control}
                    name="supervisorEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <UserIcon className="inline w-4 h-4 mr-1" />
                          Supervisor/Admin Email *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="admin@cloud.neduet.edu.pk"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Discipline */}
                  <FormField
                    control={form.control}
                    name="discipline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <BookOpen className="inline w-4 h-4 mr-1" />
                          Discipline *
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select discipline" />
                            </SelectTrigger>
                          </FormControl>

                          <SelectContent>
                            <SelectItem value="CT">CT</SelectItem>
                            <SelectItem value="AI">AI</SelectItem>
                            <SelectItem value="DS">DS</SelectItem>
                            <SelectItem value="GA">GA</SelectItem>
                            <SelectItem value="CY">CY</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Batch */}
                  <FormField
                    control={form.control}
                    name="batch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Users className="inline w-4 h-4 mr-1" />
                          Batch *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="2023-2027" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Semester */}
                  <FormField
                    control={form.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <GraduationCap className="inline w-4 h-4 mr-1" />
                          Semester *
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select semester" />
                            </SelectTrigger>
                          </FormControl>

                          <SelectContent>
                            <SelectItem value="1">1st Semester</SelectItem>
                            <SelectItem value="2">2nd Semester</SelectItem>
                            <SelectItem value="3">3rd Semester</SelectItem>
                            <SelectItem value="4">4th Semester</SelectItem>
                            <SelectItem value="5">5th Semester</SelectItem>
                            <SelectItem value="6">6th Semester</SelectItem>
                            <SelectItem value="7">7th Semester</SelectItem>
                            <SelectItem value="8">8th Semester</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Roll No */}
                  <FormField
                    control={form.control}
                    name="rollNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Hash className="inline w-4 h-4 mr-1" />
                          Roll Number *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="CT-210001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel ?? (() => navigate("/"))}
                  className="flex-1"
                >
                  Cancel
                </Button>

                <Button type="submit" className="flex-1">
                  Submit Signup Request
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleSignupForm;