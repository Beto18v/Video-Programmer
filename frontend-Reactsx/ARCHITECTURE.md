# 🏗️ Arquitectura y Extensibilidad - Video Programmer Frontend

## 📊 Arquitectura General

```
┌─────────────────────────────────────────────┐
│              FRONTEND (React)               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Pages   │  │Components│  │  Store   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │             │              │        │
│       └─────────────┴──────────────┘        │
│                     ┆                       │
│              ┌──────▼──────┐               │
│              │  Services   │               │
│              └──────┬──────┘               │
│                     ┆                       │
└─────────────────────┼───────────────────────┘
                      ┆ HTTP/HTTPS
┌─────────────────────▼───────────────────────┐
│             BACKEND (FastAPI)               │
├─────────────────────────────────────────────┤
│  ┌──────┐  ┌─────────┐  ┌──────────────┐  │
│  │ Auth │  │ Videos  │  │ Payments     │  │
│  └──────┘  └─────────┘  └──────────────┘  │
└─────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos

### 1. Autenticación

```
Usuario → LoginPage → authService.login() → API → authStore
                                                    ↓
                                              localStorage
                                                    ↓
                                            ProtectedRoute ✓
```

### 2. Operaciones con Videos

```
Usuario → VideoUploadPage → videoService.uploadVideo()
                                    ↓
                              FormData + File
                                    ↓
                              API /videos/upload
                                    ↓
                              Backend procesa
                                    ↓
                              Response → UI Update
```

### 3. Estado Global

```
┌──────────────────────────────────────┐
│         Zustand Store                │
├──────────────────────────────────────┤
│  authStore (user, tokens, login)     │
│  - Persiste en localStorage          │
│  - Auto-sync con API                 │
└──────────────────────────────────────┘
```

## 🧩 Patrones de Diseño Implementados

### 1. **Service Layer Pattern**

Toda la lógica de API está encapsulada en servicios:

```typescript
// ❌ MAL - llamar API directamente desde componente
const response = await axios.post("/auth/login", data);

// ✅ BIEN - usar servicio
const response = await authService.login(credentials);
```

### 2. **Repository Pattern**

Los servicios actúan como repositorios para diferentes entidades:

```typescript
// videoService.ts
class VideoService {
  getVideos();
  getVideo(id);
  uploadVideo(data);
  deleteVideo(id);
}
```

### 3. **Singleton Pattern**

Servicios exportados como instancias únicas:

```typescript
export const apiService = new ApiService();
export const authService = new AuthService();
```

### 4. **Observer Pattern (via Zustand)**

Estado reactivo que notifica a componentes:

```typescript
const { user } = useAuthStore(); // Se actualiza automáticamente
```

### 5. **Higher-Order Component (HOC)**

ProtectedRoute envuelve componentes para agregar autenticación:

```typescript
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

## 🔧 Cómo Extender el Proyecto

### Agregar una Nueva Página

**1. Crear el archivo de la página:**

```typescript
// src/pages/MiNuevaPagina.tsx
import { useTranslation } from "react-i18next";
import Layout from "../components/layout/Layout";
import { Card, Button } from "../components/ui";

const MiNuevaPagina = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="container-custom py-8">
        <h1 className="text-4xl font-bold text-white mb-8">
          {t("miPagina.title")}
        </h1>

        <Card>{/* Contenido */}</Card>
      </div>
    </Layout>
  );
};

export default MiNuevaPagina;
```

**2. Agregar traducciones:**

```json
// src/i18n/locales/es.json
{
  "miPagina": {
    "title": "Mi Nueva Página",
    "description": "Descripción"
  }
}
```

**3. Agregar ruta:**

```typescript
// src/App.tsx
import MiNuevaPagina from "./pages/MiNuevaPagina";

<Route
  path="/mi-pagina"
  element={
    <ProtectedRoute>
      <MiNuevaPagina />
    </ProtectedRoute>
  }
/>;
```

**4. Agregar al Navbar (opcional):**

```typescript
// src/components/layout/Navbar.tsx
<NavLink to="/mi-pagina">{t("nav.miPagina")}</NavLink>
```

