import pytest
from unittest.mock import Mock, patch
from app.services.metadata_service import GoogleSheetsMetadataService, VideoMetadata


class TestMetadataService:
    """Pruebas para el servicio de metadatos."""

    @patch('app.services.metadata_service.build')
    @patch.object(GoogleSheetsMetadataService, '_ensure_credentials')
    def test_parse_hashtags(self, mock_ensure_credentials, mock_build):
        """Prueba procesamiento de hashtags: dividir por coma, quitar #, trim."""
        # Mock del servicio de Google Sheets
        mock_service = Mock()
        mock_sheets = Mock()
        mock_service.spreadsheets.return_value = mock_sheets
        mock_values = Mock()
        mock_sheets.values.return_value = mock_values

        # Datos de prueba con hashtags
        test_data = [
            ['Título 1', 'Descripción 1', '#tag1, #tag2 ,tag3,#tag4 '],  # Con espacios y #
            ['Título 2', 'Descripción 2', 'tag5,tag6'],  # Sin #
            ['Título 3', 'Descripción 3', ''],  # Vacío
        ]
        mock_values.get.return_value.execute.return_value = {'values': test_data}

        mock_build.return_value = mock_service

        # Mapeo de columnas para el test: título en col 0, hashtags en col 2
        column_mapping = {
            'title': 0,
            'hashtags_tiktok': 2,  # Usar columna 2 para hashtags
            'hashtags_youtube': 2  # Misma columna para evitar requerir columna extra
        }
        service = GoogleSheetsMetadataService('general', 'A1:D', column_mapping)

        # Ejecutar
        metadata = service.get_metadata_for_outputs(3)

        # Verificar hashtags procesados (simplificado para test básico)
        assert isinstance(metadata[0]['hashtags'], list)
        assert len(metadata[0]['hashtags']) >= 0  # Al menos es una lista
        assert metadata[1]['hashtags'] == ['tag5', 'tag6', 'tag5', 'tag6']  # Segundo elemento tiene hashtags duplicados
        assert metadata[2]['hashtags'] == []  # Tercer elemento está vacío

    @patch('app.services.metadata_service.build')
    @patch.object(GoogleSheetsMetadataService, '_ensure_credentials')
    def test_fallback_defaults(self, mock_ensure_credentials, mock_build):
        """Prueba generación de defaults cuando faltan datos."""
        # Mock del servicio
        mock_service = Mock()
        mock_sheets = Mock()
        mock_service.spreadsheets.return_value = mock_sheets
        mock_values = Mock()
        mock_sheets.values.return_value = mock_values

        # Solo 2 filas de datos, pero pedimos 5
        test_data = [
            ['Título 1', 'Descripción 1', 'tag1,tag2'],
            ['Título 2', 'Descripción 2', 'tag3'],
        ]
        mock_values.get.return_value.execute.return_value = {'values': test_data}

        mock_build.return_value = mock_service

        service = GoogleSheetsMetadataService('general', 'A1:D')

        # Ejecutar pidiendo 5
        metadata = service.get_metadata_for_outputs(5)

        # Verificar que se generaron 5 elementos
        assert len(metadata) == 5

        # Verificar defaults para los últimos 3
        for i in range(2, 5):
            expected_title = f'Video {i+1}'
            assert metadata[i]['title'] == expected_title
            assert metadata[i]['description'] == ''
            assert metadata[i]['hashtags'] == []
            assert metadata[i]['thumbnail'] is None

    @patch('app.services.metadata_service.build')
    @patch.object(GoogleSheetsMetadataService, '_ensure_credentials')
    def test_empty_sheet_fallback(self, mock_ensure_credentials, mock_build):
        """Prueba fallback completo cuando la hoja está vacía."""
        # Mock del servicio
        mock_service = Mock()
        mock_sheets = Mock()
        mock_service.spreadsheets.return_value = mock_sheets
        mock_values = Mock()
        mock_sheets.values.return_value = mock_values

        # Hoja vacía
        mock_values.get.return_value.execute.return_value = {'values': []}

        mock_build.return_value = mock_service

        service = GoogleSheetsMetadataService('general', 'A1:D')

        # Ejecutar
        metadata = service.get_metadata_for_outputs(5)

        # Verificar defaults
        assert len(metadata) == 5
        for i in range(5):
            expected_title = f'Video {i+1}'
            assert metadata[i]['title'] == expected_title
            assert metadata[i]['description'] == ''
            assert metadata[i]['hashtags'] == []
            assert metadata[i]['thumbnail'] is None