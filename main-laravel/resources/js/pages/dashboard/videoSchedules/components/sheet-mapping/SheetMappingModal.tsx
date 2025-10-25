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
import {
    AlertCircle,
    Check,
    Download,
    Link as LinkIcon,
    Sheet,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
    SheetColumn,
    SheetMapping,
    VIDEO_FIELDS,
    VideoFieldKey,
} from '../../types';

interface SheetMappingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (mapping: SheetMapping, data: Record<string, unknown>[]) => void;
    isLoading?: boolean;
}

export default function SheetMappingModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
}: SheetMappingModalProps) {
    const [sheetUrl, setSheetUrl] = useState('');
    const [sheetData, setSheetData] = useState<SheetColumn[]>([]);
    const [mapping, setMapping] = useState<SheetMapping>({});
    const [selectedField, setSelectedField] = useState<VideoFieldKey | null>(
        null,
    );
    const [loadingSheet, setLoadingSheet] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mock function to simulate loading sheet data
    const loadSheetData = useCallback(async () => {
        setLoadingSheet(true);
        setError(null);

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Mock data - in real implementation, this would come from Google Sheets API
            const mockData: SheetColumn[] = [
                {
                    id: 'A',
                    name: 'Título del Video',
                    data: [
                        'Mi primer video',
                        'Tutorial de React',
                        'Cómo usar TypeScript',
                        'Introducción a Node.js',
                    ],
                },
                {
                    id: 'B',
                    name: 'Descripción',
                    data: [
                        'Este es mi primer video en YouTube',
                        'Aprende React desde cero',
                        'Guía completa de TypeScript',
                        'Tutorial básico de Node.js',
                    ],
                },
                {
                    id: 'C',
                    name: 'Tags',
                    data: [
                        '#youtube #principiante',
                        '#react #tutorial',
                        '#typescript #programación',
                        '#nodejs #backend',
                    ],
                },
                {
                    id: 'D',
                    name: 'Fecha Publicación',
                    data: [
                        '2024-01-15 10:00',
                        '2024-01-16 14:30',
                        '2024-01-17 09:15',
                        '2024-01-18 16:45',
                    ],
                },
                {
                    id: 'E',
                    name: 'URL Miniatura',
                    data: [
                        'https://example.com/thumb1.jpg',
                        'https://example.com/thumb2.jpg',
                        'https://example.com/thumb3.jpg',
                        'https://example.com/thumb4.jpg',
                    ],
                },
            ];

            setSheetData(mockData);
        } catch {
            setError(
                'Error al cargar los datos del Sheet. Verifica la URL y los permisos.',
            );
        } finally {
            setLoadingSheet(false);
        }
    }, []);

    const handleColumnSelect = useCallback(
        (columnId: string) => {
            if (!selectedField) return;

            setMapping((prev) => ({
                ...prev,
                [selectedField]: columnId,
            }));
            setSelectedField(null);
        },
        [selectedField],
    );

    const handleFieldSelect = useCallback((fieldKey: VideoFieldKey) => {
        setSelectedField(fieldKey);
    }, []);

    const handleRemoveMapping = useCallback((fieldKey: VideoFieldKey) => {
        setMapping((prev) => {
            const newMapping = { ...prev };
            delete newMapping[fieldKey];
            return newMapping;
        });
    }, []);

    const getMappedColumn = useCallback(
        (fieldKey: VideoFieldKey) => {
            const columnId = mapping[fieldKey];
            return columnId
                ? sheetData.find((col) => col.id === columnId)
                : null;
        },
        [mapping, sheetData],
    );

    const isValidUrl = useCallback((url: string) => {
        try {
            const urlObj = new URL(url);
            return (
                urlObj.hostname.includes('docs.google.com') &&
                url.includes('/spreadsheets/')
            );
        } catch {
            return false;
        }
    }, []);

    const handleConfirm = useCallback(() => {
        // Convert sheet data to video format based on mapping
        const videos = [];
        const maxRows = Math.max(...sheetData.map((col) => col.data.length));

        for (let i = 0; i < maxRows; i++) {
            const video: Record<string, unknown> = {
                id: Date.now().toString() + i,
                status: 'pending',
            };

            // Map each field
            for (const [fieldKey, columnId] of Object.entries(mapping)) {
                if (columnId) {
                    const column = sheetData.find((col) => col.id === columnId);
                    if (column && column.data[i]) {
                        video[fieldKey] = column.data[i];
                    }
                }
            }

            videos.push(video);
        }

        onConfirm(mapping, videos);
    }, [mapping, sheetData, onConfirm]);

    const handleReset = useCallback(() => {
        setSheetUrl('');
        setSheetData([]);
        setMapping({});
        setSelectedField(null);
        setError(null);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            handleReset();
        }
    }, [isOpen, handleReset]);

    const canConfirm = sheetData.length > 0 && Object.keys(mapping).length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sheet className="h-5 w-5" />
                        Conectar con Google Sheets
                    </DialogTitle>
                    <DialogDescription>
                        Conecta tu Google Sheet para importar datos de videos
                        automáticamente
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    {/* URL Input */}
                    <div className="mb-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sheetUrl">
                                URL del Google Sheet
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="sheetUrl"
                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                    value={sheetUrl}
                                    onChange={(e) =>
                                        setSheetUrl(e.target.value)
                                    }
                                    disabled={loadingSheet}
                                />
                                <Button
                                    onClick={() => loadSheetData()}
                                    disabled={
                                        !isValidUrl(sheetUrl) || loadingSheet
                                    }
                                    className="flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    {loadingSheet ? 'Cargando...' : 'Cargar'}
                                </Button>
                            </div>
                            {error && (
                                <div className="flex items-center gap-2 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {sheetData.length > 0 && (
                        <div className="grid h-[500px] grid-cols-3 gap-6">
                            {/* Fields to Map */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">
                                        Campos a Mapear
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Selecciona un campo y luego una columna
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[400px]">
                                        <div className="space-y-2">
                                            {VIDEO_FIELDS.filter(
                                                (field) => field.key !== 'file',
                                            ).map((field) => {
                                                const mappedColumn =
                                                    getMappedColumn(field.key);
                                                const isSelected =
                                                    selectedField === field.key;

                                                return (
                                                    <div
                                                        key={field.key}
                                                        className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                                                            isSelected
                                                                ? 'border-primary bg-primary/10'
                                                                : mappedColumn
                                                                  ? 'border-green-500 bg-green-50'
                                                                  : 'border-border hover:border-primary/50'
                                                        } `}
                                                        onClick={() =>
                                                            handleFieldSelect(
                                                                field.key,
                                                            )
                                                        }
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="text-sm font-medium">
                                                                    {
                                                                        field.label
                                                                    }
                                                                    {field.required && (
                                                                        <span className="ml-1 text-destructive">
                                                                            *
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {mappedColumn && (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        →{' '}
                                                                        {
                                                                            mappedColumn.name
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {mappedColumn && (
                                                                    <>
                                                                        <Check className="h-4 w-4 text-green-500" />
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                handleRemoveMapping(
                                                                                    field.key,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>

                            {/* Sheet Preview */}
                            <Card className="col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-sm">
                                        Vista Previa del Sheet
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Haz clic en una columna para mapear
                                        {selectedField && (
                                            <Badge
                                                variant="outline"
                                                className="ml-2"
                                            >
                                                Mapeando:{' '}
                                                {
                                                    VIDEO_FIELDS.find(
                                                        (f) =>
                                                            f.key ===
                                                            selectedField,
                                                    )?.label
                                                }
                                            </Badge>
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[400px]">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    {sheetData.map((column) => {
                                                        const isMapped =
                                                            Object.values(
                                                                mapping,
                                                            ).includes(
                                                                column.id,
                                                            );
                                                        const isSelectedColumn =
                                                            selectedField &&
                                                            mapping[
                                                                selectedField
                                                            ] === column.id;

                                                        return (
                                                            <TableHead
                                                                key={column.id}
                                                                className={`relative cursor-pointer transition-colors ${
                                                                    selectedField
                                                                        ? 'hover:bg-primary/10'
                                                                        : isMapped
                                                                          ? 'bg-green-50'
                                                                          : 'hover:bg-muted/50'
                                                                } ${isSelectedColumn ? 'bg-primary/20' : ''} `}
                                                                onClick={() =>
                                                                    selectedField &&
                                                                    handleColumnSelect(
                                                                        column.id,
                                                                    )
                                                                }
                                                            >
                                                                <div className="space-y-1">
                                                                    <div className="font-medium">
                                                                        {
                                                                            column.name
                                                                        }
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        Columna{' '}
                                                                        {
                                                                            column.id
                                                                        }
                                                                    </div>
                                                                    {isMapped && (
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="text-xs"
                                                                        >
                                                                            Mapeado
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableHead>
                                                        );
                                                    })}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {Array.from({
                                                    length: Math.min(
                                                        5,
                                                        Math.max(
                                                            ...sheetData.map(
                                                                (col) =>
                                                                    col.data
                                                                        .length,
                                                            ),
                                                        ),
                                                    ),
                                                }).map((_, rowIndex) => (
                                                    <TableRow key={rowIndex}>
                                                        {sheetData.map(
                                                            (column) => (
                                                                <TableCell
                                                                    key={
                                                                        column.id
                                                                    }
                                                                    className="max-w-[200px] truncate"
                                                                >
                                                                    {column
                                                                        .data[
                                                                        rowIndex
                                                                    ] || ''}
                                                                </TableCell>
                                                            ),
                                                        )}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!canConfirm || isLoading}
                        className="flex items-center gap-2"
                    >
                        <LinkIcon className="h-4 w-4" />
                        {isLoading ? 'Importando...' : 'Importar Datos'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
