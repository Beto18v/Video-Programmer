import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Calendar,
    Folder,
    Key,
    LayoutGrid,
    Tv,
    Users,
    Video,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Inicio',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Videos',
        href: '/videos',
        icon: Video,
    },
    {
        title: 'Canales',
        href: '/channels',
        icon: Tv,
    },
    {
        title: 'Credenciales',
        href: '/youtube-credentials',
        icon: Key,
    },
    {
        title: 'Programaciones',
        href: '/video-schedules',
        icon: Calendar,
    },
    {
        title: 'Gestión de cuentas',
        href: '/account-management',
        icon: Users,
        adminOnly: true,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Planes',
        href: '/pricing',
        icon: Folder,
    },
    {
        title: 'Documentación',
        href: '#',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props as unknown as SharedData;
    const isAdmin = auth?.user?.role?.name === 'ADMIN';

    const filteredNavItems = mainNavItems.filter(
        (item) => !item.adminOnly || isAdmin,
    );
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
