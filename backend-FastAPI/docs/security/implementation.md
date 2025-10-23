# Video Programmer API - Security Guide

Este documento describe las mejoras de seguridad implementadas en el backend FastAPI y cómo utilizarlas.

## 🔒 Características de Seguridad Implementadas

### 1. HTTPS en Producción

#### Con Nginx (Recomendado para Producción)

```bash
# 1. Configurar Nginx como reverse proxy
sudo cp docs/nginx-ssl.conf /etc/nginx/sites-available/video-programmer
sudo ln -s /etc/nginx/sites-available/video-programmer /etc/nginx/sites-enabled/

# 2. Obtener certificados SSL (Let's Encrypt)
sudo certbot --nginx -d your-domain.com

# 3. Reiniciar Nginx
sudo systemctl restart nginx
```

#### Con SSL Directo (Desarrollo/Testing)

```bash
# 1. Generar certificados auto-firmados
python scripts/generate_ssl_cert.py

# 2. Ejecutar servidor con SSL
python run_server_ssl.py --ssl
# Acceder a: https://localhost:8443
```

### 2. Autorización Basada en Roles

#### Uso en Endpoints

```python
from app.core.authorization import require_roles, admin_required, Role

# Solo administradores
@router.get("/admin-data")
async def get_admin_data(current_user = Depends(admin_required())):
    return {"admin_data": "sensitive"}

# Múltiples roles
@router.get("/user-data")
async def get_user_data(current_user = Depends(require_roles([Role.ADMIN, Role.CLIENT]))):
    return {"user_data": "general"}
```

#### Roles Disponibles

- `Role.ADMIN`: Acceso completo al sistema
- `Role.CLIENT`: Acceso limitado a funciones de cliente

### 3. Sanitización de Datos

#### Uso de Modelos Sanitizados

```python
from app.utils.sanitization import SanitizedInput, validate_file_upload

class UserData(SanitizedInput):
    name: str
    bio: str  # Se sanitiza automáticamente

# Validación de archivos
@router.post("/upload")
async def upload_file(file: UploadFile):
    file_info = validate_file_upload(file)
    return {"file": file_info}
```

#### Funciones de Sanitización

```python
from app.utils.sanitization import sanitize_html, sanitize_filename

# Escapar HTML
safe_text = sanitize_html("<script>alert('xss')</script>Hello")
# Resultado: "Hello"

# Sanitizar nombres de archivo
safe_name = sanitize_filename("../../../etc/passwd")
# Resultado: "etc_passwd"
```

### 4. Rate Limiting

#### Configuración Automática

```python
# El middleware aplica rate limiting automáticamente:
# - 60 req/min para usuarios anónimos
# - 100 req/min para usuarios autenticados
# - 200 req/min para administradores
# - Límites especiales para endpoints de autenticación
```

#### Rate Limiting Manual

```python
from app.core.rate_limiting import strict_rate_limit

@router.post("/sensitive-action")
@strict_rate_limit()  # 5 requests por 5 minutos
async def sensitive_action():
    return {"result": "action completed"}
```

### 5. Security Headers

#### Headers Implementados

- **HSTS**: Fuerza conexiones HTTPS
- **CSP**: Content Security Policy
- **X-Frame-Options**: Previene clickjacking
- **X-Content-Type-Options**: Previene MIME sniffing
- **Referrer-Policy**: Controla información de referrer
- **Permissions-Policy**: Deshabilita APIs peligrosas

#### Configuración Personalizada

```python
from app.core.security_headers import setup_video_programmer_security

# Se configura automáticamente en main.py
setup_video_programmer_security(app, environment="production")
```

### 6. Logging Estructurado

#### Tipos de Logs

```python
from app.core.logging_config import log_user_action, log_security_event

# Log de acción de usuario
log_user_action(
    user_id="123",
    action="video_upload",
    resource="video",
    video_id="456"
)

# Log de evento de seguridad
log_security_event(
    event_type="failed_login_attempt",
    user_id="123",
    ip_address="192.168.1.1"
)
```

