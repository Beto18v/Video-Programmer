import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Eye, Tv, Users, Video } from 'lucide-react';
import { Channel } from '../../types';

interface ChannelSelectionProps {
    channels: Channel[];
    selectedChannelId?: number;
    onChannelSelect: (channel: Channel) => void;
    isLoading?: boolean;
}

export default function ChannelSelection({
    channels,
    selectedChannelId,
    onChannelSelect,
    isLoading = false,
}: ChannelSelectionProps) {
    if (channels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Tv className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                    No hay canales conectados
                </h3>
                <p className="mb-4 text-center text-muted-foreground">
                    Necesitas conectar al menos un canal para programar videos
                </p>
                <Button asChild>
                    <a href="/channels/create">Conectar Canal</a>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold">
                    Selecciona un canal para programar videos
                </h2>
                <p className="text-muted-foreground">
                    Elige el canal donde quieres subir y programar tus videos
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {channels.map((channel) => (
                    <Card
                        key={channel.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedChannelId === channel.id
                                ? 'border-primary ring-2 ring-primary'
                                : ''
                        }`}
                        onClick={() => onChannelSelect(channel)}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                {channel.avatar_url ? (
                                    <img
                                        src={channel.avatar_url}
                                        alt={channel.name}
                                        className="h-12 w-12 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                        <Tv className="h-6 w-6" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <CardTitle className="truncate text-base">
                                        {channel.name}
                                    </CardTitle>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Badge
                                            variant={
                                                channel.status === 'active'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                            className="text-xs"
                                        >
                                            {channel.status}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {channel.platform.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                            {channel.description && (
                                <CardDescription className="mb-3 line-clamp-2 text-sm">
                                    {channel.description}
                                </CardDescription>
                            )}

                            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>
                                        {(
                                            channel.subscriber_count || 0
                                        ).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Video className="h-3 w-3" />
                                    <span>
                                        {(
                                            channel.video_count || 0
                                        ).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    <span>
                                        {(
                                            channel.view_count || 0
                                        ).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <Button
                                className="mt-4 w-full"
                                size="sm"
                                disabled={
                                    isLoading || channel.status !== 'active'
                                }
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChannelSelect(channel);
                                }}
                            >
                                {selectedChannelId === channel.id
                                    ? 'Seleccionado'
                                    : 'Seleccionar'}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
