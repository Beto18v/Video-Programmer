import axios from "axios";
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { config, STORAGE_KEYS } from "../config";
import type { ApiResponse } from "../types";

/**
 * Clase para manejar todas las peticiones HTTP a la API
 */
class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.api = axios.create({
      baseURL: config.apiBaseUrl,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  /**
   * Configurar interceptores para requests y responses
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        // Si el error es 401 y no estamos en un intento de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Si ya estamos refrescando, esperar al resultado
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.api(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.isRefreshing = false;
            this.onRefreshed(newToken);
            this.refreshSubscribers = [];

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.api(originalRequest);
          } catch (refreshError) {
            this.isRefreshing = false;
            this.refreshSubscribers = [];
            this.clearAuth();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Notificar a los suscriptores que el token fue refrescado
   */
  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
  }

  /**
   * Obtener el access token del localStorage
   */
  private getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Obtener el refresh token del localStorage
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Refrescar el access token usando el refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(`${config.apiBaseUrl}/auth/refresh`, {
      refresh_token: refreshToken,
    });

    const { access_token } = response.data;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
    return access_token;
  }

  /**
   * Limpiar datos de autenticación
   */
  private clearAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  /**
   * Petición GET
   */
  async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.get(
        url,
        config
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Petición POST
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.post(
        url,
        data,
        config
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Petición PUT
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.put(
        url,
        data,
        config
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Petición PATCH
   */
  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.patch(
        url,
        data,
        config
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Petición DELETE
   */
  async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.delete(
        url,
        config
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Upload de archivos con FormData
   */
  async upload<T = unknown>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.post(
        url,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(progress);
            }
          },
        }
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: unknown): ApiResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse>;

      if (axiosError.response) {
        // Error de respuesta del servidor
        return {
          success: false,
          error: axiosError.response.data.error || "Error en la petición",
          message: axiosError.response.data.message,
        };
      } else if (axiosError.request) {
        // Error de red (sin respuesta)
        return {
          success: false,
          error: "network_error",
          message: "No se pudo conectar con el servidor",
        };
      }
    }

    // Error desconocido
    return {
      success: false,
      error: "unknown_error",
      message: "Ocurrió un error inesperado",
    };
  }

  /**
   * Obtener instancia de axios para casos especiales
   */
  getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}

// Exportar instancia única (singleton)
export const apiService = new ApiService();
