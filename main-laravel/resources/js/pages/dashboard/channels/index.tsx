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
import { Edit, Eye, Plus, Trash2, Tv } from 'lucide-react';
import { useEffect } from 'react';
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
}

export default function ChannelsIndex({
    channels = [],
    flash,
}: {
    channels?: Channel[];
    flash?: { success?: string; error?: string };
}) {
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

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
                    <Button asChild>
                        <a href="/auth/google">
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar Canal
                        </a>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {channels.map((channel) => (
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
                                    <div>
                                        <CardTitle className="text-lg">
                                            {channel.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {channel.description}
                                        </CardDescription>
                                    </div>
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

                {channels.length === 0 && (
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
