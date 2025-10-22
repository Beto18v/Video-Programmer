#!/usr/bin/env python3
"""
Script de prueba para verificar el flujo del panel con selección de canal.
"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_panel_flow():
    """Prueba el flujo completo del panel con selección de canal."""

    print("🧪 Probando flujo del panel con selección de canal...")

    # 1. Verificar página principal
    print("\n1. Verificando página principal...")
    response = requests.get(f"{BASE_URL}/panel")
    assert response.status_code == 200, f"Error en /panel: {response.status_code}"
    assert "Seleccionar Canal" in response.text, "No se encuentra título de selección"
    print("✅ Página principal OK")

    # 2. Verificar selección de canal (religion)
    print("\n2. Verificando selección de canal 'religion'...")
    response = requests.get(f"{BASE_URL}/panel/channel/religion")
    if response.status_code == 302:  # Redirect to OAuth
        print("⚠️  Redirigiendo a OAuth (token no existe) - esto es esperado")
        oauth_url = response.headers.get('location', '')
        assert 'oauth2/authorize/youtube/religion' in oauth_url, f"Redirect incorrecto: {oauth_url}"
        print("✅ Redirect a OAuth correcto")
    else:
        assert response.status_code == 200, f"Error en /panel/channel/religion: {response.status_code}"
        assert "religion" in response.text, "Canal no aparece en la página"
        print("✅ Selección de canal OK")

    # 3. Verificar navegación en base.html
    print("\n3. Verificando navegación con canal...")
    response = requests.get(f"{BASE_URL}/panel/channel/beto")
    if response.status_code == 200:
        assert "Canal: BETO" in response.text, "Canal no aparece en navegación"
        assert "/panel/channel/beto" in response.text, "Enlace a videos no encontrado"
        assert "/panel/salida/beto" in response.text, "Enlace a salida no encontrado"
        assert "/panel/publish/beto/edit" in response.text, "Enlace a publicar no encontrado"
        print("✅ Navegación con canal OK")

    print("\n🎉 Todos los tests del panel pasaron!")

if __name__ == "__main__":
    # Verificar que el servidor esté corriendo
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print("❌ El servidor no está corriendo. Ejecuta: python run_server.py")
            exit(1)
    except:
        print("❌ El servidor no está corriendo. Ejecuta: python run_server.py")
        exit(1)

    test_panel_flow()