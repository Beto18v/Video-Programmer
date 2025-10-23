# Autenticación OAuth2 Automática con Google para FastAPI

Este documento explica cómo funciona la autenticación OAuth2 automática con Google en el backend FastAPI. El backend maneja todas las credenciales y el flujo OAuth2 sin requerir configuración manual del usuario.

## Configuración

### Credenciales

Las credenciales de Google OAuth2 están configuradas automáticamente en el backend. No se requiere configuración adicional por parte del usuario.

## Flujo de Autenticación

### 1. Iniciar Sesión

Para iniciar el flujo de OAuth2, redirige al usuario a:

```
GET /login
```

Esto redirigirá automáticamente a Google para autorizar el acceso.

### 2. Callback

Google redirigirá de vuelta a:

```
GET /api/v1/oauth2/callback/google?code=<authorization_code>&state=<state>
```

Este endpoint:

- Intercambia el código de autorización por tokens de acceso
- Obtiene información del usuario desde Google
- Crea o actualiza el usuario en la base de datos
- Guarda los tokens OAuth de forma segura

### 3. Usar la API

Una vez autenticado, puedes usar `YouTubeService` pasando el `user_id` y la sesión de BD:

```python
from app.services.youtube_service import YouTubeService
from app.db.session import get_db

db = next(get_db())
youtube_service = YouTubeService(config, user_id, db)
```

## Manejo de Tokens

### Renovación Automática

Los tokens se renuevan automáticamente cuando:

- El token de acceso ha expirado
- Quedan menos de 5 minutos para que expire

Esto se maneja en `OAuthService.refresh_token_if_needed()`.

### Renovación Manual

Puedes forzar la renovación de tokens:

```
POST /api/v1/oauth2/refresh/{user_id}
```

### Almacenamiento Seguro

- Los tokens se almacenan en la base de datos en la tabla `oauth_tokens`
- Los `access_token` y `refresh_token` se guardan encriptados
- Solo se accede a través de servicios autorizados

## Seguridad

### Mejores Prácticas Implementadas

1. **PKCE**: Se usa PKCE (Proof Key for Code Exchange) en el flujo OAuth2
2. **State Parameter**: Protección contra ataques CSRF
3. **Secure Tokens**: Tokens almacenados de forma segura en BD
4. **Token Refresh**: Renovación automática de tokens expirados
5. **Scope Limitation**: Solo scopes necesarios (YouTube upload y acceso general)

### Consideraciones Adicionales

- En producción, usa HTTPS
- Implementa rate limiting
- Monitorea el uso de la API
- Configura alertas para fallos de renovación de tokens

## Endpoints de API

### Autenticación

- `GET /login` - Iniciar sesión (redirige a OAuth2)
- `GET /api/v1/oauth2/authorize/google` - Iniciar flujo OAuth2
- `GET /api/v1/oauth2/callback/google` - Callback de Google
- `POST /api/v1/oauth2/refresh/{user_id}` - Renovar tokens

### Usuario

- `GET /api/v1/user/me?user_id={id}` - Obtener información del usuario actual

## Base de Datos

### Tablas

#### users

- `id`: ID único del usuario
- `google_id`: ID de Google del usuario
- `email`: Email del usuario
- `name`: Nombre del usuario
- `picture`: URL de la foto de perfil
- `created_at`: Fecha de creación
- `updated_at`: Fecha de actualización

#### oauth_tokens

- `id`: ID único del token
- `user_id`: ID del usuario (FK)
- `provider`: Proveedor (por defecto 'google')
- `access_token`: Token de acceso
- `refresh_token`: Token de refresco
- `token_type`: Tipo de token (Bearer)
- `expires_at`: Fecha de expiración
- `scope`: Scopes autorizados
- `created_at`: Fecha de creación
- `updated_at`: Fecha de actualización

## Manejo de Errores

### Errores Comunes

1. **Credenciales no configuradas**: Asegúrate de tener `YT_CLIENT_ID` y `YT_CLIENT_SECRET`
2. **Token expirado**: Se renueva automáticamente, pero puede fallar si el refresh_token es inválido
3. **Usuario no encontrado**: El usuario debe existir en la BD
4. **Scopes insuficientes**: Asegúrate de que los scopes solicitados sean correctos

### Logging

Todos los eventos importantes se registran con loguru:

- Inicio de flujo OAuth
- Éxito/fallo de autenticación
- Renovación de tokens
- Errores de API
