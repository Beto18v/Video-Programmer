// Tipos de usuario y autenticación
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "admin";
  plan: "free" | "basic" | "pro";
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  confirmPassword: string;
}

// Tipos de videos
export interface Video {
  id: string;
  userId: string;
  title: string;
  description: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  duration: number;
  thumbnail?: string;
  category?: string;
  tags: string[];
  privacy: "public" | "unlisted" | "private";
  status: "draft" | "scheduled" | "published" | "processing" | "failed";
  publishDate?: string;
  youtubeVideoId?: string;
  views?: number;
  likes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoUpload {
  file: File;
  title: string;
  description: string;
  category?: string;
  tags: string[];
  privacy: "public" | "unlisted" | "private";
  thumbnail?: File;
}

export interface VideoSchedule {
  videoId: string;
  publishDate: string;
}

// Tipos de planes y suscripciones
export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  features: string[];
  limits: {
    videosPerMonth: number;
    maxFileSize: number;
    advancedFeatures: boolean;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: "active" | "canceled" | "expired" | "pending";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipos de pagos
export interface Payment {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: "card" | "mercadopago";
  transactionId?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  type: "card";
  cardLast4: string;
  cardBrand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

// Tipos de estadísticas
export interface Stats {
  totalVideos: number;
  scheduledVideos: number;
  publishedVideos: number;
  totalViews: number;
  totalLikes: number;
  storageUsed: number;
  storageLimit: number;
}

// Tipos de respuestas de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Tipos de errores
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Tipos de formularios
export interface FormField {
  value: string;
  error?: string;
  touched: boolean;
}

// Tipos de notificaciones
export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

// Tipos de configuración
export interface AppConfig {
  apiBaseUrl: string;
  googleClientId: string;
  mercadoPagoPublicKey: string;
  maxFileSize: number;
  supportedVideoFormats: string[];
  languages: Array<{
    code: string;
    name: string;
  }>;
}
