"""
Tests para el servicio de metadatos.
"""

import json
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from pydantic_core import ValidationError
from app.services.metadata_service import (
    CSVMetadataService,
    GoogleSheetsMetadataService,
    JSONMetadataService,
    MetadataServiceFactory
)
from app.core.config import Settings


class TestGoogleSheetsMetadataService:
    """Tests para GoogleSheetsMetadataService."""

    @patch('app.services.metadata_service.build')
    @patch('app.services.metadata_service.InstalledAppFlow')
    @patch('app.services.metadata_service.Credentials')
    @patch('pathlib.Path.exists', return_value=True)
    @patch('builtins.open')
    def test_get_metadata_for_outputs_success(self, mock_open, mock_path_exists, mock_credentials, mock_flow, mock_build):
        """Test obtención exitosa de metadatos desde Google Sheets."""
        # Mock credentials
        mock_creds = MagicMock()
        mock_credentials.from_authorized_user_file.return_value = mock_creds
        mock_creds.valid = True

        # Mock Sheets API
        mock_service = MagicMock()
        mock_sheet = MagicMock()
        mock_service.spreadsheets.return_value = mock_sheet

        mock_result = {
            'values': [
                ['Video 1', 'Descripción 1', '#tag1, #tag2', 'thumb1.jpg'],
                ['Video 2', 'Descripción 2', 'tag3,tag4', 'thumb2.jpg'],
                ['', 'Descripción 3', '', ''],
            ]
        }
        mock_sheet.values.return_value.get.return_value.execute.return_value = mock_result
        mock_build.return_value = mock_service

        service = GoogleSheetsMetadataService('sheet_id', 'range')

        metadata = service.get_metadata_for_outputs(5)

        assert len(metadata) == 5
        assert metadata[0]['title'] == 'Video 1'
        assert metadata[0]['description'] == 'Descripción 1'
        assert metadata[0]['hashtags'] == ['tag1', 'tag2']
        assert metadata[0]['thumbnail'] == 'thumb1.jpg'

        assert metadata[1]['hashtags'] == ['tag3', 'tag4']
        assert metadata[2]['hashtags'] == []

        # Verificar defaults para filas faltantes
        assert metadata[3]['title'] == 'Video 4'
        assert metadata[4]['title'] == 'Video 5'

    def test_get_metadata_for_outputs_no_credentials(self):
        """Test error cuando no hay archivo de credenciales."""
        with patch('pathlib.Path.exists', return_value=False):
            with pytest.raises(FileNotFoundError, match="credentials.json no encontrado"):
                GoogleSheetsMetadataService('sheet_id', 'range')

    def test_get_metadata_for_outputs_empty_sheet(self):
        """Test cuando la hoja está vacía."""
        with patch('pathlib.Path.exists', return_value=True):
            with patch('builtins.open'):
                with patch('app.services.metadata_service.Credentials') as mock_creds:
                    mock_creds.from_authorized_user_file.return_value.valid = True

                    with patch('app.services.metadata_service.build') as mock_build:
                        mock_service = MagicMock()
                        mock_sheet = MagicMock()
                        mock_service.spreadsheets.return_value = mock_sheet
                        mock_sheet.values.return_value.get.return_value.execute.return_value = {'values': []}
                        mock_build.return_value = mock_service

                        service = GoogleSheetsMetadataService('sheet_id', 'range')
                        metadata = service.get_metadata_for_outputs(3)

                        assert len(metadata) == 3
                        assert metadata[0]['title'] == 'Video 1'
                        assert metadata[1]['title'] == 'Video 2'
                        assert metadata[2]['title'] == 'Video 3'


class TestCSVMetadataService:
    """Tests para CSVMetadataService."""

    def test_get_metadata_for_outputs_success(self):
        """Test obtención exitosa de metadatos desde CSV."""
        csv_content = """titulo,descripcion,hashtags,miniatura
Video 1,Descripcion 1,"#tag1, #tag2",thumb1.jpg
Video 2,Descripcion 2,"tag3,tag4",thumb2.jpg
Video 3,Descripcion 3,,
"""

        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as f:
            f.write(csv_content)
            csv_path = f.name

        try:
            service = CSVMetadataService(csv_path)
            metadata = service.get_metadata_for_outputs(5)

            assert len(metadata) == 5
            assert metadata[0]['title'] == 'Video 1'
            assert metadata[0]['hashtags'] == ['tag1', 'tag2']
            assert metadata[1]['hashtags'] == ['tag3', 'tag4']
            assert metadata[2]['hashtags'] == []

            # Defaults
            assert metadata[3]['title'] == 'Video 4'
            assert metadata[4]['title'] == 'Video 5'

        finally:
            Path(csv_path).unlink()

    def test_get_metadata_for_outputs_missing_columns(self):
        """Test cuando faltan columnas en el CSV."""
        csv_content = """titulo,descripcion
Video 1,Descripción 1
"""

        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write(csv_content)
            csv_path = f.name

        try:
            service = CSVMetadataService(csv_path)
            metadata = service.get_metadata_for_outputs(2)

            # Debería retornar defaults cuando faltan columnas
            assert len(metadata) == 2
            assert metadata[0]['title'] == 'Video 1'
            assert metadata[1]['title'] == 'Video 2'

        finally:
            Path(csv_path).unlink()

    def test_get_metadata_for_outputs_file_not_found(self):
        """Test error cuando el archivo CSV no existe."""
        with pytest.raises(FileNotFoundError):
            CSVMetadataService('/nonexistent/file.csv')


