import re
from pathlib import Path

from app.models.plan import MediaGroup, Plan


# Extensiones de video soportadas (configurable)
VIDEO_EXTENSIONS = {'.mp4', '.mov', '.mkv', '.avi', '.m4v', '.webm'}


def list_media(source_dir: str | Path) -> list[Path]:
    """
    Lista todos los archivos multimedia en el directorio fuente.

    Args:
        source_dir: Directorio donde buscar archivos multimedia

    Returns:
        Lista de rutas Path ordenadas alfabéticamente
    """
    source_path = Path(source_dir)

    if not source_path.exists():
        raise ValueError(f"El directorio {source_path} no existe")

    if not source_path.is_dir():
        raise ValueError(f"{source_path} no es un directorio")

    # Buscar archivos con extensiones de video
    media_files: list[Path] = []
    for ext in VIDEO_EXTENSIONS:
        media_files.extend(source_path.glob(f"**/*{ext}"))
        media_files.extend(source_path.glob(f"**/*{ext.upper()}"))

    # Remover duplicados y ordenar
    media_files = list(set(media_files))
    media_files.sort()

    return media_files


def sort_media(paths: list[Path], ordering: str) -> list[Path]:
    """
    Ordena los archivos multimedia por nombre o fecha de modificación.

    Args:
        paths: Lista de rutas de archivos
        ordering: Tipo de ordenamiento ('name' o 'date')

    Returns:
        Lista ordenada de rutas

    Raises:
        ValueError: Si ordering no es válido
    """
    if ordering not in ['name', 'date']:
        raise ValueError("ordering debe ser 'name' o 'date'")

    if ordering == 'name':
        return sorted(paths, key=lambda p: _get_sortable_name(p.name))
    else:  # ordering == 'date'
        return sorted(paths, key=lambda p: p.stat().st_mtime)


def _get_sortable_name(filename: str) -> str:
    """
    Convierte un nombre de archivo en una versión ordenable que respeta padding numérico.

    Solo padea números en el nombre del archivo, no en la extensión.

    Ejemplos:
    - "video1.mp4" -> "video001.mp4"
    - "video10.mp4" -> "video010.mp4"
    - "video001.mp4" -> "video001.mp4"

    Args:
        filename: Nombre del archivo

    Returns:
        Nombre ordenable con padding numérico consistente
    """
    # Separar nombre y extensión
    if '.' in filename:
        name_part, ext_part = filename.rsplit('.', 1)
        ext_part = '.' + ext_part
    else:
        name_part = filename
        ext_part = ''

    # Función para convertir números a formato con padding
    def pad_numbers(match: re.Match[str]) -> str:
        num = match.group()
        return f"{int(num):03d}"

    # Aplicar padding solo a la parte del nombre
    padded_name = re.sub(r'\d+', pad_numbers, name_part)

    return padded_name + ext_part


def group_paths(paths: list[Path], group_size: int) -> list[list[Path]]:
    """
    Agrupa las rutas en listas de tamaño group_size.

    Args:
        paths: Lista de rutas a agrupar
        group_size: Tamaño de cada grupo

    Returns:
        Lista de listas de rutas agrupadas
    """
    if group_size <= 0:
        raise ValueError("group_size debe ser mayor que 0")

    groups = []
    for i in range(0, len(paths), group_size):
        group = paths[i:i + group_size]
        if group:  # Solo agregar grupos no vacíos
            groups.append(group)

    return groups


def build_plan(
    source_dir: str | Path,
    output_dir: str | Path,
    ordering: str,
    group_size: int,
    output_pattern: str = "Semana{{week|02}}_Dia{{day|02}}.mp4"
) -> Plan:
    """
    Construye un plan completo de agrupamiento de archivos multimedia.

    Args:
        source_dir: Directorio fuente de archivos
        output_dir: Directorio de salida
        ordering: Tipo de ordenamiento ('name' o 'date')
        group_size: Tamaño de cada grupo
        output_pattern: Patrón para nombres de salida con variables:
                        {{week}}, {{day}}, {{batch}}, {{index}}
                        Soporta formato como {{week|02}} para padding

    Returns:
        Plan completo con grupos y estadísticas
    """
    # Listar y ordenar archivos
    media_files = list_media(source_dir)
    sorted_files = sort_media(media_files, ordering)

    # Agrupar archivos
    grouped_paths = group_paths(sorted_files, group_size)

    # Crear grupos con nombres de salida
    groups = []
    for idx, group_paths_list in enumerate(grouped_paths, 1):
        # Generar nombre de salida usando el patrón
        output_name = _generate_output_name(output_pattern, idx, len(grouped_paths))
        output_path = Path(output_dir) / output_name

        group = MediaGroup(
            index=idx,
            inputs=[str(p) for p in group_paths_list],
            output=str(output_path)
        )
        groups.append(group)

    return Plan(
        groups=groups,
        total_inputs=len(sorted_files),
        total_outputs=len(groups)
    )


def _generate_output_name(pattern: str, index: int, total_groups: int) -> str:
    """
    Genera un nombre de archivo de salida basado en el patrón.

    Args:
        pattern: Patrón con variables {{variable|format}}
        index: Índice del grupo (1-based)
        total_groups: Número total de grupos

    Returns:
        Nombre de archivo generado
    """
    result = pattern

    # Calcular semana y día basado en el índice
    # Asumiendo que cada grupo representa un día, y 7 días = 1 semana
    week = ((index - 1) // 7) + 1
    day = ((index - 1) % 7) + 1

    # Reemplazar variables con formato opcional
    replacements = {
        'week': week,
        'day': day,
        'batch': index,
        'index': index
    }

    for var, value in replacements.items():
        # Patrón con formato: {{variable|format}}
        formatted_pattern = r'\{\{' + var + r'(?:\|(\d+))?\}\}'
        matches = re.findall(formatted_pattern, result)

        for match in matches:
            if match:  # Tiene formato
                width = int(match)
                formatted_value = f"{value:0{width}d}"
            else:  # Sin formato
                formatted_value = str(value)

            result = re.sub(r'\{\{' + var + r'(?:\|\d+)?\}\}', formatted_value, result, count=1)

    return result


class GroupingService:
    """Servicio para agrupar y organizar archivos multimedia."""

    def __init__(self):
        """Inicializa el servicio de agrupamiento."""
        pass

    def build_plan(
        self,
        source_dir: str | Path,
        output_dir: str | Path,
        ordering: str,
        group_size: int,
        output_pattern: str = "Semana{{week|02}}_Dia{{day|02}}.mp4"
    ) -> Plan:
        """
        Construye un plan completo de agrupamiento de archivos multimedia.

        Args:
            source_dir: Directorio fuente de archivos
            output_dir: Directorio de salida
            ordering: Tipo de ordenamiento ('name' o 'date')
            group_size: Tamaño de cada grupo
            output_pattern: Patrón para nombres de salida

        Returns:
            Plan completo con grupos y estadísticas
        """
        return build_plan(source_dir, output_dir, ordering, group_size, output_pattern)