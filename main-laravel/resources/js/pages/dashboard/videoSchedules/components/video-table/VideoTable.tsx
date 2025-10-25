import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Calendar, Clock, Plus, Sheet, Trash2, Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { VIDEO_FIELDS, VideoUpload } from '../../types';
import FileUpload from './FileUpload';

interface VideoTableProps {
    videos: VideoUpload[];
    onVideosChange: (videos: VideoUpload[]) => void;
    onConnectSheet: () => void;
    isLoading?: boolean;
}

export default function VideoTable({
    videos,
    onVideosChange,
    onConnectSheet,
}: VideoTableProps) {
    const [editingCell, setEditingCell] = useState<{
        videoId: string;
        field: string;
    } | null>(null);

    const generateVideoId = useCallback(() => {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }, []);

    const addVideo = useCallback(() => {
        const newVideo: VideoUpload = {
            id: generateVideoId(),
            title: '',
            description: '',
            hashtags: '',
            scheduledAt: new Date().toISOString().slice(0, 16), // Format for datetime-local input
            status: 'pending',
        };
        onVideosChange([...videos, newVideo]);
    }, [videos, onVideosChange, generateVideoId]);

    const removeVideo = useCallback(
        (videoId: string) => {
            onVideosChange(videos.filter((video) => video.id !== videoId));
        },
        [videos, onVideosChange],
    );

    const updateVideo = useCallback(
        (
            videoId: string,
            field: keyof VideoUpload,
            value: string | File | number,
        ) => {
            onVideosChange(
                videos.map((video) =>
                    video.id === videoId ? { ...video, [field]: value } : video,
                ),
            );
        },
        [videos, onVideosChange],
    );

    const handleCellClick = useCallback((videoId: string, field: string) => {
        if (!['file', 'thumbnail'].includes(field)) {
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
                        <div className="w-48">
                            <FileUpload
                                label=""
                                accept="video/*"
                                onFileSelect={(files) => {
                                    if (files.length > 0) {
                                        updateVideo(video.id, 'file', files[0]);
                                        updateVideo(
                                            video.id,
                                            'fileName',
                                            files[0].name,
                                        );
                                    }
                                }}
                                currentFile={video.file}
                                currentFileName={video.fileName}
                                placeholder="MP4, MOV, AVI..."
                                maxSize={2000} // 2GB for videos
                                className="min-w-0"
                            />
                        </div>
                    );

                case 'thumbnail':
                    return (
                        <div className="w-32">
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
                                placeholder="JPG, PNG..."
                                maxSize={10} // 10MB for images
                                className="min-w-0"
                            />
                        </div>
                    );

                case 'title':
                    return isEditing ? (
                        <Input
                            value={video.title}
                            onChange={(e) =>
                                updateVideo(video.id, 'title', e.target.value)
                            }
                            onBlur={handleCellBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                    handleCellBlur();
                                }
                            }}
                            autoFocus
                            className="w-full min-w-[200px]"
                            placeholder="Título del video"
                        />
                    ) : (
                        <div
                            className="min-h-[40px] min-w-[200px] cursor-text rounded p-2 hover:bg-muted/50"
                            onClick={() => handleCellClick(video.id, field.key)}
                        >
                            {video.title || (
                                <span className="text-muted-foreground italic">
                                    Haz clic para agregar título
                                </span>
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

                case 'scheduledAt':
                    return (
                        <div className="min-w-[180px]">
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
                                className="w-full"
                            />
                        </div>
                    );

                default:
                    return null;
            }
        },
        [editingCell, updateVideo, handleCellClick, handleCellBlur],
    );

    const getStatusBadge = useCallback((status: VideoUpload['status']) => {
        const variants = {
            pending: 'secondary',
            uploading: 'default',
            scheduled: 'outline',
            completed: 'default',
            failed: 'destructive',
        } as const;

        return (
            <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
        );
    }, []);

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
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {VIDEO_FIELDS.map((field) => (
                                    <TableHead
                                        key={field.key}
                                        className="whitespace-nowrap"
                                    >
                                        {field.label}
                                        {field.required && (
                                            <span className="ml-1 text-destructive">
                                                *
                                            </span>
                                        )}
                                    </TableHead>
                                ))}
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-20">Acciones</TableHead>
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
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(video.status)}
                                            {video.progress && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {video.progress}%
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="p-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                removeVideo(video.id)
                                            }
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
        </Card>
    );
}
