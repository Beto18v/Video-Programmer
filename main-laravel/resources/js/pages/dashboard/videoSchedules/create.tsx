import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Video Schedules',
        href: '/video-schedules',
    },
    {
        title: 'Create',
        href: '/video-schedules/create',
    },
];

export default function VideoSchedulesCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Video Schedule" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/video-schedules">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Schedules
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Create Video Schedule</h1>
                        <p className="text-muted-foreground">Schedule a video upload or action</p>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Schedule Information</CardTitle>
                        <CardDescription>Set up when and what action to perform on your video</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="video_id">Video</Label>
                            <Select name="video_id">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a video" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Videos will be populated from props */}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="scheduled_at">Scheduled Date & Time</Label>
                            <Input id="scheduled_at" name="scheduled_at" type="datetime-local" required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="action">Action</Label>
                            <Select name="action" defaultValue="upload">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="upload">Upload to YouTube</SelectItem>
                                    <SelectItem value="update">Update Video</SelectItem>
                                    <SelectItem value="delete">Delete Video</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="action_parameters">Action Parameters (JSON)</Label>
                            <textarea
                                id="action_parameters"
                                name="action_parameters"
                                rows={3}
                                placeholder='{"privacy": "public", "notify_subscribers": true}'
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="max_retries">Max Retries</Label>
                            <Input id="max_retries" name="max_retries" type="number" defaultValue="3" min="0" max="10" />
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit">Create Schedule</Button>
                            <Button asChild variant="outline">
                                <Link href="/video-schedules">Cancel</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}