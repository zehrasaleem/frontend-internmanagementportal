// client/src/api/api.ts
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosHeaders,
  AxiosRequestConfig,
} from "axios";
export const BASE_URL = "http://localhost:5000/api";

/* ------------------------------------------------------------
   ✅ Create base Axios instance
------------------------------------------------------------ */
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  withCredentials: true,
});

/* ------------------------------------------------------------
   🔹 One-off task approval request
------------------------------------------------------------ */
export const requestTaskApproval = async (taskId: string, isMissed = false) => {
  if (!taskId) throw new Error("Task ID is required");
  return api.put(`/tasks/${taskId.trim()}/request-approval`, { isMissed });
};

// request admin permission to start missed task
export const requestTaskStart = (taskId: string) => {
  const token = localStorage.getItem("token");
  return axios.put(`${BASE_URL}/tasks/${taskId}/request-start`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

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

export const fetchTasks = (email?: string) => {
  if (email) {
    return api.get(`/tasks/student/${email}`);
  } else {
    return api.get("/tasks"); // admin
  }
};

export const updateTaskStatus = async (
  taskId: string,
  status: string,
  dueDate?: string
) => {
  const payload: any = { status };
  if (dueDate) payload.dueDate = dueDate;
  return api.patch(`/tasks/${taskId}`, payload);
};


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
export const updateTask = (taskId: string, taskData: any) =>
  api.patch(`/tasks/${taskId.trim()}`, taskData);
export const requestAdminStartApproval = (taskId: string) =>
  api.put(`/tasks/${taskId.trim()}/admin-approve-start`);
export const requestTaskApprovalForStudent = (taskId: string, isMissed = false) =>
  api.put(`/tasks/${taskId.trim()}/request-approval`, { isMissed });
export const assignMoreStudentsToTask = (taskId: string, assignedTo: string[]) =>
  api.patch(`/tasks/${taskId.trim()}/assign`, { assignedTo });
export const getTaskById = (taskId: string) =>
  api.get(`/tasks/${taskId.trim()}`);


/* ------------------------------------------------------------
   ✅ GOOGLE SIGNUP (🚨 FIXED)
------------------------------------------------------------ */
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

export const getGoogleSignupInfo = async () => {
  const res = await api.get("/google/signup-info");
  return res.data;
};

export const completeGoogleSignup = (
  payload: GoogleSignupPayload,
  config?: AxiosRequestConfig
) => api.post("/google/complete", payload, config);

export const completeNormalSignup = (
  payload: GoogleSignupPayload,
  config?: AxiosRequestConfig
) => api.post("/auth/register/complete", payload, config);

/* ------------------------------------------------------------
   ✅ Default export
------------------------------------------------------------ */
export default api;