import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
        title: 'Vídeos',
        href: '/videos',
    },
    {
        title: 'Crear',
        href: '/videos/create',
    },
];

export default function VideosCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Vídeo" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/videos">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a Vídeos
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Crear Vídeo</h1>
                        <p className="text-muted-foreground">
                            Agrega un nuevo vídeo a tu colección
                        </p>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Información del Vídeo</CardTitle>
                        <CardDescription>
                            Completa los detalles para tu nuevo vídeo
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Título</Label>
                            <Input id="title" name="title" required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Descripción</Label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

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
                            <Label htmlFor="file">Archivo de Vídeo</Label>
                            <Input
                                id="file"
                                name="file"
                                type="file"
                                accept="video/*"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="thumbnail">Miniatura</Label>
                            <Input
                                id="thumbnail"
                                name="thumbnail"
                                type="file"
                                accept="image/*"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="tags">
                                Etiquetas (separadas por coma)
                            </Label>
                            <Input
                                id="tags"
                                name="tags"
                                placeholder="tag1, tag2, tag3"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="privacy">Privacidad</Label>
                            <Select name="privacy" defaultValue="private">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">
                                        Público
                                    </SelectItem>
                                    <SelectItem value="private">
                                        Privado
                                    </SelectItem>
                                    <SelectItem value="unlisted">
                                        No listado
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox id="made_for_kids" name="made_for_kids" />
                            <Label htmlFor="made_for_kids">
                                Hecho para niños
                            </Label>
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit">Crear Vídeo</Button>
                            <Button asChild variant="outline">
                                <Link href="/videos">Cancelar</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
