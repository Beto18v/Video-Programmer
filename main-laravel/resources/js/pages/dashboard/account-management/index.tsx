import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { Eye, Search, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';

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
    role?: {
        name: string;
    };
    deleted_at?: string;
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
    deleted_at?: string;
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
    flash,
}: {
    users: User[];
    channels: Channel[];
    videos: Video[];
    filters?: { email?: string; plan?: string };
    flash?: { success?: string };
}) {
    const [emailFilter, setEmailFilter] = useState(filters?.email || '');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: '',
    });

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

    const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
    const [restoreUserId, setRestoreUserId] = useState<number | null>(null);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                '/account-management',
                { email: emailFilter, plan: filters?.plan },
                { preserveState: true },
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [emailFilter, filters?.plan]);

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
                        <div className="flex justify-end">
                            <Dialog
                                open={isCreateModalOpen}
                                onOpenChange={setIsCreateModalOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Crear Usuario
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Crear Nuevo Usuario
                                        </DialogTitle>
                                        <DialogDescription>
                                            Ingresa los detalles del nuevo
                                            usuario.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="name"
                                                className="text-right"
                                            >
                                                Nombre
                                            </Label>
                                            <Input
                                                id="name"
                                                value={newUser.name}
                                                onChange={(e) =>
                                                    setNewUser({
                                                        ...newUser,
                                                        name: e.target.value,
                                                    })
                                                }
                                                className="col-span-3"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="email"
                                                className="text-right"
                                            >
                                                Correo
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={newUser.email}
                                                onChange={(e) =>
                                                    setNewUser({
                                                        ...newUser,
                                                        email: e.target.value,
                                                    })
                                                }
                                                className="col-span-3"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="password"
                                                className="text-right"
                                            >
                                                Contraseña
                                            </Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={newUser.password}
                                                onChange={(e) =>
                                                    setNewUser({
                                                        ...newUser,
                                                        password:
                                                            e.target.value,
                                                    })
                                                }
                                                className="col-span-3"
                                                minLength={8}
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="role"
                                                className="text-right"
                                            >
                                                Rol
                                            </Label>
                                            <Select
                                                value={newUser.role}
                                                onValueChange={(value) =>
                                                    setNewUser({
                                                        ...newUser,
                                                        role: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Selecciona un rol" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ADMIN">
                                                        Admin
                                                    </SelectItem>
                                                    <SelectItem value="USER">
                                                        Usuario
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={() => {
                                                router.post('/users', newUser, {
                                                    onSuccess: () => {
                                                        setIsCreateModalOpen(
                                                            false,
                                                        );
                                                        setNewUser({
                                                            name: '',
                                                            email: '',
                                                            password: '',
                                                            role: '',
                                                        });
                                                    },
                                                });
                                            }}
                                        >
                                            Crear
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        placeholder="Buscar por email..."
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 pl-8 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                        value={emailFilter}
                                        onChange={(e) =>
                                            setEmailFilter(e.target.value)
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
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
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
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Acciones</TableHead>
                                    <TableHead></TableHead>
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
                                            <Badge variant="outline">
                                                {user.role?.name || 'Sin rol'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.deleted_at ? (
                                                <AlertDialog
                                                    open={
                                                        isRestoreDialogOpen &&
                                                        restoreUserId ===
                                                            user.id
                                                    }
                                                    onOpenChange={(open) => {
                                                        if (!open) {
                                                            setRestoreUserId(
                                                                null,
                                                            );
                                                            setIsRestoreDialogOpen(
                                                                false,
                                                            );
                                                        } else
                                                            setIsRestoreDialogOpen(
                                                                open,
                                                            );
                                                    }}
                                                >
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                setRestoreUserId(
                                                                    user.id,
                                                                );
                                                                setIsRestoreDialogOpen(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            Restaurar
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                ¿Está seguro?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta acción
                                                                restaurará al
                                                                usuario. ¿Desea
                                                                continuar?
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancelar
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => {
                                                                    if (
                                                                        restoreUserId
                                                                    ) {
                                                                        router.patch(
                                                                            `/users/${restoreUserId}/restore`,
                                                                            {},
                                                                            {
                                                                                onSuccess:
                                                                                    () => {
                                                                                        setIsRestoreDialogOpen(
                                                                                            false,
                                                                                        );
                                                                                        setRestoreUserId(
                                                                                            null,
                                                                                        );
                                                                                    },
                                                                            },
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                Sí, restaurar
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            ) : (
                                                <AlertDialog
                                                    open={
                                                        isDeleteDialogOpen &&
                                                        deleteUserId === user.id
                                                    }
                                                    onOpenChange={(open) => {
                                                        if (!open) {
                                                            setDeleteUserId(
                                                                null,
                                                            );
                                                            setIsDeleteDialogOpen(
                                                                false,
                                                            );
                                                        } else
                                                            setIsDeleteDialogOpen(
                                                                open,
                                                            );
                                                    }}
                                                >
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => {
                                                                setDeleteUserId(
                                                                    user.id,
                                                                );
                                                                setIsDeleteDialogOpen(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                ¿Está seguro?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta acción
                                                                eliminará
                                                                permanentemente
                                                                al usuario.
                                                                ¿Desea
                                                                continuar?
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancelar
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => {
                                                                    if (
                                                                        deleteUserId
                                                                    ) {
                                                                        router.delete(
                                                                            `/users/${deleteUserId}`,
                                                                            {
                                                                                onSuccess:
                                                                                    () => {
                                                                                        setIsDeleteDialogOpen(
                                                                                            false,
                                                                                        );
                                                                                        setDeleteUserId(
                                                                                            null,
                                                                                        );
                                                                                    },
                                                                            },
                                                                        );
                                                                    }
                                                                }}
                                                                className="bg-red-600 hover:bg-red-700"
                                                            >
                                                                Sí, eliminar
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {user.role?.name !== 'ADMIN' &&
                                                !user.deleted_at && (
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => {
                                                            router.patch(
                                                                `/users/${user.id}/make-ADMIN`,
                                                                {},
                                                                {
                                                                    onSuccess:
                                                                        () =>
                                                                            router.reload(),
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        Hacer Admin
                                                    </Button>
                                                )}
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
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Acciones</TableHead>
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
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    channel.deleted_at
                                                        ? 'destructive'
                                                        : 'default'
                                                }
                                            >
                                                {channel.deleted_at
                                                    ? 'Eliminado'
                                                    : 'Activo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {channel.deleted_at ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        router.patch(
                                                            `/channels/${channel.id}/restore`,
                                                        )
                                                    }
                                                >
                                                    Restaurar
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
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
            <Toaster />
        </AppLayout>
    );
}
