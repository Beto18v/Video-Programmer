# 📋 Guía de Inicio Rápido - Video Programmer Frontend

## ✅ Pasos Completados

El frontend de Video Programmer ha sido completamente configurado con las siguientes características:

### 🎨 Diseño y Estilos

- ✅ Paleta de colores personalizada (rojo, blanco, negro)
- ✅ Tailwind CSS configurado con tema personalizado
- ✅ Archivo `DESIGN.md` con guía completa de diseño
- ✅ Componentes UI reutilizables con estilos consistentes
- ✅ Animaciones y transiciones modernas

### 🌍 Internacionalización

- ✅ i18next configurado con 3 idiomas:
  - Español (por defecto)
  - English
  - Português
- ✅ Selector de idioma en Navbar
- ✅ Traducciones completas en `src/i18n/locales/`

### 🔧 Arquitectura Técnica

- ✅ TypeScript con tipos estrictos
- ✅ React 19 con Vite
- ✅ React Router con rutas protegidas
- ✅ Zustand para estado global
- ✅ React Query para peticiones HTTP
- ✅ React Hook Form + Zod para formularios

### 📡 Servicios de API

- ✅ Cliente HTTP base con interceptores
- ✅ Refresh automático de tokens
- ✅ Servicio de autenticación (login, registro, Google OAuth)
- ✅ Servicio de videos (upload, schedule, CRUD)
- ✅ Servicios de planes, pagos y estadísticas

### 🧩 Componentes

- ✅ **UI Components**: Button, Input, Card, Modal, Badge
- ✅ **Layout**: Navbar responsivo con menú de usuario
- ✅ **Pages**: Login, Dashboard (con más por implementar)
- ✅ **ProtectedRoute**: Guard de autenticación

### 📁 Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables
├── pages/         # Páginas de la app
├── services/      # Lógica de negocio y API
├── store/         # Estado global (Zustand)
├── types/         # Tipos TypeScript
├── i18n/          # Traducciones
└── config/        # Configuración
```

## 🚀 Cómo Iniciar

### 1. Configurar Variables de Entorno

Edita el archivo `.env` con tus credenciales:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
VITE_MERCADOPAGO_PUBLIC_KEY=tu_mercadopago_public_key
```

### 2. Instalar Dependencias (si no lo has hecho)

```bash
npm install
```

### 3. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

### 4. Asegurar que el Backend esté corriendo

El backend FastAPI debe estar corriendo en: **http://localhost:8000**

Para iniciar el backend:

```bash
cd ../backend-FastAPI
python run_server.py
```

## 🔌 Integración Frontend-Backend

### Flujo de Autenticación

1. **Login con Email/Password**:

   - Usuario ingresa credenciales en `/login`
   - Frontend envía POST a `/auth/login`
   - Backend retorna `access_token`, `refresh_token` y datos del usuario
   - Tokens se guardan en localStorage
   - Usuario es redirigido a `/dashboard`

2. **Login con Google**:

   - Usuario hace clic en "Iniciar con Google"
   - Frontend redirige a `/auth/google` del backend
   - Backend maneja OAuth y redirige de vuelta
   - Frontend recibe tokens y guarda sesión

3. **Refresh Automático**:
   - Cuando el `access_token` expira (401)
   - Frontend usa `refresh_token` para obtener nuevo `access_token`
   - Request original se reintenta automáticamente
   - Si refresh falla, usuario es enviado a login

### Endpoints Críticos del Backend

Asegúrate de que tu backend tenga estos endpoints:

```python
# Autenticación
POST   /auth/login              # Login con credenciales
POST   /auth/register           # Registro de usuario
GET    /auth/google             # Inicio OAuth Google
POST   /auth/google/callback    # Callback OAuth Google
POST   /auth/refresh            # Refresh token
GET    /auth/me                 # Usuario actual
POST   /auth/logout             # Cerrar sesión

# Videos
GET    /videos                  # Listar videos
POST   /videos/upload           # Subir video
PUT    /videos/{id}             # Actualizar video
DELETE /videos/{id}             # Eliminar video
POST   /videos/schedule         # Programar publicación

# Planes
GET    /plans                   # Planes disponibles
GET    /subscriptions/current   # Suscripción actual
POST   /subscriptions/subscribe # Suscribirse

# Pagos
GET    /payments                # Historial
POST   /payments/create         # Crear pago

# Stats
GET    /stats                   # Estadísticas generales
```

### Configurar CORS en el Backend

En tu `backend-FastAPI/app/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Frontend local
        "https://tu-dominio.com"  # Frontend producción
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📝 Próximos Pasos

### Páginas Pendientes por Implementar

1. **RegisterPage** - Registro de nuevos usuarios
2. **VideosPage** - Lista de todos los videos
3. **VideoUploadPage** - Subir nuevos videos
4. **VideoEditPage** - Editar metadata de videos
5. **SchedulePage** - Calendario de programación
6. **PlansPage** - Mostrar planes y precios
7. **ProfilePage** - Perfil del usuario
8. **SettingsPage** - Configuración de la cuenta
9. **PaymentsPage** - Historial de pagos

### Funcionalidades Adicionales

- [ ] Upload de videos con preview
- [ ] Calendario interactivo para programación
- [ ] Dashboard con gráficos de estadísticas
- [ ] Notificaciones en tiempo real
- [ ] Drag & drop para archivos
- [ ] Editor de miniaturas
- [ ] Sistema de notificaciones toast
- [ ] Modo claro/oscuro (opcional)

## 🎯 Comando Rápido para Iniciar Todo

```bash
# Terminal 1 - Backend
cd backend-FastAPI
python run_server.py

# Terminal 2 - Frontend
cd frontend-Reactsx
npm run dev
```

Luego abre: **http://localhost:5173**

## 🐛 Solución de Problemas

### Error: "Cannot connect to backend"

1. Verifica que el backend esté corriendo en `http://localhost:8000`
2. Verifica CORS configurado en el backend
3. Verifica `VITE_API_BASE_URL` en `.env`

### Error: "Module not found"

```bash
npm install
```

### Error: Tailwind no funciona

```bash
npm install -D tailwindcss postcss autoprefixer
```

### Puerto 5173 en uso

```bash
# Vite usará el siguiente puerto disponible automáticamente
# O especifica uno manualmente en vite.config.ts
```

## 📚 Documentación Adicional

- **[DESIGN.md](./DESIGN.md)** - Guía completa de diseño y paleta de colores
- **[FRONTEND_README.md](./FRONTEND_README.md)** - Documentación técnica detallada
- **Backend Docs** - `../backend-FastAPI/docs/INDEX.md`

## 💡 Tips de Desarrollo

### Hot Reload

Vite tiene HMR (Hot Module Replacement) activado por defecto. Los cambios se reflejan instantáneamente.

### Componentes

Todos los componentes UI están en `src/components/ui/` y son totalmente personalizables.

### Agregar Nueva Página

1. Crear archivo en `src/pages/TuPagina.tsx`
2. Agregar ruta en `src/App.tsx`
3. Agregar traduciones en `src/i18n/locales/*.json`

### Modificar Colores

Edita `tailwind.config.js` y actualiza `DESIGN.md` para mantener consistencia.

---

**🎉 ¡El frontend está listo para desarrollar!**

Si tienes dudas, revisa los archivos de documentación o los comentarios en el código.
