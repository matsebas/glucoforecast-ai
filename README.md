# GlucoForecast AI

Asistente web para gestión inteligente de diabetes tipo 1, que integra datos de Monitoreo Continuo de Glucosa (CGM) y
utiliza Inteligencia Artificial Generativa para generar reportes en lenguaje natural para apoyar a pacientes con DM1 en
la autogestión de su condición.

## 🚀 Características principales

- **Monitoreo Continuo de Glucosa (CGM)**: Análisis completo de datos de glucosa con métricas de tiempo en rango (TIR)
- **Inteligencia Artificial**: Reconocimiento de patrones de glucosa y consejos personalizados con Google Gemini
- **Integración LibreView**: Importación automática de datos desde archivos CSV de LibreView
- **Configuración de Parámetros**: Gestión de factores de sensibilidad a la insulina (ISF), ratios de carbohidratos (
  ICR) y rangos objetivo
- **Visualizaciones Históricas**: Gráficos y métricas de glucosa para diferentes períodos de tiempo
- **Cálculo de Insulina**: Asistencia inteligente para el cálculo de dosis de insulina

## 🛠️ Tecnologías utilizadas

- **Frontend**: Next.js 15.3.3 con React 19 y TailwindCSS 4.1.7
- **Base de Datos**: PostgreSQL con Drizzle ORM
- **Autenticación**: NextAuth.js 5.0.0-beta.28
- **Inteligencia Artificial**: Google Gemini 2.0 Flash vía AI SDK
- **Despliegue**: Vercel con PostgreSQL

## 📋 Prerrequisitos

Antes de comenzar, asegurate de tener instalado:

### Herramientas necesarias

