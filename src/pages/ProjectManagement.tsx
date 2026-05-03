import React, { useEffect, useState } from "react";
import {
  fetchProjects,
  createProject,
  assignProject,
  unassignProject,
  deleteProject,
  updateProject,
} from "../api/projects";
import api from "../api/api";
import {
  Plus,
  MoreVertical,
  X,
} from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminNavbar from "@/components/admin/AdminNavbar";

interface Student {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

interface Project {
  _id?: string;
  title: string;
  description?: string;
  color?: string;
  status?: string;
  createdAt?: string;
  dueDate?: string;
  teamLead?: Student | null;
  assignedTo?: Student[];
}

const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [teamLead, setTeamLead] = useState<string>(""); // only _id string
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [status, setStatus] = useState("Active");
  const [date, setDate] = useState<string>("");
  const [me, setMe] = useState<any>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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

  // ✅ FIXED: Only fetch students (not all users), filter role, remove duplicates
  const fetchStudents = async () => {
    try {
      const res = await api.get("/users/students");

      // supports both shapes:
      // 1) res.data = [...]
      // 2) res.data.students = [...]
      const rawList: Student[] = Array.isArray(res.data) ? res.data : (res.data?.students || []);

      // defensive filter + dedupe by _id
      const onlyStudents = rawList
        .filter((u: any) => u && u._id && (u.role ? u.role === "student" : true))
        .reduce((acc: Student[], cur: Student) => {
          if (!acc.some((x) => x._id === cur._id)) acc.push(cur);
          return acc;
        }, []);

      setStudents(onlyStudents);
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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setColor("#3b82f6");
    setStatus("Active");
    setDate("");
    setTeamLead("");
    setEditingProject(null);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("Please enter a project title!");

    const projectPayload = {
      title,
      description,
      color,
      status,
      createdAt: date ? new Date(date).toISOString() : new Date().toISOString(),
      teamLead: teamLead || null,
    };

    try {
      if (editingProject) {
        const res = await updateProject(editingProject._id!, projectPayload);
        setProjects((prev) =>
          prev.map((p) => (p._id === editingProject._id ? res.data : p))
        );
        setEditingProject(null);
      } else {
        const res = await createProject(projectPayload);
        const newProject = (res as any).data || res;
        setProjects((prev) => [newProject, ...prev]);
      }

      setShowModal(false);
      resetForm();
    } catch (err: any) {
      console.error("❌ Full API error:", err.response?.data || err);
      alert("Failed to save project. Please check console for details.");
    }
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
    setTeamLead(project.teamLead?._id || "");
    setShowModal(true);
  };

  const onAssign = async (projectId: string) => {
    if (!selectedStudent)
      return alert("Please choose a student before assigning.");
    try {
      await assignProject(projectId, selectedStudent);
      await fetchAllProjects();
      setSelectedStudent("");
    } catch (err) {
      console.error("❌ Error assigning student:", err);
    }
  };

  const onUnassign = async (projectId: string, userId: string) => {
    try {
      await unassignProject(projectId, userId);
      await fetchAllProjects();
    } catch (err) {
      console.error("❌ Error unassigning student:", err);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar activeItem="Project Management" />

      {/* Main */}
      <div className="flex-1 ml-64">
        <AdminNavbar me={me} onLogout={handleLogout} />

        <main className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Project Management
            </h2>
          </div>

          {/* Top section */}
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

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <p className="text-gray-500 text-sm">No projects yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.map((p) => (
                <div
                  key={p._id || p.title}
                  className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                >
                  {/* Title & Status */}
                  <div className="flex justify-between items-start relative">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {p.title}
                      </h3>
                      <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mt-1">
                        {p.status || "Active"}
                      </span>
                    </div>

                    {/* Dropdown */}
                    <div
                      className="relative dropdown-container"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical
                        className="text-gray-400 cursor-pointer"
                        onClick={() =>
                          setOpenDropdownId(openDropdownId === p._id ? null : p._id!)
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

                  {/* Description */}
                  <p className="text-gray-600 mt-3 text-sm">
                    {p.description || "No description"}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    📅 Created:{" "}
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "N/A"}
                  </p>

                  {/* Team Lead */}
                  <div className="mt-3">
                    <p className="font-medium text-gray-700">Team Lead:</p>
                    <p className="text-sm text-gray-600">
                      {p.teamLead ? p.teamLead.name || p.teamLead.email : "Not assigned"}
                    </p>
                  </div>

                  {/* Assigned Students */}
                  <div className="mt-3">
                    <p className="font-medium text-gray-700">Assigned Members:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                      {p.assignedTo && p.assignedTo.length > 0 ? (
                        p.assignedTo.map((s) => (
                          <li
                            key={s._id}
                            className="flex justify-between items-center"
                          >
                            <span>• {s.name || s.email}</span>
                            <button
                              onClick={() => onUnassign(p._id!, s._id)}
                              className="text-red-500 text-xs hover:underline"
                            >
                              Remove
                            </button>
                          </li>
                        ))
                      ) : (
                        <li>No members assigned</li>
                      )}
                    </ul>
                  </div>

                  {/* Assign Dropdown */}
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
                    resetForm();
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>

                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {editingProject ? "Edit Project" : "Create New Project"}
                </h3>

                <form onSubmit={handleCreateProject} className="space-y-4">
                  {/* Project Name */}
                  <div>
                    <label className="text-sm font-medium">Project Name *</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Date */}
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

                  {/* Color */}
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

                  {/* Status */}
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

                  {/* Team Lead */}
                  <div>
                    <label className="text-sm font-medium">Team Lead</label>
                    <select
                      value={teamLead}
                      onChange={(e) => setTeamLead(e.target.value)}
                      className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Select Team Lead</option>
                      {students.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name || s.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
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