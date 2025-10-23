#!/usr/bin/env python3
"""
Script de instalación y configuración para las mejoras de seguridad.
"""

import os
import subprocess
import sys
from pathlib import Path


def run_command(cmd, description=""):
    """Ejecuta un comando y maneja errores."""
    print(f"📦 {description}")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} - Completado")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Error: {e.stderr}")
        return False


def create_directories():
    """Crea directorios necesarios."""
    dirs = ["logs", "ssl", "storage", "monitoring"]
    
    for dir_name in dirs:
        path = Path(dir_name)
        if not path.exists():
            path.mkdir(parents=True, exist_ok=True)
            print(f"✅ Directorio creado: {dir_name}")
        else:
            print(f"ℹ️ Directorio ya existe: {dir_name}")


def setup_environment_file():
    """Configura el archivo .env."""
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if not env_file.exists():
        if env_example.exists():
            import shutil
            shutil.copy(env_example, env_file)
            print("✅ Archivo .env creado desde .env.example")
        else:
            # Crear .env básico
            env_content = """# Environment Configuration
ENVIRONMENT=development
SECRET_KEY=your-secret-key-change-this-in-production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/video_programmer
POSTGRES_PASSWORD=postgres

# Redis (opcional para rate limiting distribuido)
REDIS_URL=redis://localhost:6379/0

# Logging
LOG_LEVEL=INFO

# Security
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
"""
            env_file.write_text(env_content)
            print("✅ Archivo .env básico creado")
    else:
        print("ℹ️ Archivo .env ya existe")


def install_poetry_dependencies():
    """Instala dependencias usando Poetry."""
    if run_command("poetry --version", "Verificando Poetry"):
        if run_command("poetry install", "Instalando dependencias con Poetry"):
            return True
    
    print("⚠️ Poetry no encontrado, intentando con pip...")
    return False


def install_pip_dependencies():
    """Instala dependencias usando pip."""
    # Crear requirements.txt actualizado
    requirements = """fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic-settings>=2.0.0
python-dotenv>=1.0.0
python-dateutil>=2.8.0
pytz>=2023.3
google-api-python-client>=2.100.0
google-auth>=2.23.0
google-auth-oauthlib>=1.1.0
google-auth-httplib2>=0.1.1
httpx>=0.24.0
pandas>=2.0.0
pytest>=7.4.0
loguru>=0.7.0
sqlalchemy>=2.0.0
alembic>=1.12.0
psycopg2-binary>=2.9.0
authlib>=1.2.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.0
python-multipart>=0.0.6
starlette>=0.27.0
redis>=5.0.0
bleach>=6.0.0
python-magic>=0.4.27
cryptography>=41.0.0
slowapi>=0.1.9
prometheus-client>=0.17.0
email-validator>=2.0.0
"""
    
    requirements_file = Path("requirements-security.txt")
    requirements_file.write_text(requirements)
    
    return run_command(
        f"{sys.executable} -m pip install -r requirements-security.txt", 
        "Instalando dependencias de seguridad"
    )


def generate_ssl_certificates():
    """Genera certificados SSL para desarrollo."""
    ssl_dir = Path("ssl")
    cert_file = ssl_dir / "certificate.crt"
    key_file = ssl_dir / "private.key"
    
    if not cert_file.exists() or not key_file.exists():
        print("🔐 Generando certificados SSL para desarrollo...")
        if run_command("python scripts/generate_ssl_cert.py", "Generando certificados SSL"):
            print("✅ Certificados SSL generados")
        else:
            print("⚠️ No se pudieron generar certificados SSL automáticamente")
            print("   Ejecuta manualmente: python scripts/generate_ssl_cert.py")
    else:
        print("ℹ️ Certificados SSL ya existen")


def setup_database():
    """Configura la base de datos."""
    print("🗄️ Configurando base de datos...")
    
    # Verificar si PostgreSQL está disponible
    if run_command("psql --version", "Verificando PostgreSQL"):
        print("✅ PostgreSQL encontrado")
        
        # Intentar crear base de datos
        db_cmd = """psql -c "CREATE DATABASE video_programmer;" -U postgres"""
        if run_command(db_cmd, "Creando base de datos"):
            print("✅ Base de datos creada")
        else:
            print("ℹ️ Base de datos puede que ya exista")
    else:
        print("⚠️ PostgreSQL no encontrado. Instala PostgreSQL o usa SQLite para desarrollo")


def create_monitoring_config():
    """Crea configuración para monitoreo."""
    monitoring_dir = Path("monitoring")
    prometheus_config = monitoring_dir / "prometheus.yml"
    
    if not prometheus_config.exists():
        config_content = """global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'video-programmer-api'
    static_configs:
      - targets: ['api:8000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
"""
        prometheus_config.write_text(config_content)
        print("✅ Configuración de Prometheus creada")
    else:
        print("ℹ️ Configuración de Prometheus ya existe")


def run_security_tests():
    """Ejecuta las pruebas de seguridad."""
    print("🧪 ¿Ejecutar pruebas de seguridad? (y/n): ", end="")
    response = input().lower().strip()
    
    if response in ['y', 'yes', 'sí', 's']:
        if run_command("python scripts/test_security.py", "Ejecutando pruebas de seguridad"):
            print("✅ Pruebas de seguridad completadas")
        else:
            print("⚠️ Algunas pruebas de seguridad fallaron")


def main():
    """Función principal de instalación."""
    print("🚀 Instalador de Mejoras de Seguridad - Video Programmer API")
    print("=" * 60)
    
    # Verificar que estamos en el directorio correcto
    if not Path("app").exists() or not Path("pyproject.toml").exists():
        print("❌ Error: Ejecuta este script desde el directorio raíz del proyecto")
        sys.exit(1)
    
    steps = [
        ("Creando directorios", create_directories),
        ("Configurando archivo de entorno", setup_environment_file),
        ("Instalando dependencias", lambda: install_poetry_dependencies() or install_pip_dependencies()),
        ("Generando certificados SSL", generate_ssl_certificates),
        ("Configurando base de datos", setup_database),
        ("Creando configuración de monitoreo", create_monitoring_config),
    ]
    
    success_count = 0
    
    for description, func in steps:
        print(f"\n📋 {description}...")
        try:
            func()
            success_count += 1
        except Exception as e:
            print(f"❌ Error en {description}: {e}")
    
    print(f"\n📊 Instalación completada: {success_count}/{len(steps)} pasos exitosos")
    
    if success_count == len(steps):
        print("\n🎉 ¡Instalación completada exitosamente!")
        print("\n🚀 Próximos pasos:")
        print("1. Revisa y ajusta el archivo .env")
        print("2. Ejecuta: python -m app.main_secure")
        print("3. Para SSL: python run_server_ssl.py --ssl")
        print("4. Para Docker: docker-compose -f docker-compose.secure.yml up")
        
        run_security_tests()
    else:
        print("\n⚠️ Instalación completada con algunos errores")
        print("Revisa los mensajes de error arriba y ejecuta los pasos fallidos manualmente")


if __name__ == "__main__":
    main()