export interface VideoProcess {
    id: number;
    original_filename: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    error_message?: string;
    download_url?: string;
}

export interface BatchProcess {
    batch_id: string;
    videos: VideoProcess[];
}

export interface UploadResponse {
    success: boolean;
    batch_id?: string;
    results?: VideoProcess[];
    message?: string;
}

export interface StatusResponse {
    success: boolean;
    data?: VideoProcess;
    message?: string;
}

export interface BatchStatusResponse {
    success: boolean;
    data?: VideoProcess[];
    message?: string;
}
