import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link } from '@inertiajs/react';
import { Calendar, Key, LayoutGrid, Tv, Video } from 'lucide-react';

const headerNavItems = [
    {
        title: 'Videos',
        href: '/videos',
        icon: Video,
        emoji: '📹',
    },
    {
        title: 'Channels',
        href: '/channels',
        icon: Tv,
        emoji: '📺',
    },
    {
        title: 'Schedules',
        href: '/video-schedules',
        icon: Calendar,
        emoji: '📅',
    },
    {
        title: 'Credentials',
        href: '/youtube-credentials',
        icon: Key,
        emoji: '🔑',
    },
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        emoji: '🏠',
    },
];

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <nav className="ml-4 hidden items-center gap-4 md:flex">
                    {headerNavItems.map((item) => (
                        <Link
                            key={item.title}
                            href={item.href}
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                            <span>{item.emoji}</span>
                            <span>{item.title}</span>
                        </Link>
                    ))}
                </nav>
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}
