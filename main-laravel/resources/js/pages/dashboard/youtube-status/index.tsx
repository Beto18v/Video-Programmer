import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle,
    ExternalLink,
    RefreshCw,
    Shield,
    XCircle,
    Youtube,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Estado de YouTube',
        href: '/youtube-status',
    },
];

interface Channel {
    id: number;
    name: string;
    youtube_channel_id: string;
    status: string;
    youtubeCredential?: {
        status: string;
        expires_at: string;
        last_refreshed_at?: string;
        refresh_count: number;
        scopes: string[];
    } | null;
}

interface YoutubeStatusProps {
    channels: Channel[];
    statistics: {
        total_channels: number;
        connected_channels: number;
        active_tokens: number;
        expired_tokens: number;
    };
    needsReauth: boolean;
    authUrl: string;
}

export default function YoutubeStatus({
    channels,
    statistics,
    needsReauth,
    authUrl,
}: YoutubeStatusProps) {
    const getChannelStatus = (channel: Channel) => {
        if (!channel.youtubeCredential) {
            return {
                status: 'no-credentials',
                text: 'Sin credenciales',
                variant: 'secondary' as const,
            };
        }

        const creds = channel.youtubeCredential;
        const isExpired = new Date(creds.expires_at) <= new Date();

        if (creds.status === 'active' && !isExpired) {
            return {
                status: 'active',
                text: 'Activo',
                variant: 'default' as const,
            };
        }

        if (isExpired || creds.status === 'expired') {
            return {
                status: 'expired',
                text: 'Expirado',
                variant: 'destructive' as const,
            };
        }

        return {
            status: 'inactive',
            text: 'Inactivo',
            variant: 'secondary' as const,
        };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Estado de YouTube" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold">
                        Estado de Conexión YouTube
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Verifica el estado de tus credenciales de YouTube
                    </p>
                </div>

                {/* Status Alert */}
                {needsReauth ? (
                    <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertTitle className="text-red-800">
                            ⚠️ Credenciales de YouTube expiradas
                        </AlertTitle>
                        <AlertDescription className="text-red-700">
                            <div className="space-y-2">
                                <p>
                                    Tus tokens de YouTube han expirado y
                                    necesitas volver a autenticar tu cuenta para
                                    que los videos se suban correctamente.
                                </p>
                                <Button asChild className="mt-2">
                                    <a href={authUrl}>
                                        <Youtube className="mr-2 h-4 w-4" />
                                        Volver a conectar YouTube
                                    </a>
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">
                            ✅ YouTube configurado correctamente
                        </AlertTitle>
                        <AlertDescription className="text-green-700">
                            Tus credenciales están activas y los videos se
                            subirán automáticamente.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Canales
                            </CardTitle>
                            <Youtube className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {statistics.total_channels}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Conectados
                            </CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {statistics.connected_channels}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tokens Activos
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {statistics.active_tokens}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tokens Expirados
                            </CardTitle>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {statistics.expired_tokens}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Channels List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Canales de YouTube</CardTitle>
                        <CardDescription>
                            Estado detallado de cada canal conectado
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {channels.map((channel) => {
                                const status = getChannelStatus(channel);
                                return (
                                    <div
                                        key={channel.id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <div className="space-y-1">
                                            <h3 className="font-medium">
                                                {channel.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                ID: {channel.youtube_channel_id}
                                            </p>
                                            {channel.youtubeCredential && (
                                                <div className="text-xs text-muted-foreground">
                                                    Última actualización:{' '}
                                                    {channel.youtubeCredential
                                                        .last_refreshed_at
                                                        ? new Date(
                                                              channel.youtubeCredential.last_refreshed_at,
                                                          ).toLocaleDateString()
                                                        : 'Nunca'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={status.variant}>
                                                {status.text}
                                            </Badge>
                                            {status.status === 'active' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <a
                                                        href={`https://youtube.com/channel/${channel.youtube_channel_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {channels.length === 0 && (
                                <div className="py-8 text-center">
                                    <Youtube className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-2 text-sm font-medium">
                                        No hay canales conectados
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Conecta tu primer canal de YouTube para
                                        comenzar.
                                    </p>
                                    <Button asChild className="mt-4">
                                        <a href={authUrl}>
                                            <Youtube className="mr-2 h-4 w-4" />
                                            Conectar YouTube
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Help Section */}
                {needsReauth && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="h-5 w-5" />
                                ¿Por qué necesito volver a autenticar?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-amber-600">
                                        Tokens expirados automáticamente
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Los tokens de YouTube expiran por
                                        seguridad. Cuando esto sucede, es
                                        necesario volver a autorizar el acceso.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium text-blue-600">
                                        Proceso simple de re-autenticación
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Solo necesitas hacer clic en "Volver a
                                        conectar YouTube" y autorizar nuevamente
                                        el acceso a tu cuenta.
                                    </p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="mb-2 font-medium">
                                    Pasos para solucionar:
                                </h4>
                                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                                    <li>
                                        Haz clic en "Volver a conectar YouTube"
                                    </li>
                                    <li>
                                        Inicia sesión en tu cuenta de
                                        Google/YouTube
                                    </li>
                                    <li>
                                        Autoriza los permisos de la aplicación
                                    </li>
                                    <li>
                                        ¡Listo! Tus videos volverán a subirse
                                        automáticamente
                                    </li>
                                </ol>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
