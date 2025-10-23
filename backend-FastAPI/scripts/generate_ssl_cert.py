#!/usr/bin/env python3
"""
Script para generar certificados SSL auto-firmados para desarrollo.
Para producción, use Let's Encrypt o certificados comerciales.
"""

import subprocess
import sys
from pathlib import Path

def generate_ssl_cert():
    """Genera certificados SSL auto-firmados para desarrollo."""
    
    cert_dir = Path("ssl")
    cert_dir.mkdir(exist_ok=True)
    
    # Paths para los certificados
    key_file = cert_dir / "private.key"
    cert_file = cert_dir / "certificate.crt"
    
    # Comando para generar certificado auto-firmado
    cmd = [
        "openssl", "req", "-x509", "-newkey", "rsa:4096",
        "-keyout", str(key_file),
        "-out", str(cert_file),
        "-days", "365",
        "-nodes",
        "-subj", "/C=CO/ST=State/L=City/O=Organization/CN=localhost"
    ]
    
    try:
        _ = subprocess.run(cmd, check=True)
        print(f"✅ Certificados SSL generados:")
        print(f"   🔑 Clave privada: {key_file}")
        print(f"   📜 Certificado: {cert_file}")
        print(f"\n💡 Para usar con Uvicorn:")
        print(f"   uvicorn app.main:app --ssl-keyfile={key_file} --ssl-certfile={cert_file} --port=8443")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error generando certificados: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("❌ OpenSSL no encontrado. Instale OpenSSL primero.")
        print("   Windows: https://slproweb.com/products/Win32OpenSSL.html")
        print("   Linux: apt-get install openssl")
        print("   macOS: brew install openssl")
        sys.exit(1)

if __name__ == "__main__":
    generate_ssl_cert()