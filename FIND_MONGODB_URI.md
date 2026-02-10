# Cómo Encontrar tu URI en MongoDB Atlas

## Si Acabas de Crear el Cluster

### Ruta 1: Desde la Pantalla Principal (MÁS FÁCIL)

1. Abre [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. En el menú izquierdo, haz clic en **"Deployment"**
3. Verás una sección que dice **"Database"**
4. Deberías ver tu cluster (ej: `Cluster0`)
5. Haz clic en el botón **"Connect"** (botón gris/verde a la derecha del nombre del cluster)
6. Se abrirá un modal con 3 opciones:
   - Connect with MongoDB Compass
   - **Connect your application** ← ESTA
   - Connect with MongoDB Shell
7. Haz clic en **"Connect your application"**
8. Se abrirá otro modal con tu URI

### Ruta 2: Si No Ves el Botón Connect

1. Ve a **"Deployment"** → **"Database"**
2. Busca tu cluster (ej: `Cluster0`)
3. Haz clic directamente en el **nombre del cluster**
4. Entrará a la página del cluster
5. Debería haber un botón **"Connect"** en la parte superior
6. Sigue los pasos de la Ruta 1

### Ruta 3: Desde el Menú de Navegación

1. En el menú superior izquierdo, ve a **"Database"**
2. Luego **"Database Deployments"**
3. Verás tu cluster
4. Haz clic en **"Browse Collections"** o **"Connect"**
5. Si noves Connect directamente, hay un menú **"..."** (tres puntos)
6. Haz clic en esos tres puntos → **"Connect"**

## Una Vez Abierto el Modal de Conexión

Cuando hayas hecho clic en **"Connect your application"**:

1. En **"Select your language"**, elige **"Node.js"**
2. En **"Select your driver version"**, selecciona la más reciente (ej: v5.x)
3. **COPIAR LA URI** que aparece en la caja de texto

La URI se verá así:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
```

## Reemplazar Placeholders en la URI

**IMPORTANTE**: La URI tiene placeholders que debes reemplazar:

| Placeholder | Por | Ejemplo |
|-------------|-----|---------|
| `<username>` | Tu usuario de BD | `ahorros-admin` |
| `<password>` | Tu contraseña | `M0ng0DB_Ahorr0s_2024!` |
| `/myFirstDatabase` | Nombre de tu BD | `/ahorros-kingdom` |

**Antes (con placeholders):**
```
mongodb+srv://<username>:<password>@cluster0.abc123.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
```

**Después (completada):**
```
mongodb+srv://ahorros-admin:M0ng0DB_Ahorr0s_2024!@cluster0.abc123.mongodb.net/ahorros-kingdom?retryWrites=true&w=majority
```

## Si Aún No Ves la URI

### Verifica que tu Cluster Esté Creado

1. Ve a **"Deployment"** → **"Database"**
2. ¿Ves tu cluster listado?
3. ¿El estado es **"Active"** (verde)?

Si NO ves tu cluster:
- Significa que aún se está creando
- Espera 2-5 minutos más
- Recarga la página (F5)

### Verifica que Creaste un Usuario de BD

1. Ve a **"Security"** → **"Database Access"**
2. ¿Ves tu usuario (ej: `ahorros-admin`) en la lista?
3. Si NO está ahí:
   - Haz clic en **"Add New Database User"**
   - Crea uno nuevo
   - Vuelve a obtener la URI

### Verifica que Permitiste Acceso de Red

1. Ve a **"Security"** → **"Network Access"**
2. ¿Ves tu IP o `0.0.0.0/0` en la lista?
3. Si NO está ahí:
   - Haz clic en **"Add IP Address"**
   - Haz clic en **"Allow Access from Anywhere"**
   - Confirma

## Alternativa: Obtener URI del Cluster Directamente

Si aún tienes problemas:

1. Ve a **"Deployment"** → **"Database"**
2. Hayvmodo el nombre de tu cluster (ej: `Cluster0`)
3. En la fila del cluster, hayvmás a la derecha un menú **"..."**
4. Haz clic en **"Connect"**
5. Sigue los pasos anteriores

## Copiar y Guardar la URI

Una vez que tengas tu URI:

1. **Cópiala completamente** (Ctrl+C)
2. **Guárdala en un archivo de texto seguro** (no en Git)
3. Úsala en tu `.env`:
```
MONGODB_URI=mongodb+srv://ahorros-admin:password@cluster0.xxxxx.mongodb.net/ahorros-kingdom
```

## Probar que Funciona

Desde la carpeta backend:

```bash
# En tu terminal
npm run seed
```

Deberías ver:
```
MongoDB Connected: cluster0.xxxxx.mongodb.net
✅ Usuarios sembrados
✅ Eventos sembrados
```

¿Ves un error diferente? Cuéntame exactamente qué dice el error.
