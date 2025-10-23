import { apiService } from "./api.service";
import { API_ENDPOINTS } from "../config";
import type {
  Plan,
  Subscription,
  Payment,
  PaymentMethod,
  ApiResponse,
} from "../types";

/**
 * Servicio para gestión de planes y suscripciones
 */
class PlanService {
  /**
   * Obtener todos los planes disponibles
   */
  async getPlans(): Promise<ApiResponse<Plan[]>> {
    return apiService.get<Plan[]>(API_ENDPOINTS.PLANS);
  }

  /**
   * Obtener un plan por ID
   */
  async getPlan(id: string): Promise<ApiResponse<Plan>> {
    return apiService.get<Plan>(`${API_ENDPOINTS.PLANS}/${id}`);
  }

  /**
   * Obtener suscripción actual del usuario
   */
  async getCurrentSubscription(): Promise<ApiResponse<Subscription>> {
    return apiService.get<Subscription>(API_ENDPOINTS.SUBSCRIPTION);
  }

  /**
   * Suscribirse a un plan
   */
  async subscribe(
    planId: string,
    paymentMethodId?: string
  ): Promise<ApiResponse<Subscription>> {
    return apiService.post<Subscription>(API_ENDPOINTS.SUBSCRIBE, {
      plan_id: planId,
      payment_method_id: paymentMethodId,
    });
  }

  /**
   * Cancelar suscripción
   */
  async cancelSubscription(): Promise<ApiResponse<Subscription>> {
    return apiService.post<Subscription>(API_ENDPOINTS.CANCEL_SUBSCRIPTION);
  }

  /**
   * Actualizar plan de suscripción
   */
  async updateSubscription(planId: string): Promise<ApiResponse<Subscription>> {
    return apiService.put<Subscription>(API_ENDPOINTS.SUBSCRIPTION, {
      plan_id: planId,
    });
  }
}

/**
 * Servicio para gestión de pagos
 */
class PaymentService {
  /**
   * Obtener historial de pagos
   */
  async getPayments(): Promise<ApiResponse<Payment[]>> {
    return apiService.get<Payment[]>(API_ENDPOINTS.PAYMENTS);
  }

  /**
   * Obtener métodos de pago guardados
   */
  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    return apiService.get<PaymentMethod[]>(API_ENDPOINTS.PAYMENT_METHODS);
  }

  /**
   * Agregar método de pago
   */
  async addPaymentMethod(
    paymentData: unknown
  ): Promise<ApiResponse<PaymentMethod>> {
    return apiService.post<PaymentMethod>(
      API_ENDPOINTS.PAYMENT_METHODS,
      paymentData
    );
  }

  /**
   * Eliminar método de pago
   */
  async removePaymentMethod(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`${API_ENDPOINTS.PAYMENT_METHODS}/${id}`);
  }

  /**
   * Establecer método de pago por defecto
   */
  async setDefaultPaymentMethod(
    id: string
  ): Promise<ApiResponse<PaymentMethod>> {
    return apiService.put<PaymentMethod>(
      `${API_ENDPOINTS.PAYMENT_METHODS}/${id}/default`
    );
  }

  /**
   * Crear pago con MercadoPago
   */
  async createPayment(
    amount: number,
    description: string
  ): Promise<ApiResponse<{ payment_url: string }>> {
    return apiService.post<{ payment_url: string }>(
      API_ENDPOINTS.CREATE_PAYMENT,
      {
        amount,
        description,
      }
    );
  }
}

/**
 * Servicio para estadísticas
 */
class StatsService {
  /**
   * Obtener estadísticas generales
   */
  async getStats(): Promise<
    ApiResponse<{
      totalVideos: number;
      scheduledVideos: number;
      publishedVideos: number;
      totalViews: number;
    }>
  > {
    return apiService.get(API_ENDPOINTS.STATS);
  }

  /**
   * Obtener analíticas de videos
   */
  async getVideoAnalytics(videoId?: string): Promise<ApiResponse<unknown>> {
    const url = videoId
      ? `${API_ENDPOINTS.VIDEO_ANALYTICS}/${videoId}`
      : API_ENDPOINTS.VIDEO_ANALYTICS;
    return apiService.get(url);
  }
}

export const planService = new PlanService();
export const paymentService = new PaymentService();
export const statsService = new StatsService();
