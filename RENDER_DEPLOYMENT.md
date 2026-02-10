# Guía de Despliegue en Render

Este documento explica cómo desplegar el backend en Render.

## Requisitos Previos

1. Una cuenta en [Render.com](https://render.com)
2. Una base de datos MongoDB en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
3. El código del backend en un repositorio GitHub

## Pasos para Desplegar

### 1. Preparar la Base de Datos MongoDB

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo cluster (puedes usar el free tier)
4. Espera a que se cree el cluster (toma unos minutos)
5. Ve a "Network Access" y agrega tu IP o permite acceso desde cualquier IP
6. Ve a "Database Access" y crea un usuario con contraseña
7. Haz clic en "Connect" y copia la cadena de conexión (URI)
   - Reemplaza `<username>` y `<password>` con tus credenciales
   - Tu URI se verá así: `mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/ahorros-kingdom?retryWrites=true&w=majority`

### 2. Crear el Servicio en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Haz clic en **"New"** → **"Web Service"**
3. Conecta tu repositorio GitHub (si no está conectado, hazlo primero)
4. Selecciona el repositorio donde está el código
5. Rellena los datos:
   - **Name**: nombre de tu aplicación (ej: `ahorros-kingdom-api`)
   - **Environment**: Node
   - **Region**: elige la más cercana a ti
   - **Branch**: main (o tu rama principal)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Desplázate hacia abajo a la sección **"Environment"**

### 3. Agregar Variables de Entorno

En la sección **"Environment Variables"**, agrega lo siguiente:

| Clave | Valor |
|-------|-------|
| `PORT` | `5000` |
| `MONGODB_URI` | Tu URI de MongoDB Atlas (copiar de paso 1) |
| `JWT_SECRET` | Un secreto seguro (por ejemplo: `tu_secreto_super_seguro_2024_xyz`) |
| `JWT_EXPIRE` | `30d` |
| `ADMIN_PASSWORD` | `admin123` (o tu contraseña preferida) |
| `BACKEND_URL` | Dejarla en blanco por ahora, se completará después |
| `NODE_ENV` | `production` |

### 4. Confirmar el Despliegue

1. Haz clic en **"Create Web Service"**
2. Render comenzará a construir e desplegar tu aplicación
3. Espera a que el estado cambie a **"Live"**
4. Copia la URL de tu aplicación (ej: `https://tu-app-name.onrender.com`)

### 5. Actualizar Variables de Entorno

1. Edita la variable `BACKEND_URL` con la URL que obtuviste en el paso 4
   - Esto es importante para que el frontend sepa dónde está el backend

### 6. Actualizar CORS en el Frontend

Cuando despliegues el frontend, asegúrate de actualizar la variable de entorno `NEXT_PUBLIC_API_URL` para que apunte a tu backend en Render:

```
NEXT_PUBLIC_API_URL=https://tu-app-name.onrender.com
```

## Verificar que Funciona

1. Abre en tu navegador: `https://tu-app-name.onrender.com/api/health`
2. Deberías ver: `{"success":true,"message":"API is running"}`

## Notas Importantes

- **Red de Render**: Las aplicaciones gratuitas en Render se pusheran (duermen) después de 15 minutos sin tráfico. Para evitar esto, actualiza a un plan de pago.
- **Timeouts**: Asegúrate de que tu MongoDB Atlas esté accesible desde cualquier IP
- **Logs**: Puedes ver los logs en tiempo real en el dashboard de Render

## Solucionar Problemas

### Error: "Cannot connect to MongoDB"
- Verifica que la URI de MongoDB sea correcta
- Asegúrate de haber permitido acceso desde cualquier IP en MongoDB Atlas

### Error: "Port 5000 is already in use"
- La variable `PORT` en Render debería estar vacía o en 5000

### El frontend no puede conectar al backend
- Verifica que `BACKEND_URL` en el frontend apunte a la URL de Render
- Comprueba que CORS está habilitado en el backend

## Comando Útiles para el Repositorio

Asegúrate de que tu repositorio tenga un `.gitignore` que incluya:

```
node_modules/
.env
.DS_Store
receipts/images/*
```

Y un `.env.example` con las variables que necesita.
