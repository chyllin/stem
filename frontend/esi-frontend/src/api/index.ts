import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { RegisterPayload, ApiUser } from "../types";

// ── Base URL ─────────────────────────────────────────────

export const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Axios Instance ───────────────────────────────────────

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`, // ✅ important
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Refresh State ───────────────────────────────────────

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

// ── Interceptor ─────────────────────────────────────────

api.interceptors.response.use(
  (response) => response.data,

  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;
    const url = originalRequest?.url || "";

    // ❌ Skip these endpoints
    if (
      url.includes("/token/refresh/") ||
      url.includes("/users/login/") ||
      url.includes("/users/me/")
    ) {
      return Promise.reject(error);
    }

    // 🔐 Handle 401 (token expired)
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(api(originalRequest)),
            reject: (err: any) => reject(err),
          });
        });
      }

      isRefreshing = true;

      try {
        await axios.post(
          `${BASE_URL}/api/token/refresh/`, // ✅ fixed
          {},
          { withCredentials: true }
        );

        processQueue(null);

        return api(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError);

        console.warn("Refresh failed → redirecting to login");

        window.location.href = "/login";
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    // ── Normal Error Handling ─────────────────────

    const body = error.response?.data as Record<string, any>;

    const apiError: ApiError = {
      status: status || 500,
      message:
        status === 500
          ? "Server error — please try again later."
          : "Request failed.",
      fieldErrors: typeof body === "object" ? body : undefined,
    };

    if (apiError.status === 400 && apiError.fieldErrors) {
      const first = Object.values(apiError.fieldErrors).flat()[0];
      if (typeof first === "string") apiError.message = first;
    }

    return Promise.reject(apiError);
  }
);

// ── Error Shape ─────────────────────────────────────────

export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

// ── Auth APIs ───────────────────────────────────────────

// ✅ Register
export async function registerUser(payload: RegisterPayload): Promise<ApiUser> {
  return api.post("/users/register/", payload);
}

// ✅ Login
export interface LoginResponse {
  user?: ApiUser;
}

export async function loginUser(
  username: string,
  password: string
): Promise<LoginResponse> {
  return api.post("/users/login/", { username, password });
}

// ✅ Get current user
export async function fetchMe(): Promise<ApiUser> {
  return api.get("/users/me/");
}