### Agregar un Nuevo Servicio

**1. Crear el archivo del servicio:**

```typescript
// src/services/miNuevo.service.ts
import { apiService } from "./api.service";
import { API_ENDPOINTS } from "../config";
import type { ApiResponse } from "../types";

class MiNuevoService {
  async obtenerDatos(): Promise<ApiResponse<MiTipo>> {
    return apiService.get<MiTipo>("/mi-endpoint");
  }

  async crearDato(data: MiTipo): Promise<ApiResponse<MiTipo>> {
    return apiService.post<MiTipo>("/mi-endpoint", data);
  }
}

export const miNuevoService = new MiNuevoService();
```

**2. Agregar tipos:**

```typescript
// src/types/index.ts
export interface MiTipo {
  id: string;
  nombre: string;
  // ...
}
```

**3. Agregar endpoint:**

```typescript
// src/config/index.ts
export const API_ENDPOINTS = {
  // ...
  MI_ENDPOINT: "/mi-endpoint",
};
```

### Agregar un Nuevo Componente UI

**1. Crear el componente:**

```typescript
// src/components/ui/MiComponente.tsx
import type { HTMLAttributes, ReactNode } from "react";

export interface MiComponenteProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "special";
  children: ReactNode;
}

const MiComponente = ({
  variant = "default",
  children,
  className = "",
  ...props
}: MiComponenteProps) => {
  const variantStyles = {
    default: "bg-dark-900",
    special: "bg-primary-600",
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default MiComponente;
```

**2. Exportar en index:**

```typescript
// src/components/ui/index.ts
export { default as MiComponente } from "./MiComponente";
export type { MiComponenteProps } from "./MiComponente";
```

**3. Usar el componente:**

```typescript
import { MiComponente } from "../components/ui";

<MiComponente variant="special">Contenido</MiComponente>;
```

### Agregar Estado Global

**1. Crear el store:**

```typescript
// src/store/miStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface MiState {
  datos: MiTipo[];
  isLoading: boolean;

  // Actions
  setDatos: (datos: MiTipo[]) => void;
  fetchDatos: () => Promise<void>;
}

export const useMiStore = create<MiState>()(
  devtools(
    persist(
      (set) => ({
        datos: [],
        isLoading: false,

        setDatos: (datos) => set({ datos }),

        fetchDatos: async () => {
          set({ isLoading: true });
          try {
            const response = await miService.obtenerDatos();
            if (response.success && response.data) {
              set({ datos: response.data, isLoading: false });
            }
          } catch {
            set({ isLoading: false });
          }
        },
      }),
      { name: "mi-storage" }
    ),
    { name: "MiStore" }
  )
);
```

**2. Usar en componentes:**

```typescript
import { useMiStore } from "../store/miStore";

const MiComponente = () => {
  const { datos, fetchDatos, isLoading } = useMiStore();

  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  if (isLoading) return <div>Cargando...</div>;

  return <div>{/* Renderizar datos */}</div>;
};
```

## 🎨 Sistema de Diseño

### Uso de Clases de Tailwind

**Colores:**

```tsx
// Primarios (Rojo)
<div className="bg-primary-600 text-white" />

// Oscuros
<div className="bg-dark-900 border-dark-800" />

// Estados
<div className="text-green-500" />  // Éxito
<div className="text-red-500" />    // Error
<div className="text-amber-500" />  // Advertencia
```

**Componentes Predefinidos:**

```tsx
// Botones
<button className="btn btn-primary" />
<button className="btn btn-secondary" />
<button className="btn btn-outline" />

// Inputs
<input className="input" />
<input className="input input-error" />

// Cards
<div className="card" />
<div className="card-interactive" />

// Badges
<span className="badge badge-primary" />
```

**Animaciones:**

```tsx
<div className="fade-in" />
<div className="slide-up" />
<div className="scale-in" />
```

## 🔒 Seguridad

### Validación de Formularios

Siempre usa Zod para validar:

```typescript
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(schema),
});
```

### Sanitización de Datos

```typescript
// Sanitizar antes de mostrar HTML
import DOMPurify from "dompurify";

const sanitizedHTML = DOMPurify.sanitize(userInput);
```

