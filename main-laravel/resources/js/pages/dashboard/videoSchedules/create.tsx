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
    SelectItem,
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
        title: 'Programaciones de Vídeos',
        href: '/video-schedules',
    },
    {
        title: 'Crear',
        href: '/video-schedules/create',
    },
];

export default function VideoSchedulesCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Programación de Vídeo" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/video-schedules">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a Programaciones
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            Crear Programación de Vídeo
                        </h1>
                        <p className="text-muted-foreground">
                            Programa una subida de vídeo o acción
                        </p>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Información de la Programación</CardTitle>
                        <CardDescription>
                            Configura cuándo y qué acción realizar en tu vídeo
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="video_id">Vídeo</Label>
                            <Select name="video_id">
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar un vídeo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Videos will be populated from props */}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="scheduled_at">
                                Fecha y Hora Programada
                            </Label>
                            <Input
                                id="scheduled_at"
                                name="scheduled_at"
                                type="datetime-local"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="action">Acción</Label>
                            <Select name="action" defaultValue="upload">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="upload">
                                        Subir a YouTube
                                    </SelectItem>
                                    <SelectItem value="update">
                                        Actualizar Vídeo
                                    </SelectItem>
                                    <SelectItem value="delete">
                                        Eliminar Vídeo
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="action_parameters">
                                Parámetros de Acción (JSON)
                            </Label>
                            <textarea
                                id="action_parameters"
                                name="action_parameters"
                                rows={3}
                                placeholder='{"privacy": "public", "notify_subscribers": true}'
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="max_retries">
                                Máximo de Reintentos
                            </Label>
                            <Input
                                id="max_retries"
                                name="max_retries"
                                type="number"
                                defaultValue="3"
                                min="0"
                                max="10"
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit">Crear Programación</Button>
                            <Button asChild variant="outline">
                                <Link href="/video-schedules">Cancelar</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
