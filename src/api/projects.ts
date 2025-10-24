// src/api/project.ts
import api from "./api";

export interface ProjectPayload {
  title: string;
  description?: string;
  dueDate?: string;
  color?: string;
  status?: string;
  createdAt?: string;
}

// 🟡 Fetch all projects
export const fetchProjects = () => api.get("/projects");

// 🟢 Create a new project
export const createProject = async (projectData: ProjectPayload) => {
  try {
    const response = await api.post("/projects", projectData);
    return response.data;
  } catch (error: any) {
    console.error("❌ Error creating project:", error.response?.data || error);
    throw error;
  }
};

// 🔵 Fetch a single project by ID
export const fetchProjectById = (projectId: string) =>
  api.get(`/projects/${projectId.trim()}`);

// 🟣 Update a project (Edit)
export const updateProject = (
  projectId: string,
  data: Partial<ProjectPayload>
) => api.put(`/projects/${projectId.trim()}`, data);

// 🔴 Delete a project
export const deleteProject = (projectId: string) =>
  api.delete(`/projects/${projectId.trim()}`);

// 🟠 Assign a user to a project
export const assignProject = (projectId: string, userId: string) =>
  api.patch(`/projects/${projectId.trim()}/assignees`, {
    userId,
    action: "assign",
  });

// 🟤 Unassign a user from a project
export const unassignProject = (projectId: string, userId: string) =>
  api.patch(`/projects/${projectId.trim()}/assignees`, {
    userId,
    action: "unassign",
  });

// ✅ Default export
export default {
  fetchProjects,
  createProject,
  fetchProjectById,
  updateProject,
  deleteProject,
  assignProject,
  unassignProject,
};
