import { apiService } from "./api.service";
import { API_ENDPOINTS } from "../config";
import type {
  Video,
  VideoUpload,
  VideoSchedule,
  ApiResponse,
  PaginatedResponse,
} from "../types";

/**
 * Servicio para gestión de videos
 */
class VideoService {
  /**
   * Obtener todos los videos del usuario
   */
  async getVideos(
    page = 1,
    pageSize = 20
  ): Promise<ApiResponse<PaginatedResponse<Video>>> {
    return apiService.get<PaginatedResponse<Video>>(
      `${API_ENDPOINTS.VIDEOS}?page=${page}&page_size=${pageSize}`
    );
  }

  /**
   * Obtener un video por ID
   */
  async getVideo(id: string): Promise<ApiResponse<Video>> {
    return apiService.get<Video>(`${API_ENDPOINTS.VIDEOS}/${id}`);
  }

  /**
   * Subir un nuevo video
   */
  async uploadVideo(
    videoData: VideoUpload,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<Video>> {
    const formData = new FormData();
    formData.append("file", videoData.file);
    formData.append("title", videoData.title);
    formData.append("description", videoData.description);
    formData.append("privacy", videoData.privacy);
    formData.append("tags", JSON.stringify(videoData.tags));

    if (videoData.category) {
      formData.append("category", videoData.category);
    }

    if (videoData.thumbnail) {
      formData.append("thumbnail", videoData.thumbnail);
    }

    return apiService.upload<Video>(
      API_ENDPOINTS.VIDEO_UPLOAD,
      formData,
      onProgress
    );
  }

  /**
   * Actualizar metadata de un video
   */
  async updateVideo(
    id: string,
    data: Partial<Video>
  ): Promise<ApiResponse<Video>> {
    return apiService.put<Video>(`${API_ENDPOINTS.VIDEOS}/${id}`, data);
  }

  /**
   * Eliminar un video
   */
  async deleteVideo(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`${API_ENDPOINTS.VIDEOS}/${id}`);
  }

  /**
   * Programar un video para publicación
   */
  async scheduleVideo(schedule: VideoSchedule): Promise<ApiResponse<Video>> {
    return apiService.post<Video>(API_ENDPOINTS.VIDEO_SCHEDULE, schedule);
  }

  /**
   * Cancelar programación de un video
   */
  async cancelSchedule(videoId: string): Promise<ApiResponse<Video>> {
    return apiService.delete<Video>(
      `${API_ENDPOINTS.VIDEO_SCHEDULE}/${videoId}`
    );
  }

  /**
   * Obtener videos programados
   */
  async getScheduledVideos(): Promise<ApiResponse<Video[]>> {
    return apiService.get<Video[]>(`${API_ENDPOINTS.VIDEO_SCHEDULE}`);
  }

  /**
   * Publicar video inmediatamente
   */
  async publishVideo(videoId: string): Promise<ApiResponse<Video>> {
    return apiService.post<Video>(`${API_ENDPOINTS.VIDEOS}/${videoId}/publish`);
  }
}

export const videoService = new VideoService();
