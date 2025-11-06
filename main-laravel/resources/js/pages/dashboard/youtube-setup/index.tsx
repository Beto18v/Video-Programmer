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
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle,
    ExternalLink,
    Key,
    Settings,
    Shield,
    Youtube,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Configuración de YouTube',
        href: '/youtube-setup',
    },
];

interface YoutubeSetupProps {
    hasCredentials: boolean;
    credentialsStatus?: string;
    channels: Array<{
        id: number;
        name: string;
        platform: string;
        status: string;
    }>;
}

export default function YoutubeSetup({
    hasCredentials = false,
    credentialsStatus = 'inactive',
    channels = [],
}: YoutubeSetupProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración de YouTube" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold">
                        Configuración de YouTube
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Conecta tu canal de YouTube para subir videos
                        automáticamente
                    </p>
                    <div className="mt-4">
                        <Button asChild variant="outline">
                            <Link href="/dashboard/youtube-status">
                                <Shield className="mr-2 h-4 w-4" />
                                Verificar Estado de Credenciales
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Status Alert */}
                {!hasCredentials ? (
                    <Alert className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertTitle className="text-orange-800">
                            Credenciales de YouTube no configuradas
                        </AlertTitle>
                        <AlertDescription className="text-orange-700">
                            Para que los videos aparezcan en tu canal de
                            YouTube, necesitas configurar las credenciales de
                            acceso. Sin ellas, los videos se almacenan pero no
                            se suben automáticamente.
                        </AlertDescription>
                    </Alert>
                ) : credentialsStatus !== 'active' ? (
                    <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertTitle className="text-red-800">
                            Credenciales expiradas o inválidas
                        </AlertTitle>
                        <AlertDescription className="text-red-700">
                            Tus credenciales de YouTube necesitan ser renovadas.
                            Los videos no se subirán hasta que se resuelva esto.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">
                            YouTube configurado correctamente
                        </AlertTitle>
                        <AlertDescription className="text-green-700">
                            Tus videos se subirán automáticamente a YouTube
                            según la programación establecida.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Setup Instructions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Pasos para Configurar YouTube
                            </CardTitle>
                            <CardDescription>
                                Sigue estos pasos para conectar tu canal
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">
                                        1
                                    </div>
                                    <div>
                                        <h4 className="font-medium">
                                            Crear Proyecto en Google
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Ve a Google Cloud Console y crea un
                                            nuevo proyecto
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">
                                        2
                                    </div>
                                    <div>
                                        <h4 className="font-medium">
                                            Habilitar YouTube API
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Activa la YouTube Data API v3 en tu
                                            proyecto
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">
                                        3
                                    </div>
                                    <div>
                                        <h4 className="font-medium">
                                            Crear Credenciales OAuth
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Configura OAuth 2.0 para aplicación
                                            web
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">
                                        4
                                    </div>
                                    <div>
                                        <h4 className="font-medium">
                                            Conectar Canal
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Usa el botón de abajo para autorizar
                                            el acceso
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    asChild
                                    className="w-full"
                                    disabled={!hasCredentials}
                                >
                                    <Link href="/youtube-credentials/create">
                                        <Youtube className="mr-2 h-4 w-4" />
                                        {hasCredentials
                                            ? 'Renovar Credenciales'
                                            : 'Configurar YouTube'}
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Current Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                Estado Actual
                            </CardTitle>
                            <CardDescription>
                                Información sobre tu configuración actual
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">
                                        Credenciales YouTube:
                                    </span>
                                    <Badge
                                        variant={
                                            hasCredentials
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {hasCredentials
                                            ? 'Configuradas'
                                            : 'No configuradas'}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm">
                                        Estado de conexión:
                                    </span>
                                    <Badge
                                        variant={
                                            credentialsStatus === 'active'
                                                ? 'default'
                                                : credentialsStatus ===
                                                    'expired'
                                                  ? 'destructive'
                                                  : 'secondary'
                                        }
                                    >
                                        {credentialsStatus === 'active'
                                            ? 'Activa'
                                            : credentialsStatus === 'expired'
                                              ? 'Expirada'
                                              : 'Inactiva'}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm">
                                        Canales conectados:
                                    </span>
                                    <Badge variant="outline">
                                        {channels.length}
                                    </Badge>
                                </div>
                            </div>

                            {channels.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">
                                        Canales:
                                    </h4>
                                    {channels.map((channel) => (
                                        <div
                                            key={channel.id}
                                            className="flex items-center justify-between rounded border p-2"
                                        >
                                            <span className="text-sm">
                                                {channel.name}
                                            </span>
                                            <Badge
                                                variant={
                                                    channel.status === 'active'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {channel.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-2 pt-4">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    asChild
                                >
                                    <Link href="/channels">
                                        Ver Todos los Canales
                                    </Link>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full"
                                    asChild
                                >
                                    <a
                                        href="https://console.cloud.google.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Google Cloud Console
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Troubleshooting */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            ¿Por qué no veo mis videos en YouTube?
                        </CardTitle>
                        <CardDescription>
                            Razones comunes y soluciones
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <h4 className="font-medium text-orange-600">
                                    Sin credenciales configuradas
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Los videos se almacenan en el sistema pero
                                    no se suben automáticamente a YouTube sin
                                    credenciales válidas.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium text-blue-600">
                                    Videos programados para más tarde
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Si programaste el video para una fecha
                                    futura, se subirá automáticamente en esa
                                    fecha.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium text-purple-600">
                                    Credenciales expiradas
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Las credenciales de YouTube expiran
                                    periódicamente y necesitan renovarse.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium text-green-600">
                                    Videos en proceso
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Los videos grandes pueden tardar en
                                    procesarse. Revisa el estado en la sección
                                    de historial.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
