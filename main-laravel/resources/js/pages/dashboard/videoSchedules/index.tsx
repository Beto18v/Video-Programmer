import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, Calendar, Clock } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Video Schedules',
        href: '/video-schedules',
    },
];

interface VideoSchedule {
    id: number;
    scheduled_at: string;
    status: string;
    action: string;
    executed_at: string | null;
    error_message: string | null;
    retry_count: number;
    video: {
        title: string;
        thumbnail_url: string | null;
    };
}

export default function VideoSchedulesIndex({
    videoSchedules = [],
}: {
    videoSchedules?: VideoSchedule[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Video Schedules" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Video Schedules</h1>
                        <p className="text-muted-foreground">Manage scheduled video uploads and actions</p>
                    </div>
                    <Button asChild>
                        <Link href="/video-schedules/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Schedule
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {videoSchedules.map((schedule) => (
                        <Card key={schedule.id}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    {schedule.video.thumbnail_url ? (
                                        <img
                                            src={schedule.video.thumbnail_url}
                                            alt={schedule.video.title}
                                            className="h-12 w-12 rounded object-cover"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                                            <Calendar className="h-6 w-6" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-sm truncate">{schedule.video.title}</CardTitle>
                                        <CardDescription className="text-xs">
                                            {new Date(schedule.scheduled_at).toLocaleString()}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Action:</span>
                                        <Badge variant="outline">{schedule.action}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Status:</span>
                                        <Badge variant={
                                            schedule.status === 'completed' ? 'default' :
                                            schedule.status === 'failed' ? 'destructive' :
                                            schedule.status === 'pending' ? 'secondary' : 'outline'
                                        }>
                                            {schedule.status}
                                        </Badge>
                                    </div>
                                    {schedule.retry_count > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Retries:</span>
                                            <span className="text-sm">{schedule.retry_count}</span>
                                        </div>
                                    )}
                                    {schedule.executed_at && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            Executed {new Date(schedule.executed_at).toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={`/video-schedules/${schedule.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={`/video-schedules/${schedule.id}/edit`}>
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

                {videoSchedules.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground">No schedules found</p>
                        <Button asChild className="mt-4">
                            <Link href="/video-schedules/create">Create your first schedule</Link>
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}