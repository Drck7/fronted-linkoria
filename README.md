# Linkoria — Frontend

> Trabajo de Fin de Grado · Desarrollo de Aplicaciones Multiplataforma
>
> Autor: **Daniel Vega**

---

## ¿Qué es Linkoria?
Linkoria es una aplicación de chat en tiempo real inspirada en Discord. Permite a los usuarios autenticarse, mantener conversaciones privadas, explorar servidores, unirse mediante invitación, interactuar con canales y recibir actualizaciones en tiempo real.

Este repositorio contiene el **frontend** desarrollado con Angular 21, organizado con componentes standalone, rutas lazy y un enfoque modular por funcionalidades.

---

## Tecnologías principales
- Angular 21
- TypeScript
- RxJS
- Angular Router con carga diferida de rutas
- Signals para estado local y de sesión
- Tailwind CSS 4
- DaisyUI
- STOMP + SockJS para mensajería en tiempo real
- Vitest para pruebas unitarias

## Requisitos
- Node.js 20 o superior
- npm
- Backend de Linkoria ejecutándose en `http://localhost:8081`

---

## Configuración del backend
La aplicación frontend consume directamente el backend en local con estas URLs base:

```bash
http://localhost:8081/api/v1
ws://localhost:8081/ws
```

Si cambias el puerto del backend, deberás actualizar las URLs hardcodeadas en los servicios de autenticación, usuarios, chat y servidores.

---

## Variables de entorno necesarias
Actualmente no hay variables de entorno propias definidas en este frontend. La sesión se persiste en `localStorage` mediante:

- `token`
- `refreshToken`
- `authUser`

---

## Opción A — Desarrollo local
**Requisitos:** backend arrancado en `http://localhost:8081`.

1. Clona el repositorio:

```bash
git clone <URL_DEL_REPOSITORIO>
cd fronted-linkoria
```

2. Instala dependencias:

```bash
npm install
```

3. Arranca la aplicación:

```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200/`.

---

## Opción B — Generar el build
Para compilar la aplicación en modo producción:

```bash
npm run build
```

Los artefactos se generan en `dist/`.

---

## Scripts disponibles
- `npm start` — Arranca el servidor de desarrollo de Angular
- `npm run build` — Genera el build de producción
- `npm run watch` — Compila en modo observación
- `npm test` — Ejecuta las pruebas unitarias
- `npm run build:css` — Genera el CSS de Tailwind en `public/output.css`

---

## Rutas principales
La aplicación está organizada con rutas lazy y guards de autenticación:

- `auth/` — login y registro
- `/` — layout principal de Linkoria
- `users/all` — página principal
- `users/search` — búsqueda de usuarios
- `users/notify` — notificaciones
- `profile` — perfil propio
- `users/:id` — perfil de otro usuario
- `servers` — listado y gestión de servidores
- `servers-buscar` — unirse a servidores mediante código
- `chat` — conversaciones directas

---

## Módulos implementados

### `auth` — Autenticación
Gestiona el acceso a la aplicación con login, registro y restauración de sesión:

- Login y registro contra el backend
- Refresh automático de tokens al arrancar la app
- Guards para bloquear rutas autenticadas y no autenticadas
- Persistencia de sesión en `localStorage`

### `linkoria-front` — Layout principal
Contiene la navegación visible para usuarios autenticados:

- Home
- Búsqueda de usuarios
- Notificaciones
- Perfil propio
- Perfil público de usuario
- Not found

### `servers` — Servidores y canales
Gestiona la exploración y administración de servidores:

- Listado de servidores del usuario
- Creación, edición y eliminación
- Unión mediante `inviteCode`
- Gestión de miembros y roles
- Categorías y canales de texto
- Navegación a vista detallada de servidor

### `chat` — Mensajería directa
Gestiona las conversaciones privadas y la mensajería en tiempo real:

- Lista de conversaciones directas
- Carga de historial por HTTP
- Envío de mensajes por WebSocket
- Edición y eliminación de mensajes
- Componente de hilo de chat
- Componente de redacción de mensajes

### `shared` — Servicios comunes
Incluye servicios e interceptores reutilizables:

- Servicio de usuarios
- Servicio de amistades
- Interceptores HTTP

---

## Integración con backend
El frontend consume principalmente estos recursos del backend:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `GET /users/search`
- `GET /conversations/dm`
- `GET /conversations/{conversationId}/messages`
- `POST /servers`
- `POST /servers/join`
- `GET /servers/{serverId}/channels`

Además, la mensajería en tiempo real usa STOMP sobre WebSocket con el endpoint `/ws`.

---

## Estado del proyecto
Este proyecto está en desarrollo activo como parte del TFG. La base funcional actual incluye:

- Autenticación con JWT
- Navegación protegida por guards
- Perfil de usuario y búsqueda de usuarios
- Sistema de servidores, miembros y canales
- Conversaciones directas
- Mensajería en tiempo real
- Notificaciones y páginas auxiliares de la interfaz

---

## Estructura del proyecto

```bash
src/app/
auth/
chat/
linkoria-front/
servers/
shared/
types/
```

Cada carpeta agrupa una funcionalidad concreta para mantener el frontend modular y fácil de extender.
