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
import { Calendar, Clock, Edit, Eye, Plus, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Programaciones de Vídeos',
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
    } | null;
}

export default function VideoSchedulesIndex({
    videoSchedules = [],
}: {
    videoSchedules?: VideoSchedule[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Programaciones de Vídeos" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Programaciones de Vídeos
                        </h1>
                        <p className="text-muted-foreground">
                            Gestionar subidas y acciones programadas de vídeos
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/video-schedules/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar Programación
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {videoSchedules.map((schedule) => (
                        <Card key={schedule.id}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    {schedule.video?.thumbnail_url ? (
                                        <img
                                            src={schedule.video.thumbnail_url}
                                            alt={schedule.video.title}
                                            className="h-12 w-12 rounded object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                                            <Calendar className="h-6 w-6" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <CardTitle className="truncate text-sm">
                                            {schedule.video?.title ||
                                                'Vídeo no encontrado'}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {new Date(
                                                schedule.scheduled_at,
                                            ).toLocaleString()}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Acción:</span>
                                        <Badge variant="outline">
                                            {schedule.action}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Estado:</span>
                                        <Badge
                                            variant={
                                                schedule.status === 'completed'
                                                    ? 'default'
                                                    : schedule.status ===
                                                        'failed'
                                                      ? 'destructive'
                                                      : schedule.status ===
                                                          'pending'
                                                        ? 'secondary'
                                                        : 'outline'
                                            }
                                        >
                                            {schedule.status}
                                        </Badge>
                                    </div>
                                    {schedule.retry_count > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">
                                                Reintentos:
                                            </span>
                                            <span className="text-sm">
                                                {schedule.retry_count}
                                            </span>
                                        </div>
                                    )}
                                    {schedule.executed_at && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            Ejecutado{' '}
                                            {new Date(
                                                schedule.executed_at,
                                            ).toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button asChild size="sm" variant="outline">
                                        <Link
                                            href={`/video-schedules/${schedule.id}`}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" variant="outline">
                                        <Link
                                            href={`/video-schedules/${schedule.id}/edit`}
                                        >
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
                        <p className="text-muted-foreground">
                            No se encontraron programaciones
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/video-schedules/create">
                                Crea tu primera programación
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
