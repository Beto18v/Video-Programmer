import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

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
        title: 'Create',
        href: '/youtube-credentials/create',
    },
];

export default function YoutubeCredentialsCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create YouTube Credentials" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/youtube-credentials">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Credentials
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Create YouTube Credentials</h1>
                        <p className="text-muted-foreground">Add YouTube API credentials for a channel</p>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Credentials Information</CardTitle>
                        <CardDescription>Enter the OAuth credentials for YouTube API access</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="channel_id">Channel</Label>
                            <Select name="channel_id">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a channel" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Channels will be populated from props */}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="access_token">Access Token</Label>
                            <Input id="access_token" name="access_token" required />
                            <p className="text-sm text-muted-foreground">
                                The OAuth 2.0 access token for YouTube API
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="refresh_token">Refresh Token</Label>
                            <Input id="refresh_token" name="refresh_token" required />
                            <p className="text-sm text-muted-foreground">
                                The OAuth 2.0 refresh token for renewing access
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="expires_at">Expires At</Label>
                            <Input id="expires_at" name="expires_at" type="datetime-local" />
                            <p className="text-sm text-muted-foreground">
                                When the access token expires
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="scopes">Scopes (comma separated)</Label>
                            <Input
                                id="scopes"
                                name="scopes"
                                placeholder="https://www.googleapis.com/auth/youtube.upload,https://www.googleapis.com/auth/youtube"
                            />
                            <p className="text-sm text-muted-foreground">
                                The OAuth scopes granted to this token
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit">Create Credentials</Button>
                            <Button asChild variant="outline">
                                <Link href="/youtube-credentials">Cancel</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}