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
    addVideo: () => Promise<void>;
    updateVideo: (
        videoId: string,
        updates: Partial<VideoUpload>,
    ) => Promise<void>;
    removeVideo: (videoId: string) => Promise<void>;
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

    // API helper functions
    const apiCall = useCallback(
        async (endpoint: string, options: RequestInit = {}) => {
            const response = await fetch(`/video-schedules${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content || '',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.statusText}`);
            }

            return response.json();
        },
        [],
    );

    // Load videos from database - commented out to prevent loading existing videos
    // const loadVideos = useCallback(async () => {
    //     try {
    //         setIsLoading(true);
    //         const data = await apiCall('');
    //         // Transform backend data to frontend format
    //         const transformedVideos: VideoUpload[] = data.videoSchedules?.map((schedule: any) => ({
    //             id: schedule.id.toString(),
    //             title: schedule.video?.title || '',
    //             description: schedule.video?.description || '',
    //             hashtags: schedule.video?.tags?.join(' ') || '',
    //             scheduledAt: schedule.scheduled_at ? new Date(schedule.scheduled_at).toISOString().slice(0, 16) : '',
    //             status: schedule.status || 'pending',
    //             forKids: schedule.video?.made_for_kids || false,
    //             ageRestricted: schedule.video?.privacy === 'private' || false,
    //             file: undefined, // Files are not loaded from DB
    //             fileName: schedule.video?.file_path ? schedule.video.file_path.split('/').pop() : undefined,
    //             thumbnail: undefined,
    //             thumbnailName: schedule.video?.thumbnail_path ? schedule.video.thumbnail_path.split('/').pop() : undefined,
    //         })) || [];

    //         setVideos(transformedVideos);
    //     } catch (error) {
    //         console.error('Failed to load videos:', error);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // }, [apiCall]);

    // Save video to database
    const saveVideo = useCallback(
        async (video: VideoUpload) => {
            try {
                const videoData = {
                    title: video.title,
                    description: video.description,
                    tags: video.hashtags
                        ? video.hashtags.split(' ').filter((tag) => tag.trim())
                        : [],
                    made_for_kids: video.forKids,
                    privacy: video.ageRestricted ? 'private' : 'public',
                    scheduled_for: video.scheduledAt,
                    status: video.status,
                };

                if (video.id.startsWith('temp_')) {
                    // Create new video
                    const response = await apiCall('', {
                        method: 'POST',
                        body: JSON.stringify(videoData),
                    });
                    return response.id;
                } else {
                    // Update existing video
                    await apiCall(`/${video.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(videoData),
                    });
                    return video.id;
                }
            } catch (error) {
                console.error('Failed to save video:', error);
                throw error;
            }
        },
        [apiCall],
    );

    // Delete video from database
    const deleteVideoFromDB = useCallback(
        async (videoId: string) => {
            try {
                await apiCall(`/${videoId}`, {
                    method: 'DELETE',
                });
            } catch (error) {
                console.error('Failed to delete video:', error);
                throw error;
            }
        },
        [apiCall],
    );

    // Load videos on mount - commented out to prevent loading existing videos
    // useEffect(() => {
    //     loadVideos();
    // }, [loadVideos]);

    const generateVideoId = useCallback(() => {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }, []);

    const addVideo = useCallback(async () => {
        const now = new Date();
        const defaultTime = new Date(now);
        defaultTime.setHours(3, 33, 0, 0); // 3:33 AM

        const tempVideo: VideoUpload = {
            id: `temp_${generateVideoId()}`,
            title: '',
            description: '',
            hashtags: '',
            scheduledAt: defaultTime.toISOString().slice(0, 16),
            status: 'pending',
            forKids: false,
            ageRestricted: false,
        };

        // Add to local state immediately for UI responsiveness
        setVideos((prev) => [...prev, tempVideo]);

        try {
            // Save to database
            const savedId = await saveVideo(tempVideo);

            // Update the video with the real ID from database
            setVideos((prev) =>
                prev.map((video) =>
                    video.id === tempVideo.id
                        ? { ...video, id: savedId.toString() }
                        : video,
                ),
            );
        } catch (error) {
            // Remove from local state if save failed
            setVideos((prev) =>
                prev.filter((video) => video.id !== tempVideo.id),
            );
            throw error;
        }
    }, [generateVideoId, saveVideo]);

    const updateVideo = useCallback(
        async (videoId: string, updates: Partial<VideoUpload>) => {
            // Update local state immediately for UI responsiveness
            setVideos((prev) =>
                prev.map((video) =>
                    video.id === videoId ? { ...video, ...updates } : video,
                ),
            );

            try {
                // Find the updated video
                const updatedVideo = videos.find((v) => v.id === videoId);
                if (updatedVideo) {
                    const videoWithUpdates = { ...updatedVideo, ...updates };
                    await saveVideo(videoWithUpdates);
                }
            } catch (error) {
                // Revert local state if save failed
                setVideos((prev) =>
                    prev.map((video) =>
                        video.id === videoId
                            ? videos.find((v) => v.id === videoId)!
                            : video,
                    ),
                );
                throw error;
            }
        },
        [videos, saveVideo],
    );

    const removeVideo = useCallback(
        async (videoId: string) => {
            // Remove from local state immediately for UI responsiveness
            const videoToRemove = videos.find((v) => v.id === videoId);
            setVideos((prev) => prev.filter((video) => video.id !== videoId));
            setUploadProgress((prev) =>
                prev.filter((progress) => progress.videoId !== videoId),
            );

            try {
                // Delete from database
                if (videoToRemove && !videoToRemove.id.startsWith('temp_')) {
                    await deleteVideoFromDB(videoToRemove.id);
                }
            } catch (error) {
                // Restore local state if delete failed
                if (videoToRemove) {
                    setVideos((prev) => [...prev, videoToRemove]);
                }
                throw error;
            }
        },
        [videos, deleteVideoFromDB],
    );

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
                const now = new Date();
                const defaultTime = new Date(now);
                defaultTime.setHours(3, 33, 0, 0); // 3:33 AM

                const video: VideoUpload = {
                    id: generateVideoId() + '_sheet_' + index,
                    title: '',
                    description: '',
                    hashtags: '',
                    scheduledAt: defaultTime.toISOString().slice(0, 16),
                    status: 'pending',
                    forKids: false,
                    ageRestricted: false,
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
