# 🎨 Guía de Diseño - Video Programmer

## Paleta de Colores

Esta aplicación utiliza una paleta de colores moderna y futurista basada en **rojo, blanco y negro**.

### Colores Primarios

- **Rojo Primario**: `#DC2626` (red-600)

  - Uso: Botones principales, CTAs, elementos destacados
  - Hover: `#B91C1C` (red-700)
  - Active: `#991B1B` (red-800)

- **Rojo Oscuro**: `#7F1D1D` (red-900)
  - Uso: Fondos oscuros, elementos de alta jerarquía
- **Rojo Claro**: `#FCA5A5` (red-300)
  - Uso: Elementos secundarios, badges, notificaciones

### Colores Neutros

- **Negro Principal**: `#0A0A0A` (gray-950/black)
  - Uso: Fondos principales, modo oscuro
- **Gris Oscuro**: `#1F1F1F` (gray-900)

  - Uso: Tarjetas, paneles, contenedores

- **Gris Medio**: `#404040` (gray-700)
  - Uso: Bordes, divisores, elementos deshabilitados
- **Gris Claro**: `#A3A3A3` (gray-400)

  - Uso: Texto secundario, placeholders

- **Blanco**: `#FFFFFF`
  - Uso: Texto principal sobre fondos oscuros, fondos de modales

### Colores de Estado

- **Éxito**: `#10B981` (green-500)
- **Advertencia**: `#F59E0B` (amber-500)
- **Error**: `#EF4444` (red-500)
- **Información**: `#3B82F6` (blue-500)

## Tipografía

### Fuentes

- **Principal**: `Inter` (Google Fonts)
- **Monospace**: `JetBrains Mono` (para código/números)

### Tamaños de Texto

- **Heading 1**: `text-4xl` (36px) - font-bold
- **Heading 2**: `text-3xl` (30px) - font-bold
- **Heading 3**: `text-2xl` (24px) - font-semibold
- **Heading 4**: `text-xl` (20px) - font-semibold
- **Body Large**: `text-lg` (18px) - font-normal
- **Body**: `text-base` (16px) - font-normal
- **Body Small**: `text-sm` (14px) - font-normal
- **Caption**: `text-xs` (12px) - font-normal

## Espaciado

### Sistema de Espaciado

- **xs**: `0.5rem` (8px)
- **sm**: `1rem` (16px)
- **md**: `1.5rem` (24px)
- **lg**: `2rem` (32px)
- **xl**: `3rem` (48px)
- **2xl**: `4rem` (64px)

## Componentes

### Botones

#### Botón Primario

```css
bg-red-600 hover:bg-red-700 active:bg-red-800
text-white font-semibold
rounded-lg px-6 py-3
transition-all duration-200
shadow-lg hover:shadow-xl
```

#### Botón Secundario

```css
bg-gray-800 hover:bg-gray-700
text-white font-semibold
rounded-lg px-6 py-3
border border-gray-700
transition-all duration-200
```

#### Botón Outline

```css
bg-transparent border-2 border-red-600
text-red-600 hover:bg-red-600 hover:text-white
font-semibold rounded-lg px-6 py-3
transition-all duration-200
```

### Tarjetas

```css
bg-gray-900 border border-gray-800
rounded-xl shadow-xl
p-6
hover:border-red-600/50
transition-all duration-300
```

### Inputs

```css
bg-gray-900 border border-gray-700
focus:border-red-600 focus:ring-2 focus:ring-red-600/20
text-white placeholder-gray-400
rounded-lg px-4 py-3
transition-all duration-200
```

## Animaciones

### Transiciones Estándar

- **Rápida**: `duration-150` (150ms)
- **Normal**: `duration-200` (200ms)
- **Lenta**: `duration-300` (300ms)

### Efectos

- **Hover**: Cambio de color + elevación de sombra
- **Focus**: Ring de color primario
- **Active**: Escala ligeramente reducida (scale-95)

## Iconografía

- **Librería**: Lucide React
- **Tamaño Base**: `24px` (w-6 h-6)
- **Tamaño Pequeño**: `16px` (w-4 h-4)
- **Tamaño Grande**: `32px` (w-8 h-8)

## Layout

### Estructura Principal

```
┌─────────────────────────────────┐
│         Navbar (fixed)          │
├──────┬──────────────────────────┤
│      │                          │
│ Side │    Main Content Area     │
│ bar  │                          │
│      │                          │
└──────┴──────────────────────────┘
```

### Breakpoints

- **Mobile**: `< 640px`
- **Tablet**: `640px - 1024px`
- **Desktop**: `> 1024px`
- **Wide**: `> 1280px`

## Principios de Diseño

1. **Contraste Alto**: Usar negro y rojo para crear jerarquía visual clara
2. **Minimalismo**: Interfaces limpias con mucho espacio en blanco
3. **Futurista**: Bordes redondeados, gradientes sutiles, animaciones suaves
4. **Accesibilidad**: Contraste WCAG AA mínimo
5. **Consistencia**: Usar los componentes base en toda la aplicación

## Modificar la Paleta

Para modificar los colores del proyecto:

1. Edita el archivo `tailwind.config.js`
2. Actualiza las referencias en este documento
3. Ejecuta la búsqueda y reemplazo en los componentes si es necesario

### Ejemplo de Modificación

Si quieres cambiar el rojo primario:

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#TU_NUEVO_COLOR',
        hover: '#TU_COLOR_HOVER',
        // ...
      }
    }
  }
}
```

## Referencias de Uso

### Fondos

- **Fondo Principal**: `bg-black`
- **Fondo Secundario**: `bg-gray-950`
- **Fondo de Tarjetas**: `bg-gray-900`
- **Fondo Hover**: `hover:bg-gray-800`

### Texto

- **Texto Principal**: `text-white`
- **Texto Secundario**: `text-gray-400`
- **Texto Deshabilitado**: `text-gray-600`
- **Texto Destacado**: `text-red-600`

### Bordes

- **Borde Normal**: `border-gray-800`
- **Borde Hover**: `hover:border-red-600`
- **Borde Activo**: `border-red-600`

---

**Última actualización**: Octubre 2025
**Versión**: 1.0.0
