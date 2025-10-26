import { useCallback, useRef, useState } from 'react';
import { Channel, SheetMapping, UploadProgress, VideoUpload } from '../types';

interface UseVideoSchedulingReturn {
    // State
    selectedChannel: Channel | null;
    videos: VideoUpload[];
    uploadProgress: UploadProgress[];
    isUploading: boolean;
    isPaused: boolean;

    // Actions
    setSelectedChannel: (channel: Channel | null) => void;
    addVideo: () => void;
    updateVideo: (videoId: string, updates: Partial<VideoUpload>) => void;
    removeVideo: (videoId: string) => void;
    setVideos: (videos: VideoUpload[]) => void;

    // Upload management
    startUpload: (
        videoIds: string[],
        action: 'upload' | 'schedule',
    ) => Promise<void>;
    pauseUpload: () => void;
    resumeUpload: () => void;
    cancelUpload: () => void;

    // Sheet integration
    importFromSheet: (
        mapping: SheetMapping,
        data: Record<string, unknown>[],
    ) => void;
}

export function useVideoScheduling(): UseVideoSchedulingReturn {
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(
        null,
    );
    const [videos, setVideos] = useState<VideoUpload[]>([]);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Refs for upload management
    const uploadControllerRef = useRef<AbortController | null>(null);
    const currentUploadRef = useRef<string[]>([]);

    const generateVideoId = useCallback(() => {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }, []);

    const addVideo = useCallback(() => {
        const newVideo: VideoUpload = {
            id: generateVideoId(),
            title: '',
            description: '',
            hashtags: '',
            scheduledAt: new Date().toISOString().slice(0, 16),
            status: 'pending',
        };
        setVideos((prev) => [...prev, newVideo]);
    }, [generateVideoId]);

    const updateVideo = useCallback(
        (videoId: string, updates: Partial<VideoUpload>) => {
            setVideos((prev) =>
                prev.map((video) =>
                    video.id === videoId ? { ...video, ...updates } : video,
                ),
            );
        },
        [],
    );

    const removeVideo = useCallback((videoId: string) => {
        setVideos((prev) => prev.filter((video) => video.id !== videoId));
        setUploadProgress((prev) =>
            prev.filter((progress) => progress.videoId !== videoId),
        );
    }, []);

    const updateUploadProgress = useCallback(
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

            // Update video status
            updateVideo(videoId, { status, progress, error });
        },
        [updateVideo],
    );

    const uploadSingleVideo = useCallback(
        async (video: VideoUpload, action: 'upload' | 'schedule') => {
            if (!selectedChannel) {
                throw new Error('No channel selected');
            }

            const controller = uploadControllerRef.current;
            if (controller?.signal.aborted) {
                return;
            }

            try {
                updateUploadProgress(video.id, 0, 'uploading');

                // Simulate upload process with progress updates
                for (let progress = 0; progress <= 100; progress += 10) {
                    if (controller?.signal.aborted) {
                        updateUploadProgress(video.id, progress, 'pending');
                        return;
                    }

                    // Check if paused
                    while (isPaused && !controller?.signal.aborted) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 100),
                        );
                    }

                    updateUploadProgress(video.id, progress, 'uploading');
                    await new Promise((resolve) => setTimeout(resolve, 200)); // Simulate upload time
                }

                const finalStatus =
                    action === 'schedule' ? 'scheduled' : 'completed';
                updateUploadProgress(video.id, 100, finalStatus);

                // TODO: Here you would make the actual API call to upload/schedule the video
                console.log(
                    `${action === 'schedule' ? 'Scheduled' : 'Uploaded'} video:`,
                    {
                        channelId: selectedChannel.id,
                        video: video,
                        action,
                    },
                );
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Upload failed';
                updateUploadProgress(video.id, 0, 'failed', errorMessage);
            }
        },
        [selectedChannel, isPaused, updateUploadProgress],
    );

    const startUpload = useCallback(
        async (videoIds: string[], action: 'upload' | 'schedule') => {
            if (isUploading) return;

            setIsUploading(true);
            setIsPaused(false);

            // Create abort controller for this upload session
            uploadControllerRef.current = new AbortController();
            currentUploadRef.current = videoIds;

            const videosToUpload = videos.filter((v) =>
                videoIds.includes(v.id),
            );

            try {
                // Process videos sequentially (you could also do parallel uploads)
                for (const video of videosToUpload) {
                    if (uploadControllerRef.current?.signal.aborted) {
                        break;
                    }
                    await uploadSingleVideo(video, action);
                }
            } catch (error) {
                console.error('Upload process error:', error);
            } finally {
                setIsUploading(false);
                setIsPaused(false);
                uploadControllerRef.current = null;
                currentUploadRef.current = [];
            }
        },
        [isUploading, videos, uploadSingleVideo],
    );

    const pauseUpload = useCallback(() => {
        setIsPaused(true);
    }, []);

    const resumeUpload = useCallback(() => {
        setIsPaused(false);
    }, []);

    const cancelUpload = useCallback(() => {
        if (uploadControllerRef.current) {
            uploadControllerRef.current.abort();
        }

        // Reset uploading videos to pending
        currentUploadRef.current.forEach((videoId) => {
            updateUploadProgress(videoId, 0, 'pending');
        });

        setIsUploading(false);
        setIsPaused(false);
        uploadControllerRef.current = null;
        currentUploadRef.current = [];
    }, [updateUploadProgress]);

    const importFromSheet = useCallback(
        (mapping: SheetMapping, data: Record<string, unknown>[]) => {
            const importedVideos: VideoUpload[] = data.map((row, index) => {
                const video: VideoUpload = {
                    id: generateVideoId() + '_sheet_' + index,
                    title: '',
                    description: '',
                    hashtags: '',
                    scheduledAt: new Date().toISOString().slice(0, 16),
                    status: 'pending',
                };

                // Map data based on the mapping
                Object.entries(mapping).forEach(([fieldKey, columnId]) => {
                    if (columnId && fieldKey in video) {
                        const value = row[fieldKey];
                        if (value !== undefined && value !== null) {
                            // Type casting for different field types
                            if (
                                fieldKey === 'scheduledAt' &&
                                typeof value === 'string'
                            ) {
                                // Try to parse date string
                                const date = new Date(value);
                                if (!isNaN(date.getTime())) {
                                    video.scheduledAt = date
                                        .toISOString()
                                        .slice(0, 16);
                                }
                            } else if (fieldKey === 'title') {
                                video.title = String(value);
                            } else if (fieldKey === 'description') {
                                video.description = String(value);
                            } else if (fieldKey === 'hashtags') {
                                video.hashtags = String(value);
                            }
                        }
                    }
                });

                return video;
            });

            setVideos((prev) => [...prev, ...importedVideos]);
        },
        [generateVideoId],
    );

    return {
        // State
        selectedChannel,
        videos,
        uploadProgress,
        isUploading,
        isPaused,

        // Actions
        setSelectedChannel,
        addVideo,
        updateVideo,
        removeVideo,
        setVideos,

        // Upload management
        startUpload,
        pauseUpload,
        resumeUpload,
        cancelUpload,

        // Sheet integration
        importFromSheet,
    };
}
