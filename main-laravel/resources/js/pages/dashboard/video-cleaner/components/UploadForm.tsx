import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FileVideo, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface UploadFormProps {
    onUpload: (files: File[], positions: string[]) => void;
    isUploading: boolean;
}

const WATERMARK_POSITIONS = [
    { id: 'arriba-izquierda', label: 'Arriba Izquierda' },
    { id: 'arriba-derecha', label: 'Arriba Derecha' },
    { id: 'medio-izquierda', label: 'Medio Izquierda' },
    { id: 'medio-derecha', label: 'Medio Derecha' },
    { id: 'abajo-izquierda', label: 'Abajo Izquierda' },
    { id: 'abajo-derecha', label: 'Abajo Derecha' },
];

export function UploadForm({ onUpload, isUploading }: UploadFormProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        const videoFiles = droppedFiles.filter(
            (file) =>
                file.type.startsWith('video/') &&
                ['video/mp4', 'video/avi', 'video/mov'].includes(file.type),
        );

        if (videoFiles.length > 0) {
            setFiles((prev) => [...prev, ...videoFiles].slice(0, 10)); // Max 10 files
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const videoFiles = selectedFiles.filter(
            (file) =>
                file.type.startsWith('video/') &&
                ['video/mp4', 'video/avi', 'video/mov'].includes(file.type),
        );

        if (videoFiles.length > 0) {
            setFiles((prev) => [...prev, ...videoFiles].slice(0, 10));
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePositionChange = (positionId: string, checked: boolean) => {
        setSelectedPositions((prev) =>
            checked
                ? [...prev, positionId]
                : prev.filter((id) => id !== positionId),
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length > 0 && selectedPositions.length > 0) {
            onUpload(files, selectedPositions);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Subir Videos para Limpiar
                </CardTitle>
                <CardDescription>
                    Selecciona los videos que deseas procesar y las posiciones
                    donde aparecen los watermarks. Máximo 10 videos de hasta
                    500MB cada uno.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* File Upload Area */}
                    <div className="space-y-4">
                        <Label>Archivos de Video</Label>
                        <div
                            className={cn(
                                'rounded-lg border-2 border-dashed p-6 text-center transition-colors',
                                dragActive
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted-foreground/25',
                                files.length > 0 &&
                                    'border-solid border-primary/50',
                            )}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <FileVideo className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Arrastra y suelta videos aquí, o{' '}
                                    <button
                                        type="button"
                                        className="text-primary hover:underline"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        selecciona archivos
                                    </button>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    MP4, AVI, MOV hasta 500MB cada uno
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="video/mp4,video/avi,video/mov"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="space-y-2">
                                <Label>
                                    Archivos Seleccionados ({files.length}/10)
                                </Label>
                                <div className="max-h-40 space-y-2 overflow-y-auto">
                                    {files.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between rounded-md bg-muted p-2"
                                        >
                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                <FileVideo className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatFileSize(
                                                            file.size,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    removeFile(index)
                                                }
                                                className="flex-shrink-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Watermark Positions */}
                    <div className="space-y-4">
                        <Label>Posiciones de Watermark</Label>
                        <div className="grid grid-cols-2 gap-4">
                            {WATERMARK_POSITIONS.map((position) => (
                                <div
                                    key={position.id}
                                    className="flex items-center space-x-2"
                                >
                                    <Checkbox
                                        id={position.id}
                                        checked={selectedPositions.includes(
                                            position.id,
                                        )}
                                        onCheckedChange={(checked) =>
                                            handlePositionChange(
                                                position.id,
                                                checked as boolean,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor={position.id}
                                        className="cursor-pointer text-sm font-normal"
                                    >
                                        {position.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        {selectedPositions.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Selecciona al menos una posición donde aparecen
                                los watermarks.
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={
                            files.length === 0 ||
                            selectedPositions.length === 0 ||
                            isUploading
                        }
                        className="w-full"
                    >
                        {isUploading
                            ? 'Procesando...'
                            : `Procesar ${files.length} Video${files.length !== 1 ? 's' : ''}`}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
