// client/src/api/api.ts
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosHeaders,
  AxiosRequestHeaders,
  AxiosRequestConfig,
} from "axios";

/* ------------------------------------------------------------
   🔹 One-off task approval request (unchanged)
------------------------------------------------------------ */
export const requestTaskApproval = async (taskId: string) => {
  const token = localStorage.getItem("token");
  return axios.put(
    `http://localhost:5000/api/tasks/${taskId}/request-approval`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

/* ------------------------------------------------------------
   ✅ Create base Axios instance
------------------------------------------------------------ */
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  withCredentials: true,
});

/* ------------------------------------------------------------
   ✅ Attach JWT token to every request (TS-safe)
------------------------------------------------------------ */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");

  if (token) {
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      const headers = new AxiosHeaders(
        config.headers as Record<string, string> | undefined
      );
      headers.set("Authorization", `Bearer ${token}`);
      config.headers = headers;
    }
  }

  return config;
});

/* ------------------------------------------------------------
   ✅ Handle Unauthorized Responses
------------------------------------------------------------ */
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      // optionally redirect to login
    }
    return Promise.reject(err);
  }
);

/* ------------------------------------------------------------
   ✅ USER API Endpoints
------------------------------------------------------------ */
export const fetchUsers = async () => {
  const res = await api.get("/users");
  return res.data;
};

/* ------------------------------------------------------------
   ✅ TASK API Endpoints
------------------------------------------------------------ */
export const createTask = (taskData: any) => api.post("/tasks", taskData);

export const fetchTasks = () => api.get("/tasks");

export const updateTaskStatus = (taskId: string, status: string) =>
  api.put(`/tasks/${taskId.trim()}/status`, { status });

export const assignTask = (taskId: string, interns: string[]) =>
  api.patch(`/tasks/${taskId.trim()}/assign`, { assignedTo: interns });

export const deleteTask = (taskId: string) =>
  api.delete(`/tasks/${taskId.trim()}`);

export const updateTaskProgress = (taskId: string, progress: number) =>
  api.put(`/tasks/${taskId.trim()}/progress`, { progress });

/* ------------------------------------------------------------
   ✅ PROJECT API Endpoints
------------------------------------------------------------ */
export const getProjects = () => api.get("/projects");

export const createProject = (data: any) => api.post("/projects", data);

export const updateProject = (id: string, data: any) =>
  api.put(`/projects/${id.trim()}`, data);

export const deleteProject = (id: string) =>
  api.delete(`/projects/${id.trim()}`);

export const getProjectById = (id: string) =>
  api.get(`/projects/${id.trim()}`);

/* ------------------------------------------------------------
   ✅ GOOGLE SIGNUP (🚨 FIXED)
------------------------------------------------------------ */

// Payload type
interface GoogleSignupPayload {
  fullName: string;
  role: "student" | "admin";
  discipline?: string;
  batch?: string;
  rollNo?: string;
  phoneNumber: string;
  semester?: string;
  dateOfJoining?: string;
}

// Fetch signup info
export const getGoogleSignupInfo = async () => {
  const res = await api.get("/google/signup-info");
  return res.data;
};

// 🔥 FIX: return FULL Axios response
export const completeGoogleSignup = (
  payload: GoogleSignupPayload,
  config?: AxiosRequestConfig
) => {
  return api.post("/google/complete", payload, config);
};

// 🔥 FIX: return FULL Axios response
export const completeNormalSignup = (
  payload: GoogleSignupPayload,
  config?: AxiosRequestConfig
) => {
  return api.post("/auth/register/complete", payload, config);
};

/* ------------------------------------------------------------
   ✅ Default export
------------------------------------------------------------ */
export default api;
