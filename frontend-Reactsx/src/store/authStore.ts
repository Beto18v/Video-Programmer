import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { User } from "../types";
import { authService } from "../services/auth.service";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: authService.getStoredUser(),
        isAuthenticated: authService.isAuthenticated(),
        isLoading: false,
        error: null,

        setUser: (user) =>
          set({
            user,
            isAuthenticated: !!user,
          }),

        login: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authService.login({ email, password });
            if (response.success && response.data) {
              set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false,
              });
              return true;
            } else {
              set({
                error: response.error || "Error al iniciar sesión",
                isLoading: false,
              });
              return false;
            }
          } catch {
            set({
              error: "Error inesperado al iniciar sesión",
              isLoading: false,
            });
            return false;
          }
        },

        loginWithGoogle: () => {
          authService.loginWithGoogle();
        },

        logout: async () => {
          set({ isLoading: true });
          try {
            await authService.logout();
          } finally {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        },

        checkAuth: async () => {
          if (!authService.isAuthenticated()) {
            set({ isAuthenticated: false, user: null });
            return;
          }

          set({ isLoading: true });
          try {
            const response = await authService.getCurrentUser();
            if (response.success && response.data) {
              set({
                user: response.data,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          } catch {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: "AuthStore" }
  )
);
