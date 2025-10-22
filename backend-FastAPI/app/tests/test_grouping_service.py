import pytest
from pathlib import Path
from unittest.mock import patch

from app.services.grouping_service import (
    list_media,
    sort_media,
    group_paths,
    build_plan,
    _get_sortable_name,
    _generate_output_name
)
from app.models.plan import MediaGroup, Plan


class TestGroupingService:
    """Tests para el servicio de agrupamiento de medios."""

    def test_list_media_success(self, tmp_path):
        """Test que list_media encuentra archivos multimedia correctamente."""
        # Crear archivos de prueba
        video_dir = tmp_path / "videos"
        video_dir.mkdir()

        # Crear archivos de video
        (video_dir / "video001.mp4").write_text("fake mp4")
        (video_dir / "video002.MOV").write_text("fake mov")
        (video_dir / "video003.mkv").write_text("fake mkv")

        # Crear archivo no video
        (video_dir / "document.txt").write_text("not a video")

        result = list_media(video_dir)

        # Debería encontrar 3 archivos de video
        assert len(result) == 3
        assert all(p.suffix.lower() in ['.mp4', '.mov', '.mkv'] for p in result)

    def test_list_media_directory_not_exists(self, tmp_path):
        """Test que list_media lanza error si el directorio no existe."""
        non_existent = tmp_path / "nonexistent"

        with pytest.raises(ValueError) as exc_info:
            list_media(non_existent)

        assert "no existe" in str(exc_info.value)

    def test_list_media_not_directory(self, tmp_path):
        """Test que list_media lanza error si no es un directorio."""
        file_path = tmp_path / "file.txt"
        file_path.write_text("not a directory")

        with pytest.raises(ValueError) as exc_info:
            list_media(file_path)

        assert "no es un directorio" in str(exc_info.value)

    def test_sort_media_by_name(self, tmp_path):
        """Test que sort_media ordena correctamente por nombre."""
        # Crear archivos con nombres que necesitan orden especial
        files = [
            tmp_path / "video010.mp4",
            tmp_path / "video002.mp4",
            tmp_path / "video001.mp4",
            tmp_path / "video020.mp4"
        ]

        # Crear los archivos
        for f in files:
            f.write_text("fake")

        result = sort_media(files, "name")

        # Deberían estar ordenados: 001, 002, 010, 020
        expected_names = ["video001.mp4", "video002.mp4", "video010.mp4", "video020.mp4"]
        assert [p.name for p in result] == expected_names

    def test_sort_media_by_date(self, tmp_path):
        """Test que sort_media ordena correctamente por fecha."""
        # Crear archivos
        file1 = tmp_path / "video001.mp4"
        file2 = tmp_path / "video002.mp4"

        file1.write_text("fake")
        file2.write_text("fake")

        # file2 es más reciente
        file2.touch()

        result = sort_media([file1, file2], "date")

        # file1 debería ir primero (más antiguo)
        assert result[0].name == "video001.mp4"
        assert result[1].name == "video002.mp4"

    def test_sort_media_invalid_ordering(self, tmp_path):
        """Test que sort_media lanza error con ordering inválido."""
        files = [tmp_path / "video001.mp4"]

        with pytest.raises(ValueError) as exc_info:
            sort_media(files, "invalid")

        assert "ordering debe ser" in str(exc_info.value)

    def test_group_paths_basic(self, tmp_path):
        """Test que group_paths agrupa correctamente."""
        files = [
            tmp_path / f"video{i:03d}.mp4" for i in range(1, 8)
        ]

        result = group_paths(files, 3)

        # Deberían ser 3 grupos: [3, 3, 1]
        assert len(result) == 3
        assert len(result[0]) == 3
        assert len(result[1]) == 3
        assert len(result[2]) == 1

    def test_group_paths_invalid_size(self, tmp_path):
        """Test que group_paths lanza error con tamaño inválido."""
        files = [tmp_path / "video001.mp4"]

        with pytest.raises(ValueError) as exc_info:
            group_paths(files, 0)

        assert "group_size debe ser mayor que 0" in str(exc_info.value)

    def test_get_sortable_name(self):
        """Test que _get_sortable_name maneja padding correctamente."""
        test_cases = [
            ("video1.mp4", "video001.mp4"),
            ("video10.mp4", "video010.mp4"),
            ("video001.mp4", "video001.mp4"),
            ("test123file456.mp4", "test123file456.mp4"),
            ("no_numbers.mp4", "no_numbers.mp4")
        ]

        for input_name, expected in test_cases:
            result = _get_sortable_name(input_name)
            assert result == expected

    def test_generate_output_name_basic(self):
        """Test que _generate_output_name genera nombres básicos."""
        result = _generate_output_name("Semana{{week}}_Dia{{day}}.mp4", 1, 21)
        assert result == "Semana1_Dia1.mp4"

    def test_generate_output_name_with_padding(self):
        """Test que _generate_output_name maneja padding."""
        result = _generate_output_name("Semana{{week|02}}_Dia{{day|02}}.mp4", 1, 21)
        assert result == "Semana01_Dia01.mp4"

    def test_generate_output_name_week_calculation(self):
        """Test que _generate_output_name calcula semanas correctamente."""
        # Día 8 debería ser Semana 2, Día 1
        result = _generate_output_name("Semana{{week}}_Dia{{day}}.mp4", 8, 21)
        assert result == "Semana2_Dia1.mp4"

    def test_generate_output_name_all_variables(self):
        """Test que _generate_output_name maneja todas las variables."""
        result = _generate_output_name(
            "{{batch}}_{{index}}_{{week}}_{{day}}.mp4", 5, 21
        )
        assert result == "5_5_1_5.mp4"

    def test_build_plan_complete(self, tmp_path):
        """Test que build_plan crea un plan completo correctamente."""
        # Crear directorios
        source_dir = tmp_path / "source"
        output_dir = tmp_path / "output"
        source_dir.mkdir()
        output_dir.mkdir()

        # Crear archivos de video (9 archivos)
        for i in range(1, 10):
            (source_dir / f"video{i:03d}.mp4").write_text("fake")

        plan = build_plan(source_dir, output_dir, "name", 3, "Semana{{week}}_Dia{{day}}.mp4")

        # Verificaciones
        assert plan.total_inputs == 9
        assert plan.total_outputs == 3  # 9 archivos / 3 por grupo = 3 grupos

        # Verificar grupos
        assert len(plan.groups) == 3

        # Primer grupo
        group1 = plan.groups[0]
        assert group1.index == 1
        assert len(group1.inputs) == 3
        assert "video001.mp4" in group1.inputs[0]
        assert "Semana1_Dia1.mp4" in group1.output

        # Segundo grupo
        group2 = plan.groups[1]
        assert group2.index == 2
        assert len(group2.inputs) == 3
        assert "Semana1_Dia2.mp4" in group2.output

        # Tercer grupo
        group3 = plan.groups[2]
        assert group3.index == 3
        assert len(group3.inputs) == 3
        assert "Semana1_Dia3.mp4" in group3.output

    def test_build_plan_with_week_boundary(self, tmp_path):
        """Test que build_plan maneja correctamente el cambio de semana."""
        # Crear directorios
        source_dir = tmp_path / "source"
        output_dir = tmp_path / "output"
        source_dir.mkdir()
        output_dir.mkdir()

        # Crear 8 archivos (una semana completa + 1)
        for i in range(1, 9):
            (source_dir / f"video{i:03d}.mp4").write_text("fake")

        plan = build_plan(source_dir, output_dir, "name", 1, "Semana{{week}}_Dia{{day}}.mp4")

        # Verificar que el día 8 es Semana 2, Día 1
        day8_group = plan.groups[7]  # Índice 7 (0-based) = grupo 8
        assert day8_group.index == 8
        assert "Semana2_Dia1.mp4" in day8_group.output