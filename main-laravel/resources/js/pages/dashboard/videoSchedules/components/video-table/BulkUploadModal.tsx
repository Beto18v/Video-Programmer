import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { CheckCircle, FileVideo, Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { VideoUpload } from '../../types';

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    videos: VideoUpload[];
    onBulkUpload: (fileMappings: { videoId: string; file: File }[]) => void;
}

interface FileMapping {
    file: File;
    videoId: string | null;
    matchedBy: 'title' | 'filename' | 'manual';
    status: 'matched' | 'unmatched' | 'duplicate';
}

export default function BulkUploadModal({
    isOpen,
    onClose,
    videos,
    onBulkUpload,
}: BulkUploadModalProps) {
    const [fileMappings, setFileMappings] = useState<FileMapping[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelect = useCallback(
        (files: FileList) => {
            const fileArray = Array.from(files);

            // Auto-match files to videos
            const mappings: FileMapping[] = fileArray.map((file) => {
                const fileName = file.name
                    .toLowerCase()
                    .replace(/\.[^/.]+$/, ''); // Remove extension

                // Try to match by title first
                let matchedVideo = videos.find(
                    (video) =>
                        video.title.toLowerCase().includes(fileName) ||
                        fileName.includes(video.title.toLowerCase()),
                );

                // If no match by title, try by existing filename
                if (!matchedVideo) {
                    matchedVideo = videos.find(
                        (video) =>
                            video.fileName
                                ?.toLowerCase()
                                .replace(/\.[^/.]+$/, '') === fileName,
                    );
                }

                return {
                    file,
                    videoId: matchedVideo?.id || null,
                    matchedBy: matchedVideo ? 'title' : 'filename',
                    status: matchedVideo ? 'matched' : 'unmatched',
                };
            });

            // Check for duplicates - only if there are videos with files
            const videosWithFiles = videos.filter((v) => v.file);
            if (videosWithFiles.length > 0) {
                const usedVideoIds = new Set<string>();
                mappings.forEach((mapping) => {
                    if (mapping.videoId) {
                        if (usedVideoIds.has(mapping.videoId)) {
                            mapping.status = 'duplicate';
                        } else {
                            usedVideoIds.add(mapping.videoId);
                        }
                    }
                });
            }

            setFileMappings(mappings);
        },
        [videos],
    );

    const handleVideoAssignment = useCallback(
        (fileIndex: number, videoId: string) => {
            setFileMappings((prev) =>
                prev.map((mapping, index) =>
                    index === fileIndex
                        ? {
                              ...mapping,
                              videoId,
                              matchedBy: 'manual',
                              status: 'matched',
                          }
                        : mapping,
                ),
            );
        },
        [],
    );

    const handleConfirmUpload = useCallback(() => {
        const validMappings = fileMappings
            .filter(
                (mapping) => mapping.videoId && mapping.status === 'matched',
            )
            .map((mapping) => ({
                videoId: mapping.videoId!,
                file: mapping.file,
            }));

        if (validMappings.length > 0) {
            setIsProcessing(true);
            onBulkUpload(validMappings);
            setIsProcessing(false);
            onClose();
        }
    }, [fileMappings, onBulkUpload, onClose]);

    const getStatusBadge = (status: FileMapping['status']) => {
        const variants = {
            matched: 'default',
            unmatched: 'secondary',
            duplicate: 'destructive',
        } as const;

        const labels = {
            matched: 'Coincide',
            unmatched: 'Sin coincidencia',
            duplicate: 'Duplicado',
        };

        return <Badge variant={variants[status]}>{labels[status]}</Badge>;
    };

    const matchedCount = fileMappings.filter(
        (m) => m.status === 'matched',
    ).length;
    const totalFiles = fileMappings.length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[80vh] max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Subida Masiva de Videos
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona múltiples archivos de video para asignarlos
                        automáticamente a los videos programados. Los archivos
                        se emparejarán por nombre de archivo y título.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="file-input">
                            Seleccionar archivos de video
                        </Label>
                        <Input
                            id="file-input"
                            type="file"
                            accept="video/*"
                            multiple
                            onChange={(e) => {
                                if (e.target.files) {
                                    handleFileSelect(e.target.files);
                                }
                            }}
                            className="mt-1"
                        />
                    </div>

                    {fileMappings.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">
                                    Archivos seleccionados ({totalFiles})
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    {matchedCount} de {totalFiles} coinciden
                                </div>
                            </div>

                            <ScrollArea className="h-96 rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Archivo</TableHead>
                                            <TableHead>Asignado a</TableHead>
                                            <TableHead>Método</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fileMappings.map((mapping, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <FileVideo className="h-4 w-4 text-blue-500" />
                                                        <div>
                                                            <p className="max-w-48 truncate text-sm font-medium">
                                                                {
                                                                    mapping.file
                                                                        .name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {(
                                                                    mapping.file
                                                                        .size /
                                                                    (1024 *
                                                                        1024)
                                                                ).toFixed(
                                                                    1,
                                                                )}{' '}
                                                                MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {mapping.videoId ? (
                                                        <div className="text-sm">
                                                            {videos.find(
                                                                (v) =>
                                                                    v.id ===
                                                                    mapping.videoId,
                                                            )?.title || 'Video'}
                                                        </div>
                                                    ) : (
                                                        <select
                                                            className="w-full rounded border p-1 text-sm"
                                                            onChange={(e) =>
                                                                handleVideoAssignment(
                                                                    index,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            defaultValue=""
                                                        >
                                                            <option
                                                                value=""
                                                                disabled
                                                            >
                                                                Seleccionar
                                                                video...
                                                            </option>
                                                            {videos.map(
                                                                (video) => (
                                                                    <option
                                                                        key={
                                                                            video.id
                                                                        }
                                                                        value={
                                                                            video.id
                                                                        }
                                                                    >
                                                                        {video.title ||
                                                                            `Video ${video.id.slice(-4)}`}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs text-muted-foreground capitalize">
                                                        {mapping.matchedBy ===
                                                            'title' &&
                                                            'Por título'}
                                                        {mapping.matchedBy ===
                                                            'filename' &&
                                                            'Por nombre'}
                                                        {mapping.matchedBy ===
                                                            'manual' &&
                                                            'Manual'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(
                                                        mapping.status,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmUpload}
                        disabled={matchedCount === 0 || isProcessing}
                    >
                        {isProcessing
                            ? 'Subiendo...'
                            : `Subir ${matchedCount} videos`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
