import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";
import StudentSidebar from "@/components/students/StudentSidebar";
import StudentNavbar from "@/components/students/StudentNavbar";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
  phoneNumber?: string;
  discipline?: string;
  semester?: string;
  rollNo?: string;
  dateOfJoining?: string;
};

type ProfileForm = {
  name: string;
  phoneNumber: string;
  discipline: string;
  semester: string;
  rollNo: string;
};

const StudentProfile = () => {
  const navigate = useNavigate();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: "",
    phoneNumber: "",
    discipline: "",
    semester: "",
    rollNo: "",
  });

  // Fetch current user
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (!mounted) return;
        setMe(data.user);
      } catch {
        navigate("/login");
      } finally {
        if (mounted) setLoadingMe(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!me || editMode) return;

    setProfileForm({
      name: me.name || "",
      phoneNumber: me.phoneNumber || "",
      discipline: me.discipline || "",
      semester: me.semester || "",
      rollNo: me.rollNo || "",
    });
  }, [me, editMode]);

  const displayName =
    me?.name || (me?.email ? me.email.split("@")[0] : "Student");

  const initials = useMemo(() => {
    const base = (me?.name || me?.email || "NA").trim();
    const parts = base.split(/[ ._@-]+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || "NA";
  }, [me?.name, me?.email]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };

  const handleEditProfile = () => {
    if (!me) return;

    setProfileForm({
      name: me.name || "",
      phoneNumber: me.phoneNumber || "",
      discipline: me.discipline || "",
      semester: me.semester || "",
      rollNo: me.rollNo || "",
    });

    setEditMode(true);
  };

  const handleCancelEdit = () => {
    if (!me) return;

    setProfileForm({
      name: me.name || "",
      phoneNumber: me.phoneNumber || "",
      discipline: me.discipline || "",
      semester: me.semester || "",
      rollNo: me.rollNo || "",
    });

    setEditMode(false);
  };

  const handleProfileChange = (field: keyof ProfileForm, value: string) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);

      const payload = {
        name: profileForm.name.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
        discipline: profileForm.discipline.trim(),
        semester: profileForm.semester.trim(),
        rollNo: profileForm.rollNo.trim(),
      };

      const { data } = await api.put("/auth/me", payload);

      const updatedUser = data.user || data;

      setMe(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      setEditMode(false);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar activeItem="Profile" />

      <div className="ml-64">
        <StudentNavbar
          me={me}
          loadingMe={loadingMe}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className="min-h-[calc(100vh-73px)] p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              My Profile
            </h2>

            {/* Profile Header */}
            <div className="flex items-center space-x-4 mb-8">
              <Avatar className="h-16 w-16">
                <AvatarImage src={me?.picture || ""} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {loadingMe ? "…" : displayName}
                </h3>
              </div>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Personal Information */}
              <Card className="bg-white border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name:</p>
                    {editMode ? (
                      <Input
                        value={profileForm.name}
                        onChange={(e) =>
                          handleProfileChange("name", e.target.value)
                        }
                        placeholder="Enter name"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground">
                        {me?.name || "—"}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Email:</p>
                    <p className="text-sm font-medium text-foreground">
                      {me?.email || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Phone:</p>
                    {editMode ? (
                      <Input
                        value={profileForm.phoneNumber}
                        onChange={(e) =>
                          handleProfileChange("phoneNumber", e.target.value)
                        }
                        placeholder="Enter phone number"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground">
                        {me?.phoneNumber || "—"}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Department / Discipline:
                    </p>
                    {editMode ? (
                      <Input
                        value={profileForm.discipline}
                        onChange={(e) =>
                          handleProfileChange("discipline", e.target.value)
                        }
                        placeholder="Enter discipline"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground">
                        {me?.discipline || "—"}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Semester:</p>
                    {editMode ? (
                      <Input
                        value={profileForm.semester}
                        onChange={(e) =>
                          handleProfileChange("semester", e.target.value)
                        }
                        placeholder="Enter semester"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground">
                        {me?.semester || "—"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Student Info */}
              <Card className="bg-white border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Student Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Roll No:</p>
                    {editMode ? (
                      <Input
                        value={profileForm.rollNo}
                        onChange={(e) =>
                          handleProfileChange("rollNo", e.target.value)
                        }
                        placeholder="Enter roll number"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground">
                        {me?.rollNo || "—"}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Joined:</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(me?.dateOfJoining)}
                    </p>
                  </div>

                  {/* Keep room for supervisor, if you add it later to the model */}
                  <div>
                    <p className="text-sm text-muted-foreground">Supervisor:</p>
                    <p className="text-sm font-medium text-foreground">—</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Edit / Save Profile Buttons */}
            <div className="flex justify-start gap-3">
              {editMode ? (
                <>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {savingProfile ? "SAVING..." : "SAVE CHANGES"}
                  </Button>

                  <Button
                    onClick={handleCancelEdit}
                    disabled={savingProfile}
                    variant="outline"
                    className="px-6 py-2"
                  >
                    <X className="w-4 h-4 mr-2" />
                    CANCEL
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleEditProfile}
                  disabled={loadingMe || !me}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  EDIT PROFILE
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentProfile;