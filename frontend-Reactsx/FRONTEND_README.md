# 🎥 Video Programmer - Frontend

Frontend moderno y futurista construido con React, TypeScript, Vite y Tailwind CSS para la aplicación de programación de videos de YouTube.

## 🎨 Características de Diseño

- **Paleta de Colores**: Rojo, Blanco y Negro (ver [DESIGN.md](./DESIGN.md))
- **UI Moderna**: Componentes reutilizables con Tailwind CSS
- **Responsive**: Diseño adaptable a todos los dispositivos
- **Animaciones**: Transiciones suaves y efectos modernos
- **Modo Oscuro**: Tema oscuro por defecto para una experiencia premium

## 🚀 Tecnologías

- **React 19** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Framework de utilidades CSS
- **React Router** - Navegación del lado del cliente
- **Zustand** - Gestión de estado global
- **React Query** - Gestión de estado del servidor
- **React Hook Form** - Gestión de formularios
- **Zod** - Validación de esquemas
- **i18next** - Internacionalización (ES, EN, PT)
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos

## 📁 Estructura del Proyecto

```
frontend-Reactsx/
├── public/                  # Archivos públicos estáticos
├── src/
│   ├── assets/             # Imágenes, fuentes, etc.
│   ├── components/         # Componentes reutilizables
│   │   ├── layout/        # Navbar, Layout, Footer
│   │   ├── ui/            # Button, Input, Card, Modal, Badge
│   │   └── ProtectedRoute.tsx
│   ├── config/            # Configuración de la app
│   │   └── index.ts       # API endpoints, constantes
│   ├── i18n/              # Configuración de idiomas
│   │   ├── index.ts       # Configuración i18n
│   │   └── locales/       # Traducciones (es, en, pt)
│   ├── pages/             # Páginas de la aplicación
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── ...
│   ├── services/          # Servicios de API
│   │   ├── api.service.ts      # Cliente HTTP base
│   │   ├── auth.service.ts     # Autenticación
│   │   ├── video.service.ts    # Videos
│   │   └── index.ts            # Plans, Payments, Stats
│   ├── store/             # Estado global (Zustand)
│   │   └── authStore.ts
│   ├── types/             # Tipos TypeScript
│   │   └── index.ts
│   ├── App.tsx            # Componente raíz
│   ├── main.tsx           # Punto de entrada
│   └── index.css          # Estilos globales
├── .env.example           # Variables de entorno de ejemplo
├── DESIGN.md              # Guía de diseño y paleta de colores
├── tailwind.config.js     # Configuración de Tailwind
├── tsconfig.json          # Configuración de TypeScript
└── vite.config.ts         # Configuración de Vite
```

## 🔧 Instalación

### Prerrequisitos

- Node.js 18+
- npm o yarn

### Pasos

1. **Clonar el repositorio** (si aún no lo has hecho)

```bash
git clone <repository-url>
cd Video-programmer/frontend-Reactsx
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
VITE_MERCADOPAGO_PUBLIC_KEY=tu_mercadopago_public_key
```

4. **Iniciar el servidor de desarrollo**

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🔌 Conexión con el Backend

### Configuración del Backend

Asegúrate de que el backend FastAPI esté corriendo en `http://localhost:8000` (o la URL que hayas configurado en `.env`).

### Endpoints Principales

El frontend se conecta a los siguientes endpoints del backend:

#### Autenticación

- `POST /auth/login` - Login con email/password
- `POST /auth/register` - Registro de usuario
- `GET /auth/google` - Inicio de OAuth con Google
- `POST /auth/google/callback` - Callback de Google OAuth
- `POST /auth/refresh` - Refrescar access token
- `GET /auth/me` - Obtener usuario actual

#### Videos

- `GET /videos` - Listar videos
- `POST /videos/upload` - Subir video
- `PUT /videos/{id}` - Actualizar video
- `DELETE /videos/{id}` - Eliminar video
- `POST /videos/schedule` - Programar video

#### Planes y Suscripciones

- `GET /plans` - Obtener planes disponibles
- `GET /subscriptions/current` - Suscripción actual
- `POST /subscriptions/subscribe` - Suscribirse a un plan

#### Pagos

- `GET /payments` - Historial de pagos
- `POST /payments/create` - Crear pago con MercadoPago

### Gestión de Tokens

El frontend maneja automáticamente:

1. **Almacenamiento de tokens** en `localStorage`
2. **Refresh automático** cuando el access token expira
3. **Interceptores de Axios** para agregar el token a cada request
4. **Redirección a login** cuando la sesión expira

Ver `src/services/api.service.ts` para más detalles.

### CORS

Asegúrate de que el backend tenga configurado CORS para permitir requests desde `http://localhost:5173`:

```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🌍 Internacionalización (i18n)

La aplicación soporta 3 idiomas:

- **Español (es)** - Idioma por defecto
- **English (en)**
- **Português (pt)**

### Agregar Nuevas Traducciones

1. Edita los archivos en `src/i18n/locales/`:

   - `es.json` - Español
   - `en.json` - Inglés
   - `pt.json` - Portugués

2. Usa las traducciones en los componentes:

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();

  return <h1>{t("common.appName")}</h1>;
}
```

### Cambiar Idioma

El idioma se puede cambiar desde el selector en el Navbar o programáticamente:

```tsx
import { useTranslation } from "react-i18next";

const { i18n } = useTranslation();
i18n.changeLanguage("en"); // 'es', 'en', 'pt'
```

## 🎨 Modificar la Paleta de Colores

Para modificar los colores del proyecto:

1. **Edita `tailwind.config.js`**:

```js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#TU_COLOR_PRINCIPAL',
        // ... más tonos
      }
    }
  }
}
```

2. **Actualiza `DESIGN.md`** con las nuevas referencias

3. **Usa las clases de Tailwind** en tus componentes:

```tsx
<button className="bg-primary-600 hover:bg-primary-700">Botón</button>
```

## 🧩 Componentes Reutilizables

### Button

```tsx
import { Button } from "./components/ui";

<Button variant="primary" size="lg" isLoading={false}>
  Click me
</Button>;
```

Variantes: `primary`, `secondary`, `outline`, `ghost`, `danger`

### Input

```tsx
import { Input } from "./components/ui";

<Input label="Email" type="email" error="Error message" fullWidth />;
```

### Card

```tsx
import { Card } from "./components/ui";

<Card interactive>
  <h3>Título</h3>
  <p>Contenido</p>
</Card>;
```

### Modal

```tsx
import { Modal } from "./components/ui";

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Título del Modal"
>
  <p>Contenido del modal</p>
</Modal>;
```

### Badge

```tsx
import { Badge } from "./components/ui";

<Badge variant="primary">Activo</Badge>;
```

Variantes: `primary`, `success`, `warning`, `error`, `neutral`

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo

# Build
npm run build        # Compilar para producción

# Linting
npm run lint         # Ejecutar ESLint

# Preview
npm run preview      # Vista previa de la build de producción
```

## 🔐 Seguridad

### Prácticas Implementadas

1. **Validación de formularios** con Zod
2. **Sanitización de inputs** en el frontend
3. **HTTPS** para producción (configurar en Vite)
4. **Tokens seguros** almacenados en localStorage
5. **Refresh automático** de tokens
6. **Rutas protegidas** con ProtectedRoute
7. **Validación de tipos** con TypeScript

### Variables de Entorno

Nunca expongas información sensible:

- ✅ Usa `VITE_` como prefijo para variables públicas
- ❌ No incluyas claves secretas del servidor
- ❌ No commits el archivo `.env`

## 🚀 Deployment

### Build para Producción

```bash
npm run build
```

Esto genera los archivos optimizados en el directorio `dist/`.

### Variables de Entorno en Producción

Configura las siguientes variables en tu servicio de hosting:

```env
VITE_API_BASE_URL=https://tu-api.com
VITE_GOOGLE_CLIENT_ID=tu_google_client_id_real
VITE_MERCADOPAGO_PUBLIC_KEY=tu_mercadopago_public_key_real
```

### Servicios Recomendados

- **Vercel** - Deploy automático desde Git
- **Netlify** - CI/CD integrado
- **Cloudflare Pages** - CDN global
- **AWS Amplify** - Hosting escalable

### Ejemplo de Deploy en Vercel

1. Instala Vercel CLI:

```bash
npm install -g vercel
```

2. Deploy:

```bash
vercel
```

3. Configura las variables de entorno en el dashboard de Vercel

## 📱 Responsive Design

La aplicación es totalmente responsive:

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px
- **Wide**: > 1280px

Usa las clases de Tailwind para responsive:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  {/* Contenido */}
</div>
```

## 🧪 Testing (Próximamente)

```bash
# Ejecutar tests unitarios
npm run test

# Ejecutar tests E2E
npm run test:e2e

# Cobertura
npm run test:coverage
```

## 📚 Recursos Adicionales

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Query](https://tanstack.com/query)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

---

**Desarrollado con ❤️ usando React, TypeScript y Tailwind CSS**
