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
        title: 'Create',
        href: '/videos/create',
    },
];

export default function VideosCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Video" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/videos">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Videos
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Create Video</h1>
                        <p className="text-muted-foreground">Add a new video to your collection</p>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Video Information</CardTitle>
                        <CardDescription>Fill in the details for your new video</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

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
                            <Label htmlFor="file">Video File</Label>
                            <Input id="file" name="file" type="file" accept="video/*" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="thumbnail">Thumbnail</Label>
                            <Input id="thumbnail" name="thumbnail" type="file" accept="image/*" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="tags">Tags (comma separated)</Label>
                            <Input id="tags" name="tags" placeholder="tag1, tag2, tag3" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="privacy">Privacy</Label>
                            <Select name="privacy" defaultValue="private">
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
                            <Checkbox id="made_for_kids" name="made_for_kids" />
                            <Label htmlFor="made_for_kids">Made for kids</Label>
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit">Create Video</Button>
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