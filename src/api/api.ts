import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from "axios";

// ✅ Create base Axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  withCredentials: true,
});

// ✅ Attach JWT token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    if (config.headers && typeof (config.headers as any).set === "function") {
      (config.headers as any).set("Authorization", `Bearer ${token}`);
    } else {
      (config.headers as any) = config.headers || {};
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

// ✅ Clear token if unauthorized (401)
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
// ✅ Task API Endpoints
// ------------------------------------------------------------

// 🟢 Create new task (Admin)
export const createTask = (taskData: any) => api.post("/tasks", taskData);

// 🟡 Get all tasks
export const fetchTasks = () => api.get("/tasks");

// 🟣 Update task status (Student or Admin)
export const updateTaskStatus = (taskId: string, status: string, role: string) =>
  api.put(`/tasks/${taskId}/status`, { status, role });

// 🔵 Assign task to intern by email (Admin only)
export const assignTask = (taskId: string, internEmail: string) =>
  api.patch(`/tasks/${taskId}/assign`, { assignedTo: internEmail });

// 🔴 Delete task (Admin only)
export const deleteTask = (taskId: string) => api.delete(`/tasks/${taskId}`);

// ------------------------------------------------------------
// ✅ Default export
// ------------------------------------------------------------
export default api;
