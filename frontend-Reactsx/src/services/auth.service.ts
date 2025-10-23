import { apiService } from "./api.service";
import { API_ENDPOINTS, STORAGE_KEYS, config } from "../config";
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthTokens,
  ApiResponse,
} from "../types";

/**
 * Servicio de autenticación
 */
class AuthService {
  /**
   * Login con email y contraseña
   */
  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await apiService.post<{ user: User; tokens: AuthTokens }>(
      API_ENDPOINTS.LOGIN,
      credentials
    );

    if (response.success && response.data) {
      this.setAuth(response.data.tokens, response.data.user);
    }

    return response;
  }

  /**
   * Registro de nuevo usuario
   */
  async register(
    data: RegisterData
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await apiService.post<{ user: User; tokens: AuthTokens }>(
      API_ENDPOINTS.REGISTER,
      data
    );

    if (response.success && response.data) {
      this.setAuth(response.data.tokens, response.data.user);
    }

    return response;
  }

  /**
   * Login con Google (inicio del flujo OAuth)
   */
  loginWithGoogle(): void {
    // Redirigir al endpoint de OAuth de Google en el backend
    const redirectUrl = `${config.apiBaseUrl}${API_ENDPOINTS.GOOGLE_LOGIN}`;
    window.location.href = redirectUrl;
  }

  /**
   * Callback de Google OAuth
   * El backend debe redirigir aquí con los tokens
   */
  async handleGoogleCallback(
    code: string
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await apiService.post<{ user: User; tokens: AuthTokens }>(
      API_ENDPOINTS.GOOGLE_CALLBACK,
      { code }
    );

    if (response.success && response.data) {
      this.setAuth(response.data.tokens, response.data.user);
    }

    return response;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await apiService.post(API_ENDPOINTS.LOGOUT);
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Obtener usuario actual
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiService.get<User>(API_ENDPOINTS.ME);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Obtener el access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Obtener el refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Obtener usuario del localStorage
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }

  /**
   * Guardar autenticación
   */
  private setAuth(tokens: AuthTokens, user: User): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  /**
   * Limpiar autenticación
   */
  private clearAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

export const authService = new AuthService();
