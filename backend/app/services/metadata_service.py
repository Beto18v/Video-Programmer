"""
Servicio de metadatos para obtener información de videos desde diferentes fuentes.

Este módulo proporciona una interfaz unificada para recuperar metadatos de videos
desde Google Sheets, archivos CSV o JSON, con soporte para OAuth local.
"""

import csv
import json
import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.oauth2 import service_account
from pydantic import BaseModel

from app.core.config import Settings


class VideoMetadata(BaseModel):
    """Modelo de metadatos para un video."""
    title: str
    description: str
    hashtags: List[str]
    thumbnail: Optional[str] = None


class MetadataService(ABC):
    """Interfaz base para servicios de metadatos."""

    @abstractmethod
    def get_metadata_for_outputs(self, n: int) -> List[Dict[str, Any]]:
        """
        Obtiene metadatos para n videos de salida.

        Args:
            n: Número de videos para los que obtener metadatos

        Returns:
            Lista de diccionarios con metadatos para cada video
        """
        pass


from app.core.config import Settings


class GoogleSheetsMetadataService(MetadataService):
    """Servicio de metadatos que lee desde Google Sheets."""

    SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

    def __init__(self, channel: str):
        """
        Inicializa el servicio de Google Sheets para un canal específico.

        Args:
            channel: Canal para el que obtener metadatos ('religion' o 'phrases')
        """
        self.channel = channel
        self.settings = Settings()

        # Configurar sheet_id y range según el canal
        if channel == "religion":
            self.sheet_id = self.settings.sheets_id_religion
            self.range_name = self.settings.sheets_range_religion
            self.column_mapping = {
                'title': 0,      # Columna I (índice 0 en el rango I2:L)
                'hashtags_tiktok': 2,  # Columna K (índice 2)
                'hashtags_youtube': 3  # Columna L (índice 3)
            }
        elif channel == "phrases":
            self.sheet_id = self.settings.sheets_id_phrases
            self.range_name = self.settings.sheets_range_phrases
            self.column_mapping = {
                'title': 0,      # Columna C (índice 0 en el rango C2:G)
                'hashtags_tiktok': 3,  # Columna F (índice 3)
                'hashtags_youtube': 4  # Columna G (índice 4)
            }
        else:
            raise ValueError(f"Canal no soportado: {channel}. Use 'religion' o 'phrases'.")

        self.creds = None
        self._ensure_credentials()

    def _ensure_credentials(self) -> None:
        """Asegura que las credenciales de Service Account estén disponibles."""
        if self.settings.google_service_account_file and self.settings.google_service_account_file.exists():
            # Usar Service Account
            self.creds = service_account.Credentials.from_service_account_file(
                str(self.settings.google_service_account_file),
                scopes=self.SCOPES
            )
        else:
            # Fallback a OAuth (para compatibilidad)
            tokens_dir = Path('.tokens/google')
            tokens_dir.mkdir(parents=True, exist_ok=True)

            token_path = tokens_dir / 'token.json'
            credentials_path = Path('credentials.json')

            if not credentials_path.exists():
                raise FileNotFoundError(
                    "Archivo credentials.json no encontrado. "
                    "Descarga las credenciales OAuth desde Google Cloud Console."
                )

            # Cargar credenciales existentes si están disponibles
            if token_path.exists():
                self.creds = Credentials.from_authorized_user_file(str(token_path), self.SCOPES)

            # Si no hay credenciales válidas, iniciar flujo OAuth
            if not self.creds or not self.creds.valid:
                if self.creds and self.creds.expired and self.creds.refresh_token:
                    self.creds.refresh(Request())
                else:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        str(credentials_path), self.SCOPES
                    )
                    self.creds = flow.run_local_server(port=8080)

                # Guardar credenciales para futuras ejecuciones
                if self.creds:
                    with open(token_path, 'w') as token_file:
                        token_file.write(self.creds.to_json())

    def get_metadata_for_outputs(self, n: int) -> List[Dict[str, Any]]:
        """
        Obtiene metadatos desde Google Sheets según el canal configurado.

        Para Religion: columnas I(título), K(hashtags_tiktok), L(hashtags_youtube) - descripción nula
        Para Phrases: columnas C(título), F(hashtags_tiktok), G(hashtags_youtube) - descripción nula
        """
        try:
            service = build('sheets', 'v4', credentials=self.creds)
            sheet = service.spreadsheets()

            result = sheet.values().get(
                spreadsheetId=self.sheet_id,
                range=self.range_name
            ).execute()

            values = result.get('values', [])

            if not values:
                return self._generate_defaults(n)

            # Procesar filas según el canal
            metadata_list = []
            for row in values:
                # Verificar que tengamos suficientes columnas según el mapping
                min_cols = max(self.column_mapping.values()) + 1
                if len(row) < min_cols:
                    continue

                # Extraer datos según el mapping del canal
                title_col = self.column_mapping['title']
                hashtags_tiktok_col = self.column_mapping['hashtags_tiktok']
                hashtags_youtube_col = self.column_mapping['hashtags_youtube']

                title = row[title_col].strip() if row[title_col] else ""

                # Para Religion y Phrases, la descripción es nula inicialmente
                description = ""

                # Procesar hashtags de TikTok
                hashtags_tiktok_str = row[hashtags_tiktok_col].strip() if len(row) > hashtags_tiktok_col and row[hashtags_tiktok_col] else ""
                hashtags_tiktok = []
                if hashtags_tiktok_str:
                    hashtags_tiktok = [
                        tag.strip().lstrip('#')
                        for tag in hashtags_tiktok_str.split(',')
                        if tag.strip()
                    ]

                # Procesar hashtags de YouTube
                hashtags_youtube_str = row[hashtags_youtube_col].strip() if len(row) > hashtags_youtube_col and row[hashtags_youtube_col] else ""
                hashtags_youtube = []
                if hashtags_youtube_str:
                    hashtags_youtube = [
                        tag.strip().lstrip('#')
                        for tag in hashtags_youtube_str.split(',')
                        if tag.strip()
                    ]

                # Combinar hashtags (tiktok + youtube) para compatibilidad con el sistema actual
                all_hashtags = hashtags_tiktok + hashtags_youtube

                metadata_list.append({
                    'title': title,
                    'description': description,
                    'hashtags': all_hashtags,
                    'hashtags_tiktok': hashtags_tiktok,
                    'hashtags_youtube': hashtags_youtube,
                    'thumbnail': None
                })

            # Rellenar con defaults si hay menos filas que n
            while len(metadata_list) < n:
                metadata_list.append(self._generate_default(len(metadata_list) + 1))

            return metadata_list[:n]

        except Exception as e:
            print(f"Error al leer Google Sheets para canal {self.channel}: {e}")
            return self._generate_defaults(n)

    def update_metadata(self, metadata_list: List[Dict[str, Any]]) -> bool:
        """
        Actualiza metadatos en Google Sheets.

        Args:
            metadata_list: Lista de diccionarios con metadatos a actualizar

        Returns:
            True si la actualización fue exitosa, False en caso contrario
        """
        try:
            service = build('sheets', 'v4', credentials=self.creds)
            sheet = service.spreadsheets()

            # Obtener el rango actual para determinar qué filas actualizar
            result = sheet.values().get(
                spreadsheetId=self.sheet_id,
                range=self.range_name
            ).execute()

            values = result.get('values', [])
            num_rows = len(values)

            # Preparar los valores a actualizar
            update_values = []
            for metadata in metadata_list:
                title = metadata.get('title', '')
                hashtags_tiktok = metadata.get('hashtags_tiktok', [])
                hashtags_youtube = metadata.get('hashtags_youtube', [])

                # Convertir listas de hashtags a strings separados por comas
                hashtags_tiktok_str = ','.join(f'#{tag}' for tag in hashtags_tiktok if tag)
                hashtags_youtube_str = ','.join(f'#{tag}' for tag in hashtags_youtube if tag)

                # Crear fila según el mapping del canal
                row = [''] * (max(self.column_mapping.values()) + 1)
                row[self.column_mapping['title']] = title
                row[self.column_mapping['hashtags_tiktok']] = hashtags_tiktok_str
                row[self.column_mapping['hashtags_youtube']] = hashtags_youtube_str

                update_values.append(row)

            # Si hay más metadatos que filas existentes, agregar filas
            if len(metadata_list) > num_rows:
                # Agregar filas vacías al final
                empty_rows = [[''] * len(update_values[0]) for _ in range(len(metadata_list) - num_rows)]
                update_values.extend(empty_rows)

                # Actualizar todo el rango
                update_range = self.range_name
            else:
                # Actualizar solo las filas existentes
                update_range = self.range_name

            # Actualizar los valores
            body = {
                'values': update_values
            }

            result = sheet.values().update(
                spreadsheetId=self.sheet_id,
                range=update_range,
                valueInputOption='RAW',
                body=body
            ).execute()

            print(f"Actualizados {result.get('updatedRows', 0)} filas en Google Sheets para canal {self.channel}")
            return True

        except Exception as e:
            print(f"Error al actualizar Google Sheets para canal {self.channel}: {e}")
            return False

    @staticmethod
    def _generate_defaults(n: int) -> List[Dict[str, Any]]:
        """Genera metadatos por defecto para n videos."""
        return [GoogleSheetsMetadataService._generate_default(i + 1) for i in range(n)]

    @staticmethod
    def _generate_default(index: int) -> Dict[str, Any]:
        """Genera metadatos por defecto para un video."""
        return {
            'title': f'Video {index}',
            'description': '',
            'hashtags': [],
            'thumbnail': None
        }


