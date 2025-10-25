import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Settings, Tv, Upload } from 'lucide-react';
import { useState } from 'react';
import { useVideoScheduling } from '../hooks';
import { Channel, SheetMapping } from '../types';
import { SheetMappingModal } from './sheet-mapping';
import { UploadActions } from './upload-actions';
import { VideoTable } from './video-table';

interface VideoSchedulingWorkflowProps {
    channels: Channel[];
}

export default function VideoSchedulingWorkflow({
    channels,
}: VideoSchedulingWorkflowProps) {
    const [showSheetModal, setShowSheetModal] = useState(false);

    const {
        selectedChannel,
        videos,
        uploadProgress,
        isUploading,
        isPaused,
        setSelectedChannel,
        addVideo,
        updateVideo,
        removeVideo,
        setVideos,
        startUpload,
        pauseUpload,
        resumeUpload,
        cancelUpload,
        importFromSheet,
    } = useVideoScheduling();

    const handleChannelSelect = (channel: Channel) => {
        setSelectedChannel(channel);
    };

    const handleVideosChange = (newVideos: typeof videos) => {
        setVideos(newVideos);
    };

    const handleConnectSheet = () => {
        setShowSheetModal(true);
    };

    const handleSheetImport = (
        mapping: SheetMapping,
        data: Record<string, unknown>[],
    ) => {
        importFromSheet(mapping, data);
        setShowSheetModal(false);
    };

    const handleStartUpload = async (
        videoIds: string[],
        action: 'upload' | 'schedule',
    ) => {
        await startUpload(videoIds, action);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold">Programación de Videos</h1>
                <p className="mt-2 text-muted-foreground">
                    Sube y programa videos de manera eficiente en tus canales
                    conectados
                </p>
            </div>

            {/* Step 1: Channel Selection */}
            {!selectedChannel ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Paso 1: Selecciona un Canal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-center">
                            <div className="max-w-md space-y-4">
                                {channels.map((channel) => (
                                    <div
                                        key={channel.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:bg-muted"
                                        onClick={() =>
                                            handleChannelSelect(channel)
                                        }
                                    >
                                        {channel.avatar_url ? (
                                            <img
                                                src={channel.avatar_url}
                                                alt={channel.name}
                                                className="h-10 w-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                <Tv className="h-5 w-5" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-semibold">
                                                {channel.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {channel.platform.toUpperCase()}{' '}
                                                • {channel.status}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Selected Channel Info */}
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {selectedChannel.avatar_url ? (
                                        <img
                                            src={selectedChannel.avatar_url}
                                            alt={selectedChannel.name}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold">
                                            {selectedChannel.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Canal seleccionado para programar
                                            videos
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedChannel(null)}
                                    className="text-sm text-muted-foreground hover:text-foreground"
                                >
                                    Cambiar canal
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Step 2: Video Management */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            <h2 className="text-xl font-semibold">
                                Paso 2: Gestiona tus Videos
                            </h2>
                        </div>

                        <VideoTable
                            videos={videos}
                            onVideosChange={handleVideosChange}
                            onConnectSheet={handleConnectSheet}
                            isLoading={isUploading}
                        />
                    </div>

                    <Separator />

                    {/* Step 3: Upload Actions */}
                    {videos.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                <h2 className="text-xl font-semibold">
                                    Paso 3: Subir y Programar
                                </h2>
                            </div>

                            <UploadActions
                                videos={videos}
                                onStartUpload={handleStartUpload}
                                onPauseUpload={pauseUpload}
                                onResumeUpload={resumeUpload}
                                onCancelUpload={cancelUpload}
                                uploadProgress={uploadProgress}
                                isUploading={isUploading}
                                isPaused={isPaused}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Sheet Mapping Modal */}
            <SheetMappingModal
                isOpen={showSheetModal}
                onClose={() => setShowSheetModal(false)}
                onConfirm={handleSheetImport}
                isLoading={false}
            />
        </div>
    );
}
