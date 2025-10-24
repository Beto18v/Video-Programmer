import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

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
        title: 'Crear',
        href: '/youtube-credentials/create',
    },
];

export default function YoutubeCredentialsCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Credenciales de YouTube" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/youtube-credentials">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a Credenciales
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            Crear Credenciales de YouTube
                        </h1>
                        <p className="text-muted-foreground">
                            Agregar credenciales de API de YouTube para un canal
                        </p>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Información de Credenciales</CardTitle>
                        <CardDescription>
                            Ingresa las credenciales OAuth para acceso a la API
                            de YouTube
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="channel_id">Canal</Label>
                            <Select name="channel_id">
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar un canal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Channels will be populated from props */}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="access_token">
                                Token de Acceso
                            </Label>
                            <Input
                                id="access_token"
                                name="access_token"
                                required
                            />
                            <p className="text-sm text-muted-foreground">
                                The OAuth 2.0 access token for YouTube API
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="refresh_token">
                                Token de Actualización
                            </Label>
                            <Input
                                id="refresh_token"
                                name="refresh_token"
                                required
                            />
                            <p className="text-sm text-muted-foreground">
                                The OAuth 2.0 refresh token for renewing access
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="expires_at">Expira En</Label>
                            <Input
                                id="expires_at"
                                name="expires_at"
                                type="datetime-local"
                            />
                            <p className="text-sm text-muted-foreground">
                                Cuando expira el token de acceso
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="scopes">
                                Alcances (separados por coma)
                            </Label>
                            <Input
                                id="scopes"
                                name="scopes"
                                placeholder="https://www.googleapis.com/auth/youtube.upload,https://www.googleapis.com/auth/youtube"
                            />
                            <p className="text-sm text-muted-foreground">
                                Los alcances OAuth concedidos a este token
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit">Crear Credenciales</Button>
                            <Button asChild variant="outline">
                                <Link href="/youtube-credentials">
                                    Cancelar
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
