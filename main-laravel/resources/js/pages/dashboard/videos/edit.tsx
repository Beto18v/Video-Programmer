import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';

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
        title: 'Edit',
        href: '/videos/edit',
    },
];

interface Video {
    id: number;
    title: string;
    description: string;
    channel_id: number;
    tags: string[];
    privacy: string;
    made_for_kids: boolean;
}

export default function VideosEdit({
    video,
}: {
    video: Video;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Video" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/videos">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Videos
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Edit Video</h1>
                        <p className="text-muted-foreground">Update video information</p>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Video Information</CardTitle>
                        <CardDescription>Update the details for your video</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" defaultValue={video.title} required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                defaultValue={video.description}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="channel_id">Channel</Label>
                            <Select name="channel_id" defaultValue={video.channel_id.toString()}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a channel" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Channels will be populated from props */}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="tags">Tags (comma separated)</Label>
                            <Input id="tags" name="tags" defaultValue={video.tags.join(', ')} placeholder="tag1, tag2, tag3" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="privacy">Privacy</Label>
                            <Select name="privacy" defaultValue={video.privacy}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="private">Private</SelectItem>
                                    <SelectItem value="unlisted">Unlisted</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox id="made_for_kids" name="made_for_kids" defaultChecked={video.made_for_kids} />
                            <Label htmlFor="made_for_kids">Made for kids</Label>
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit">Update Video</Button>
                            <Button asChild variant="outline">
                                <Link href="/videos">Cancel</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}