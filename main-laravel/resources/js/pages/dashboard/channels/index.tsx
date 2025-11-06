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
import { Edit, Eye, Plus, RefreshCw, Trash2, Tv } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Canales',
        href: '/channels',
    },
];

interface Channel {
    id: number;
    name: string;
    description: string;
    status: string;
    subscriber_count: number;
    video_count: number;
    view_count: number;
    avatar_url: string | null;
    last_sync_at: string | null;
}

export default function ChannelsIndex({
    channels = [],
    flash,
}: {
    channels?: Channel[];
    flash?: { success?: string; error?: string };
}) {
    const [channelData, setChannelData] = useState<Channel[]>(channels);
    const [syncingChannels, setSyncingChannels] = useState<Set<number>>(
        new Set(),
    );
    const [syncingAll, setSyncingAll] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const syncChannel = async (channelId: number) => {
        setSyncingChannels((prev) => new Set(prev).add(channelId));

        try {
            const response = await fetch(`/channels/${channelId}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
            });

            const data = await response.json();

            if (data.success) {
                // Update the channel in the local state
                setChannelData((prev) =>
                    prev.map((channel) =>
                        channel.id === channelId
                            ? { ...channel, ...data.channel }
                            : channel,
                    ),
                );
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch {
            toast.error('Error al sincronizar el canal');
        } finally {
            setSyncingChannels((prev) => {
                const newSet = new Set(prev);
                newSet.delete(channelId);
                return newSet;
            });
        }
    };

    const syncAllChannels = async () => {
        setSyncingAll(true);

        try {
            const response = await fetch('/channels/sync-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                // Reload the page to get fresh data after a short delay
                setTimeout(() => {
                    router.reload();
                }, 2000);
            } else {
                toast.error(data.message);
            }
        } catch {
            toast.error('Error al sincronizar los canales');
        } finally {
            setSyncingAll(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Canales" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Canales</h1>
                        <p className="text-muted-foreground">
                            Gestiona tus canales de YouTube conectados
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={syncAllChannels}
                            disabled={syncingAll}
                            variant="outline"
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${syncingAll ? 'animate-spin' : ''}`}
                            />
                            {syncingAll
                                ? 'Sincronizando...'
                                : 'Sincronizar Todo'}
                        </Button>
                        <Button asChild>
                            <a href="/auth/google">
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar Canal
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {channelData.map((channel) => (
                        <Card key={channel.id}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    {channel.avatar_url ? (
                                        <img
                                            src={channel.avatar_url}
                                            alt={channel.name}
                                            className="h-12 w-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                            <Tv className="h-6 w-6" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">
                                            {channel.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {channel.description}
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={() => syncChannel(channel.id)}
                                        disabled={syncingChannels.has(
                                            channel.id,
                                        )}
                                        size="sm"
                                        variant="ghost"
                                        className="shrink-0"
                                    >
                                        <RefreshCw
                                            className={`h-4 w-4 ${syncingChannels.has(channel.id) ? 'animate-spin' : ''}`}
                                        />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Suscriptores:</span>
                                        <span>
                                            {channel.subscriber_count.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Vídeos:</span>
                                        <span>
                                            {channel.video_count.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Vistas:</span>
                                        <span>
                                            {channel.view_count.toLocaleString()}
                                        </span>
                                    </div>
                                    {channel.last_sync_at && (
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Última sincronización:</span>
                                            <span>
                                                {new Date(
                                                    channel.last_sync_at,
                                                ).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <Badge
                                        variant={
                                            channel.status === 'active'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {channel.status}
                                    </Badge>
                                    <div className="flex gap-2">
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                        >
                                            <Link
                                                href={`/channels/${channel.id}`}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                        >
                                            <Link
                                                href={`/channels/${channel.id}/edit`}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {channelData.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground">
                            No se encontraron canales
                        </p>
                        <Button asChild className="mt-4">
                            <a href="/auth/google">Conecta tu primer canal</a>
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
