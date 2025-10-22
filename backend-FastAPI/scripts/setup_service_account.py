#!/usr/bin/env python3
"""
Guía para configurar Google Service Account para Google Sheets API.

Este script te ayudará a configurar el acceso a Google Sheets sin necesidad
de autenticación OAuth interactiva.
"""

import json
from pathlib import Path

def setup_service_account_guide():
    """Muestra la guía para configurar Service Account."""

    print("🔐 Configuración de Google Service Account para Sheets API")
    print("=" * 60)

    print("\n📋 PASOS PARA CONFIGURAR:")
    print("\n1. Ve a Google Cloud Console: https://console.cloud.google.com/")
    print("2. Selecciona tu proyecto (o crea uno nuevo)")
    print("3. Habilita la Google Sheets API:")
    print("   - Ve a 'APIs & Services' > 'Library'")
    print("   - Busca 'Google Sheets API' y habilítala")

    print("\n4. Crea una Service Account:")
    print("   - Ve a 'APIs & Services' > 'Credentials'")
    print("   - Click 'Create Credentials' > 'Service Account'")
    print("   - Nombre: 'video-programmer-sheets' (o el que prefieras)")
    print("   - Descripción: 'Service account for automated Sheets access'")
    print("   - Click 'Create and Continue' (puedes saltar los permisos)")

    print("\n5. Crea una clave JSON:")
    print("   - En la lista de Service Accounts, click en la que acabas de crear")
    print("   - Ve a la pestaña 'Keys'")
    print("   - Click 'Add Key' > 'Create new key' > 'JSON'")
    print("   - El archivo se descargará automáticamente")

    print("\n6. Comparte el Sheet con la Service Account:")
    print("   - Abre tu Google Sheet")
    print("   - Click 'Share' en la esquina superior derecha")
    print("   - Pega el email de la Service Account (termina en @PROJECT.iam.gserviceaccount.com)")
    print("   - Dale permisos de 'Viewer' (suficiente para leer)")

    print("\n7. Coloca el archivo JSON en el proyecto:")
    print("   - Mueve el archivo descargado a la raíz del proyecto")
    print("   - Renómbralo como 'service-account.json' (o el nombre que prefieras)")

    print("\n8. Actualiza el .env:")
    print("   - Agrega la línea:")
    print("     GOOGLE_SERVICE_ACCOUNT_FILE=service-account.json")

    print("\n✅ Una vez completado, reinicia el servidor y prueba la integración.")

    print("\n" + "=" * 60)
    print("💡 NOTA: La Service Account no requiere autenticación interactiva")
    print("   y es perfecta para acceso automatizado a Sheets.")

def check_service_account_file():
    """Verifica si el archivo de Service Account existe y es válido."""

    env_file = Path('.env')
    if not env_file.exists():
        print("❌ Archivo .env no encontrado")
        return False

    # Leer el .env para encontrar la configuración
    service_account_file = None
    with open('.env', 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('GOOGLE_SERVICE_ACCOUNT_FILE='):
                service_account_file = line.split('=', 1)[1].strip()
                break

    if not service_account_file:
        print("❌ GOOGLE_SERVICE_ACCOUNT_FILE no configurado en .env")
        return False

    sa_path = Path(service_account_file)
    if not sa_path.exists():
        print(f"❌ Archivo de Service Account no encontrado: {service_account_file}")
        return False

    # Verificar que sea un JSON válido
    try:
        with open(sa_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        required_fields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email']
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            print(f"❌ Campos faltantes en el archivo JSON: {missing_fields}")
            return False

        if data.get('type') != 'service_account':
            print("❌ El archivo no es de tipo 'service_account'")
            return False

        print(f"✅ Archivo de Service Account válido: {service_account_file}")
        print(f"   📧 Email: {data.get('client_email')}")
        print(f"   🏗️ Proyecto: {data.get('project_id')}")

        return True

    except json.JSONDecodeError:
        print(f"❌ El archivo {service_account_file} no es un JSON válido")
        return False
    except Exception as e:
        print(f"❌ Error al verificar el archivo: {e}")
        return False

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        # Solo verificar configuración existente
        check_service_account_file()
    else:
        # Mostrar guía completa
        setup_service_account_guide()
        print("\n🔍 Verificando configuración actual...")
        check_service_account_file()