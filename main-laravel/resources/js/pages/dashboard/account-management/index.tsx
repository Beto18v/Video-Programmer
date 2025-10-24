import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Gestión de cuentas',
        href: '/account-management',
    },
];

interface User {
    id: number;
    name: string;
    email: string;
    current_plan?: {
        name: string;
    };
}

interface Channel {
    id: number;
    name: string;
    user?: {
        name: string;
    };
    subscriber_count: number;
    video_count: number;
    view_count: number;
}

interface Video {
    id: number;
    title: string;
    channel?: {
        name: string;
    };
    view_count: number;
    published_at: string;
}

export default function AccountManagementIndex({
    users,
    channels,
    videos,
    filters,
}: {
    users: User[];
    channels: Channel[];
    videos: Video[];
    filters?: { email?: string; plan?: string };
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de cuentas" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Gestión de cuentas
                        </h1>
                        <p className="text-muted-foreground">
                            Administra usuarios, canales y videos del sistema
                        </p>
                    </div>
                </div>

                {/* Tabla de Usuarios */}
                <Card>
                    <CardHeader>
                        <CardTitle>Usuarios Registrados</CardTitle>
                        <CardDescription>
                            Lista de todos los usuarios del sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        placeholder="Buscar por email..."
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 pl-8 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                        value={filters?.email || ''}
                                        onChange={(e) =>
                                            router.get(
                                                '/account-management',
                                                {
                                                    ...filters,
                                                    email: e.target.value,
                                                },
                                                { preserveState: true },
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            <select
                                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                value={filters?.plan || ''}
                                onChange={(e) =>
                                    router.get(
                                        '/account-management',
                                        { ...filters, plan: e.target.value },
                                        { preserveState: true },
                                    )
                                }
                            >
                                <option value="">Todos los planes</option>
                                <option value="basic">Básico</option>
                                <option value="premium">Premium</option>
                            </select>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {user.current_plan?.name ||
                                                    'Sin plan'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button size="sm" variant="outline">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Tabla de Canales */}
                <Card>
                    <CardHeader>
                        <CardTitle>Canales</CardTitle>
                        <CardDescription>
                            Lista de todos los canales conectados
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Suscriptores</TableHead>
                                    <TableHead>Videos</TableHead>
                                    <TableHead>Vistas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {channels.map((channel) => (
                                    <TableRow key={channel.id}>
                                        <TableCell>{channel.id}</TableCell>
                                        <TableCell>{channel.name}</TableCell>
                                        <TableCell>
                                            {channel.user?.name}
                                        </TableCell>
                                        <TableCell>
                                            {channel.subscriber_count.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {channel.video_count.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {channel.view_count.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Tabla de Videos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Videos</CardTitle>
                        <CardDescription>
                            Lista de todos los videos del sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Canal</TableHead>
                                    <TableHead>Vistas</TableHead>
                                    <TableHead>Publicado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {videos.map((video) => (
                                    <TableRow key={video.id}>
                                        <TableCell>{video.id}</TableCell>
                                        <TableCell>{video.title}</TableCell>
                                        <TableCell>
                                            {video.channel?.name}
                                        </TableCell>
                                        <TableCell>
                                            {video.view_count.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                video.published_at,
                                            ).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
