/**
 * VideoTable - Componente mejorado para la gestión de videos programados
 *
 * Mejoras implementadas:
 * - ✅ Añadida columna Canal que muestra automáticamente el canal seleccionado
 * - ✅ Validación completa de campos con mensajes de error visibles
 * - ✅ Botón de subida masiva integrado en la cabecera de la columna Video
 * - ✅ Asociación automática del canal seleccionado a nuevos videos
 * - ✅ Soporte para archivos de video de hasta 10GB
 * - ✅ Optimización de performance con useMemo y useCallback
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertCircle,
    Calendar,
    Clock,
    Plus,
    Sheet,
    Trash2,
    Upload,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Channel, VIDEO_FIELDS, VideoUpload } from '../../types';
import BulkUploadModal from './BulkUploadModal';
import FileUpload from './FileUpload';

interface VideoTableProps {
    videos: VideoUpload[];
    onVideosChange: (videos: VideoUpload[]) => void;
    onConnectSheet: () => void;
    selectedChannel?: Channel | null; // Canal seleccionado del contexto
    isLoading?: boolean;
}

export default function VideoTable({
    videos,
    onVideosChange,
    onConnectSheet,
    selectedChannel,
}: VideoTableProps) {
    const [editingCell, setEditingCell] = useState<{
        videoId: string;
        field: string;
    } | null>(null);
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

    const generateVideoId = useCallback(() => {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }, []);

    // Función para validar un video individual
    const validateVideo = useCallback(
        (video: VideoUpload): VideoUpload => {
            // No validar videos que están siendo subidos o ya completados
            if (
                video.status === 'uploading' ||
                video.status === 'completed' ||
                video.status === 'scheduled'
            ) {
                return {
                    ...video,
                    validationErrors: undefined, // Limpiar errores previos
                };
            }

            const errors: VideoUpload['validationErrors'] = {};

            // Verificar si tiene archivo (tanto File object como fileName para compatibilidad)
            const hasFile = video.file || video.fileName;

            // Validar archivo de video solo para videos completamente nuevos sin ningún archivo
            if (!hasFile && video.status === 'pending') {
                // Solo mostrar error de archivo si no hay ni File ni fileName
                errors.file = 'El archivo de video es obligatorio';
            }

            // Validar título (requerido, mínimo 3 caracteres, máximo 100)
            // Solo validar título si no está vacío (permitir videos nuevos sin título inicialmente)
            if (video.title && video.title.trim().length > 0) {
                if (video.title.trim().length < 3) {
                    errors.title = 'El título debe tener al menos 3 caracteres';
                } else if (video.title.length > 100) {
                    errors.title = 'El título no debe exceder 100 caracteres';
                }
            } else if (hasFile) {
                // Solo requerir título si ya tiene archivo
                errors.title = 'El título es obligatorio';
            }

            // Validar canal (requerido solo si ya tiene archivo)
            if (!selectedChannel && hasFile) {
                errors.channel = 'Debe seleccionar un canal';
            }

            // Validar fecha de programación (requerida solo si ya tiene archivo)
            if (hasFile) {
                if (!video.scheduledAt) {
                    errors.scheduledAt =
                        'La fecha de programación es obligatoria';
                } else {
                    const scheduledDate = new Date(video.scheduledAt);
                    const now = new Date();
                    if (scheduledDate <= now) {
                        errors.scheduledAt = 'La fecha debe ser futura';
                    }
                }
            }

            // Validar thumbnail (opcional, pero si existe debe ser una imagen válida)
            if (video.thumbnail) {
                if (!video.thumbnail.type.startsWith('image/')) {
                    errors.thumbnail = 'El archivo debe ser una imagen';
                } else if (video.thumbnail.size > 10 * 1024 * 1024) {
                    errors.thumbnail = 'La imagen no debe exceder 10MB';
                }
            }

            return {
                ...video,
                validationErrors:
                    Object.keys(errors).length > 0 ? errors : undefined,
            };
        },
        [selectedChannel],
    );

    // Función para agregar un nuevo video con canal pre-asignado
    const addVideo = useCallback(() => {
        const now = new Date();
        const defaultTime = new Date(now);
        defaultTime.setDate(defaultTime.getDate() + 1); // Un día después
        defaultTime.setHours(0, 0, 0, 0); // A las 00:00 (medianoche)

        const newVideo: VideoUpload = {
            id: generateVideoId(),
            title: '',
            description: '',
            hashtags: '',
            scheduledAt: defaultTime.toISOString().slice(0, 16), // Format for datetime-local input
            // ✅ MEJORA: Asociar automáticamente el canal seleccionado
            channelId: selectedChannel?.id,
            channelName: selectedChannel?.name,
            status: 'pending',
            forKids: false,
            ageRestricted: false,
        };
        onVideosChange([...videos, newVideo]);
    }, [videos, onVideosChange, generateVideoId, selectedChannel]);

    const removeVideo = useCallback(
        (videoId: string) => {
            const updatedVideos = videos.filter(
                (video) => video.id !== videoId,
            );
            onVideosChange(updatedVideos);
        },
        [videos, onVideosChange],
    );

    // ✅ MEJORA: Actualización de video con validación automática
    const updateVideo = useCallback(
        (
            videoId: string,
            field: keyof VideoUpload,
            value: string | File | number | boolean,
        ) => {
            onVideosChange(
                videos.map((video) => {
                    if (video.id === videoId) {
                        const updatedVideo = { ...video, [field]: value };
                        // Validar el video después de actualizarlo
                        return validateVideo(updatedVideo);
                    }
                    return video;
                }),
            );
        },
        [videos, onVideosChange, validateVideo],
    );

    const handleCellClick = useCallback((videoId: string, field: string) => {
        // Solo permitir edición para campos que no sean archivos
        if (!['file', 'thumbnail', 'channel'].includes(field)) {
            setEditingCell({ videoId, field });
        }
    }, []);

    const handleCellBlur = useCallback(() => {
        setEditingCell(null);
    }, []);

    const renderCell = useCallback(
        (video: VideoUpload, field: (typeof VIDEO_FIELDS)[number]) => {
            const isEditing =
                editingCell?.videoId === video.id &&
                editingCell?.field === field.key;

            switch (field.key) {
                case 'file':
                    return (
                        <div className="w-48 space-y-1">
                            <FileUpload
                                label=""
                                accept="video/*"
                                onFileSelect={(files) => {
                                    if (files.length > 0) {
                                        const file = files[0];

                                        // Actualizar múltiples campos de una sola vez para evitar estados inconsistentes
                                        onVideosChange(
                                            videos.map((v) => {
                                                if (v.id === video.id) {
                                                    const updatedVideo = {
                                                        ...v,
                                                    };

                                                    // Actualizar archivo
                                                    updatedVideo.file = file;
                                                    updatedVideo.fileName =
                                                        file.name;

                                                    // Si el video no tiene título, usar el nombre del archivo
                                                    if (
                                                        !v.title ||
                                                        v.title.trim() === ''
                                                    ) {
                                                        const titleFromFile =
                                                            file.name.replace(
                                                                /\.[^/.]+$/,
                                                                '',
                                                            ); // Remover extensión
                                                        updatedVideo.title =
                                                            titleFromFile;
                                                    }

                                                    // Cambiar estado a 'pending' después de subida exitosa
                                                    updatedVideo.status =
                                                        'pending';

                                                    // Validar el video actualizado
                                                    return validateVideo(
                                                        updatedVideo,
                                                    );
                                                }
                                                return v;
                                            }),
                                        );
                                    } else {
                                        // Si no hay archivos (se está limpiando), limpiar los campos relacionados
                                        onVideosChange(
                                            videos.map((v) => {
                                                if (v.id === video.id) {
                                                    const updatedVideo = {
                                                        ...v,
                                                    };
                                                    updatedVideo.file =
                                                        undefined;
                                                    updatedVideo.fileName = '';
                                                    return validateVideo(
                                                        updatedVideo,
                                                    );
                                                }
                                                return v;
                                            }),
                                        );
                                    }
                                }}
                                currentFile={video.file}
                                currentFileName={video.fileName}
                                placeholder="Seleccionar video"
                                maxSize={10000} // 10GB for videos
                                className={`min-w-0 ${
                                    video.validationErrors?.file
                                        ? 'border-destructive'
                                        : ''
                                }`}
                                compact={true}
                            />
                            {video.validationErrors?.file && (
                                <div className="flex items-center gap-1 text-xs text-destructive">
                                    <AlertCircle className="h-3 w-3" />
                                    {video.validationErrors.file}
                                </div>
                            )}
                        </div>
                    );

                case 'thumbnail':
                    return (
                        <div className="w-32 space-y-1">
                            <FileUpload
                                label=""
                                accept="image/*"
                                onFileSelect={(files) => {
                                    if (files.length > 0) {
                                        updateVideo(
                                            video.id,
                                            'thumbnail',
                                            files[0],
                                        );
                                        updateVideo(
                                            video.id,
                                            'thumbnailUrl',
                                            URL.createObjectURL(files[0]),
                                        );
                                    }
                                }}
                                currentFile={video.thumbnail}
                                placeholder="Miniatura"
                                maxSize={10} // 10MB for images
                                className="min-w-0"
                                compact={true}
                            />
                            {video.validationErrors?.thumbnail && (
                                <div className="flex items-center gap-1 text-xs text-destructive">
                                    <AlertCircle className="h-3 w-3" />
                                    {video.validationErrors.thumbnail}
                                </div>
                            )}
                        </div>
                    );

                case 'title':
                    return (
                        <div className="space-y-1">
                            {isEditing ? (
                                <Input
                                    value={video.title}
                                    onChange={(e) =>
                                        updateVideo(
                                            video.id,
                                            'title',
                                            e.target.value,
                                        )
                                    }
                                    onBlur={handleCellBlur}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === 'Enter' ||
                                            e.key === 'Escape'
                                        ) {
                                            handleCellBlur();
                                        }
                                    }}
                                    autoFocus
                                    className={`w-full min-w-[200px] ${
                                        video.validationErrors?.title
                                            ? 'border-destructive'
                                            : ''
                                    }`}
                                    placeholder="Título del video"
                                />
                            ) : (
                                <div
                                    className={`min-h-[40px] min-w-[200px] cursor-text rounded p-2 hover:bg-muted/50 ${
                                        video.validationErrors?.title
                                            ? 'border border-destructive'
                                            : ''
                                    }`}
                                    onClick={() =>
                                        handleCellClick(video.id, field.key)
                                    }
                                >
                                    {video.title || (
                                        <span className="text-muted-foreground italic">
                                            Haz clic para agregar título
                                        </span>
                                    )}
                                </div>
                            )}
                            {video.validationErrors?.title && (
                                <div className="flex items-center gap-1 text-xs text-destructive">
                                    <AlertCircle className="h-3 w-3" />
                                    {video.validationErrors.title}
                                </div>
                            )}
                        </div>
                    );

                case 'description':
                    return isEditing ? (
                        <Textarea
                            value={video.description}
                            onChange={(
                                e: React.ChangeEvent<HTMLTextAreaElement>,
                            ) =>
                                updateVideo(
                                    video.id,
                                    'description',
                                    e.target.value,
                                )
                            }
                            onBlur={handleCellBlur}
                            onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === 'Escape') {
                                    handleCellBlur();
                                }
                            }}
                            autoFocus
                            className="w-full min-w-[250px] resize-none"
                            placeholder="Descripción del video"
                            rows={3}
                        />
                    ) : (
                        <div
                            className="min-h-[40px] max-w-[300px] min-w-[250px] cursor-text rounded p-2 hover:bg-muted/50"
                            onClick={() => handleCellClick(video.id, field.key)}
                        >
                            {video.description ? (
                                <div className="line-clamp-3 whitespace-pre-wrap">
                                    {video.description}
                                </div>
                            ) : (
                                <span className="text-muted-foreground italic">
                                    Haz clic para agregar descripción
                                </span>
                            )}
                        </div>
                    );

                case 'hashtags':
                    return isEditing ? (
                        <Input
                            value={video.hashtags}
                            onChange={(e) =>
                                updateVideo(
                                    video.id,
                                    'hashtags',
                                    e.target.value,
                                )
                            }
                            onBlur={handleCellBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                    handleCellBlur();
                                }
                            }}
                            autoFocus
                            className="w-full min-w-[180px]"
                            placeholder="#tag1 #tag2 #tag3"
                        />
                    ) : (
                        <div
                            className="min-h-[40px] min-w-[180px] cursor-text rounded p-2 hover:bg-muted/50"
                            onClick={() => handleCellClick(video.id, field.key)}
                        >
                            {video.hashtags || (
                                <span className="text-muted-foreground italic">
                                    Haz clic para agregar hashtags
                                </span>
                            )}
                        </div>
                    );

                case 'channel':
                    return (
                        <div className="min-w-[150px] space-y-1">
                            <div
                                className={`rounded-md bg-muted/20 p-2 ${
                                    video.validationErrors?.channel
                                        ? 'border border-destructive'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                                        <span className="text-xs font-medium text-primary">
                                            {selectedChannel?.name?.charAt(0) ||
                                                'C'}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium">
                                        {selectedChannel?.name || 'Sin canal'}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {selectedChannel?.platform?.toUpperCase() ||
                                        'N/A'}
                                </p>
                            </div>
                            {video.validationErrors?.channel && (
                                <div className="flex items-center gap-1 text-xs text-destructive">
                                    <AlertCircle className="h-3 w-3" />
                                    {video.validationErrors.channel}
                                </div>
                            )}
                        </div>
                    );

                case 'scheduledAt':
                    return (
                        <div className="min-w-[180px] space-y-1">
                            <Input
                                type="datetime-local"
                                value={video.scheduledAt}
                                onChange={(e) =>
                                    updateVideo(
                                        video.id,
                                        'scheduledAt',
                                        e.target.value,
                                    )
                                }
                                className={`w-full ${
                                    video.validationErrors?.scheduledAt
                                        ? 'border-destructive'
                                        : ''
                                }`}
                            />
                            {video.validationErrors?.scheduledAt && (
                                <div className="flex items-center gap-1 text-xs text-destructive">
                                    <AlertCircle className="h-3 w-3" />
                                    {video.validationErrors.scheduledAt}
                                </div>
                            )}
                        </div>
                    );

                default:
                    return null;
            }
        },
        [
            editingCell,
            updateVideo,
            handleCellClick,
            handleCellBlur,
            selectedChannel,
            onVideosChange,
            validateVideo,
            videos,
        ],
    );

    // Configuración de badges optimizada con useMemo
    const statusBadgeConfig = useMemo(
        () => ({
            pending: { variant: 'secondary' as const, label: 'Pendiente' },
            uploading: { variant: 'default' as const, label: 'Subiendo' },
            scheduled: { variant: 'outline' as const, label: 'Programado' },
            completed: { variant: 'default' as const, label: 'Completado' },
            failed: { variant: 'destructive' as const, label: 'Fallido' },
        }),
        [],
    );

    const getStatusBadge = useCallback(
        (status: VideoUpload['status']) => {
            const config =
                statusBadgeConfig[status] || statusBadgeConfig.pending;
            return <Badge variant={config.variant}>{config.label}</Badge>;
        },
        [statusBadgeConfig],
    );

    // ✅ MEJORA: Función de subida masiva con asociación automática de canal
    const handleBulkUpload = useCallback(
        async (fileMappings: { videoId: string; file: File }[]) => {
            const updatedVideos = [...videos];
            const newVideos: VideoUpload[] = [];

            // Procesar cada archivo subido
            fileMappings.forEach((mapping) => {
                if (mapping.videoId) {
                    // Si hay un video existente, actualizarlo
                    const videoIndex = updatedVideos.findIndex(
                        (v) => v.id === mapping.videoId,
                    );
                    if (videoIndex !== -1) {
                        const existingVideo = updatedVideos[videoIndex];
                        updatedVideos[videoIndex] = {
                            ...existingVideo,
                            file: mapping.file,
                            fileName: mapping.file.name,
                            status: 'pending', // Update status when file is assigned
                            // Si el video no tiene título, usar el nombre del archivo
                            title:
                                existingVideo.title &&
                                existingVideo.title.trim() !== ''
                                    ? existingVideo.title
                                    : mapping.file.name.replace(
                                          /\.[^/.]+$/,
                                          '',
                                      ), // Remover extensión
                            // Asegurar que el canal esté asociado
                            channelId:
                                selectedChannel?.id || existingVideo.channelId,
                            channelName:
                                selectedChannel?.name ||
                                existingVideo.channelName,
                        };
                    }
                } else {
                    // Si no hay video existente, crear uno nuevo
                    const now = new Date();
                    const defaultTime = new Date(now);
                    defaultTime.setDate(defaultTime.getDate() + 1); // Un día después
                    defaultTime.setHours(0, 0, 0, 0); // A las 00:00

                    const newVideo: VideoUpload = {
                        id: generateVideoId(),
                        file: mapping.file,
                        fileName: mapping.file.name,
                        title: mapping.file.name.replace(/\.[^/.]+$/, ''), // Remover extensión
                        description: '',
                        hashtags: '',
                        scheduledAt: defaultTime.toISOString().slice(0, 16),
                        channelId: selectedChannel?.id,
                        channelName: selectedChannel?.name,
                        status: 'pending', // Set status to pending when file is present
                        forKids: false,
                        ageRestricted: false,
                    };
                    newVideos.push(newVideo);
                }
            });

            // Combinar videos actualizados con nuevos videos
            const finalVideos = [...updatedVideos, ...newVideos];
            onVideosChange(finalVideos);
        },
        [videos, onVideosChange, selectedChannel, generateVideoId],
    );

    if (videos.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Programar Videos
                        </CardTitle>
                        <Button
                            onClick={onConnectSheet}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Sheet className="h-4 w-4" />
                            Conectar con Sheet
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="py-12 text-center">
                        <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">
                            No hay videos programados
                        </h3>
                        <p className="mb-4 text-muted-foreground">
                            Agrega videos manualmente o conecta con Google
                            Sheets
                        </p>
                        <Button
                            onClick={addVideo}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Agregar Video
                        </Button>
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
                        <Upload className="h-5 w-5" />
                        Videos a Programar ({videos.length})
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            onClick={onConnectSheet}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Sheet className="h-4 w-4" />
                            Conectar con Sheet
                        </Button>
                        <Button
                            onClick={() => setIsBulkUploadOpen(true)}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            Subida Masiva
                        </Button>
                        <Button
                            onClick={addVideo}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Agregar Video
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="max-h-[600px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {VIDEO_FIELDS.map((field) => (
                                    <TableHead
                                        key={field.key}
                                        className="whitespace-nowrap"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>
                                                {field.label}
                                                {field.required && (
                                                    <span className="ml-1 text-destructive">
                                                        *
                                                    </span>
                                                )}
                                            </span>
                                            {/* Botón de subida masiva para la columna Video */}
                                            {field.key === 'file' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setIsBulkUploadOpen(
                                                            true,
                                                        )
                                                    }
                                                    className="ml-2 h-6 px-2 text-xs"
                                                    title="Subida masiva de videos"
                                                >
                                                    <Upload className="h-3 w-3" />
                                                    <span className="ml-1 hidden sm:inline">
                                                        Masiva
                                                    </span>
                                                </Button>
                                            )}
                                        </div>
                                    </TableHead>
                                ))}
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-32 text-center">
                                    Para niños
                                </TableHead>
                                <TableHead className="w-40 text-center">
                                    Restricción de edad
                                </TableHead>
                                <TableHead className="w-20 text-center">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {videos.map((video) => (
                                <TableRow key={video.id}>
                                    {VIDEO_FIELDS.map((field) => (
                                        <TableCell
                                            key={field.key}
                                            className="p-1"
                                        >
                                            {renderCell(video, field)}
                                        </TableCell>
                                    ))}
                                    <TableCell className="p-1">
                                        <div className="flex items-center justify-center gap-2">
                                            {getStatusBadge(video.status)}
                                            {video.progress && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {video.progress}%
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="p-1 text-center">
                                        <Checkbox
                                            checked={video.forKids || false}
                                            onCheckedChange={(checked) =>
                                                updateVideo(
                                                    video.id,
                                                    'forKids',
                                                    checked as boolean,
                                                )
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="p-1 text-center">
                                        <Checkbox
                                            checked={
                                                video.ageRestricted || false
                                            }
                                            onCheckedChange={(checked) =>
                                                updateVideo(
                                                    video.id,
                                                    'ageRestricted',
                                                    checked as boolean,
                                                )
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="p-1 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeVideo(video.id);
                                            }}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <BulkUploadModal
                isOpen={isBulkUploadOpen}
                onClose={() => setIsBulkUploadOpen(false)}
                videos={videos}
                onBulkUpload={handleBulkUpload}
            />
        </Card>
    );
}
