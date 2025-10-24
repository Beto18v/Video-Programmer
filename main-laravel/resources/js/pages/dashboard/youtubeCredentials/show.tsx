import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Key, Clock, RefreshCw, Shield } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'YouTube Credentials',
        href: '/youtube-credentials',
    },
    {
        title: 'Show',
        href: '/youtube-credentials/show',
    },
];

interface YoutubeCredential {
    id: number;
    status: string;
    expires_at: string | null;
    last_refreshed_at: string | null;
    refresh_count: number;
    scopes: string[];
    token_metadata: Record<string, unknown>;
    channel: {
        name: string;
        avatar_url: string | null;
    };
}

export default function YoutubeCredentialsShow({
    youtubeCredential,
}: {
    youtubeCredential: YoutubeCredential;
}) {
    const isExpired = youtubeCredential.expires_at && new Date(youtubeCredential.expires_at) < new Date();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Credentials for ${youtubeCredential.channel.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/youtube-credentials">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Credentials
                        </Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href={`/youtube-credentials/${youtubeCredential.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    {youtubeCredential.channel.avatar_url ? (
                                        <img
                                            src={youtubeCredential.channel.avatar_url}
                                            alt={youtubeCredential.channel.name}
                                            className="h-16 w-16 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                            <Key className="h-8 w-8" />
                                        </div>
                                    )}
                                    <div>
                                        <CardTitle className="text-xl">{youtubeCredential.channel.name}</CardTitle>
                                        <CardDescription>YouTube API Credentials</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <h4 className="font-medium mb-2">Token Status</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Shield className={`h-4 w-4 ${youtubeCredential.status === 'active' ? 'text-green-500' : 'text-red-500'}`} />
                                                <span>Status: </span>
                                                <Badge variant={youtubeCredential.status === 'active' ? 'default' : 'destructive'}>
                                                    {youtubeCredential.status}
                                                </Badge>
                                            </div>
                                            {youtubeCredential.expires_at && (
                                                <div className="flex items-center gap-2">
                                                    <Clock className={`h-4 w-4 ${isExpired ? 'text-red-500' : 'text-green-500'}`} />
                                                    <span>Expires: {new Date(youtubeCredential.expires_at).toLocaleString()}</span>
                                                    {isExpired && <Badge variant="destructive">Expired</Badge>}
                                                </div>
                                            )}
                                            {youtubeCredential.last_refreshed_at && (
                                                <div className="flex items-center gap-2">
                                                    <RefreshCw className="h-4 w-4" />
                                                    <span>Last refresh: {new Date(youtubeCredential.last_refreshed_at).toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div>Refresh count: {youtubeCredential.refresh_count}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-2">Scopes</h4>
                                        <div className="space-y-1">
                                            {youtubeCredential.scopes.map((scope, index) => (
                                                <Badge key={index} variant="outline" className="text-xs block w-fit">
                                                    {scope}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {youtubeCredential.token_metadata && Object.keys(youtubeCredential.token_metadata).length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="font-medium mb-2">Token Metadata</h4>
                                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                            {JSON.stringify(youtubeCredential.token_metadata, null, 2)}
                                        </pre>
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
                                    Refresh Token
                                </Button>
                                <Button className="w-full" variant="outline">
                                    Test API Access
                                </Button>
                                <Button className="w-full" variant="outline">
                                    View Channel
                                </Button>
                                <Button className="w-full" variant="destructive">
                                    Revoke Credentials
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}