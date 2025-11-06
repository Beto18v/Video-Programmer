import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    Pause,
    Play,
    RotateCcw,
    Settings,
    Upload,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { UploadProgress, VideoUpload } from '../../types';

interface UploadActionsProps {
    videos: VideoUpload[];
    onStartUpload: (videoIds: string[], action: 'upload' | 'schedule') => void;
    onPauseUpload: () => void;
    onResumeUpload: () => void;
    onCancelUpload: () => void;
    uploadProgress?: UploadProgress[];
    isUploading?: boolean;
    isPaused?: boolean;
}

export default function UploadActions({
    videos,
    onStartUpload,
    onPauseUpload,
    onResumeUpload,
    onCancelUpload,
    uploadProgress = [],
    isUploading = false,
    isPaused = false,
}: UploadActionsProps) {
    const [selectedVideos, setSelectedVideos] = useState<Set<string>>(
        new Set(),
    );
    const [uploadAction, setUploadAction] = useState<'upload' | 'schedule'>(
        'schedule',
    );
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Statistics
    const stats = useMemo(() => {
        const total = videos.length;
        const completed = videos.filter((v) => v.status === 'completed').length;
        const failed = videos.filter((v) => v.status === 'failed').length;
        const pending = videos.filter((v) => v.status === 'pending').length;
        const uploading = videos.filter((v) => v.status === 'uploading').length;
        const scheduled = videos.filter((v) => v.status === 'scheduled').length;

        return { total, completed, failed, pending, uploading, scheduled };
    }, [videos]);

    // Progress calculation
    const overallProgress = useMemo(() => {
        if (uploadProgress.length === 0) return 0;
        const totalProgress = uploadProgress.reduce(
            (acc, progress) => acc + progress.progress,
            0,
        );
        return Math.round(totalProgress / uploadProgress.length);
    }, [uploadProgress]);

    const handleSelectAll = useCallback(
        (checked: boolean) => {
            if (checked) {
                const availableVideos = videos
                    .filter(
                        (v) => v.status === 'pending' || v.status === 'failed',
                    )
                    .map((v) => v.id);
                setSelectedVideos(new Set(availableVideos));
            } else {
                setSelectedVideos(new Set());
            }
        },
        [videos],
    );

    const handleSelectVideo = useCallback(
        (videoId: string, checked: boolean) => {
            setSelectedVideos((prev) => {
                const newSet = new Set(prev);
                if (checked) {
                    newSet.add(videoId);
                } else {
                    newSet.delete(videoId);
                }
                return newSet;
            });
        },
        [],
    );

    const handleStartUpload = useCallback(() => {
        if (selectedVideos.size === 0) return;
        onStartUpload(Array.from(selectedVideos), uploadAction);
        setShowConfirmDialog(false);
        setSelectedVideos(new Set());
    }, [selectedVideos, uploadAction, onStartUpload]);

    const availableVideos = videos.filter(
        (v) => v.status === 'pending' || v.status === 'failed',
    );
    const allAvailableSelected =
        availableVideos.length > 0 &&
        availableVideos.every((v) => selectedVideos.has(v.id));

    // Validar que los videos seleccionados tengan información obligatoria completa
    const selectedVideosComplete = useMemo(() => {
        const selectedVideosList = videos.filter((v) =>
            selectedVideos.has(v.id),
        );
        return selectedVideosList.every((video) => {
            // Información obligatoria: Video (file), Título, Fecha/Hora
            return (
                video.file &&
                video.title &&
                video.title.trim().length > 0 &&
                video.scheduledAt
            );
        });
    }, [videos, selectedVideos]);

    const canStartUpload = selectedVideos.size > 0 && selectedVideosComplete;
    const someSelected = selectedVideos.size > 0;

    const getStatusColor = useCallback((status: VideoUpload['status']) => {
        switch (status) {
            case 'completed':
                return 'text-green-600';
            case 'failed':
                return 'text-red-600';
            case 'uploading':
                return 'text-blue-600';
            case 'scheduled':
                return 'text-purple-600';
            default:
                return 'text-gray-600';
        }
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Acciones de Subida y Programación
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                    <div className="text-center">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <div className="text-xs text-muted-foreground">
                            Total
                        </div>
                    </div>
                    <div className="text-center">
                        <div
                            className={`text-2xl font-bold ${getStatusColor('completed')}`}
                        >
                            {stats.completed}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Completados
                        </div>
                    </div>
                    <div className="text-center">
                        <div
                            className={`text-2xl font-bold ${getStatusColor('scheduled')}`}
                        >
                            {stats.scheduled}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Programados
                        </div>
                    </div>
                    <div className="text-center">
                        <div
                            className={`text-2xl font-bold ${getStatusColor('uploading')}`}
                        >
                            {stats.uploading}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Subiendo
                        </div>
                    </div>
                    <div className="text-center">
                        <div
                            className={`text-2xl font-bold ${getStatusColor('failed')}`}
                        >
                            {stats.failed}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Fallidos
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                            {stats.pending}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Pendientes
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                {isUploading && (
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
                    </div>
                )}

                {/* Selection Controls */}
                {availableVideos.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="select-all"
                                    checked={allAvailableSelected}
                                    onCheckedChange={handleSelectAll}
                                />
                                <label
                                    htmlFor="select-all"
                                    className="text-sm font-medium"
                                >
                                    Seleccionar todos los disponibles (
                                    {availableVideos.length})
                                </label>
                            </div>
                            {someSelected && (
                                <Badge variant="outline">
                                    {selectedVideos.size} seleccionados
                                </Badge>
                            )}
                        </div>

                        {/* Video List for Selection */}
                        <div className="max-h-40 space-y-2 overflow-y-auto">
                            {availableVideos.map((video) => {
                                const progress = uploadProgress.find(
                                    (p) => p.videoId === video.id,
                                );
                                return (
                                    <div
                                        key={video.id}
                                        className="flex items-center gap-3 rounded border p-2"
                                    >
                                        <Checkbox
                                            checked={selectedVideos.has(
                                                video.id,
                                            )}
                                            onCheckedChange={(checked) =>
                                                handleSelectVideo(
                                                    video.id,
                                                    checked as boolean,
                                                )
                                            }
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium">
                                                {video.title ||
                                                    video.fileName ||
                                                    'Video sin título'}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Badge
                                                    variant={
                                                        video.status ===
                                                        'failed'
                                                            ? 'destructive'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {video.status}
                                                </Badge>
                                                {video.scheduledAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(
                                                            video.scheduledAt,
                                                        ).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                            {progress && (
                                                <Progress
                                                    value={progress.progress}
                                                    className="mt-1 h-1 w-full"
                                                />
                                            )}
                                        </div>
                                        {video.status === 'failed' && (
                                            <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
                                        )}
                                        {video.status === 'completed' && (
                                            <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Action Controls */}
                <div className="flex flex-wrap gap-3">
                    {isUploading ? (
                        <>
                            {isPaused ? (
                                <Button
                                    onClick={onResumeUpload}
                                    className="flex items-center gap-2"
                                >
                                    <Play className="h-4 w-4" />
                                    Reanudar
                                </Button>
                            ) : (
                                <Button
                                    onClick={onPauseUpload}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Pause className="h-4 w-4" />
                                    Pausar
                                </Button>
                            )}
                            <Button
                                onClick={onCancelUpload}
                                variant="destructive"
                                className="flex items-center gap-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Cancelar Todo
                            </Button>
                        </>
                    ) : (
                        <Dialog
                            open={showConfirmDialog}
                            onOpenChange={setShowConfirmDialog}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    disabled={!canStartUpload}
                                    className="flex items-center gap-2"
                                >
                                    {uploadAction === 'upload' ? (
                                        <Upload className="h-4 w-4" />
                                    ) : (
                                        <Calendar className="h-4 w-4" />
                                    )}
                                    {uploadAction === 'upload'
                                        ? 'Subir Ahora'
                                        : 'Programar'}
                                    {selectedVideos.size > 0 &&
                                        ` (${selectedVideos.size})`}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Confirmar Acción</DialogTitle>
                                    <DialogDescription>
                                        Selecciona el tipo de acción que quieres
                                        realizar con los {selectedVideos.size}{' '}
                                        videos seleccionados.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Tipo de acción:
                                        </label>
                                        <Select
                                            value={uploadAction}
                                            onValueChange={(
                                                value: 'upload' | 'schedule',
                                            ) => setUploadAction(value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="schedule">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        Programar según
                                                        fecha/hora establecida
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="upload">
                                                    <div className="flex items-center gap-2">
                                                        <Upload className="h-4 w-4" />
                                                        Subir inmediatamente
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="rounded-lg bg-muted p-3 text-sm">
                                        {uploadAction === 'schedule'
                                            ? 'Los videos se subirán automáticamente en las fechas y horas programadas.'
                                            : 'Los videos se subirán inmediatamente, ignorando la programación de fecha/hora.'}
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setShowConfirmDialog(false)
                                        }
                                    >
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleStartUpload}>
                                        Confirmar
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {videos.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                        No hay videos para procesar
                    </div>
                )}

                {/* Mensaje de ayuda para validación */}
                {selectedVideos.size > 0 && !selectedVideosComplete && (
                    <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                        <div className="flex items-center gap-2 text-yellow-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Información incompleta
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-yellow-700">
                            Para programar videos, todos deben tener:{' '}
                            <strong>Video</strong>, <strong>Título</strong> y{' '}
                            <strong>Fecha/Hora</strong> completados.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
