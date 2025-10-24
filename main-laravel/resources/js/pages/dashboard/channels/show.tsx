import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Users, Video, Eye, ExternalLink } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Channels',
        href: '/channels',
    },
    {
        title: 'Show',
        href: '/channels/show',
    },
];

interface Channel {
    id: number;
    youtube_channel_id: string;
    name: string;
    custom_url: string;
    description: string;
    avatar_url: string | null;
    banner_url: string | null;
    subscriber_count: number;
    video_count: number;
    view_count: number;
    status: string;
    connected_at: string | null;
    last_sync_at: string | null;
}

export default function ChannelsShow({
    channel,
}: {
    channel: Channel;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={channel.name} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/channels">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Channels
                        </Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href={`/channels/${channel.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    {channel.avatar_url ? (
                                        <img
                                            src={channel.avatar_url}
                                            alt={channel.name}
                                            className="h-20 w-20 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                                            <Users className="h-10 w-10" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <CardTitle className="text-2xl">{channel.name}</CardTitle>
                                        <CardDescription className="mt-2">{channel.description}</CardDescription>
                                        {channel.custom_url && (
                                            <a
                                                href={`https://youtube.com/${channel.custom_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                {channel.custom_url}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-2xl font-bold">{channel.subscriber_count.toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Subscribers</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Video className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-2xl font-bold">{channel.video_count.toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Videos</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-2xl font-bold">{channel.view_count.toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Views</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                    <Badge variant={channel.status === 'connected' ? 'default' : 'secondary'}>
                                        {channel.status}
                                    </Badge>
                                    {channel.connected_at && (
                                        <span className="text-sm text-muted-foreground">
                                            Connected {new Date(channel.connected_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                {channel.last_sync_at && (
                                    <div className="text-sm text-muted-foreground">
                                        Last synced: {new Date(channel.last_sync_at).toLocaleDateString()}
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
                                    Sync Channel Data
                                </Button>
                                <Button className="w-full" variant="outline">
                                    View on YouTube
                                </Button>
                                <Button className="w-full" variant="outline">
                                    Manage Credentials
                                </Button>
                                <Button className="w-full" variant="destructive">
                                    Disconnect Channel
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}