// src/api/project.ts
import api from "./api";

// Project payload type
export interface ProjectPayload {
  title: string;
  description?: string;
  dueDate?: string;
  color?: string;
  status?: string;
  teamLead?: string; // team lead support
  createdAt?: string;
}

// 🟡 Fetch all projects
export const fetchProjects = () => {
  return api.get("/projects");
};

// 🟢 Create a new project
export const createProject = (projectData: ProjectPayload) => {
  return api.post("/projects", projectData);
};

// 🔵 Fetch a single project by ID
export const fetchProjectById = (projectId: string) => {
  return api.get(`/projects/${projectId.trim()}`);
};

// 🟣 Update a project
export const updateProject = (projectId: string, data: Partial<ProjectPayload>) => {
  return api.put(`/projects/${projectId.trim()}`, data);
};

// 🔴 Delete a project
export const deleteProject = (projectId: string) => {
  return api.delete(`/projects/${projectId.trim()}`);
};

// 🟠 Assign a user to a project
export const assignProject = (projectId: string, userId: string) => {
  return api.patch(`/projects/${projectId.trim()}/assignees`, {
    userId,
    action: "assign",
  });
};

// 🟤 Unassign a user from a project
export const unassignProject = (projectId: string, userId: string) => {
  return api.patch(`/projects/${projectId.trim()}/assignees`, {
    userId,
    action: "unassign",
  });
};

// 🔵 Assign / update a team lead
export const assignTeamLead = (projectId: string, teamLeadId: string) => {
  return api.put(`/projects/${projectId.trim()}`, {
    teamLead: teamLeadId,
  });
};

// ✅ Default export
export default {
  fetchProjects,
  createProject,
  fetchProjectById,
  updateProject,
  deleteProject,
  assignProject,
  unassignProject,
  assignTeamLead,
};