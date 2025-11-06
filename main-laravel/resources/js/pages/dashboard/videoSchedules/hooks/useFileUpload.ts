import { useCallback, useRef, useState } from 'react';

interface UploadState {
    isUploading: boolean;
    progress: number;
    error: string | null;
    file: File | null;
}

interface UseFileUploadReturn {
    uploadState: UploadState;
    startUpload: (file: File) => Promise<void>;
    cancelUpload: () => void;
    clearUpload: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
    const [uploadState, setUploadState] = useState<UploadState>({
        isUploading: false,
        progress: 0,
        error: null,
        file: null,
    });

    const xhrRef = useRef<XMLHttpRequest | null>(null);

    const startUpload = useCallback(async (file: File) => {
        setUploadState({
            isUploading: true,
            progress: 0,
            error: null,
            file,
        });

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('video_file', file);

            // Create XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();
            xhrRef.current = xhr; // Store reference for cancellation

            // Set up progress tracking
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round(
                        (event.loaded / event.total) * 100,
                    );
                    setUploadState((prev) => ({
                        ...prev,
                        progress,
                    }));
                }
            });

            // Set up completion handling
            xhr.addEventListener('load', () => {
                xhrRef.current = null; // Clear reference
                if (xhr.status === 200) {
                    setUploadState((prev) => ({
                        ...prev,
                        isUploading: false,
                        progress: 100,
                    }));
                } else {
                    setUploadState((prev) => ({
                        ...prev,
                        isUploading: false,
                        error: 'Error en la subida del archivo',
                    }));
                }
            });

            // Set up error handling
            xhr.addEventListener('error', () => {
                xhrRef.current = null; // Clear reference
                setUploadState((prev) => ({
                    ...prev,
                    isUploading: false,
                    error: 'Error de red durante la subida',
                }));
            });

            // Set up abort handling
            xhr.addEventListener('abort', () => {
                xhrRef.current = null; // Clear reference
                setUploadState((prev) => ({
                    ...prev,
                    isUploading: false,
                    error: 'Subida cancelada',
                }));
            });

            // Get CSRF token
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            // Start the upload
            xhr.open('POST', '/video-uploads/single-file', true);
            xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken || '');
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.send(formData);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Upload failed';
            setUploadState((prev) => ({
                ...prev,
                isUploading: false,
                error: errorMessage,
            }));
        }
    }, []);

    const cancelUpload = useCallback(() => {
        if (xhrRef.current) {
            xhrRef.current.abort(); // This will trigger the 'abort' event listener
        } else {
            // If no XHR request, just reset state
            setUploadState((prev) => ({
                ...prev,
                isUploading: false,
                progress: 0,
                error: 'Subida cancelada',
            }));
        }
    }, []);

    const clearUpload = useCallback(() => {
        // Cancel any ongoing upload
        if (xhrRef.current) {
            xhrRef.current.abort();
        }

        setUploadState({
            isUploading: false,
            progress: 0,
            error: null,
            file: null,
        });
    }, []);

    return {
        uploadState,
        startUpload,
        cancelUpload,
        clearUpload,
    };
}
