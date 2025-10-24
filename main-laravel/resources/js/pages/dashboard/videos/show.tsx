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
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    Edit,
    Eye,
    MessageSquare,
    ThumbsUp,
} from 'lucide-react';
import { useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Videos',
        href: '/videos',
    },
    {
        title: 'Show',
        href: '/videos/show',
    },
];

interface Video {
    id: number;
    title: string;
    description: string;
    status: string;
    privacy: string;
    published_at: string | null;
    thumbnail_url: string | null;
    file_path: string | null;
    duration: number | null;
    view_count: number;
    like_count: number;
    comment_count: number;
    tags: string[];
    made_for_kids: boolean;
    channel: {
        name: string;
    };
}

export default function VideosShow({ video }: { video: Video }) {
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['video'] });
        }, 300000); // 5 minutes

        return () => clearInterval(interval);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={video.title} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/videos">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Videos
                        </Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href={`/videos/${video.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                {video.thumbnail_url && (
                                    <img
                                        src={video.thumbnail_url}
                                        alt={video.title}
                                        className="h-64 w-full rounded-md object-cover"
                                    />
                                )}
                                <CardTitle className="text-2xl">
                                    {video.title}
                                </CardTitle>
                                <CardDescription>
                                    {video.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 flex flex-wrap gap-2">
                                    <Badge variant="outline">
                                        {video.channel.name}
                                    </Badge>
                                    <Badge
                                        variant={
                                            video.status === 'published'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {video.status}
                                    </Badge>
                                    <Badge variant="outline">
                                        {video.privacy}
                                    </Badge>
                                    {video.made_for_kids && (
                                        <Badge variant="outline">
                                            Made for kids
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    {video.published_at && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            Published{' '}
                                            {new Date(
                                                video.published_at,
                                            ).toLocaleDateString()}
                                        </div>
                                    )}
                                    {video.duration && (
                                        <div>
                                            Duration:{' '}
                                            {Math.floor(video.duration / 60)}:
                                            {(video.duration % 60)
                                                .toString()
                                                .padStart(2, '0')}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex gap-6">
                                    <div className="flex items-center gap-1">
                                        <Eye className="h-4 w-4" />
                                        <span className="text-sm">
                                            {video.view_count.toLocaleString()}{' '}
                                            views
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <ThumbsUp className="h-4 w-4" />
                                        <span className="text-sm">
                                            {video.like_count.toLocaleString()}{' '}
                                            likes
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="text-sm">
                                            {video.comment_count.toLocaleString()}{' '}
                                            comments
                                        </span>
                                    </div>
                                </div>

                                {video.tags.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="mb-2 text-sm font-medium">
                                            Tags
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                            {video.tags.map((tag, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button className="w-full" variant="outline">
                                    Schedule Upload
                                </Button>
                                <Button className="w-full" variant="outline">
                                    View on YouTube
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="destructive"
                                >
                                    Delete Video
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
