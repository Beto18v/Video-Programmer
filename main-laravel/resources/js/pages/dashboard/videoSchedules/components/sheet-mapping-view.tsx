import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
    AlertCircle,
    Check,
    Download,
    Link as LinkIcon,
    Sheet,
    X,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import {
    SheetColumn,
    SheetMapping,
    VIDEO_FIELDS,
    VideoFieldKey,
} from '../types';

interface SheetMappingViewProps {
    sheetState: {
        url: string;
        selectedSheet?: string;
        sheets?: Array<{ name: string; index: number }>;
        data: SheetColumn[];
        mapping: SheetMapping;
    };
    onStateChange: (
        state: {
            url: string;
            selectedSheet?: string;
            sheets?: Array<{ name: string; index: number }>;
            data: SheetColumn[];
            mapping: SheetMapping;
        } | null,
    ) => void;
    onConfirm: (mapping: SheetMapping, data: Record<string, unknown>[]) => void;
    onCancel: () => void;
}

export function SheetMappingView({
    sheetState,
    onStateChange,
    onConfirm,
    onCancel,
}: SheetMappingViewProps) {
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
            // First check if user has valid credentials
            console.log('Checking credentials...');
            const credentialsResponse = await fetch(
                '/api/sheets/check-credentials',
                {
                    method: 'GET',
                    headers: {
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                },
            );

            console.log(
                'Credentials response status:',
                credentialsResponse.status,
            );

            let errorData;
            try {
                errorData = await credentialsResponse.json();
                console.log('Credentials response data:', errorData);
            } catch (parseError) {
                console.error('Failed to parse response JSON:', parseError);
                throw new Error(
                    `Server error (${credentialsResponse.status}): ${credentialsResponse.statusText}`,
                );
            }

            if (!credentialsResponse.ok) {
                throw new Error(
                    errorData.message ||
                        errorData.error ||
                        'Error al verificar credenciales',
                );
            }

            const credentialsData = errorData;

            if (!credentialsData.hasCredentials) {
                if (credentialsData.redirectUrl) {
                    // Open authentication in popup
                    const authWindow = window.open(
                        credentialsData.redirectUrl,
                        'google-auth',
                        'width=600,height=700,scrollbars=yes,resizable=yes',
                    );

                    if (authWindow) {
                        // Poll for authentication completion
                        const checkAuth = setInterval(() => {
                            try {
                                // Check if popup is closed
                                if (authWindow.closed) {
                                    clearInterval(checkAuth);
                                    // Reload the page to check credentials again
                                    window.location.reload();
                                    return;
                                }
                            } catch {
                                // Cross-origin error, popup might be on different domain
                                clearInterval(checkAuth);
                                // Wait a bit and reload
                                setTimeout(() => {
                                    window.location.reload();
                                }, 2000);
                            }
                        }, 1000);
                    } else {
                        setError(
                            'No se pudo abrir la ventana de autenticación. Verifica que los popups estén habilitados.',
                        );
                    }
                    return;
                }
                throw new Error(credentialsData.message);
            }

            console.log('Credentials valid, loading sheet metadata...');
            // If credentials are valid, load sheet metadata (tabs)
            const metadataResponse = await fetch('/api/sheets/tabs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({ url: sheetState.url }),
            });

            if (!metadataResponse.ok) {
                const errorData = await metadataResponse.json();
                throw new Error(
                    errorData.error || 'Error al cargar las pestañas del Sheet',
                );
            }

            const metadata = await metadataResponse.json();

            // Load data for the selected sheet (or first sheet if none selected)
            const selectedSheet = sheetState.selectedSheet || metadata[0]?.name;

            const dataResponse = await fetch('/api/sheets/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    url: sheetState.url,
                    sheet_name: selectedSheet,
                }),
            });

            if (!dataResponse.ok) {
                const errorData = await dataResponse.json();
                throw new Error(
                    errorData.error || 'Error al cargar los datos del Sheet',
                );
            }

            const data = await dataResponse.json();
            onStateChange({
                ...sheetState,
                sheets: metadata,
                selectedSheet,
                data,
            });
        } catch (err) {
            console.error('Load sheet data error:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Error al cargar los datos del Sheet. Verifica la URL y los permisos.',
            );
        } finally {
            setLoadingSheet(false);
        }
    }, [sheetState, onStateChange]);

    const handleSheetChange = useCallback(
        async (sheetName: string) => {
            setLoadingSheet(true);
            setError(null);

            try {
                const response = await fetch('/api/sheets/data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        url: sheetState.url,
                        sheet_name: sheetName,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.error ||
                            'Error al cargar los datos del Sheet',
                    );
                }

                const data = await response.json();
                onStateChange({
                    ...sheetState,
                    selectedSheet: sheetName,
                    data,
                    mapping: {}, // Reset mapping when changing sheets
                });
                setSelectedField(null);
            } catch (err) {
                console.error('Load sheet data error:', err);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Error al cargar los datos del Sheet.',
                );
            } finally {
                setLoadingSheet(false);
            }
        },
        [sheetState, onStateChange],
    );

    const handleColumnSelect = useCallback(
        (columnId: string) => {
            if (!selectedField) return;

            const newMapping = {
                ...sheetState.mapping,
                [selectedField]: columnId,
            };
            onStateChange({
                ...sheetState,
                mapping: newMapping,
            });
            setSelectedField(null);
        },
        [selectedField, sheetState, onStateChange],
    );

    const handleFieldSelect = useCallback((fieldKey: VideoFieldKey) => {
        setSelectedField(fieldKey);
    }, []);

    const handleRemoveMapping = useCallback(
        (fieldKey: VideoFieldKey) => {
            const newMapping = { ...sheetState.mapping };
            delete newMapping[fieldKey];
            onStateChange({
                ...sheetState,
                mapping: newMapping,
            });
        },
        [sheetState, onStateChange],
    );

    const getMappedColumn = useCallback(
        (fieldKey: VideoFieldKey) => {
            const columnId = sheetState.mapping[fieldKey];
            return columnId
                ? sheetState.data.find((col) => col.id === columnId)
                : null;
        },
        [sheetState.mapping, sheetState.data],
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
        const maxRows = Math.max(
            ...sheetState.data.map((col) => col.data.length),
        );

        for (let i = 0; i < maxRows; i++) {
            const video: Record<string, unknown> = {
                id: Date.now().toString() + i,
                status: 'pending',
            };

            // Map each field
            for (const [fieldKey, columnId] of Object.entries(
                sheetState.mapping,
            )) {
                if (columnId) {
                    const column = sheetState.data.find(
                        (col) => col.id === columnId,
                    );
                    if (column && column.data[i]) {
                        video[fieldKey] = column.data[i];
                    }
                }
            }

            videos.push(video);
        }

        onConfirm(sheetState.mapping, videos);
    }, [sheetState, onConfirm]);

    const canConfirm =
        sheetState.data.length > 0 &&
        Object.keys(sheetState.mapping).length > 0;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sheet className="h-5 w-5" />
                        Conectar con Google Sheets
                    </CardTitle>
                    <CardDescription>
                        Conecta tu Google Sheet para importar datos de videos
                        automáticamente
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* URL Input */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sheetUrl">
                                URL del Google Sheet
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="sheetUrl"
                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                    value={sheetState.url}
                                    onChange={(e) =>
                                        onStateChange({
                                            ...sheetState,
                                            url: e.target.value,
                                        })
                                    }
                                    disabled={loadingSheet}
                                />
                                <Button
                                    onClick={loadSheetData}
                                    disabled={
                                        !isValidUrl(sheetState.url) ||
                                        loadingSheet
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
                </CardContent>
            </Card>

            {sheetState.data.length > 0 && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Fields to Map */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-sm">
                                Campos a Mapear
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Selecciona un campo y luego una columna del
                                sheet
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {VIDEO_FIELDS.filter(
                                    (field: {
                                        key: string;
                                        label: string;
                                        required: boolean;
                                    }) => field.key !== 'file',
                                ).map(
                                    (field: {
                                        key: VideoFieldKey;
                                        label: string;
                                        required: boolean;
                                    }) => {
                                        const mappedColumn = getMappedColumn(
                                            field.key,
                                        );
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
                                                    handleFieldSelect(field.key)
                                                }
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate text-sm font-medium">
                                                            {field.label}
                                                            {field.required && (
                                                                <span className="ml-1 text-destructive">
                                                                    *
                                                                </span>
                                                            )}
                                                        </div>
                                                        {mappedColumn && (
                                                            <div className="truncate text-xs text-muted-foreground">
                                                                →{' '}
                                                                {
                                                                    mappedColumn.name
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-2 flex items-center gap-1">
                                                        {mappedColumn && (
                                                            <>
                                                                <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
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
                                    },
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sheet Preview */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-sm">
                                Vista Previa de tu Google Sheet
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Verifica que los datos sean correctos. Haz clic
                                en una columna para mapear
                                {selectedField && (
                                    <Badge variant="outline" className="ml-2">
                                        Mapeando:{' '}
                                        {
                                            VIDEO_FIELDS.find(
                                                (f: {
                                                    key: VideoFieldKey;
                                                    label: string;
                                                    required: boolean;
                                                }) => f.key === selectedField,
                                            )?.label
                                        }
                                    </Badge>
                                )}
                            </CardDescription>
                            {sheetState.sheets &&
                                sheetState.sheets.length > 1 && (
                                    <div className="mt-2">
                                        <Label
                                            htmlFor="sheet-select"
                                            className="text-xs"
                                        >
                                            Seleccionar Pestaña:
                                        </Label>
                                        <Select
                                            value={sheetState.selectedSheet}
                                            onValueChange={handleSheetChange}
                                            disabled={loadingSheet}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Seleccionar pestaña" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sheetState.sheets.map(
                                                    (sheet) => (
                                                        <SelectItem
                                                            key={sheet.name}
                                                            value={sheet.name}
                                                        >
                                                            {sheet.name}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px] w-full">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {sheetState.data.map((column) => {
                                                const isMapped = Object.values(
                                                    sheetState.mapping,
                                                ).includes(column.id);
                                                const isSelectedColumn =
                                                    selectedField &&
                                                    sheetState.mapping[
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
                                                                {column.name}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Columna{' '}
                                                                {column.id}
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
                                            length: Math.max(
                                                ...sheetState.data.map(
                                                    (col) => col.data.length,
                                                ),
                                            ),
                                        }).map((_, rowIndex) => (
                                            <TableRow key={rowIndex}>
                                                {sheetState.data.map(
                                                    (column) => (
                                                        <TableCell
                                                            key={column.id}
                                                            className="max-w-[200px] truncate"
                                                        >
                                                            {column.data[
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

            <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                    className="flex items-center gap-2"
                >
                    <LinkIcon className="h-4 w-4" />
                    Importar Datos
                </Button>
            </div>
        </div>
    );
}
