import React, { useEffect, useState } from "react";
import {
  fetchProjects,
  createProject,
  assignProject,
  deleteProject,
  updateProject,
} from "../api/projects";
import api from "../api/api";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FolderKanban,
  FileText,
  BarChart3,
  Calendar as CalendarIcon,
  LogOut,
  Plus,
  MoreVertical,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Student {
  _id: string;
  name?: string;
  email?: string;
}

interface Project {
  _id?: string;
  title: string;
  description?: string;
  color?: string;
  status?: string;
  createdAt?: string;
  dueDate?: string;
  assignedTo?: Student[];
}

const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [status, setStatus] = useState("Active");
  const [date, setDate] = useState<string>("");
  const [me, setMe] = useState<any>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null); // ✅ NEW STATE

  const colorOptions = [
    "#3b82f6",
    "#22c55e",
    "#a855f7",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#6366f1",
    "#14b8a6",
  ];

  useEffect(() => {
    fetchAllProjects();
    fetchStudents();
    fetchMe();

    // ✅ close dropdown on outside click
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".dropdown-container")) setOpenDropdownId(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchAllProjects = async () => {
    try {
      const res = await fetchProjects();
      setProjects(res.data);
    } catch (err) {
      console.error("❌ Error fetching projects:", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get("/users");
      setStudents(res.data);
    } catch (err) {
      console.warn("⚠️ Could not load students:", err);
    }
  };

  const fetchMe = async () => {
    try {
      const res = await api.get("/auth/me");
      setMe(res.data.user);
    } catch (err) {
      console.warn("⚠️ Could not load user:", err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("Please enter a project title!");

    const projectData: Project = {
      title,
      description,
      color,
      status,
      createdAt: date ? new Date(date).toISOString() : new Date().toISOString(),
    };

    try {
      if (editingProject) {
        const res = await updateProject(editingProject._id!, projectData);
        setProjects((prev) =>
          prev.map((p) => (p._id === editingProject._id ? res.data : p))
        );
        setEditingProject(null);
      } else {
        const res = await createProject(projectData);
        const newProject = res.data || res;
        setProjects((prev) => [newProject, ...prev]);
      }

      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("❌ Error saving project:", err);
      alert("Failed to save project. Please check console for details.");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setColor("#3b82f6");
    setStatus("Active");
    setDate("");
    setEditingProject(null);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setTitle(project.title);
    setDescription(project.description || "");
    setColor(project.color || "#3b82f6");
    setStatus(project.status || "Active");
    setDate(
      project.createdAt
        ? new Date(project.createdAt).toISOString().split("T")[0]
        : ""
    );
    setShowModal(true);
  };

  const onAssign = async (projectId: string) => {
    if (!selectedStudent) return alert("Please choose a student before assigning.");
    try {
      await assignProject(projectId, selectedStudent);
      fetchAllProjects();
    } catch (err) {
      console.error("❌ Error assigning student:", err);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("❌ Error deleting project:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin-dashboard" },
    { icon: Users, label: "Intern Management", path: "/intern-management" },
    { icon: ClipboardList, label: "Task Management", path: "/task-management" },
    { icon: FolderKanban, label: "Project Management", path: "/project-management" },
    { icon: FileText, label: "Attendance Reports", path: "/attendance-reports" },
    { icon: BarChart3, label: "Program Reports", path: "/program-reports" },
    { icon: CalendarIcon, label: "Timetable & Scheduling", path: "/admin-timetable" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div className="ml-3">
              <h1 className="font-semibold text-gray-900 text-sm">
                CSIT Admin Dashboard
              </h1>
              <p className="text-xs text-gray-500">Intern Management Portal</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => (
            <a
              key={item.label}
              href={item.path}
              className={`flex items-center px-3 py-3 rounded-lg text-sm transition-all ${
                item.label === "Project Management"
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Project Management
              </h2>
              <p className="text-sm text-gray-500">
                {me?.role === "admin" ? "Admin" : "User"}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={me?.picture || ""} alt={me?.name || "A"} />
                  <AvatarFallback>{me?.name ? me.name[0] : "A"}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-700">
                  {me?.name || me?.email || "Admin"}
                </span>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-semibold text-gray-800">
              Manage Your Projects
            </h3>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} /> Create New Project
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="text-gray-500 text-sm">No projects yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.map((p) => (
                <div
                  key={p._id || p.title}
                  className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start relative">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {p.title}
                      </h3>
                      <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mt-1">
                        {p.status || "Active"}
                      </span>
                    </div>

                    {/* Dropdown Menu - FIXED */}
                    <div
                      className="relative dropdown-container"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical
                        className="text-gray-400 cursor-pointer"
                        onClick={() =>
                          setOpenDropdownId(
                            openDropdownId === p._id ? null : p._id!
                          )
                        }
                      />
                      {openDropdownId === p._id && (
                        <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg w-32 z-10">
                          <button
                            onClick={() => {
                              handleEditProject(p);
                              setOpenDropdownId(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => {
                              onDelete(p._id!);
                              setOpenDropdownId(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 mt-3 text-sm">
                    {p.description || "No description"}
                  </p>

                  <p className="text-xs text-gray-500 mt-2">
                    📅 Created:{" "}
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>

                  <div className="mt-4">
                    <p className="font-medium text-gray-700">Assigned:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                      {p.assignedTo && p.assignedTo.length > 0 ? (
                        p.assignedTo.map((s) => (
                          <li key={s._id}>• {s.name || s.email}</li>
                        ))
                      ) : (
                        <li>No members assigned</li>
                      )}
                    </ul>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <select
                      className="border rounded-lg px-2 py-1 flex-1 text-sm"
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      value={selectedStudent}
                    >
                      <option value="">Select student</option>
                      {students.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name || s.email}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => onAssign(p._id!)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingProject(null);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>

                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {editingProject ? "Edit Project" : "Create New Project"}
                </h3>

                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Project Name *</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Created Date *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Color</label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {colorOptions.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`w-6 h-6 rounded-full border ${
                            c === color ? "ring-2 ring-blue-500" : ""
                          }`}
                          style={{ backgroundColor: c }}
                          onClick={() => setColor(c)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                    >
                      <option>Active</option>
                      <option>Completed</option>
                      <option>On Hold</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingProject(null);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingProject ? "Save Changes" : "Create Project"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProjectManagement;
