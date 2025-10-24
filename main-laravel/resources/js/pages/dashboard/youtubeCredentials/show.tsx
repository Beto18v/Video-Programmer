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
import { ArrowLeft, Clock, Edit, Key, RefreshCw, Shield } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inicio',
        href: '/dashboard',
    },
    {
        title: 'Credenciales de YouTube',
        href: '/youtube-credentials',
    },
    {
        title: 'Mostrar',
        href: '/youtube-credentials/show',
    },
];

interface YoutubeCredential {
    id: number;
    status: string;
    expires_at: string | null;
    last_refreshed_at: string | null;
    refresh_count: number;
    scopes: string[];
    token_metadata: Record<string, unknown>;
    channel: {
        name: string;
        avatar_url: string | null;
    } | null;
}

export default function YoutubeCredentialsShow({
    youtubeCredential,
}: {
    youtubeCredential: YoutubeCredential;
}) {
    const isExpired =
        youtubeCredential.expires_at &&
        new Date(youtubeCredential.expires_at) < new Date();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={`Credenciales para ${youtubeCredential.channel?.name || 'Canal Desconocido'}`}
            />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/youtube-credentials">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a Credenciales
                        </Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link
                            href={`/youtube-credentials/${youtubeCredential.id}/edit`}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    {youtubeCredential.channel?.avatar_url ? (
                                        <img
                                            src={
                                                youtubeCredential.channel
                                                    .avatar_url
                                            }
                                            alt={youtubeCredential.channel.name}
                                            className="h-16 w-16 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                            <Key className="h-8 w-8" />
                                        </div>
                                    )}
                                    <div>
                                        <CardTitle className="text-xl">
                                            {youtubeCredential.channel?.name ||
                                                'Canal no encontrado'}
                                        </CardTitle>
                                        <CardDescription>
                                            Credenciales de la API de YouTube
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <h4 className="mb-2 font-medium">
                                            Estado del Token
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Shield
                                                    className={`h-4 w-4 ${youtubeCredential.status === 'active' ? 'text-green-500' : 'text-red-500'}`}
                                                />
                                                <span>Estado: </span>
                                                <Badge
                                                    variant={
                                                        youtubeCredential.status ===
                                                        'active'
                                                            ? 'default'
                                                            : 'destructive'
                                                    }
                                                >
                                                    {youtubeCredential.status}
                                                </Badge>
                                            </div>
                                            {youtubeCredential.expires_at && (
                                                <div className="flex items-center gap-2">
                                                    <Clock
                                                        className={`h-4 w-4 ${isExpired ? 'text-red-500' : 'text-green-500'}`}
                                                    />
                                                    <span>
                                                        Expira:{' '}
                                                        {new Date(
                                                            youtubeCredential.expires_at,
                                                        ).toLocaleString()}
                                                    </span>
                                                    {isExpired && (
                                                        <Badge variant="destructive">
                                                            Expirado
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                            {youtubeCredential.last_refreshed_at && (
                                                <div className="flex items-center gap-2">
                                                    <RefreshCw className="h-4 w-4" />
                                                    <span>
                                                        Última actualización:{' '}
                                                        {new Date(
                                                            youtubeCredential.last_refreshed_at,
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                Refresh count: Conteo de
                                                actualizaciones:{' '}
                                                {
                                                    youtubeCredential.refresh_count
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="mb-2 font-medium">
                                            Alcances
                                        </h4>
                                        <div className="space-y-1">
                                            {youtubeCredential.scopes.map(
                                                (scope, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="outline"
                                                        className="block w-fit text-xs"
                                                    >
                                                        {scope}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {youtubeCredential.token_metadata &&
                                    Object.keys(
                                        youtubeCredential.token_metadata,
                                    ).length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="mb-2 font-medium">
                                                Metadatos del Token
                                            </h4>
                                            <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
                                                {JSON.stringify(
                                                    youtubeCredential.token_metadata,
                                                    null,
                                                    2,
                                                )}
                                            </pre>
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
                                <Button className="w-full" variant="outline">
                                    Actualizar Token
                                </Button>
                                <Button className="w-full" variant="outline">
                                    Probar Acceso a la API
                                </Button>
                                <Button className="w-full" variant="outline">
                                    Ver Canal
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="destructive"
                                >
                                    Revocar Credenciales
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
