# Guía Paso a Paso: MongoDB Atlas

## Paso 1: Crear Cuenta en MongoDB Atlas

1. Ve a [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Haz clic en **"Try Free"** o **"Sign Up"**
3. Completa el formulario:
   - Email
   - Password
   - First Name
   - Last Name
4. Acepta los términos y haz clic en **"Create Account"**
5. Verifica tu email (MongoDB te enviará un enlace de confirmación)

## Paso 2: Crear un Proyecto

1. Una vez dentro, haz clic en **"+ New Project"**
2. Dale un nombre: `ahorros-kingdom`
3. Haz clic en **"Next"**
4. En "Project Owner", deja la selección por defecto
5. Haz clic en **"Create Project"**

## Paso 3: Crear un Cluster

1. Verás un panel que dice **"Create a Deployment"**
2. Haz clic en **"Build a Database"**
3. Elige el plan **"Free"** (M0 Sandbox) - es suficiente para desarrollo
4. Haz clic en **"Create"**
5. En la siguiente pantalla, selecciona:
   - **Cloud Provider**: AWS, Google Cloud, o Azure (elige cualquiera)
   - **Region**: Elige la región más cercana a ti (ej: `us-east-1` para USA, `eu-west-1` para Europa)
6. Haz clic en **"Create Cluster"**
7. Espera 2-3 minutos mientras se crea el cluster (verás una animación de carga)

## Paso 4: Crear Usuario de Base de Datos

Una vez que el cluster esté creado:

1. En el menú izquierdo, ve a **"Security"** → **"Database Access"**
2. Haz clic en **"Add New Database User"**
3. Completa:
   - **Username**: `ahorros-admin` (o el nombre que prefieras)
   - **Password**: Genera uno seguro (ej: `M0ng0DB_Ahorr0s_2024!`)
   - **Built-in Role**: Selecciona **"Atlas Admin"**
4. Haz clic en **"Add User"**
5. **IMPORTANTE**: Guarda este usuario y contraseña en un lugar seguro

## Paso 5: Permitir Acceso de Red

1. En el menú izquierdo, ve a **"Security"** → **"Network Access"**
2. Haz clic en **"Add IP Address"**
3. Tienes dos opciones:
   - **Opción A (Menos Seguro - Para desarrollo)**: Haz clic en **"Allow Access from Anywhere"**
     - Esto agrupa `0.0.0.0/0` que permite acceso desde cualquier IP
   - **Opción B (Más Seguro)**: Agrega tu IP específica (la de tu casa o oficina)
     - MongoDB automáticamente detecta tu IP actual
4. Haz clic en **"Confirm"**

## Paso 6: Obtener la Cadena de Conexión (URI)

1. Ve a **"Deployment"** o **"Database"** en el menú izquierdo
2. Deberías ver tu cluster creado (ej: `Cluster0`)
3. Haz clic en **"Connect"**
4. Se abrirá un modal con varias opciones
5. Haz clic en **"Drivers"** (si no está seleccionado)
6. En **"Select your language"**, elige **"Node.js"**
7. En **"Select your driver version"**, elige la versión más reciente
8. Verás una cadena que comienza con `mongodb+srv://`

**Ejemplo de URI:**
```
mongodb+srv://ahorros-admin:M0ng0DB_Ahorr0s_2024!@cluster0.abcd1234.mongodb.net/ahorros-kingdom?retryWrites=true&w=majority
```

9. **IMPORTANTE**: Reemplaza:
   - `ahorros-admin` con tu **username**
   - `M0ng0DB_Ahorr0s_2024!` con tu **password**
   - `ahorros-kingdom` al final es el nombre de tu BD (puedes dejarlo igual)

10. Copia esta URI completa

## Paso 7: Usar la URI en Render

1. Abre dashborad de [Render](https://dashboard.render.com)
2. Ve a tu servicio backend
3. Haz clic en **"Environment"**
4. Edita la variable **`MONGODB_URI`**
5. Pega la URI que copiaste en el paso 6
6. Haz clic en **"Save Changes"**
7. Render redesplegará automáticamente con la nueva conexión

## Verificar que Funciona

### Opción 1: Desde tu Máquina Local

1. En tu archivo `.env` local, actualiza:
```
MONGODB_URI=mongodb+srv://ahorros-admin:M0ng0DB_Ahorr0s_2024!@cluster0.abcd1234.mongodb.net/ahorros-kingdom?retryWrites=true&w=majority
```

2. Desde la carpeta backend, ejecuta:
```bash
npm run seed
```

3. Deberías ver mensajes como:
```
✅ Usuarios sembrados
✅ Eventos sembrados
MongoDB Connected: cluster0.abcd1234.mongodb.net
```

### Opción 2: Desde MongoDB Atlas

1. Ve a **"Deployment"** → **"Database"**
2. Haz clic en **"Browse Collections"** en tu cluster
3. Deberías ver tus colecciones: `users`, `deposits`, `events`
4. Si ves datos, ¡significa que funciona!

## Solucionar Problemas

### Error: "MongoServerSelectionError"
- **Causa**: No permitiste el acceso de tu IP
- **Solución**: Ve a **"Network Access"** y agrega tu IP o permite acceso desde cualquier lugar

### Error: "authentication failed"
- **Causa**: Usuario o contraseña incorrectos en la URI
- **Solución**: Copia nuevamente la URI desde MongoDB Atlas

### Error: "Database connection timeout"
- **Causa**: El cluster aún se está creando (toma 2-3 minutos)
- **Solución**: Espera un poco más y vuelve a intentar

### No veo mis datos en Collections
- **Causa**: Aún no has ejecutado el seed
- **Solución**: Ejecuta `npm run seed` para crear datos de prueba

## Resumen de Credenciales a Guardar

Guarda esto en un archivo privado (NO LO COMPARTAS):

```
MongoDB Atlas - ahorros-kingdom
================================

Proyecto: ahorros-kingdom
Cluster: Cluster0
Región: [Tu región elegida]

Usuario: ahorros-admin
Contraseña: [Tu contraseña]

URI:
mongodb+srv://ahorros-admin:password@cluster0.xxxxx.mongodb.net/ahorros-kingdom?retryWrites=true&w=majority

Dirección del Cluster:
cluster0.xxxxx.mongodb.net
```

## Siguientes Pasos

Una vez que MongoDB Atlas esté funcionando:

1. Ve a [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
2. Sigue los pasos para desplegar tu backend en Render

¡Listo! 🎉