#### Archivos de Log

- `logs/app.log`: Logs generales de la aplicación
- `logs/error.log`: Errores y excepciones
- `logs/access.log`: Logs de acceso HTTP
- `logs/audit.log`: Logs de auditoría y seguridad

### 7. Manejo Centralizado de Errores

#### Excepciones Personalizadas

```python
from app.core.logging_config import ValidationError, AuthorizationError

# Error de validación
raise ValidationError("Email inválido", field="email")

# Error de autorización
raise AuthorizationError("Acceso denegado a recurso admin")
```

## 🚀 Configuración y Despliegue

### Desarrollo Local

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con valores reales

# 3. Ejecutar con logging mejorado
python -m app.main_secure

# 4. Para SSL en desarrollo
python scripts/generate_ssl_cert.py
python run_server_ssl.py --ssl
```

### Producción con Docker

```bash
# 1. Configurar variables de entorno
export SECRET_KEY="your-super-secret-key"
export POSTGRES_PASSWORD="secure-db-password"
export ENVIRONMENT="production"

# 2. Construir y ejecutar
docker-compose -f docker-compose.secure.yml up -d

# 3. Verificar salud de servicios
docker-compose -f docker-compose.secure.yml ps
```

### Verificación de Seguridad

```bash
# 1. Verificar headers de seguridad
curl -I https://your-domain.com/health

# 2. Probar rate limiting
for i in {1..70}; do curl https://your-domain.com/api/v1/health; done

# 3. Verificar logs estructurados
tail -f logs/access.log | jq '.'
```

## 📋 Checklist de Seguridad

### Antes de Producción

- [ ] Cambiar `SECRET_KEY` por uno aleatorio y seguro
- [ ] Configurar certificados SSL válidos
- [ ] Establecer contraseñas seguras para PostgreSQL y Redis
- [ ] Configurar dominios permitidos en CORS
- [ ] Revisar y ajustar políticas CSP
- [ ] Configurar monitoreo de logs
- [ ] Probar todos los endpoints con autorización
- [ ] Verificar rate limiting en endpoints críticos
- [ ] Ejecutar tests de seguridad

### Monitoreo Continuo

- [ ] Monitorear logs de seguridad
- [ ] Revisar métricas de rate limiting
- [ ] Auditar accesos de administradores
- [ ] Verificar certificados SSL
- [ ] Analizar logs de errores

## 🔧 Configuraciones Adicionales

### Variables de Entorno Importantes

```env
# Seguridad
SECRET_KEY=your-super-secret-key-min-32-chars
ENVIRONMENT=production

# Base de datos
DATABASE_URL=postgresql://user:pass@localhost/db
POSTGRES_PASSWORD=secure-password

# Rate limiting
REDIS_URL=redis://localhost:6379/0

# SSL
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

### Configuración de Nginx

```nginx
# Rate limiting adicional
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

# Security headers adicionales
add_header X-Robots-Tag "noindex, nofollow" always;
add_header X-API-Version "1.0" always;
```

## 🚨 Troubleshooting

### Problemas Comunes

#### SSL Certificate Issues

```bash
# Verificar certificados
openssl x509 -in ssl/certificate.crt -text -noout

# Regenerar certificados
rm -rf ssl/
python scripts/generate_ssl_cert.py
```

#### Rate Limiting Demasiado Restrictivo

```python
# Ajustar en app/core/rate_limiting.py
RateLimitMiddleware(
    app,
    default_requests_per_minute=120,  # Aumentar límite
    authenticated_requests_per_minute=200
)
```

#### CSP Bloqueando Recursos

```python
# Ajustar política en app/core/security_headers.py
csp_policy = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' your-cdn.com; "
    # ... agregar dominios necesarios
)
```

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HTTP Security Headers](https://securityheaders.com/)

---

Para más información y soporte, consulta la documentación técnica en `/docs` o contacta al equipo de desarrollo.