1. **Node.js 18.x o superior**
   - [Descargar Node.js](https://nodejs.org/en/download)
   - Verificar instalación: `node --version`

2. **pnpm 8.x o superior**
   - [Guía de instalación de pnpm](https://pnpm.io/installation)
   - Instalación rápida: `npm install -g pnpm`
   - Verificar instalación: `pnpm --version`

3. **Docker y Docker Compose**
   - **Windows**: [Docker Desktop para Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
   - **macOS**: [Docker Desktop para Mac](https://docs.docker.com/desktop/setup/install/mac-install/)
   - **Linux**: [Docker Desktop para Linux](https://docs.docker.com/desktop/setup/install/linux/)
   - Verificar instalación: `docker --version` y `docker-compose --version`

4. **Cuenta de Google AI Studio** (para API de Gemini)
   - [Crear cuenta en Google AI Studio](https://aistudio.google.com/app/apikey)

## 🚀 Instalación y configuración local

### 1. Clonar el repositorio

```bash
git clone https://github.com/matsebas/glucoforecast-ai.git
cd glucoforecast-ai
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env.local
```

### 4. Obtener API Key de Google AI (Gemini)

1. Ingresá a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Iniciá sesión con tu cuenta de Google
3. Hacé clic en "Create API Key"
4. Copiá la API key generada
5. Editá el archivo `.env.local` y reemplazá `YOUR_GOOGLE_AI_API_KEY_HERE` con tu API key:

```env
GOOGLE_GENERATIVE_AI_API_KEY="tu-api-key-real-aqui"
```

### 5. Levantar la base de datos con Docker

```bash
# Iniciar PostgreSQL en Docker
docker-compose up -d postgres

# Verificar que la base de datos esté corriendo
docker-compose ps
```

### 6. Configurar la base de datos

```bash
# Generar las migraciones de Drizzle
pnpm db:generate

# Aplicar las migraciones a la base de datos
pnpm db:migrate
```

### 7. Ejecutar la aplicación

```bash
# Iniciar el servidor de desarrollo
pnpm dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### 8. Detener el entorno

```bash
# Detener la aplicación: Ctrl+C en la terminal donde corre pnpm dev

# Detener la base de datos
docker-compose down

# Para borrar todos los datos (cuidado, esto elimina la base de datos)
docker-compose down -v
```

## 🔧 Configuración adicional

### Variables de entorno opcionales

- **LIBRE_LINK_EMAIL/PASSWORD**: Para integración directa con LibreView API (opcional)
- **BLOB_READ_WRITE_TOKEN**: Para almacenamiento de archivos en Vercel (solo producción)
- **VERBOSE**: Para logs detallados durante desarrollo

### Solución de problemas comunes

1. **Error de conexión a la base de datos**: Verificá que Docker esté ejecutándose y que el contenedor de PostgreSQL
   esté activo
2. **Error de API de Gemini**: Verificá que tu API key sea válida y que tengas créditos disponibles
3. **Error de migraciones**: Asegurate de que la base de datos esté corriendo antes de ejecutar las migraciones
4. **Conectando a Neon en lugar de local**: Si tenés Vercel CLI instalado, podría estar inyectando variables de
   entorno. Asegurate de que `USE_LOCAL_DB="true"` esté en tu `.env.local`

### Alternar entre desarrollo local y Vercel

El proyecto detecta automáticamente el entorno:

- **Desarrollo local**: Usa PostgreSQL local si `USE_LOCAL_DB="true"` está configurado
- **Vercel**: Usa automáticamente Neon Database en todos los entornos de Vercel
- **Para trabajar con Vercel localmente**: Comentá o eliminá `USE_LOCAL_DB="true"` del `.env.local`

```env
# Para desarrollo local
USE_LOCAL_DB="true"

# Para testing con datos de Vercel (comentar la línea anterior)
# USE_LOCAL_DB="true"
```

## 🎮 Cuenta de demostración

Para probar la plataforma sin necesidad de registrarte:

- **Email**: `demo@soysiglo.21.edu.ar`
- **Contraseña**: `Final2025!`

## 📊 Datos de prueba

En la carpeta `demo_data/` encontrarás un archivo CSV con datos de muestra en formato LibreView que podés importar para
probar las funcionalidades:

- `demo_glucose_libreview_data.csv`: Datos de glucosa de ejemplo compatibles con el formato de exportación de LibreView

### Cómo importar los datos de prueba:

1. Iniciá sesión con la cuenta demo
2. Navegá a la sección de importación de datos
3. Subí el archivo `demo_glucose_libreview_data.csv`
4. Esperá a que se procesen los datos
5. Configurá tus parámetros de paciente (ISF, ICR, rangos objetivo)
6. Explorá las métricas y consultá con la IA

## 🏗️ Comandos de desarrollo

```bash
# Desarrollo
pnpm dev                 # Iniciar servidor de desarrollo con Turbopack
pnpm build              # Construir para producción
pnpm start              # Iniciar servidor de producción
pnpm lint               # Ejecutar ESLint
pnpm lint:fix           # Corregir problemas de ESLint automáticamente

# Base de datos
pnpm db:generate        # Generar migraciones de Drizzle
pnpm db:migrate         # Aplicar migraciones a la base de datos
pnpm db:pull            # Extraer esquema desde la base de datos
pnpm db:push            # Empujar esquema a la base de datos (usar con precaución)
```

## 📁 Estructura del proyecto

```
├── app/                 # Next.js App Router
│   ├── api/             # Rutas de API
│   ├── (home)/          # Rutas principales de la aplicación
│   ├── login/           # Página de inicio de sesión
│   └── register/        # Página de registro
├── components/          # Componentes React reutilizables
│   └── ui/              # Componentes de UI (shadcn/ui)
├── lib/                 # Lógica de negocio y utilidades
│   ├── db/              # Configuración y esquema de base de datos
│   ├── services/        # Servicios organizados por dominio
│   ├── types/           # Definiciones de tipos TypeScript
│   └── validations/     # Esquemas de validación Zod
├── demo_data/           # Datos de prueba
└── drizzle/             # Migraciones de base de datos
```

## 🔒 Seguridad y privacidad

- Todas las contraseñas se almacenan hasheadas usando bcrypt
- Los datos médicos están protegidos por autenticación obligatoria
- La aplicación cumple con prácticas de seguridad para datos sensibles de salud
- Las sesiones tienen un tiempo de expiración configurado de 30 minutos

## 🩺 Uso médico y disclaimer

**IMPORTANTE**: Esta aplicación es una herramienta de apoyo educativo y no reemplaza el consejo médico profesional.
Siempre consultá con tu médico diabetólogo antes de hacer cambios en tu tratamiento de diabetes.

## 🤝 Contribuir

1. Forkeá el proyecto
2. Creá una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Realizá tus cambios y asegurate de que pasen los lints
4. Commitea tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
5. Empujá a la rama (`git push origin feature/nueva-funcionalidad`)
6. Abrí un Pull Request

## 📝 Notas de desarrollo

- **Idioma**: Los comentarios del código están en español, siendo una aplicación médica en español
- **Base de datos**: Siempre ejecutá `pnpm db:generate` después de cambios en el esquema, luego `pnpm db:migrate`
- **Testing**: Actualmente no hay framework de testing configurado. Se realiza testing manual vía servidor de desarrollo

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consultá el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tenés problemas o preguntas:

1. Revisá la documentación en este README
2. Buscá en los [Issues](https://github.com/matsebas/glucoforecast-ai/issues) existentes
3. Creá un nuevo Issue si no encontrás solución

---

Desarrollado con ❤️ para la comunidad de diabetes tipo 1