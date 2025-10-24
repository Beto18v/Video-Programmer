import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Edit,
    XCircle,
} from 'lucide-react';

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
        title: 'Show',
        href: '/video-schedules/show',
    },
];

interface VideoSchedule {
    id: number;
    scheduled_at: string;
    status: string;
    action: string;
    action_parameters: Record<string, unknown>;
    executed_at: string | null;
    error_message: string | null;
    execution_log: unknown[];
    retry_count: number;
    max_retries: number;
    next_retry_at: string | null;
    video: {
        title: string;
        thumbnail_url: string | null;
    } | null;
}

export default function VideoSchedulesShow({
    videoSchedule,
}: {
    videoSchedule: VideoSchedule;
}) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'failed':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'pending':
                return <Clock className="h-5 w-5 text-yellow-500" />;
            default:
                return <AlertCircle className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={`Schedule for ${videoSchedule.video?.title || 'Unknown Video'}`}
            />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/video-schedules">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Schedules
                        </Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link
                            href={`/video-schedules/${videoSchedule.id}/edit`}
                        >
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
                                    {videoSchedule.video?.thumbnail_url ? (
                                        <img
                                            src={
                                                videoSchedule.video
                                                    .thumbnail_url
                                            }
                                            alt={videoSchedule.video.title}
                                            className="h-16 w-16 rounded object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                                            <Calendar className="h-8 w-8" />
                                        </div>
                                    )}
                                    <div>
                                        <CardTitle className="text-xl">
                                            {videoSchedule.video?.title ||
                                                'Video not found'}
                                        </CardTitle>
                                        <CardDescription>
                                            Video Schedule #{videoSchedule.id}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <h4 className="mb-2 font-medium">
                                            Schedule Details
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>
                                                    Scheduled for:{' '}
                                                    {new Date(
                                                        videoSchedule.scheduled_at,
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span>Action: </span>
                                                <Badge variant="outline">
                                                    {videoSchedule.action}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(
                                                    videoSchedule.status,
                                                )}
                                                <span>Status: </span>
                                                <Badge
                                                    variant={
                                                        videoSchedule.status ===
                                                        'completed'
                                                            ? 'default'
                                                            : videoSchedule.status ===
                                                                'failed'
                                                              ? 'destructive'
                                                              : videoSchedule.status ===
                                                                  'pending'
                                                                ? 'secondary'
                                                                : 'outline'
                                                    }
                                                >
                                                    {videoSchedule.status}
                                                </Badge>
                                            </div>
                                            {videoSchedule.executed_at && (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4" />
                                                    <span>
                                                        Executed:{' '}
                                                        {new Date(
                                                            videoSchedule.executed_at,
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="mb-2 font-medium">
                                            Retry Information
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                Retries:{' '}
                                                {videoSchedule.retry_count} /{' '}
                                                {videoSchedule.max_retries}
                                            </div>
                                            {videoSchedule.next_retry_at && (
                                                <div>
                                                    Next retry:{' '}
                                                    {new Date(
                                                        videoSchedule.next_retry_at,
                                                    ).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {videoSchedule.action_parameters &&
                                    Object.keys(videoSchedule.action_parameters)
                                        .length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="mb-2 font-medium">
                                                Action Parameters
                                            </h4>
                                            <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
                                                {JSON.stringify(
                                                    videoSchedule.action_parameters,
                                                    null,
                                                    2,
                                                )}
                                            </pre>
                                        </div>
                                    )}

                                {videoSchedule.error_message && (
                                    <div className="mt-4">
                                        <h4 className="mb-2 font-medium text-red-600">
                                            Error Message
                                        </h4>
                                        <div className="rounded border border-red-200 bg-red-50 p-2 text-sm dark:border-red-800 dark:bg-red-950">
                                            {videoSchedule.error_message}
                                        </div>
                                    </div>
                                )}

                                {videoSchedule.execution_log &&
                                    videoSchedule.execution_log.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="mb-2 font-medium">
                                                Execution Log
                                            </h4>
                                            <div className="space-y-1">
                                                {videoSchedule.execution_log.map(
                                                    (log, index) => (
                                                        <div
                                                            key={index}
                                                            className="rounded bg-muted p-2 text-xs"
                                                        >
                                                            {typeof log ===
                                                            'string'
                                                                ? log
                                                                : JSON.stringify(
                                                                      log,
                                                                  )}
                                                        </div>
                                                    ),
                                                )}
                                            </div>
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
                                {videoSchedule.status === 'pending' && (
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                    >
                                        Cancel Schedule
                                    </Button>
                                )}
                                {videoSchedule.status === 'failed' &&
                                    videoSchedule.retry_count <
                                        videoSchedule.max_retries && (
                                        <Button
                                            className="w-full"
                                            variant="outline"
                                        >
                                            Retry Now
                                        </Button>
                                    )}
                                <Button className="w-full" variant="outline">
                                    View Video
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="destructive"
                                >
                                    Delete Schedule
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
