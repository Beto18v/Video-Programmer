#!/usr/bin/env python3
"""
Servidor de desarrollo con SSL habilitado.
Para desarrollo y testing de funcionalidades HTTPS.
"""

import os
import ssl
import uvicorn
from pathlib import Path

from app.main_secure import app


def run_with_ssl():
    """
    Ejecuta el servidor con SSL para desarrollo/testing.
    """
    
    # Paths para certificados SSL
    ssl_dir = Path("ssl")
    cert_file = ssl_dir / "certificate.crt"
    key_file = ssl_dir / "private.key"
    
    # Verificar que existen los certificados
    if not cert_file.exists() or not key_file.exists():
        print("❌ Certificados SSL no encontrados.")
        print("🔧 Ejecuta: python scripts/generate_ssl_cert.py")
        print(f"   Esperando archivos en:")
        print(f"   🔑 {key_file}")
        print(f"   📜 {cert_file}")
        return
    
    print("🚀 Iniciando servidor con SSL...")
    print(f"🔒 HTTPS: https://localhost:8443")
    print(f"🔓 HTTP:  http://localhost:8000")
    print(f"📊 Docs:  https://localhost:8443/docs")
    
    # Configuración SSL
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain(cert_file, key_file)
    
    # Configurar uvicorn con SSL
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8443,  # Puerto HTTPS
        ssl_keyfile=str(key_file),
        ssl_certfile=str(cert_file),
        reload=True,
        log_level="info",
        access_log=True
    )


def run_without_ssl():
    """
    Ejecuta el servidor sin SSL (HTTP normal).
    """
    print("🚀 Iniciando servidor sin SSL...")
    print(f"🔓 HTTP: http://localhost:8000")
    print(f"📊 Docs: http://localhost:8000/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--ssl":
        run_with_ssl()
    else:
        run_without_ssl()
        print("\n💡 Para ejecutar con SSL: python run_server_ssl.py --ssl")