import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Videos',
        href: '/videos',
    },
];

interface Video {
    id: number;
    title: string;
    description: string;
    status: string;
    published_at: string | null;
    thumbnail_url: string | null;
    view_count: number;
    like_count: number;
    comment_count: number;
    channel: {
        name: string;
    };
}

function translateStatus(status: string): string {
    switch (status) {
        case 'published':
            return 'Publicado';
        case 'draft':
            return 'Borrador';
        case 'scheduled':
            return 'Programado';
        default:
            return status;
    }
}

function formatDate(dateString: string | null): string {
    if (!dateString) return 'No publicado';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

interface Channel {
    id: number;
    name: string;
    importing: boolean;
    video_count: number;
}

export default function VideosIndex({
    videos = [],
    channels = [],
    filters = {},
}: {
    videos?: Video[];
    channels?: Channel[];
    filters?: { channel_id?: string };
}) {
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Polling para actualizar si hay importaciones en progreso
    useEffect(() => {
        if (channels.some((channel) => channel.importing)) {
            toast.loading('Cargando videos del canal, por favor espera...');
            const interval = setInterval(() => {
                router.reload({ only: ['channels', 'videos'] });
            }, 5000); // Cada 5 segundos

            return () => clearInterval(interval);
        } else {
            toast.dismiss();
            if (
                channels.some(
                    (channel) => !channel.importing && channel.video_count > 0,
                )
            ) {
                toast.success('Videos subidos correctamente.');
            }
        }
    }, [channels]);

    const openModal = (video: Video) => {
        setSelectedVideo(video);
        setIsModalOpen(true);
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vídeos" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Vídeos</h1>
                        <p className="text-muted-foreground">
                            Gestiona tus vídeos subidos
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Select
                            value={
                                filters.channel_id
                                    ? filters.channel_id.toString()
                                    : 'all'
                            }
                            onValueChange={(value) => {
                                router.get(
                                    '/videos',
                                    value === 'all'
                                        ? {}
                                        : { channel_id: value },
                                );
                            }}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Todos los canales" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Todos los canales
                                </SelectItem>
                                {channels.map((channel) => (
                                    <SelectItem
                                        key={channel.id}
                                        value={channel.id.toString()}
                                    >
                                        {channel.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button asChild>
                            <Link href="/videos/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar Vídeo
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {videos.map((video) => (
                        <Card key={video.id}>
                            <CardHeader>
                                {video.thumbnail_url && (
                                    <img
                                        src={video.thumbnail_url}
                                        alt={video.title}
                                        className="h-32 w-full rounded-md object-cover"
                                    />
                                )}
                                <CardTitle className="text-lg">
                                    {video.title}
                                </CardTitle>
                                <CardDescription>
                                    {video.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>📺</span>
                                        <span>{video.channel.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>🎬</span>
                                        <span className="font-medium">
                                            {video.title}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>📅</span>
                                        <span>
                                            {formatDate(video.published_at)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            <span>👁️</span>
                                            <span>
                                                {video.view_count.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span>👍</span>
                                            <span>
                                                {video.like_count.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span>💬</span>
                                            <span>
                                                {video.comment_count.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <Badge
                                            variant={
                                                video.status === 'published'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {translateStatus(video.status)}
                                        </Badge>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openModal(video)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Link
                                                    href={`/videos/${video.id}/edit`}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button size="sm" variant="outline">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Video Detail Modal */}
                <Dialog
                    open={isModalOpen}
                    onOpenChange={(open) => {
                        setIsModalOpen(open);
                        if (!open) setSelectedVideo(null);
                    }}
                >
                    <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Detalle del Video</DialogTitle>
                            <DialogDescription>
                                Información completa del video seleccionado
                            </DialogDescription>
                        </DialogHeader>
                        {selectedVideo && (
                            <div className="space-y-6">
                                {selectedVideo.thumbnail_url && (
                                    <img
                                        src={selectedVideo.thumbnail_url}
                                        alt={selectedVideo.title}
                                        className="h-64 w-full rounded-md object-cover"
                                    />
                                )}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-xl font-semibold">
                                            {selectedVideo.title}
                                        </h3>
                                        <p className="mt-2 text-muted-foreground">
                                            {selectedVideo.description}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2">
                                            <span>📺</span>
                                            <span className="font-medium">
                                                Canal:
                                            </span>
                                            <span>
                                                {selectedVideo.channel.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>📅</span>
                                            <span className="font-medium">
                                                Publicado:
                                            </span>
                                            <span>
                                                {formatDate(
                                                    selectedVideo.published_at,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>👁️</span>
                                            <span className="font-medium">
                                                Vistas:
                                            </span>
                                            <span>
                                                {selectedVideo.view_count.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>👍</span>
                                            <span className="font-medium">
                                                Likes:
                                            </span>
                                            <span>
                                                {selectedVideo.like_count.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>💬</span>
                                            <span className="font-medium">
                                                Comentarios:
                                            </span>
                                            <span>
                                                {selectedVideo.comment_count.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    selectedVideo.status ===
                                                    'published'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {translateStatus(
                                                    selectedVideo.status,
                                                )}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {videos.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground">
                            No se encontraron vídeos
                        </p>
                        <div className="mt-4 flex gap-2">
                            <Button asChild>
                                <Link href="/videos/create">
                                    Crea tu primer vídeo
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
