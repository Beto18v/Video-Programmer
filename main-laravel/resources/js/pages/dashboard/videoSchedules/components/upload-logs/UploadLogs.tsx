import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle,
    Clock,
    ExternalLink,
    FileVideo,
    Trash2,
    Upload,
    Youtube,
} from 'lucide-react';
import { useMemo } from 'react';
import { UploadProgress } from '../../types';

interface UploadLogsProps {
    logs: string[];
    uploadProgress: UploadProgress[];
    isUploading: boolean;
    onClearLogs: () => void;
}

export default function UploadLogs({
    logs,
    uploadProgress,
    isUploading,
    onClearLogs,
}: UploadLogsProps) {
    const overallProgress = useMemo(() => {
        if (uploadProgress.length === 0) return 0;

        const totalProgress = uploadProgress.reduce(
            (sum, item) => sum + item.progress,
            0,
        );
        return Math.round(totalProgress / uploadProgress.length);
    }, [uploadProgress]);

    const stats = useMemo(() => {
        const total = uploadProgress.length;
        const completed = uploadProgress.filter(
            (p) => p.status === 'completed' || p.status === 'scheduled',
        ).length;
        const failed = uploadProgress.filter(
            (p) => p.status === 'failed',
        ).length;
        const uploading = uploadProgress.filter(
            (p) => p.status === 'uploading',
        ).length;

        return { total, completed, failed, uploading };
    }, [uploadProgress]);

    const getStatusIcon = (status: UploadProgress['status']) => {
        switch (status) {
            case 'completed':
            case 'scheduled':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'uploading':
                return <Upload className="h-4 w-4 text-blue-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: UploadProgress['status']) => {
        switch (status) {
            case 'completed':
            case 'scheduled':
                return (
                    <Badge
                        variant="default"
                        className="bg-green-100 text-green-800"
                    >
                        Completado
                    </Badge>
                );
            case 'failed':
                return <Badge variant="destructive">Fallido</Badge>;
            case 'uploading':
                return (
                    <Badge
                        variant="default"
                        className="bg-blue-100 text-blue-800"
                    >
                        Subiendo
                    </Badge>
                );
            case 'pending':
                return <Badge variant="secondary">Pendiente</Badge>;
            default:
                return <Badge variant="outline">Desconocido</Badge>;
        }
    };

    if (!isUploading && logs.length === 0 && uploadProgress.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileVideo className="h-5 w-5" />
                        Logs de Subida
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="py-8 text-center text-muted-foreground">
                        <FileVideo className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p>No hay logs de subida disponibles</p>
                        <p className="text-sm">
                            Los logs aparecerán aquí cuando inicies una subida
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <FileVideo className="h-5 w-5" />
                        Logs de Subida
                        {isUploading && (
                            <Badge
                                variant="default"
                                className="bg-blue-100 text-blue-800"
                            >
                                En progreso
                            </Badge>
                        )}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearLogs}
                        disabled={isUploading}
                        className="flex items-center gap-1"
                    >
                        <Trash2 className="h-4 w-4" />
                        Limpiar
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Overall Progress */}
                {isUploading && uploadProgress.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                                Progreso General
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {overallProgress}%
                            </span>
                        </div>
                        <Progress value={overallProgress} className="w-full" />

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="space-y-1">
                                <div className="text-lg font-bold">
                                    {stats.total}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Total
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-lg font-bold text-blue-600">
                                    {stats.uploading}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Subiendo
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-lg font-bold text-green-600">
                                    {stats.completed}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Completados
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-lg font-bold text-red-600">
                                    {stats.failed}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Fallidos
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* YouTube Setup Alert */}
                {stats.completed > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                        <Youtube className="h-4 w-4 text-yellow-600" />
                        <AlertDescription>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-yellow-800">
                                    Videos subidos localmente pero no en YouTube
                                </p>
                                <p className="text-sm text-yellow-700">
                                    Para que los videos aparezcan en tu canal de
                                    YouTube, necesitas configurar las
                                    credenciales de YouTube API.
                                </p>
                                <Link
                                    href="/dashboard/youtube-setup"
                                    className="inline-flex items-center gap-1 text-sm font-medium text-yellow-800 underline hover:text-yellow-900"
                                >
                                    Configurar YouTube API
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Individual Video Progress */}
                {uploadProgress.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">
                            Progreso por Video
                        </h4>
                        <ScrollArea className="h-32 rounded-md border">
                            <div className="space-y-2 p-3">
                                {uploadProgress.map((item) => (
                                    <div
                                        key={item.videoId}
                                        className="flex items-center gap-3 text-sm"
                                    >
                                        {getStatusIcon(item.status)}
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-medium">
                                                Video {item.videoId.slice(-8)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(item.status)}
                                                {item.status ===
                                                    'uploading' && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {item.progress}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {item.status === 'uploading' && (
                                            <div className="w-16">
                                                <Progress
                                                    value={item.progress}
                                                    className="h-2"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {/* Logs */}
                {logs.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Logs Detallados</h4>
                        <ScrollArea className="h-48 rounded-md border bg-muted/20">
                            <div className="space-y-1 p-3">
                                {logs.map((log, index) => (
                                    <div
                                        key={index}
                                        className="font-mono text-xs break-words"
                                    >
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
