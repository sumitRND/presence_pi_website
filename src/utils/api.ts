// src/utils/api.ts

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
  // Additional fields for specific responses
  month?: number;
  year?: number;
  totalUsers?: number;
  submittedCount?: number;
  totalCount?: number;
}

export class ApiClient {
private getHeaders() {
  // Check for both possible token locations
  const ssoToken = localStorage.getItem("sso_token");
  const piToken = localStorage.getItem("pi_token");
  const ssoUser = localStorage.getItem("sso_user");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Prioritize tokens in order
  if (ssoToken) {
    headers.Authorization = `Bearer ${ssoToken}`;
  } else if (piToken) {
    headers.Authorization = `Bearer ${piToken}`;
  } else if (ssoUser) {
    const userData = JSON.parse(ssoUser);
    const ssoData = {
      username: userData.username,
      projectCodes: userData.projects,
      timestamp: Date.now(),
    };
    headers["X-SSO-User"] = JSON.stringify(ssoData);
  }

  return headers;
}

  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async post<T = any>(
    endpoint: string,
    data: unknown,
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async put<T = any>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async postWithSSO(
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<ApiResponse> {
    const ssoUser = localStorage.getItem("sso_user");
    let body = data;

    if (ssoUser) {
      const userData = JSON.parse(ssoUser);
      body = {
        ...data,
        username: userData.username,
        projectCodes: userData.projects,
      };
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return response.json();
  }
}

export const api = new ApiClient();