class CSVMetadataService(MetadataService):
    """Servicio de metadatos que lee desde archivo CSV."""

    def __init__(self, csv_path: str):
        """
        Inicializa el servicio CSV.

        Args:
            csv_path: Ruta al archivo CSV
        """
        self.csv_path = Path(csv_path)
        if not self.csv_path.exists():
            raise FileNotFoundError(f"Archivo CSV no encontrado: {csv_path}")

    def get_metadata_for_outputs(self, n: int) -> List[Dict[str, Any]]:
        """
        Obtiene metadatos desde archivo CSV.

        Columnas esperadas: titulo, descripcion, hashtags, miniatura
        """
        try:
            df = pd.read_csv(self.csv_path)

            # Verificar columnas requeridas
            required_cols = ['titulo', 'descripcion', 'hashtags', 'miniatura']
            missing_cols = [col for col in required_cols if col not in df.columns]
            if missing_cols:
                print(f"Columnas faltantes en CSV: {missing_cols}")
                return self._generate_defaults(n)

            metadata_list = []
            for _, row in df.iterrows():
                title = str(row.get('titulo', '')).strip()
                description = str(row.get('descripcion', '')).strip()
                hashtags_value = row.get('hashtags')
                hashtags_str = str(hashtags_value).strip() if pd.notna(hashtags_value) else ''
                thumbnail = str(row.get('miniatura', '')).strip() if pd.notna(row.get('miniatura')) else None

                # Procesar hashtags
                hashtags = []
                if hashtags_str:
                    hashtags = [
                        tag.strip().lstrip('#')
                        for tag in hashtags_str.split(',')
                        if tag.strip()
                    ]

                metadata_list.append({
                    'title': title,
                    'description': description,
                    'hashtags': hashtags,
                    'thumbnail': thumbnail
                })

            # Rellenar con defaults si necesario
            while len(metadata_list) < n:
                metadata_list.append(self._generate_default(len(metadata_list) + 1))

            return metadata_list[:n]

        except Exception as e:
            print(f"Error al leer CSV: {e}")
            return self._generate_defaults(n)

    @staticmethod
    def _generate_defaults(n: int) -> List[Dict[str, Any]]:
        """Genera metadatos por defecto para n videos."""
        return [CSVMetadataService._generate_default(i + 1) for i in range(n)]

    @staticmethod
    def _generate_default(index: int) -> Dict[str, Any]:
        """Genera metadatos por defecto para un video."""
        return {
            'title': f'Video {index}',
            'description': '',
            'hashtags': [],
            'thumbnail': None
        }


