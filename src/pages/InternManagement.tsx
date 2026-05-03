import { useEffect, useState } from "react";
import {
  Search,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminNavbar from "@/components/admin/AdminNavbar";

type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role: "student" | "admin";
  picture?: string;
};

type Intern = {
  _id: string;
  name?: string;
  email: string;
  picture?: string;
  discipline?: string;
  batch?: string;
  rollNo?: string;
  phoneNumber?: string;
  semester?: string;
  dateOfJoining?: string;
};

const InternManagement = () => {
  const navigate = useNavigate();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [interns, setInterns] = useState<Intern[]>([]);
  const [loadingInterns, setLoadingInterns] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [removingInternId, setRemovingInternId] = useState<string | null>(null);

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

  const loadInterns = async () => {
    try {
      setLoadingInterns(true);
      const { data } = await api.get("/users/students");
      setInterns(data.students || []);
    } catch (error) {
      console.error("Failed to load interns:", error);
      setInterns([]);
    } finally {
      setLoadingInterns(false);
    }
  };

  useEffect(() => {
    loadInterns();
  }, []);

  const getInitials = (name?: string, email?: string) => {
    const base = (name || email || "NA").trim();
    const parts = base.split(/[ ._@-]+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || "NA";
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const handleViewIntern = async (intern: Intern) => {
    try {
      setLoadingProfile(true);
      const { data } = await api.get(`/users/students/${intern._id}`);
      setSelectedIntern(data.student || intern);
    } catch (error) {
      console.error("Failed to load intern profile:", error);
      setSelectedIntern(intern);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleRemoveIntern = async (intern: Intern) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${intern.name || intern.email}? This will remove the intern account, timetable, attendance records, and assigned task links. Projects will not be deleted.`
    );

    if (!confirmed) return;

    try {
      setRemovingInternId(intern._id);
      await api.delete(`/users/students/${intern._id}`);

      setInterns((prev) => prev.filter((item) => item._id !== intern._id));

      if (selectedIntern?._id === intern._id) {
        setSelectedIntern(null);
      }
    } catch (error) {
      console.error("Failed to remove intern:", error);
      alert("Failed to remove intern. Please try again.");
    } finally {
      setRemovingInternId(null);
    }
  };

  const filteredInterns = interns.filter((intern) => {
    const search = searchTerm.toLowerCase();
    return (
      intern.name?.toLowerCase().includes(search) ||
      intern.email?.toLowerCase().includes(search) ||
      intern.discipline?.toLowerCase().includes(search) ||
      intern.semester?.toLowerCase().includes(search) ||
      intern.rollNo?.toLowerCase().includes(search)
    );
  });

  const renderProfileView = () => {
    if (!selectedIntern) return null;

    return (
      <main className="p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedIntern(null)}
            className="mb-4 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Interns
          </Button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h2>

          <div className="flex items-center mb-8">
            <Avatar className="w-16 h-16">
              <AvatarImage src={selectedIntern.picture || ""} alt={selectedIntern.name || selectedIntern.email} />
              <AvatarFallback className="bg-blue-600 text-white text-lg">
                {getInitials(selectedIntern.name, selectedIntern.email)}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold text-gray-900 ml-4">
              {selectedIntern.name || "Unnamed Intern"}
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Personal Information
                </h3>

                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-blue-900/70">Email:</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedIntern.email || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-blue-900/70">Phone:</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedIntern.phoneNumber || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-blue-900/70">Department / Discipline:</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedIntern.discipline || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-blue-900/70">Semester:</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedIntern.semester || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Student Details
                </h3>

                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-blue-900/70">Roll No:</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedIntern.rollNo || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-blue-900/70">Joined:</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(selectedIntern.dateOfJoining)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-blue-900/70">Supervisor:</p>
                    <p className="text-sm font-medium text-gray-900">—</p>
                  </div>

                  <div>
                    <p className="text-sm text-blue-900/70">Batch:</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedIntern.batch || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {loadingProfile && (
            <p className="text-sm text-gray-500 mt-4">Loading profile...</p>
          )}
        </div>
      </main>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activeItem="Intern Management" />

      {/* Main Content */}
      <div className="ml-64">
        <AdminNavbar
          me={me}
          loadingMe={loadingMe}
          onLogout={handleLogout}
        />

        {selectedIntern ? (
          renderProfileView()
        ) : (
          <main className="p-6">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Intern Management</h2>
            </div>

            {/* Search Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search Interns..."
                  className="pl-10 bg-gray-100 border-gray-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Interns Table */}
            <Card className="border border-gray-200">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-gray-600 font-medium">INTERN</TableHead>
                      <TableHead className="text-gray-600 font-medium">EMAIL</TableHead>
                      <TableHead className="text-gray-600 font-medium">DISCIPLINE</TableHead>
                      <TableHead className="text-gray-600 font-medium">SEMESTER</TableHead>
                      <TableHead className="text-gray-600 font-medium">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loadingInterns ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Loading interns...
                        </TableCell>
                      </TableRow>
                    ) : filteredInterns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No interns found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInterns.map((intern) => (
                        <TableRow key={intern._id} className="border-b border-gray-100">
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={intern.picture || ""} alt={intern.name || intern.email} />
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                                  {getInitials(intern.name, intern.email)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-gray-900">
                                {intern.name || "Unnamed Intern"}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-gray-600">
                            {intern.email}
                          </TableCell>

                          <TableCell className="text-gray-600">
                            {intern.discipline || "—"}
                          </TableCell>

                          <TableCell className="text-gray-600">
                            {intern.semester || "—"}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => handleViewIntern(intern)}
                                className="text-blue-600 hover:text-blue-700 p-0"
                              >
                                VIEW
                              </Button>

                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => handleRemoveIntern(intern)}
                                disabled={removingInternId === intern._id}
                                className="text-red-600 hover:text-red-700 p-0 disabled:opacity-50"
                              >
                                {removingInternId === intern._id ? "REMOVING..." : "REMOVE"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        )}
      </div>
    </div>
  );
};

export default InternManagement;