# 📚 Documentación - Video Programmer API

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![Tests](https://img.shields.io/badge/Tests-34%20passing-brightgreen.svg)](../tests)
[![Security](https://img.shields.io/badge/Security-Enhanced-red.svg)](./security)

> Documentación completa y organizada para Video Programmer API

## 📋 Índice de Documentación

### 🚀 Inicio Rápido

- **[README.md](./README.md)** - Instalación y primeros pasos en 5 minutos

### 👥 Para Usuarios Finales

- **[Manual de Usuario](./user-manual/USER_MANUAL.md)** - Guía completa para usar la plataforma
- **[Primeros Pasos](./user-manual/getting-started.md)** - Configuración inicial paso a paso
- **[Referencia de API](./user-manual/api-reference.md)** - Endpoints disponibles y ejemplos
- **[Solución de Problemas](./user-manual/troubleshooting.md)** - Problemas comunes y soluciones

### 🛠️ Para Desarrolladores

- **[Documentación Completa](./README_COMPLETE.md)** - Guía técnica detallada
- **[Arquitectura del Sistema](./developer/architecture.md)** - Diseño, componentes y flujo de datos
- **[API Endpoints](./developer/api-endpoints.md)** - Referencia técnica completa de endpoints
- **[Guía de Despliegue](./developer/deployment.md)** - Estrategias de deployment y configuración

### 🔒 Seguridad

- **[Resumen de Seguridad](./security/overview.md)** - Características de seguridad implementadas
- **[Implementación Detallada](./security/implementation.md)** - Configuración técnica de seguridad
- **[OAuth2 con Google](./security/oauth.md)** - Autenticación externa con YouTube

### 🔗 Integraciones Externas

- **[YouTube API](./integrations/youtube-api.md)** - Publicación automática y gestión de canales
- **[MercadoPago](./integrations/mercado-pago.md)** - Sistema de pagos latinoamericano

### ⚙️ Configuración

- **[Nginx SSL](./config/nginx-ssl.conf)** - Configuración de proxy reverso seguro

## 🎯 Mapa de la Documentación

```
docs/
├── README.md                     # Inicio rápido
├── README_COMPLETE.md           # Documentación técnica completa
├── user-manual/                 # Documentación para usuarios
│   ├── USER_MANUAL.md          # Manual completo de usuario
│   ├── getting-started.md      # Primeros pasos
│   ├── api-reference.md        # Referencia de API
│   └── troubleshooting.md      # Solución de problemas
├── developer/                   # Documentación técnica
│   ├── architecture.md         # Arquitectura del sistema
│   ├── api-endpoints.md        # Endpoints detallados
│   └── deployment.md           # Guías de despliegue
├── security/                    # Documentación de seguridad
│   ├── overview.md             # Resumen de seguridad
│   ├── implementation.md       # Implementación detallada
│   └── oauth.md                # OAuth2 con Google
├── integrations/               # Integraciones externas
│   ├── youtube-api.md          # YouTube API
│   ├── mercado-pago.md         # MercadoPago
│   └── stripe.md               # (No implementado)
└── config/                      # Configuraciones
    └── nginx-ssl.conf          # Configuración Nginx
```

## 🔍 Búsqueda Rápida por Tema

### Autenticación y Usuarios

- [Registro y Login](./user-manual/getting-started.md#registro-y-configuración-inicial)
- [OAuth2 con Google](./security/oauth.md)
- [Gestión de Roles](./developer/architecture.md#roles-del-sistema)

### Gestión de Videos

- [Subir Videos](./user-manual/getting-started.md#subir-tu-primer-video)
- [Procesamiento con FFmpeg](./developer/architecture.md#flujo-de-procesamiento-de-video)
- [Publicación en YouTube](./integrations/youtube-api.md#publicación-de-videos)

### Pagos y Suscripciones

- [Planes Disponibles](./user-manual/api-reference.md#planes-y-suscripciones)
- [MercadoPago](./integrations/mercado-pago.md)

### Despliegue y Producción

- [Docker Compose](./developer/deployment.md#opción-1-docker-compose-recomendado-para-desarrollo)
- [Kubernetes](./developer/deployment.md#opción-2-kubernetes)
- [AWS ECS](./developer/deployment.md#opción-3-aws-ecs)

### Seguridad

- [Rate Limiting](./security/implementation.md#rate-limiting)
- [Headers de Seguridad](./security/implementation.md#headers-de-seguridad)
- [Auditoría](./security/overview.md#logging-de-auditoría)

## 📊 Estado del Proyecto

| Componente             | Estado     | Documentación                                   |
| ---------------------- | ---------- | ----------------------------------------------- |
| ✅ API Core            | Operativo  | [Arquitectura](./developer/architecture.md)     |
| ✅ Autenticación       | Completo   | [OAuth2](./security/oauth.md)                   |
| ✅ Gestión Videos      | Completo   | [API Reference](./user-manual/api-reference.md) |
| ✅ YouTube Integration | Completo   | [YouTube API](./integrations/youtube-api.md)    |
| ✅ MercadoPago         | Completo   | [MercadoPago](./integrations/mercado-pago.md)   |
| ✅ Seguridad           | Completo   | [Security](./security/overview.md)              |
| ✅ Tests               | 34 passing | [Testing](../tests/)                            |
| ✅ Docker              | Listo      | [Deployment](./developer/deployment.md)         |

## 🚀 Enlaces Rápidos

### Desarrollo

- [Instalación](./README.md#instalación-en-5-minutos)
- [API Docs](../docs) (FastAPI auto-generada)
- [Tests](../tests/)
- [Scripts](../scripts/)

### Producción

- [Despliegue](./developer/deployment.md)
- [Configuración SSL](./config/nginx-ssl.conf)
- [Monitoreo](./developer/architecture.md#monitoreo-y-observabilidad)

### Soporte

- [Issues](https://github.com/Beto18v/Video-Programmer/issues)
- [Discussions](https://github.com/Beto18v/Video-Programmer/discussions)
- [Wiki](https://github.com/Beto18v/Video-Programmer/wiki)

## 📞 Contribuir

¿Quieres contribuir a la documentación?

1. **Fork** el repositorio
2. Crea una **branch** para tu cambio: `git checkout -b docs/improvement`
3. **Edita** los archivos en `docs/`
4. **Commit** tus cambios: `git commit -m 'Improve documentation'`
5. **Push** a la branch: `git push origin docs/improvement`
6. Abre un **Pull Request**

### Guías de Contribución

- Sigue la estructura existente
- Usa formato Markdown consistente
- Incluye ejemplos de código cuando sea relevante
- Actualiza este índice si agregas nuevos archivos

## 📈 Versiones de Documentación

- **v1.0** (Octubre 2025) - Documentación completa reorganizada
  - Estructura modular por audiencias
  - Cobertura completa de todas las funcionalidades
  - Ejemplos prácticos y troubleshooting
  - Guías de despliegue para múltiples plataformas

## 🎯 Próximos Pasos

### Documentación Pendiente

- [ ] SDKs para diferentes lenguajes
- [ ] Webhooks y integraciones avanzadas
- [ ] Casos de uso específicos por industria
- [ ] Tutoriales en video

### Mejoras Planeadas

- [ ] Búsqueda integrada en la documentación
- [ ] Versionado de documentación
- [ ] Traducciones (ES/EN/PT)
- [ ] Diagramas interactivos

---

_Índice de documentación - Octubre 2025_

> 💡 **Tip**: Usa `Ctrl+K` en VS Code para buscar rápidamente en toda la documentación
