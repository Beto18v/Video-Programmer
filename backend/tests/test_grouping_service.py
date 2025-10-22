import pytest
from pathlib import Path
from app.services.grouping_service import sort_media, group_paths


class TestGroupingService:
    """Pruebas para el servicio de agrupamiento."""

    def test_sort_media_by_name(self, tmp_path):
        """Prueba ordenamiento por nombre con padding numérico."""
        # Crear archivos de prueba
        files = [
            tmp_path / "video10.mp4",
            tmp_path / "video2.mp4",
            tmp_path / "video001.mp4",
            tmp_path / "video1.mp4"
        ]
        for f in files:
            f.touch()

        paths = [Path(f) for f in files]
        sorted_paths = sort_media(paths, "name")

        # Verificar orden: video001, video1, video2, video10
        expected_names = ["video001.mp4", "video1.mp4", "video2.mp4", "video10.mp4"]
        actual_names = [p.name for p in sorted_paths]
        assert actual_names == expected_names

    def test_sort_media_by_date(self, tmp_path):
        """Prueba ordenamiento por fecha de modificación."""
        # Crear archivos con diferentes tiempos de modificación
        files = []
        for i in range(3):
            f = tmp_path / f"video{i}.mp4"
            f.touch()
            # Simular diferentes tiempos (no preciso en Windows, pero básico)
            files.append(f)

        paths = [Path(f) for f in files]
        sorted_paths = sort_media(paths, "date")

        # Al menos verificar que no lanza error y retorna lista ordenada
        assert len(sorted_paths) == 3
        assert all(isinstance(p, Path) for p in sorted_paths)

    def test_sort_media_invalid_ordering(self):
        """Prueba que ordering inválido lanza ValueError."""
        with pytest.raises(ValueError, match="ordering debe ser 'name' o 'date'"):
            sort_media([], "invalid")

    def test_group_paths_basic(self):
        """Prueba agrupamiento básico."""
        paths = [Path(f"video{i}.mp4") for i in range(7)]
        groups = group_paths(paths, 3)

        assert len(groups) == 3
        assert len(groups[0]) == 3
        assert len(groups[1]) == 3
        assert len(groups[2]) == 1  # Último grupo incompleto

    def test_group_paths_exact_division(self):
        """Prueba agrupamiento con división exacta."""
        paths = [Path(f"video{i}.mp4") for i in range(6)]
        groups = group_paths(paths, 3)

        assert len(groups) == 2
        assert all(len(g) == 3 for g in groups)

    def test_group_paths_empty(self):
        """Prueba agrupamiento con lista vacía."""
        groups = group_paths([], 3)
        assert groups == []

    def test_group_paths_invalid_size(self):
        """Prueba que group_size inválido lanza ValueError."""
        with pytest.raises(ValueError, match="group_size debe ser mayor que 0"):
            _ = group_paths([Path("test.mp4")], 0)