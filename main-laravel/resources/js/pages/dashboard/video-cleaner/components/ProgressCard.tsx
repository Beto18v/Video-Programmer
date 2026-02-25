import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Download,
    FileVideo,
    Loader2,
} from 'lucide-react';

interface VideoProcess {
    id: number;
    original_filename: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    error_message?: string;
    download_url?: string;
}

interface ProgressCardProps {
    video: VideoProcess;
    onDownload?: (video: VideoProcess) => void;
}

const STATUS_CONFIG = {
    pending: {
        label: 'Pendiente',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
    },
    processing: {
        label: 'Procesando',
        color: 'bg-blue-100 text-blue-800',
        icon: Loader2,
    },
    completed: {
        label: 'Completado',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
    },
    failed: {
        label: 'Error',
        color: 'bg-red-100 text-red-800',
        icon: AlertCircle,
    },
};

export function ProgressCard({ video, onDownload }: ProgressCardProps) {
    const statusConfig = STATUS_CONFIG[video.status];
    const StatusIcon = statusConfig.icon;

    const handleDownload = () => {
        if (video.download_url && onDownload) {
            onDownload(video);
        } else if (video.download_url) {
            // Fallback: direct download
            window.open(video.download_url, '_blank');
        }
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <FileVideo className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                            <h4 className="truncate font-medium">
                                {video.original_filename}
                            </h4>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        'text-xs',
                                        statusConfig.color,
                                    )}
                                >
                                    <StatusIcon className="mr-1 h-3 w-3" />
                                    {statusConfig.label}
                                </Badge>
                                {video.status === 'processing' && (
                                    <span className="text-xs text-muted-foreground">
                                        {video.progress}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {video.status === 'completed' && video.download_url && (
                        <Button
                            size="sm"
                            onClick={handleDownload}
                            className="flex-shrink-0"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                        </Button>
                    )}
                </div>

                {/* Progress Bar */}
                {video.status === 'processing' && (
                    <div className="mt-3">
                        <Progress value={video.progress} className="h-2" />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Procesando video...
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {video.status === 'failed' && video.error_message && (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                            <div>
                                <p className="text-sm font-medium text-red-800">
                                    Error en el procesamiento
                                </p>
                                <p className="mt-1 text-sm text-red-700">
                                    {video.error_message}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {video.status === 'completed' && (
                    <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-3">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                            <div>
                                <p className="text-sm font-medium text-green-800">
                                    Procesamiento completado
                                </p>
                                <p className="mt-1 text-sm text-green-700">
                                    El video ha sido limpiado exitosamente.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
