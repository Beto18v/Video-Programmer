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
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, ExternalLink, Eye, Users, Video } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inicio',
        href: '/dashboard',
    },
    {
        title: 'Canales',
        href: '/channels',
    },
    {
        title: 'Mostrar',
        href: '/channels/show',
    },
];

interface Channel {
    id: number;
    youtube_channel_id: string;
    name: string;
    custom_url: string;
    description: string;
    avatar_url: string | null;
    banner_url: string | null;
    subscriber_count: number;
    video_count: number;
    view_count: number;
    status: string;
    connected_at: string | null;
    last_sync_at: string | null;
}

export default function ChannelsShow({ channel }: { channel: Channel }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={channel.name} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/channels">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a Canales
                        </Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href={`/channels/${channel.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    {channel.avatar_url ? (
                                        <img
                                            src={channel.avatar_url}
                                            alt={channel.name}
                                            className="h-20 w-20 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                                            <Users className="h-10 w-10" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <CardTitle className="text-2xl">
                                            {channel.name}
                                        </CardTitle>
                                        <CardDescription className="mt-2">
                                            {channel.description}
                                        </CardDescription>
                                        {channel.custom_url && (
                                            <a
                                                href={`https://youtube.com/${channel.custom_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                {channel.custom_url}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="mb-1 flex items-center justify-center gap-1">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-2xl font-bold">
                                                {channel.subscriber_count.toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Suscriptores
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <div className="mb-1 flex items-center justify-center gap-1">
                                            <Video className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-2xl font-bold">
                                                {channel.video_count.toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Vídeos
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <div className="mb-1 flex items-center justify-center gap-1">
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-2xl font-bold">
                                                {channel.view_count.toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Vistas
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-4 flex items-center gap-2">
                                    <Badge
                                        variant={
                                            channel.status === 'active'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {channel.status}
                                    </Badge>
                                    {channel.connected_at && (
                                        <span className="text-sm text-muted-foreground">
                                            Connected{' '}
                                            {new Date(
                                                channel.connected_at,
                                            ).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                {channel.last_sync_at && (
                                    <div className="text-sm text-muted-foreground">
                                        Última sincronización:{' '}
                                        {new Date(
                                            channel.last_sync_at,
                                        ).toLocaleDateString()}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Acciones</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    className="w-full"
                                    variant="destructive"
                                    onClick={() =>
                                        confirm(
                                            '¿Estás seguro de que quieres desconectar este canal?',
                                        ) &&
                                        router.delete(`/channels/${channel.id}`)
                                    }
                                >
                                    Desconectar Canal
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
