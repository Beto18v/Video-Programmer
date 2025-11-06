import { useCallback, useRef, useState } from 'react';
import { Channel, UploadProgress, VideoUpload } from '../types';

interface VideoData {
    id: number;
    title: string;
    description: string;
    file_path: string;
    thumbnail_path?: string;
    status: string;
    channel: Channel;
}

interface ScheduleData {
    id: number;
    video_id: number;
    scheduled_at: string;
    status: string;
    action: string;
}

interface UploadResult {
    video: VideoData;
    schedule: ScheduleData;
    channel: Channel;
}

interface BulkUploadResult {
    results: UploadResult[];
    successCount: number;
    failedCount: number;
}

interface UseVideoUploadProps {
    onUploadStart?: () => void;
    onUploadProgress?: (progress: UploadProgress[]) => void;
    onUploadComplete?: (results: BulkUploadResult) => void;
    onUploadError?: (error: string) => void;
}

export function useVideoUpload({
    onUploadStart,
    onUploadProgress,
    onUploadComplete,
    onUploadError,
}: UseVideoUploadProps = {}) {
    const [isUploading, setIsUploading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
    const [uploadLogs, setUploadLogs] = useState<string[]>([]);
    const abortControllerRef = useRef<AbortController | null>(null);

    const addLog = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        setUploadLogs((prev) => [...prev, logMessage]);
        console.log(logMessage);
    }, []);

    const updateProgress = useCallback(
        (
            videoId: string,
            progress: number,
            status: VideoUpload['status'],
            error?: string,
        ) => {
            setUploadProgress((prev) => {
                const existing = prev.find((p) => p.videoId === videoId);
                if (existing) {
                    return prev.map((p) =>
                        p.videoId === videoId
                            ? { ...p, progress, status, error }
                            : p,
                    );
                } else {
                    return [...prev, { videoId, progress, status, error }];
                }
            });

            onUploadProgress?.(uploadProgress);
        },
        [uploadProgress, onUploadProgress],
    );

    const simulateProgress = useCallback(
        async (videoId: string, duration: number = 3000) => {
            return new Promise<void>((resolve) => {
                let progress = 0;
                const increment = 100 / (duration / 100);

                const interval = setInterval(() => {
                    if (abortControllerRef.current?.signal.aborted) {
                        clearInterval(interval);
                        resolve();
                        return;
                    }

                    progress += increment;
                    if (progress >= 100) {
                        progress = 100;
                        clearInterval(interval);
                        updateProgress(videoId, progress, 'completed');
                        resolve();
                    } else {
                        updateProgress(
                            videoId,
                            Math.floor(progress),
                            'uploading',
                        );
                    }
                }, 100);
            });
        },
        [updateProgress],
    );

    const uploadSingleVideo = useCallback(
        async (
            video: VideoUpload,
            channel: Channel,
            signal: AbortSignal,
        ): Promise<UploadResult> => {
            if (!video.file) {
                throw new Error('No se ha seleccionado archivo de video');
            }

            addLog(`Iniciando subida: ${video.title || video.fileName}`);
            updateProgress(video.id, 0, 'uploading');

            const formData = new FormData();
            formData.append('channel_id', channel.id.toString());
            formData.append('title', video.title);
            formData.append('description', video.description || '');
            formData.append('hashtags', video.hashtags || '');

            // Convert datetime-local to proper ISO string with timezone
            // datetime-local gives us YYYY-MM-DDTHH:mm format (user's local time)
            // We need to convert it to ISO string that Laravel can properly parse
            const localDateTime = new Date(video.scheduledAt);
            const isoDateTime = localDateTime.toISOString(); // This converts to UTC

            // Debug info for timezone handling
            console.log('Timezone conversion debug:', {
                input: video.scheduledAt,
                localDateTime: localDateTime.toString(),
                isoDateTime: isoDateTime,
                userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                localTimezoneOffset: localDateTime.getTimezoneOffset(),
            });

            formData.append('scheduled_at', isoDateTime);

            formData.append('for_kids', video.forKids ? '1' : '0');
            formData.append('age_restricted', video.ageRestricted ? '1' : '0');
            formData.append('video_file', video.file);

            if (video.thumbnail) {
                formData.append('thumbnail', video.thumbnail);
            }

            try {
                // Simulate upload progress
                const progressPromise = simulateProgress(video.id);

                const response = await fetch('/video-uploads/single', {
                    method: 'POST',
                    body: formData,
                    signal,
                    headers: {
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al subir video');
                }

                await progressPromise;
                const result: UploadResult = await response.json();

                addLog(`✅ Video subido exitosamente: ${video.title}`);
                updateProgress(video.id, 100, 'scheduled');

                return result;
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Error desconocido';
                if (error instanceof Error && error.name === 'AbortError') {
                    addLog(`⏹️ Subida cancelada: ${video.title}`);
                    updateProgress(
                        video.id,
                        0,
                        'failed',
                        'Cancelado por el usuario',
                    );
                } else {
                    addLog(`❌ Error al subir ${video.title}: ${errorMessage}`);
                    updateProgress(video.id, 0, 'failed', errorMessage);
                }
                throw error;
            }
        },
        [addLog, updateProgress, simulateProgress],
    );

    const uploadBulkVideos = useCallback(
        async (
            videos: VideoUpload[],
            channel: Channel,
        ): Promise<BulkUploadResult> => {
            if (!channel) {
                throw new Error('No se ha seleccionado un canal');
            }

            const validVideos = videos.filter((v) => v.file && v.title.trim());
            if (validVideos.length === 0) {
                throw new Error('No hay videos válidos para subir');
            }

            addLog(
                `🚀 Iniciando subida masiva de ${validVideos.length} videos al canal: ${channel.name}`,
            );

            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            try {
                const results: UploadResult[] = [];
                let successCount = 0;
                let failedCount = 0;

                for (const video of validVideos) {
                    if (abortController.signal.aborted) {
                        addLog('🛑 Subida masiva cancelada por el usuario');
                        break;
                    }

                    try {
                        const result = await uploadSingleVideo(
                            video,
                            channel,
                            abortController.signal,
                        );
                        results.push(result);
                        successCount++;
                        addLog(
                            `📊 Progreso: ${successCount + failedCount}/${validVideos.length} procesados`,
                        );
                    } catch (error: unknown) {
                        if (
                            !(error instanceof Error) ||
                            error.name !== 'AbortError'
                        ) {
                            failedCount++;
                            addLog(
                                `📊 Progreso: ${successCount + failedCount}/${validVideos.length} procesados`,
                            );
                        }
                    }

                    // Small delay between uploads to prevent overwhelming the server
                    if (!abortController.signal.aborted) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 500),
                        );
                    }
                }

                addLog(
                    `🎉 Subida masiva completada: ${successCount} exitosos, ${failedCount} fallidos`,
                );
                return { results, successCount, failedCount };
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Error desconocido';
                addLog(`💥 Error en subida masiva: ${errorMessage}`);
                throw error;
            }
        },
        [addLog, uploadSingleVideo],
    );

    const startUpload = useCallback(
        async (
            videos: VideoUpload[],
            channel: Channel,
            action: 'upload' | 'schedule' = 'upload',
        ) => {
            if (isUploading) return;

            setIsUploading(true);
            setIsPaused(false);
            setUploadProgress([]);
            setUploadLogs([]);

            onUploadStart?.();

            try {
                if (action === 'schedule') {
                    addLog(
                        '📅 Programando videos según fechas establecidas...',
                    );
                    // For scheduling, we'll just save the videos without uploading immediately
                    const results = await uploadBulkVideos(videos, channel);
                    onUploadComplete?.(results);
                } else {
                    addLog('⬆️ Subiendo videos inmediatamente...');
                    const results = await uploadBulkVideos(videos, channel);
                    onUploadComplete?.(results);
                }
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Error desconocido';
                onUploadError?.(errorMessage);
            } finally {
                setIsUploading(false);
                setIsPaused(false);
                abortControllerRef.current = null;
            }
        },
        [
            isUploading,
            onUploadStart,
            onUploadComplete,
            onUploadError,
            addLog,
            uploadBulkVideos,
        ],
    );

    const pauseUpload = useCallback(() => {
        if (isUploading && !isPaused) {
            setIsPaused(true);
            addLog('⏸️ Subida pausada');
        }
    }, [isUploading, isPaused, addLog]);

    const resumeUpload = useCallback(() => {
        if (isUploading && isPaused) {
            setIsPaused(false);
            addLog('▶️ Subida reanudada');
        }
    }, [isUploading, isPaused, addLog]);

    const cancelUpload = useCallback(() => {
        if (isUploading && abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsUploading(false);
            setIsPaused(false);
            addLog('🚫 Subida cancelada por el usuario');
        }
    }, [isUploading, addLog]);

    const clearLogs = useCallback(() => {
        setUploadLogs([]);
        addLog('🧹 Logs limpiados');
    }, [addLog]);

    return {
        isUploading,
        isPaused,
        uploadProgress,
        uploadLogs,
        startUpload,
        pauseUpload,
        resumeUpload,
        cancelUpload,
        clearLogs,
    };
}
