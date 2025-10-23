import type { AppConfig } from "../types";

// Configuración de la aplicación
export const config: AppConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
  mercadoPagoPublicKey: import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || "",
  maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
  supportedVideoFormats: [
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
  ],
  languages: [
    { code: "es", name: "Español" },
    { code: "en", name: "English" },
    { code: "pt", name: "Português" },
  ],
};

// Endpoints de la API
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  LOGOUT: "/auth/logout",
  REFRESH_TOKEN: "/auth/refresh",
  GOOGLE_LOGIN: "/auth/google",
  GOOGLE_CALLBACK: "/auth/google/callback",
  ME: "/auth/me",

  // Users
  USERS: "/users",
  USER_PROFILE: "/users/profile",
  UPDATE_PROFILE: "/users/profile",
  CHANGE_PASSWORD: "/users/password",

  // Videos
  VIDEOS: "/videos",
  VIDEO_UPLOAD: "/videos/upload",
  VIDEO_SCHEDULE: "/videos/schedule",
  VIDEO_METADATA: "/videos/metadata",

  // Plans
  PLANS: "/plans",
  SUBSCRIBE: "/subscriptions/subscribe",
  CANCEL_SUBSCRIPTION: "/subscriptions/cancel",
  SUBSCRIPTION: "/subscriptions/current",

  // Payments
  PAYMENTS: "/payments",
  PAYMENT_METHODS: "/payments/methods",
  CREATE_PAYMENT: "/payments/create",

  // Stats
  STATS: "/stats",
  VIDEO_ANALYTICS: "/stats/videos",
} as const;

// Configuración de almacenamiento local
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
  LANGUAGE: "language",
  THEME: "theme",
} as const;
