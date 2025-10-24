import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

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
        title: 'Create',
        href: '/channels/create',
    },
];

export default function ChannelsCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Channel" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/channels">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Channels
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Create Channel</h1>
                        <p className="text-muted-foreground">Connect a new YouTube channel</p>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Channel Information</CardTitle>
                        <CardDescription>Enter the details to connect your YouTube channel</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="youtube_channel_id">YouTube Channel ID</Label>
                            <Input id="youtube_channel_id" name="youtube_channel_id" required />
                            <p className="text-sm text-muted-foreground">
                                You can find your channel ID in your YouTube channel URL or settings
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name">Channel Name</Label>
                            <Input id="name" name="name" required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="custom_url">Custom URL</Label>
                            <Input id="custom_url" name="custom_url" placeholder="youtube.com/c/YourChannel" />
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit">Connect Channel</Button>
                            <Button asChild variant="outline">
                                <Link href="/channels">Cancel</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}