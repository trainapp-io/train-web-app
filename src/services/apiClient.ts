import axios from "axios";
import { tokenService } from "./tokenService";
import { RefreshTokenResponse, RefreshTokenRequest } from "@trainapp-io/train-core";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
});

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.request.use((config) => {
  // Skip authentication for public endpoints
  const isPublicEndpoint = config.url?.includes('/availability/public/');
  
  if (!isPublicEndpoint) {
    const token = tokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  // Log workout-logs requests for debugging
  if (config.url?.includes('workout-logs') && config.method === 'post') {
    console.log('API Client - Request URL:', config.url);
    console.log('API Client - Request data:', config.data);
    console.log('API Client - Request data stringified:', JSON.stringify(config.data, null, 2));
  }
  
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    
    // Skip token refresh for public endpoints
    const isPublicEndpoint = originalRequest.url?.includes('/availability/public/');
    if (isPublicEndpoint) {
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenService.getRefreshToken();
      const deviceId = tokenService.getDeviceId();

      if (!refreshToken || !deviceId) {
        // No refresh token available, redirect to login
        tokenService.clearTokens();
        window.location.href = "/login?expired=true";
        return Promise.reject(err);
      }

      try {
        const refreshRequest: RefreshTokenRequest = {
          refreshToken,
          deviceId,
        };

        const response = await axios.post<RefreshTokenResponse>(
          `${API_URL}/user/refresh`,
          refreshRequest
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Update tokens
        tokenService.setAccessToken(accessToken);
        tokenService.setRefreshToken(newRefreshToken);

        // Reset refreshing flag before processing queue
        isRefreshing = false;

        // Process queued requests
        processQueue(null, accessToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError: any) {
        // Reset refreshing flag immediately on error
        isRefreshing = false;
        
        // Reject all queued requests
        processQueue(refreshError, null);

        // Clear tokens and force logout for any refresh error
        tokenService.clearTokens();
        
        // Redirect to login page
        window.location.href = "/login?expired=true";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  }
);

export default api;
