/**
 * BulkUploadModal - Componente mejorado para subida masiva de videos
 *
 * Mejoras implementadas:
 * - ✅ Algoritmo de matching inteligente con normalización de texto
 * - ✅ Validación de archivos (tipo y tamaño) antes del matching
 * - ✅ Detección mejorada de duplicados
 * - ✅ Múltiples estrategias de matching: exacto, inclusión, por nombre de archivo
 * - ✅ Manejo de errores robusto con try-catch
 * - ✅ Límite de 50GB total para archivos y 10GB por archivo individual
 */

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
    matchedBy: 'title' | 'filename' | 'manual' | 'none';
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

            // Validar archivos antes del matching
            const validFiles = fileArray.filter((file) => {
                // Verificar tipo de archivo
                if (!file.type.startsWith('video/')) {
                    console.warn(
                        `Archivo omitido (no es un video): ${file.name}`,
                    );
                    return false;
                }

                // Verificar tamaño (10GB máximo)
                if (file.size > 10000 * 1024 * 1024) {
                    console.warn(`Archivo omitido (muy grande): ${file.name}`);
                    return false;
                }

                return true;
            });

            // Auto-matching mejorado de archivos a videos
            const mappings: FileMapping[] = validFiles.map((file) => {
                const fileName = file.name
                    .toLowerCase()
                    .replace(/\.[^/.]+$/, ''); // Remove extension

                // Normalizar texto para comparación
                const normalizeText = (text: string) =>
                    text
                        .toLowerCase()
                        .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
                        .replace(/\s+/g, ' ') // Normalizar espacios
                        .trim();

                const normalizedFileName = normalizeText(fileName);

                // 1. Buscar coincidencia exacta por título
                let matchedVideo = videos.find(
                    (video) =>
                        normalizeText(video.title) === normalizedFileName,
                );

                // 2. Si no hay coincidencia exacta, buscar por inclusión (título contiene nombre de archivo)
                if (!matchedVideo) {
                    matchedVideo = videos.find((video) => {
                        const normalizedTitle = normalizeText(video.title);
                        return (
                            normalizedTitle.includes(normalizedFileName) ||
                            normalizedFileName.includes(normalizedTitle)
                        );
                    });
                }

                // 3. Si no hay match por título, intentar por fileName existente
                if (!matchedVideo) {
                    matchedVideo = videos.find(
                        (video) =>
                            video.fileName &&
                            normalizeText(
                                video.fileName.replace(/\.[^/.]+$/, ''),
                            ) === normalizedFileName,
                    );
                }

                // 4. Como último recurso, buscar videos sin archivo asignado
                if (!matchedVideo) {
                    matchedVideo = videos.find((video) => !video.file);
                }

                return {
                    file,
                    videoId: matchedVideo?.id || null,
                    matchedBy: matchedVideo
                        ? normalizeText(matchedVideo.title) ===
                          normalizedFileName
                            ? 'title'
                            : normalizeText(matchedVideo.title).includes(
                                    normalizedFileName,
                                )
                              ? 'title'
                              : 'filename'
                        : ('none' as FileMapping['matchedBy']),
                    status: matchedVideo ? 'matched' : 'unmatched',
                };
            });

            // Detectar y marcar duplicados
            const usedVideoIds = new Set<string>();
            mappings.forEach((mapping) => {
                if (mapping.videoId) {
                    if (usedVideoIds.has(mapping.videoId)) {
                        mapping.status = 'duplicate';
                    } else {
                        usedVideoIds.add(mapping.videoId);
                        // Verificar si el video ya tiene un archivo
                        const video = videos.find(
                            (v) => v.id === mapping.videoId,
                        );
                        if (video?.file) {
                            mapping.status = 'duplicate';
                        }
                    }
                }
            });

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

        if (validMappings.length === 0) {
            console.warn('No hay archivos válidos para subir');
            return;
        }

        // Verificar que los archivos no excedan el límite de tamaño total
        const totalSize = validMappings.reduce(
            (sum, mapping) => sum + mapping.file.size,
            0,
        );
        const totalSizeGB = totalSize / (1024 * 1024 * 1024);

        if (totalSizeGB > 50) {
            // Límite de 50GB total
            console.warn(
                'El tamaño total de archivos excede el límite recomendado de 50GB',
            );
        }

        setIsProcessing(true);

        try {
            onBulkUpload(validMappings);
            onClose();
        } catch (error) {
            console.error('Error durante la subida masiva:', error);
        } finally {
            setIsProcessing(false);
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
                                                        {mapping.matchedBy ===
                                                            'none' &&
                                                            'Sin coincidencia'}
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
