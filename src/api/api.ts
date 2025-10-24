// src/api/api.ts
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosHeaders,
  AxiosRequestHeaders,
} from "axios";

// ------------------------------------------------------------
// ✅ Create base Axios instance
// ------------------------------------------------------------
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  withCredentials: true,
});

// ------------------------------------------------------------
// ✅ Attach JWT token to every request (fully TS-safe)
// ------------------------------------------------------------
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");

  if (token) {
    let headers: AxiosRequestHeaders;

    // Case 1: headers is already an AxiosHeaders instance
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${token}`);
      return config;
    }

    // Case 2: headers might be a plain object or undefined
    headers = new AxiosHeaders(config.headers as Record<string, string> | undefined);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});

// ------------------------------------------------------------
// ✅ Handle Unauthorized Responses
// ------------------------------------------------------------
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(err);
  }
);

// ------------------------------------------------------------
// ✅ TASK API Endpoints
// ------------------------------------------------------------
export const createTask = (taskData: any) => api.post("/tasks", taskData);
export const fetchTasks = () => api.get("/tasks");
export const updateTaskStatus = (taskId: string, status: string, role: string) =>
  api.put(`/tasks/${taskId.trim()}/status`, { status, role });
export const assignTask = (taskId: string, internEmail: string) =>
  api.patch(`/tasks/${taskId.trim()}/assign`, { assignedTo: internEmail });
export const deleteTask = (taskId: string) =>
  api.delete(`/tasks/${taskId.trim()}`);

// ------------------------------------------------------------
// ✅ PROJECT API Endpoints
// ------------------------------------------------------------
export const getProjects = () => api.get("/projects");
export const createProject = (data: any) => api.post("/projects", data);
export const updateProject = (id: string, data: any) =>
  api.put(`/projects/${id.trim()}`, data);
export const deleteProject = (id: string) =>
  api.delete(`/projects/${id.trim()}`);
export const getProjectById = (id: string) =>
  api.get(`/projects/${id.trim()}`);

// ------------------------------------------------------------
// ✅ Default export
// ------------------------------------------------------------
export default api;
