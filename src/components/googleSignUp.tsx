import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User as UserIcon, GraduationCap, Users, Hash, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { completeGoogleSignup, completeNormalSignup } from "../api/api";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["student", "admin"], { required_error: "Please select a role" }),
  discipline: z.string().optional(),
  batch: z.string().optional(),
  rollNo: z.string().optional(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  semester: z.string().optional(),
  dateOfJoining: z.string().optional(),
}).refine(
  (d) => (d.role === "student" ? !!d.discipline && !!d.batch && !!d.rollNo : true),
  { message: "All student fields are required", path: ["discipline"] }
);

type FormData = z.infer<typeof formSchema>;

const GoogleSignupForm: React.FC<{ onSubmit?: (d: FormData) => void; onCancel?: () => void }> = ({ onSubmit, onCancel }) => {
  const [selectedRole, setSelectedRole] = useState<"student" | "admin">("student");
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      role: "student",
      discipline: "",
      batch: "",
      rollNo: "",
      phoneNumber: "",
      semester: "",
      dateOfJoining: "",
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      const payload = {
        fullName: data.fullName,
        role: data.role,
        discipline: data.role === "student" ? data.discipline : undefined,
        batch: data.role === "student" ? data.batch : undefined,
        rollNo: data.role === "student" ? data.rollNo : undefined,
        phoneNumber: data.phoneNumber,
        semester: data.role === "student" ? data.semester : undefined,
        dateOfJoining: data.role === "student" && data.dateOfJoining ? data.dateOfJoining : undefined,
      };

      console.log("Submitting Google signup payload:", payload);

      const res = await completeGoogleSignup(payload, { withCredentials: true });
      console.log("Server response:", res.data);

      if (res.data?.token) localStorage.setItem("token", res.data.token);
      if (res.data?.user) localStorage.setItem("currentUser", JSON.stringify(res.data.user));

      navigate(res.data.user.role === "admin" ? "/admin-dashboard" : "/student-dashboard", { replace: true });
      onSubmit?.(data);
    } catch (err: any) {
      console.error("Registration failed:", err);
      alert("Registration failed: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleRoleChange = (value: "student" | "admin") => {
    setSelectedRole(value);
    form.setValue("role", value);
    if (value === "admin") {
      form.setValue("discipline", "");
      form.setValue("batch", "");
      form.setValue("rollNo", "");
      form.setValue("semester", "");
      form.setValue("dateOfJoining", "");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-form-background p-4">
      <Card className="w-full max-w-lg shadow-lg border-form-border">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-2">
            <UserIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">Complete Your Profile</CardTitle>
          <p className="text-muted-foreground text-sm">Please provide additional information to complete your registration</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Full Name */}
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <UserIcon className="w-4 h-4" /> Full Name <span className="text-form-error">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your full name" className="h-11 border-form-border focus:border-form-focus" />
                  </FormControl>
                  <FormMessage className="text-form-error text-xs" />
                </FormItem>
              )} />

              {/* Role */}
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <GraduationCap className="w-4 h-4" /> Role
                  </FormLabel>
                  <Select value={field.value} onValueChange={(v: "student" | "admin") => { field.onChange(v); handleRoleChange(v); }}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-form-border focus:border-form-focus">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-form-error text-xs" />
                </FormItem>
              )} />

              {/* Phone Number */}
              <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., 03xx-xxxxxxx" className="h-11 border-form-border focus:border-form-focus" />
                  </FormControl>
                  <FormMessage className="text-form-error text-xs" />
                </FormItem>
              )} />

              {/* Student-only fields */}
              {selectedRole === "student" && (
                <div className="space-y-4">
                  <FormField control={form.control} name="discipline" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <BookOpen className="w-4 h-4" /> Discipline
                      </FormLabel>
                      <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                        <FormControl>
                          <SelectTrigger className="h-11 border-form-border focus:border-form-focus">
                            <SelectValue placeholder="Select your discipline" />
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
                      <FormMessage className="text-form-error text-xs" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="batch" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Users className="w-4 h-4" /> Batch
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 2023-2027" className="h-11 border-form-border focus:border-form-focus" />
                      </FormControl>
                      <FormMessage className="text-form-error text-xs" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="rollNo" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Hash className="w-4 h-4" /> Roll Number
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., CT-210001" className="h-11 border-form-border focus:border-form-focus" />
                      </FormControl>
                      <FormMessage className="text-form-error text-xs" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="semester" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Semester</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 6" className="h-11 border-form-border focus:border-form-focus" />
                      </FormControl>
                      <FormMessage className="text-form-error text-xs" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="dateOfJoining" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Date of Joining</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-11 border-form-border focus:border-form-focus" />
                      </FormControl>
                      <FormMessage className="text-form-error text-xs" />
                    </FormItem>
                  )} />
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel ?? (() => navigate("/"))}
                  className="flex-1 h-11 border-form-border hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground">
                  Complete Registration
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