class JSONMetadataService(MetadataService):
    """Servicio de metadatos que lee desde archivo JSON."""

    def __init__(self, json_path: str):
        """
        Inicializa el servicio JSON.

        Args:
            json_path: Ruta al archivo JSON
        """
        self.json_path = Path(json_path)
        if not self.json_path.exists():
            raise FileNotFoundError(f"Archivo JSON no encontrado: {json_path}")

    def get_metadata_for_outputs(self, n: int) -> List[Dict[str, Any]]:
        """
        Obtiene metadatos desde archivo JSON.

        Estructura esperada: lista de objetos con titulo, descripcion, hashtags, miniatura
        """
        try:
            with open(self.json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if not isinstance(data, list):
                print("El archivo JSON debe contener una lista de objetos")
                return self._generate_defaults(n)

            metadata_list = []
            for item in data:
                if not isinstance(item, dict):
                    continue

                title = str(item.get('titulo', '')).strip()
                description = str(item.get('descripcion', '')).strip()
                hashtags_str = str(item.get('hashtags', '')).strip()
                thumbnail = item.get('miniatura')
                if thumbnail is not None:
                    thumbnail = str(thumbnail).strip()

                # Procesar hashtags
                hashtags = []
                if hashtags_str:
                    hashtags = [
                        tag.strip().lstrip('#')
                        for tag in hashtags_str.split(',')
                        if tag.strip()
                    ]

                metadata_list.append({
                    'title': title,
                    'description': description,
                    'hashtags': hashtags,
                    'thumbnail': thumbnail
                })

            # Rellenar con defaults si necesario
            while len(metadata_list) < n:
                metadata_list.append(self._generate_default(len(metadata_list) + 1))

            return metadata_list[:n]

        except Exception as e:
            print(f"Error al leer JSON: {e}")
            return self._generate_defaults(n)

    @staticmethod
    def _generate_defaults(n: int) -> List[Dict[str, Any]]:
        """Genera metadatos por defecto para n videos."""
        return [JSONMetadataService._generate_default(i + 1) for i in range(n)]

    @staticmethod
    def _generate_default(index: int) -> Dict[str, Any]:
        """Genera metadatos por defecto para un video."""
        return {
            'title': f'Video {index}',
            'description': '',
            'hashtags': [],
            'thumbnail': None
        }


class MetadataServiceFactory:
    """Factory para crear servicios de metadatos."""

    @staticmethod
    def create_service(config: Settings, force_source: Optional[str] = None) -> MetadataService:
        """
        Crea el servicio de metadatos apropiado basado en la configuración.

        Args:
            config: Configuración de la aplicación
            force_source: Forzar tipo de fuente (opcional)

        Returns:
            Instancia del servicio de metadatos apropiado

        Raises:
            ValueError: Si el tipo de fuente de metadatos no es válido
        """
        source_type = force_source or config.metadata_source_type

        if source_type == 'sheets':
            if not config.sheets_id or not config.sheets_range:
                raise ValueError("SHEETS_ID y SHEETS_RANGE son requeridos para fuente 'sheets'")
            return GoogleSheetsMetadataService('religion')  # Default to religion for legacy compatibility

        elif source_type == 'csv':
            if not config.csv_path:
                raise ValueError("CSV_PATH es requerido para fuente 'csv'")
            return CSVMetadataService(str(config.csv_path))

        elif source_type == 'json':
            if not config.json_path:
                raise ValueError("JSON_PATH es requerido para fuente 'json'")
            return JSONMetadataService(str(config.json_path))

        else:
            raise ValueError(f"Tipo de fuente de metadatos no válido: {source_type}")