export interface Channel {
    id: number;
    name: string;
    description: string;
    status: string;
    subscriber_count: number;
    video_count: number;
    view_count: number;
    avatar_url: string | null;
    platform: string; // youtube, etc.
}

export interface VideoUpload {
    id: string; // Unique identifier for the row
    file?: File;
    fileName?: string;
    title: string;
    description: string;
    hashtags: string;
    thumbnail?: File;
    thumbnailUrl?: string;
    scheduledAt: string; // ISO date string
    status: 'pending' | 'uploading' | 'scheduled' | 'completed' | 'failed';
    progress?: number; // Upload progress percentage
    error?: string;
}

export interface SheetColumn {
    id: string;
    name: string;
    data: string[];
}

export type SheetMapping = {
    [K in keyof Partial<VideoUpload>]: string | null;
};

export interface SchedulingFormData {
    channelId: number;
    videos: VideoUpload[];
    useSheet: boolean;
    sheetUrl?: string;
    sheetMapping?: SheetMapping;
}

export interface UploadProgress {
    videoId: string;
    progress: number;
    status: VideoUpload['status'];
    error?: string;
}

export const VIDEO_FIELDS = [
    { key: 'file', label: 'Video', required: true },
    { key: 'title', label: 'Título', required: true },
    { key: 'description', label: 'Descripción', required: false },
    { key: 'hashtags', label: 'Hashtags', required: false },
    { key: 'thumbnail', label: 'Miniatura', required: false },
    { key: 'scheduledAt', label: 'Fecha/Hora de publicación', required: true },
] as const;

export type VideoFieldKey = (typeof VIDEO_FIELDS)[number]['key'];
