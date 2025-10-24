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
        title: 'Edit',
        href: '/video-schedules/edit',
    },
];

interface VideoSchedule {
    id: number;
    video_id: number;
    scheduled_at: string;
    action: string;
    action_parameters: Record<string, unknown>;
    max_retries: number;
}

export default function VideoSchedulesEdit({
    videoSchedule,
}: {
    videoSchedule: VideoSchedule;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Video Schedule" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/video-schedules">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Schedules
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Edit Video Schedule</h1>
                        <p className="text-muted-foreground">Update schedule information</p>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Schedule Information</CardTitle>
                        <CardDescription>Update the schedule details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="video_id">Video</Label>
                            <Select name="video_id" defaultValue={videoSchedule.video_id.toString()}>
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
                            <Input
                                id="scheduled_at"
                                name="scheduled_at"
                                type="datetime-local"
                                defaultValue={new Date(videoSchedule.scheduled_at).toISOString().slice(0, 16)}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="action">Action</Label>
                            <Select name="action" defaultValue={videoSchedule.action}>
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
                                defaultValue={JSON.stringify(videoSchedule.action_parameters, null, 2)}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="max_retries">Max Retries</Label>
                            <Input
                                id="max_retries"
                                name="max_retries"
                                type="number"
                                defaultValue={videoSchedule.max_retries}
                                min="0"
                                max="10"
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit">Update Schedule</Button>
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