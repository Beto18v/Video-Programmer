import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProgressCard } from './components/ProgressCard';
import { UploadForm } from './components/UploadForm';
import {
    BatchProcess,
    BatchStatusResponse,
    UploadResponse,
    VideoProcess,
} from './types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Limpieza de Videos',
        href: '/dashboard/video-cleaner',
    },
];

export default function VideoCleaner() {
    const [currentBatch, setCurrentBatch] = useState<BatchProcess | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);

    // Auto-refresh status for active processes
    useEffect(() => {
        if (!currentBatch) return;

        const hasActiveProcesses = currentBatch.videos.some(
            (video) =>
                video.status === 'pending' || video.status === 'processing',
        );

        if (!hasActiveProcesses) return;

        const interval = setInterval(() => {
            refreshBatchStatus();
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [currentBatch]);

    const handleUpload = async (files: File[], positions: string[]) => {
        setIsUploading(true);
        setError(null);
        setSuccess(null);

        try {
            const formData = new FormData();

            files.forEach((file) => {
                formData.append('videos[]', file);
            });

            positions.forEach((position) => {
                formData.append('watermark_positions[]', position);
            });

            const response = await fetch('/video-cleaner/process', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content || '',
                },
            });

            const data: UploadResponse = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error al subir los videos');
            }

            if (data.batch_id && data.results) {
                setCurrentBatch({
                    batch_id: data.batch_id,
                    videos: data.results,
                });
                setSuccess(
                    `Se han encolado ${data.results.length} video(s) para procesamiento.`,
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsUploading(false);
        }
    };

    const refreshBatchStatus = async () => {
        if (!currentBatch) return;

        setIsPolling(true);

        try {
            const response = await fetch(
                `/video-cleaner/batch/${currentBatch.batch_id}`,
            );
            const data: BatchStatusResponse = await response.json();

            if (data.success && data.data) {
                setCurrentBatch((prev) =>
                    prev ? { ...prev, videos: data.data! } : null,
                );
            }
        } catch (err) {
            console.error('Error refreshing status:', err);
        } finally {
            setIsPolling(false);
        }
    };

    const handleDownload = (video: VideoProcess) => {
        if (video.download_url) {
            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = video.download_url;
            link.download = video.original_filename.replace(
                /\.[^/.]+$/,
                '_clean.mp4',
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const clearBatch = () => {
        setCurrentBatch(null);
        setError(null);
        setSuccess(null);
    };

    const getBatchStats = () => {
        if (!currentBatch) return null;

        const stats = {
            total: currentBatch.videos.length,
            pending: currentBatch.videos.filter((v) => v.status === 'pending')
                .length,
            processing: currentBatch.videos.filter(
                (v) => v.status === 'processing',
            ).length,
            completed: currentBatch.videos.filter(
                (v) => v.status === 'completed',
            ).length,
            failed: currentBatch.videos.filter((v) => v.status === 'failed')
                .length,
        };

        return stats;
    };

    const stats = getBatchStats();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Limpieza de Videos" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Limpieza de Videos</h1>
                    <p className="text-muted-foreground">
                        Elimina watermarks dinámicos de tus videos generados con
                        Sora.
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                {/* Upload Form */}
                {!currentBatch && (
                    <UploadForm
                        onUpload={handleUpload}
                        isUploading={isUploading}
                    />
                )}

                {/* Current Batch */}
                {currentBatch && (
                    <div className="space-y-6">
                        {/* Batch Header */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            Proceso Batch
                                            <Badge variant="outline">
                                                {currentBatch.batch_id}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription>
                                            Estado del procesamiento de videos
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={refreshBatchStatus}
                                            disabled={isPolling}
                                        >
                                            <RefreshCw
                                                className={`mr-2 h-4 w-4 ${isPolling ? 'animate-spin' : ''}`}
                                            />
                                            Actualizar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={clearBatch}
                                        >
                                            Nuevo Proceso
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            {stats && (
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">
                                                {stats.total}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Total
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-yellow-600">
                                                {stats.pending}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Pendientes
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {stats.processing}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Procesando
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {stats.completed}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Completados
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-600">
                                                {stats.failed}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Errores
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* Video Progress Cards */}
                        <div className="grid gap-4">
                            {currentBatch.videos.map((video) => (
                                <ProgressCard
                                    key={video.id}
                                    video={video}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
