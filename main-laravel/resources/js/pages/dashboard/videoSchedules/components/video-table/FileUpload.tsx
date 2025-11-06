import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FileVideo, Image, Loader2, Upload, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useFileUpload } from '../../hooks';

interface FileUploadProps {
    label: string;
    accept: string;
    multiple?: boolean;
    onFileSelect: (files: File[]) => void;
    currentFile?: File;
    currentFileName?: string;
    placeholder?: string;
    maxSize?: number; // in MB
    className?: string;
    compact?: boolean; // New prop for compact mode
}

export default function FileUpload({
    label,
    accept,
    multiple = false,
    onFileSelect,
    currentFile,
    currentFileName,
    placeholder,
    maxSize = 500, // Default size in MB (videos: 10000MB/10GB, images: 10MB)
    className = '',
    compact = false,
}: FileUploadProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Hook para manejar la subida con progreso
    const { uploadState, startUpload, cancelUpload, clearUpload } =
        useFileUpload();

    const handleFileValidation = useCallback(
        (files: FileList) => {
            const fileArray = Array.from(files);
            const validFiles: File[] = [];
            let validationError = '';

            for (const file of fileArray) {
                // Check file size
                if (file.size > maxSize * 1024 * 1024) {
                    validationError = `El archivo ${file.name} excede el tamaño máximo de ${maxSize}MB`;
                    break;
                }

                // Check file type
                const fileType = file.type;
                const isValidType = accept.split(',').some((type) => {
                    const cleanType = type.trim();
                    if (cleanType.includes('/*')) {
                        return fileType.startsWith(cleanType.replace('/*', ''));
                    }
                    return fileType === cleanType;
                });

                if (!isValidType) {
                    validationError = `Tipo de archivo no válido: ${file.name}`;
                    break;
                }

                validFiles.push(file);
            }

            if (validationError) {
                setError(validationError);
                return [];
            }

            setError(null);
            return validFiles;
        },
        [accept, maxSize],
    );

    const handleFileChange = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (files && files.length > 0) {
                const validFiles = handleFileValidation(files);
                if (validFiles.length > 0) {
                    const file = validFiles[0]; // Solo tomamos el primer archivo para upload individual

                    // Iniciar la subida automáticamente
                    try {
                        await startUpload(file);
                        // Una vez completada la subida, notificar al componente padre
                        onFileSelect([file]);
                    } catch (error) {
                        console.error('Upload failed:', error);
                        setError('Error durante la subida del archivo');
                    }
                }
            }
        },
        [handleFileValidation, onFileSelect, startUpload],
    );

    const handleDrop = useCallback(
        async (event: React.DragEvent) => {
            event.preventDefault();
            setIsDragActive(false);

            const files = event.dataTransfer.files;
            if (files && files.length > 0) {
                const validFiles = handleFileValidation(files);
                if (validFiles.length > 0) {
                    const file = validFiles[0]; // Solo tomamos el primer archivo para upload individual

                    // Iniciar la subida automáticamente
                    try {
                        await startUpload(file);
                        // Una vez completada la subida, notificar al componente padre
                        onFileSelect([file]);
                    } catch (error) {
                        console.error('Upload failed:', error);
                        setError('Error durante la subida del archivo');
                    }
                }
            }
        },
        [handleFileValidation, onFileSelect, startUpload],
    );

    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        setIsDragActive(true);
    }, []);

    const handleDragLeave = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        setIsDragActive(false);
    }, []);

    const handleClearFile = useCallback(() => {
        onFileSelect([]);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
        setError(null);
        clearUpload(); // Limpiar el estado de upload
    }, [onFileSelect, clearUpload]);

    const handleClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const isVideo = accept.includes('video');
    const isImage = accept.includes('image');
    const displayFileName = currentFile?.name || currentFileName;

    return (
        <div className={`space-y-2 ${className}`}>
            {label && <Label className="text-sm font-medium">{label}</Label>}

            {displayFileName || uploadState.file ? (
                compact ? (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 rounded-md border bg-muted/20 p-2">
                            <div className="flex-shrink-0">
                                {uploadState.isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                ) : isVideo ? (
                                    <FileVideo className="h-4 w-4 text-blue-500" />
                                ) : isImage ? (
                                    <Image className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Upload className="h-4 w-4 text-gray-500" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium">
                                    {uploadState.file?.name || displayFileName}
                                </p>
                                {uploadState.isUploading && (
                                    <p className="text-xs text-blue-600">
                                        Subiendo... {uploadState.progress}%
                                    </p>
                                )}
                                {uploadState.error && (
                                    <p className="text-xs text-red-600">
                                        {uploadState.error}
                                    </p>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={
                                    uploadState.isUploading
                                        ? cancelUpload
                                        : handleClearFile
                                }
                                className="h-6 w-6 flex-shrink-0 p-0"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>

                        {/* Barra de progreso para versión compacta */}
                        {uploadState.isUploading && (
                            <Progress
                                value={uploadState.progress}
                                className="h-1 w-full bg-gray-200"
                            />
                        )}
                    </div>
                ) : (
                    <Card className="relative">
                        <CardContent className="space-y-3 p-3">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    {uploadState.isUploading ? (
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                    ) : isVideo ? (
                                        <FileVideo className="h-8 w-8 text-blue-500" />
                                    ) : isImage ? (
                                        <Image className="h-8 w-8 text-green-500" />
                                    ) : (
                                        <Upload className="h-8 w-8 text-gray-500" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {uploadState.file?.name ||
                                            displayFileName}
                                    </p>
                                    {(currentFile || uploadState.file) && (
                                        <p className="text-xs text-muted-foreground">
                                            {(
                                                (currentFile?.size ||
                                                    uploadState.file?.size ||
                                                    0) /
                                                (1024 * 1024)
                                            ).toFixed(2)}{' '}
                                            MB
                                        </p>
                                    )}
                                    {uploadState.isUploading && (
                                        <p className="text-sm font-medium text-blue-600">
                                            Subiendo... {uploadState.progress}%
                                        </p>
                                    )}
                                    {uploadState.error && (
                                        <p className="text-sm font-medium text-red-600">
                                            {uploadState.error}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={
                                        uploadState.isUploading
                                            ? cancelUpload
                                            : handleClearFile
                                    }
                                    className="flex-shrink-0"
                                    title={
                                        uploadState.isUploading
                                            ? 'Cancelar subida'
                                            : 'Eliminar archivo'
                                    }
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Barra de progreso para versión normal */}
                            {uploadState.isUploading && (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                            Progreso
                                        </span>
                                        <span className="text-xs font-medium">
                                            {uploadState.progress}%
                                        </span>
                                    </div>
                                    <Progress
                                        value={uploadState.progress}
                                        className="h-2 w-full"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            ) : compact ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClick}
                    className="h-8 w-full text-xs"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <Upload className="mr-1 h-3 w-3" />
                    {placeholder || 'Seleccionar'}
                </Button>
            ) : (
                <div
                    className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors duration-200 ${
                        isDragActive
                            ? 'border-primary bg-primary/10'
                            : 'border-muted-foreground/25 hover:border-primary/50'
                    } ${error ? 'border-destructive' : ''} `}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={handleClick}
                >
                    <div className="flex flex-col items-center gap-2">
                        <Upload
                            className={`h-8 w-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`}
                        />
                        <div>
                            <p className="text-sm font-medium">
                                {isDragActive
                                    ? 'Suelta el archivo aquí'
                                    : 'Haz clic para seleccionar o arrastra el archivo'}
                            </p>
                            {placeholder && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {placeholder}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                                Tamaño máximo: {maxSize}MB
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileChange}
                className="sr-only"
            />
        </div>
    );
}
