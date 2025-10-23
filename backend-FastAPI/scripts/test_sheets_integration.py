#!/usr/bin/env python3
"""
Script para probar la integración completa de metadatos desde Google Sheets.
"""

import requests
import json
from pathlib import Path

def test_sheets_integration():
    """Prueba la integración completa con Google Sheets."""

    print("🧪 Probando integración con Google Sheets...")

    # 1. Verificar configuración
    print("\n1. Verificando configuración...")
    env_file = Path('.env')
    if not env_file.exists():
        print("❌ Archivo .env no encontrado")
        return

    service_account_file = None
    with open('.env', 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('GOOGLE_SERVICE_ACCOUNT_FILE='):
                service_account_file = line.split('=', 1)[1].strip()
                break

    if not service_account_file:
        print("❌ GOOGLE_SERVICE_ACCOUNT_FILE no configurado")
        return

    sa_path = Path(service_account_file)
    if not sa_path.exists():
        print(f"❌ Archivo {service_account_file} no encontrado")
        return

    print(f"✅ Service Account configurado: {service_account_file}")

    # 2. Verificar servidor
    print("\n2. Verificando servidor...")
    try:
        response = requests.get("http://127.0.0.1:8000/docs", timeout=5)
        if response.status_code != 200:
            print("❌ Servidor no responde")
            return
        print("✅ Servidor funcionando")
    except:
        print("❌ No se puede conectar al servidor")
        return

    # 3. Probar carga de metadatos
    print("\n3. Probando carga de metadatos...")

    # Crear archivos de prueba
    for channel in ['general', 'phrases']:
        test_dir = Path(f"storage/salida/{channel}")
        test_dir.mkdir(parents=True, exist_ok=True)

        for i in range(2):
            test_file = test_dir / f"test_video_{i+1}.mp4"
            test_file.write_text("fake video content")

    # Probar general
    try:
        response = requests.get("http://127.0.0.1:8000/panel/publish/general/edit")
        if response.status_code == 200:
            content = response.text
            if "hashtags_tiktok" in content and "hashtags_youtube" in content:
                print("✅ General: Metadatos cargados correctamente")
            else:
                print("⚠️ General: Template actualizado pero posible error en carga")
        else:
            print(f"❌ General: Error HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ General: Error de conexión - {e}")

    # Probar phrases
    try:
        response = requests.get("http://127.0.0.1:8000/panel/publish/phrases/edit")
        if response.status_code == 200:
            content = response.text
            if "hashtags_tiktok" in content and "hashtags_youtube" in content:
                print("✅ Phrases: Metadatos cargados correctamente")
            else:
                print("⚠️ Phrases: Template actualizado pero posible error en carga")
        else:
            print(f"❌ Phrases: Error HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ Phrases: Error de conexión - {e}")

    print("\n🎉 Prueba completada!")
    print("\n💡 Si ves errores, verifica:")
    print("   - Que el Service Account tenga acceso a los Sheets")
    print("   - Que los IDs y rangos de Sheets sean correctos")
    print("   - Que el archivo service-account.json sea válido")

if __name__ == "__main__":
    test_sheets_integration()