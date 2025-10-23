# Integración de Mercado Pago para Actualización de Planes

Este documento explica cómo integrar Mercado Pago como pasarela de pagos para permitir que los usuarios actualicen su plan de suscripción.

## Configuración

### 1. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```bash
# Mercado Pago
MP_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
BASE_URL=https://tu-dominio.com
```

- `MP_ACCESS_TOKEN`: Tu access token de Mercado Pago (producir o sandbox)
- `BASE_URL`: La URL base de tu aplicación (debe ser HTTPS en producción)

### 2. Obtener Credenciales de Mercado Pago

1. Ve a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
2. Crea una aplicación
3. Obtén el Access Token de producción o sandbox

## Flujo de Integración

### 1. Crear Preferencia de Pago

El usuario selecciona un plan y solicita actualizarlo. El backend crea una preferencia de pago:

```http
POST /api/v1/payments/create_preference
Content-Type: application/json

{
  "plan_id": 2,
  "user_id": 123
}
```

Respuesta:

```json
{
  "preference_id": "123456789-abcdef12-3456-7890-abcd12345678",
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789-abcdef12-3456-7890-abcd12345678",
  "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789-abcdef12-3456-7890-abcd12345678"
}
```

### 2. Redireccionar al Usuario

Redirige al usuario a `init_point` (o `sandbox_init_point` en desarrollo) para completar el pago.

### 3. Procesar Webhook

Mercado Pago envía una notificación al webhook cuando el pago se completa:

```http
POST /api/v1/payments/webhooks/mercadopago
Content-Type: application/json

{
  "topic": "payment",
  "resource": "https://api.mercadopago.com/v1/payments/123456789"
}
```

El backend:

1. Verifica que el topic sea "payment"
2. Obtiene los detalles del pago usando la API de Mercado Pago
3. Si el pago está aprobado, actualiza el plan del usuario en la base de datos

## Endpoints Implementados

### POST /api/v1/payments/create_preference

Crea una preferencia de pago para Mercado Pago.

**Request Body:**

```json
{
  "plan_id": 2,
  "user_id": 123
}
```

**Response:**

```json
{
  "preference_id": "string",
  "init_point": "string",
  "sandbox_init_point": "string"
}
```

### POST /api/v1/payments/webhooks/mercadopago

Webhook para recibir notificaciones de Mercado Pago.

**Request Body:**

```json
{
  "topic": "payment",
  "resource": "https://api.mercadopago.com/v1/payments/123456789"
}
```

## Seguridad

### Validación de Webhooks

- Se verifica que el topic sea "payment"
- Se obtiene el pago directamente de la API de Mercado Pago usando el access token
- Solo se procesan pagos con status "approved"

### Mejores Prácticas de Seguridad

- Nunca almacenes datos sensibles de tarjetas
- Usa HTTPS en producción
- Valida la autenticidad de los webhooks
- Usa variables de entorno para credenciales

## Configuración en Mercado Pago

1. En tu aplicación de Mercado Pago, configura el webhook URL:
   `https://tu-dominio.com/api/v1/payments/webhooks/mercadopago`

2. Selecciona los eventos a notificar: "Pago"

## Pruebas

Para probar en sandbox:

1. Usa el `sandbox_init_point` en lugar de `init_point`
2. Usa tarjetas de prueba de Mercado Pago
3. Verifica que el plan se actualice correctamente después del pago

## Dependencias

Asegúrate de tener instalada la librería de Mercado Pago:

```bash
pip install mercadopago
```

## Notas Adicionales

- La moneda está configurada como COP (Peso Colombiano). Ajusta según tu país.
- Los precios se asumen en centavos (ej: 1000 = $10.00 COP).
- Implementa logging adecuado para debugging de webhooks.
- Considera implementar reintentos para fallos de red en webhooks.</content>
  <parameter name="filePath">d:\Documentos\Repositories\Video-programmer\backend-FastAPI\MERCADO_PAGO_INTEGRATION.md
