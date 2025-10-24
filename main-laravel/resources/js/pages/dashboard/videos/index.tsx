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
import { Head, Link } from '@inertiajs/react';
import { Edit, Eye, Plus, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vídeos',
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

export default function VideosIndex({ videos = [] }: { videos?: Video[] }) {
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
                        <Button asChild>
                            <Link href="/sheets">Conectar con Sheets</Link>
                        </Button>
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
                                <div className="flex items-center justify-between">
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
                                            asChild
                                            size="sm"
                                            variant="outline"
                                        >
                                            <Link href={`/videos/${video.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
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
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {videos.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground">
                            No se encontraron vídeos
                        </p>
                        <div className="mt-4 flex gap-2">
                            <Button asChild>
                                <Link href="/channels">
                                    Conectar una cuenta
                                </Link>
                            </Button>
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