class TestJSONMetadataService:
    """Tests para JSONMetadataService."""

    def test_get_metadata_for_outputs_success(self):
        """Test obtención exitosa de metadatos desde JSON."""
        json_data = [
            {
                "titulo": "Video 1",
                "descripcion": "Descripción 1",
                "hashtags": "#tag1, #tag2",
                "miniatura": "thumb1.jpg"
            },
            {
                "titulo": "Video 2",
                "descripcion": "Descripción 2",
                "hashtags": "tag3,tag4",
                "miniatura": "thumb2.jpg"
            },
            {
                "titulo": "Video 3",
                "descripcion": "Descripción 3",
                "hashtags": "",
                "miniatura": None
            }
        ]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(json_data, f)
            json_path = f.name

        try:
            service = JSONMetadataService(json_path)
            metadata = service.get_metadata_for_outputs(5)

            assert len(metadata) == 5
            assert metadata[0]['title'] == 'Video 1'
            assert metadata[0]['hashtags'] == ['tag1', 'tag2']
            assert metadata[1]['hashtags'] == ['tag3', 'tag4']
            assert metadata[2]['hashtags'] == []

            # Defaults
            assert metadata[3]['title'] == 'Video 4'
            assert metadata[4]['title'] == 'Video 5'

        finally:
            Path(json_path).unlink()

    def test_get_metadata_for_outputs_invalid_json(self):
        """Test cuando el JSON no es una lista."""
        json_data = {"not": "a list"}

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(json_data, f)
            json_path = f.name

        try:
            service = JSONMetadataService(json_path)
            metadata = service.get_metadata_for_outputs(2)

            # Debería retornar defaults
            assert len(metadata) == 2
            assert metadata[0]['title'] == 'Video 1'
            assert metadata[1]['title'] == 'Video 2'

        finally:
            Path(json_path).unlink()

    def test_get_metadata_for_outputs_file_not_found(self):
        """Test error cuando el archivo JSON no existe."""
        with pytest.raises(FileNotFoundError):
            JSONMetadataService('/nonexistent/file.json')


class TestMetadataServiceFactory:
    """Tests para MetadataServiceFactory."""

    def test_create_service_sheets(self):
        """Test creación de servicio Google Sheets."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            config = Settings(
                source_dir=temp_path,
                output_dir=temp_path,
                metadata_source_type='sheets',
                sheets_id='test_sheet_id',
                sheets_range='Test!A1:D10'
            )

            with patch('app.services.metadata_service.GoogleSheetsMetadataService'):
                service = MetadataServiceFactory.create_service(config)
                assert isinstance(service, MagicMock)  # Mocked

    def test_create_service_csv(self):
        """Test creación de servicio CSV."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as f:
                csv_path = f.name

            try:
                config = Settings(
                    source_dir=temp_path,
                    output_dir=temp_path,
                    metadata_source_type='csv',
                    csv_path=Path(csv_path)
                )

                service = MetadataServiceFactory.create_service(config)
                assert isinstance(service, CSVMetadataService)

            finally:
                Path(csv_path).unlink()

    def test_create_service_json(self):
        """Test creación de servicio JSON."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as f:
                json_path = f.name

            try:
                config = Settings(
                    source_dir=temp_path,
                    output_dir=temp_path,
                    metadata_source_type='json',
                    json_path=Path(json_path)
                )

                service = MetadataServiceFactory.create_service(config)
                assert isinstance(service, JSONMetadataService)

            finally:
                Path(json_path).unlink()

    def test_create_service_invalid_type(self):
        """Test error con tipo de fuente inválido."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            with pytest.raises(ValidationError):
                _ = Settings(
                    source_dir=temp_path,
                    output_dir=temp_path,
                    metadata_source_type='invalid'
                )

    def test_create_service_sheets_missing_config(self):
        """Test error cuando faltan configuraciones para sheets."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            config = Settings(
                source_dir=temp_path,
                output_dir=temp_path,
                metadata_source_type='sheets',
                sheets_id=None
            )

            with pytest.raises(ValueError, match="SHEETS_ID.*requeridos"):
                MetadataServiceFactory.create_service(config)

    def test_create_service_csv_missing_config(self):
        """Test error cuando falta configuración para CSV."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            config = Settings(
                source_dir=temp_path,
                output_dir=temp_path,
                metadata_source_type='csv',
                csv_path=None
            )

            with pytest.raises(ValueError, match="CSV_PATH.*requerido"):
                MetadataServiceFactory.create_service(config)