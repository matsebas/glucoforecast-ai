# Changelog

## [1.1.2] - 2025-07-06

### Fixed

- Corregido problema de autenticación en producción con middleware NextAuth v5 y Edge Runtime
- Solucionado bug donde archivos CSV duplicados quedaban en estado "Subiendo..." indefinidamente
- Corregido manejo de cookies de sesión en entornos de producción vs desarrollo
- Mejorada vinculación automática de cuentas Google con usuarios existentes
- Corregido toggle de tema que no funcionaba correctamente con tema del sistema por defecto

### Enhanced

- Refactorizada configuración de autenticación para compatibilidad con Edge Runtime
- Mejorado toggle de tema con ciclo de 3 estados: Claro → Oscuro → Sistema → Claro
- Componentizado ThemeToggle para mejor reutilización y separación de responsabilidades
- Aplicadas mejores prácticas React con memoización y hooks optimizados
- Optimizado reporte de progreso en carga de archivos CSV
- Separada configuración auth en archivos edge-compatible y configuración completa

### Technical

- Migración completa a mejores prácticas de NextAuth v5
- Middleware ahora compatible con Edge Runtime de Vercel
- Eliminada duplicación de código en configuración de autenticación
- Creado componente reutilizable ThemeToggle con API flexible (variant, size, className)
- Mejorada arquitectura de componentes con principio de responsabilidad única

## [1.1.1] - 2025-07-06

### Fixed

- Corregido problema de redirects con GoogleProvider en producción
- Actualizado esquema de base de datos para usuarios OAuth
- Mejorados estilos para mejor contraste y accesibilidad

### Added

- Auto-vinculación de cuentas Google con usuarios existentes por email

## [1.1.0] - 2025-07-06

### Added

- Autenticación con Google OAuth 2.0 para acceso simplificado
- Sistema de recuperación de contraseñas con tokens seguros
- Integración con Resend para envío de correos de recuperación
- Framework de testing con Vitest para pruebas unitarias
- Mejoras en tipado TypeScript con Drizzle ORM fuertemente tipado
- Configuración mejorada de base de datos con soporte dual PostgreSQL/Neon

### Enhanced

- Restructuración del layout de autenticación para mejor UX
- Optimización del sistema de middleware de autenticación
- Mejoras en la configuración de variables de entorno

### Fixed

- Corrección del tipado `any` en consultas de base de datos
- Mejoras en la validación de formularios de autenticación
- Correcciones en la configuración de paths de autenticación

### Security

- Tokens de recuperación con expiración automática (30 minutos)
- Eliminación automática de tokens usados o expirados
- Validación robusta de tokens de recuperación

## [1.0.0] - 2025-07-05

### Added

- Registro seguro de usuarios con validación de credenciales y contraseñas robustas
- Inicio y cierre de sesión con control de sesión seguro (Auth.js)
- Carga de archivos CSV desde LibreView con validación de formato y duplicados
- Integración experimental con API de LibreLinkUp para sincronización automática
- Preprocesamiento y validación de datos de CGM
- Cálculo automático de métricas clave: TIR, TBR, TAR, promedio, variabilidad glucémica
- Dashboard visual con métricas y gráficos de tendencias
- Configuración personalizada de rangos glucémicos por usuario
- Interfaz para consultas en lenguaje natural con Google Gemini
- Generación de respuestas explicativas sobre patrones glucémicos
- Sistema de permisos y perfiles (Paciente/Cuidador y Profesional de Salud)
- Política de backup automatizada y cifrada (Vercel Postgres, Blob, backup offline)

### Security

- Hashing de contraseñas con bcrypt
- Protección de rutas privadas
- Política de respaldo 3-2-1 con cifrado AES-256 en almacenamiento externo

### Infrastructure

- Stack full TypeScript con Next.js y Vercel
- Base de datos relacional en Vercel Postgres + Prisma ORM
- Almacenamiento de archivos en Vercel Blob
- Despliegue continuo en Vercel
- Integración con Vercel AI SDK para respuestas en tiempo real

---

> Proyecto desarrollado como parte del Trabajo Final de Grado de la carrera de Licenciatura en Informática (Universidad
> Siglo 21).
