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
        title: 'Canales',
        href: '/channels',
    },
    {
        title: 'Crear',
        href: '/channels/create',
    },
];

export default function ChannelsCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Canal" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/channels">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a Canales
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Crear Canal</h1>
                        <p className="text-muted-foreground">
                            Conectar un nuevo canal de YouTube
                        </p>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Información del Canal</CardTitle>
                        <CardDescription>
                            Ingresa los detalles para conectar tu canal de
                            YouTube
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="youtube_channel_id">
                                ID del Canal de YouTube
                            </Label>
                            <Input
                                id="youtube_channel_id"
                                name="youtube_channel_id"
                                required
                            />
                            <p className="text-sm text-muted-foreground">
                                Puedes encontrar el ID de tu canal en la URL de
                                tu canal de YouTube o en configuraciones
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre del Canal</Label>
                            <Input id="name" name="name" required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Descripción</Label>
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="custom_url">
                                URL Personalizada
                            </Label>
                            <Input
                                id="custom_url"
                                name="custom_url"
                                placeholder="youtube.com/c/TuCanal"
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit">Conectar Canal</Button>
                            <Button asChild variant="outline">
                                <Link href="/channels">Cancelar</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
