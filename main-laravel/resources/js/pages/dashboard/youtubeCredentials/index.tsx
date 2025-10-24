import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, Key } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'YouTube Credentials',
        href: '/youtube-credentials',
    },
];

interface YoutubeCredential {
    id: number;
    status: string;
    expires_at: string | null;
    last_refreshed_at: string | null;
    refresh_count: number;
    scopes: string[];
    channel: {
        name: string;
        avatar_url: string | null;
    };
}

export default function YoutubeCredentialsIndex({
    youtubeCredentials = [],
}: {
    youtubeCredentials?: YoutubeCredential[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="YouTube Credentials" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">YouTube Credentials</h1>
                        <p className="text-muted-foreground">Manage YouTube API credentials for your channels</p>
                    </div>
                    <Button asChild>
                        <Link href="/youtube-credentials/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Credentials
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {youtubeCredentials.map((credential) => (
                        <Card key={credential.id}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    {credential.channel.avatar_url ? (
                                        <img
                                            src={credential.channel.avatar_url}
                                            alt={credential.channel.name}
                                            className="h-12 w-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                            <Key className="h-6 w-6" />
                                        </div>
                                    )}
                                    <div>
                                        <CardTitle className="text-lg">{credential.channel.name}</CardTitle>
                                        <CardDescription>YouTube Credentials</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Status:</span>
                                        <Badge variant={credential.status === 'active' ? 'default' : 'secondary'}>
                                            {credential.status}
                                        </Badge>
                                    </div>
                                    {credential.expires_at && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Expires:</span>
                                            <span className="text-sm">{new Date(credential.expires_at).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {credential.last_refreshed_at && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Last refresh:</span>
                                            <span className="text-sm">{new Date(credential.last_refreshed_at).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Refresh count:</span>
                                        <span className="text-sm">{credential.refresh_count}</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="text-sm font-medium mb-2">Scopes</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {credential.scopes.map((scope, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {scope.split('/').pop()}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={`/youtube-credentials/${credential.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={`/youtube-credentials/${credential.id}/edit`}>
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {youtubeCredentials.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground">No credentials found</p>
                        <Button asChild className="mt-4">
                            <Link href="/youtube-credentials/create">Add your first credentials</Link>
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}