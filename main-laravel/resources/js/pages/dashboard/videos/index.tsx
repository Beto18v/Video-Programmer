import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
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
}

export default function VideosIndex({
    videos = [],
}: {
    videos?: Video[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Videos" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Videos</h1>
                        <p className="text-muted-foreground">Manage your uploaded videos</p>
                    </div>
                    <Button asChild>
                        <Link href="/videos/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Video
                        </Link>
                    </Button>
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
                                <CardTitle className="text-lg">{video.title}</CardTitle>
                                <CardDescription>{video.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <Badge variant={video.status === 'published' ? 'default' : 'secondary'}>
                                        {video.status}
                                    </Badge>
                                    <div className="flex gap-2">
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={`/videos/${video.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={`/videos/${video.id}/edit`}>
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
                        <p className="text-muted-foreground">No videos found</p>
                        <Button asChild className="mt-4">
                            <Link href="/videos/create">Create your first video</Link>
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}