### Protección de Rutas

Siempre envuelve rutas privadas:

```typescript
<Route
  path="/protected"
  element={
    <ProtectedRoute>
      <ProtectedPage />
    </ProtectedRoute>
  }
/>
```

## 📊 Gestión de Estado

### Cuándo Usar Zustand vs React Query

**Zustand (Estado Global):**

- ✅ Autenticación del usuario
- ✅ Preferencias de UI (tema, idioma)
- ✅ Estado de navegación
- ✅ Datos que necesitan persistir

**React Query (Estado del Servidor):**

- ✅ Listas de datos del backend
- ✅ Datos que cambian frecuentemente
- ✅ Datos que necesitan cache
- ✅ Paginación e infinite scroll

**Ejemplo con React Query:**

```typescript
import { useQuery } from "@tanstack/react-query";

const { data, isLoading, error } = useQuery({
  queryKey: ["videos"],
  queryFn: () => videoService.getVideos(),
  staleTime: 5 * 60 * 1000, // 5 minutos
});
```

## 🧪 Testing (Estructura Recomendada)

```typescript
// src/components/ui/__tests__/Button.test.tsx
import { render, screen } from "@testing-library/react";
import Button from "../Button";

describe("Button", () => {
  it("renders correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<Button isLoading>Click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

## 🚀 Optimización

### Code Splitting

```typescript
// Lazy loading de páginas
import { lazy, Suspense } from "react";

const VideosPage = lazy(() => import("./pages/VideosPage"));

<Route
  path="/videos"
  element={
    <Suspense fallback={<Loading />}>
      <VideosPage />
    </Suspense>
  }
/>;
```

### Memoización

```typescript
import { useMemo, useCallback } from "react";

// Memoizar valores calculados
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(props);
}, [props]);

// Memoizar callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### Imágenes Optimizadas

```typescript
// Usar formatos modernos
<img
  src="/image.webp"
  alt="Description"
  loading="lazy"
  width={300}
  height={200}
/>
```

## 📱 PWA (Próximamente)

Para convertir en Progressive Web App:

1. Agregar `vite-plugin-pwa`
2. Configurar `manifest.json`
3. Implementar Service Worker
4. Agregar iconos de diferentes tamaños

## 🔍 Debugging

### React DevTools

Instala la extensión de navegador para inspeccionar:

- Componentes
- Props
- Estado
- Hooks

### Redux DevTools (Zustand)

Zustand está configurado con devtools:

```typescript
devtools(...)  // Ya configurado en stores
```

### Network Inspector

Verifica requests HTTP en:

- Chrome DevTools > Network
- Filtra por XHR/Fetch
- Verifica headers de Authorization

## 📚 Convenciones de Código

### Nombres de Archivos

- **Componentes**: `PascalCase.tsx` (ej. `Button.tsx`)
- **Hooks**: `camelCase.ts` (ej. `useAuth.ts`)
- **Servicios**: `camelCase.service.ts` (ej. `auth.service.ts`)
- **Tipos**: `camelCase.types.ts` o `index.ts` en `/types`
- **Páginas**: `PascalCase.tsx` + sufijo Page (ej. `LoginPage.tsx`)

### Imports

Orden recomendado:

```typescript
// 1. React y hooks
import { useState, useEffect } from "react";

// 2. Librerías externas
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// 3. Componentes
import Layout from "../components/layout/Layout";
import { Button, Card } from "../components/ui";

// 4. Servicios y stores
import { authService } from "../services/auth.service";
import { useAuthStore } from "../store/authStore";

// 5. Tipos
import type { User } from "../types";

// 6. Estilos (si aplica)
import "./styles.css";
```

### Comentarios

```typescript
/**
 * Descripción del componente
 *
 * @param props - Propiedades del componente
 * @returns Elemento React
 */
const MiComponente = (props: Props) => {
  // Lógica del componente
  return <div>...</div>;
};
```

---

**🎯 Con esta arquitectura, el proyecto es altamente escalable y mantenible.**

Para cualquier duda, consulta la documentación específica de cada tecnología o revisa los ejemplos en el código existente.
