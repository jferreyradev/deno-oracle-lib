# Deno Oracle Library

Una librería reutilizable para Deno que proporciona una capa de abstracción completa para trabajar con Oracle Database. Incluye gestión de conexiones, cache, SQL builder, validación de datos y controladores CRUD genéricos.

> ✅ **Estado del Proyecto**: Librería lista para producción. Todos los warnings de linting han sido corregidos y los tests pasan correctamente.

## 🚀 Características

- ✅ **Gestión de Conexiones**: Pool de conexiones Oracle optimizado
- ✅ **Cache en Memoria**: Sistema de cache configurable con TTL
- ✅ **SQL Builder**: Constructor dinámico de consultas SQL
- ✅ **Validación de Datos**: Validador genérico configurable
- ✅ **Controladores CRUD**: Operaciones CRUD automáticas
- ✅ **Configuración de Entidades**: Gestión de metadatos de tablas
- ✅ **TypeScript**: Completamente tipado para mejor DX

## 📦 Instalación y Uso

### **Instalación Local (Desarrollo)**

```typescript
// Clonar el repositorio
git clone https://github.com/tu-usuario/deno-oracle-lib.git
cd deno-oracle-lib

// Usar directamente
import { OracleConnection } from "./mod.ts";
```

### **Uso desde GitHub (Recomendado actualmente)**

```typescript
// Versión específica (recomendado)
import {
  GenericController,
  initializePool,
  MemoryCache,
  OracleConnection,
  querySQL,
  SqlBuilder,
} from "https://raw.githubusercontent.com/tu-usuario/deno-oracle-lib/v1.0.0/mod.ts";

// Última versión de main (no recomendado para producción)
import { OracleConnection } from "https://raw.githubusercontent.com/tu-usuario/deno-oracle-lib/main/mod.ts";
```

### **Uso con Import Maps**

```json
// deno.json
{
  "imports": {
    "oracle-lib/": "https://raw.githubusercontent.com/tu-usuario/deno-oracle-lib/v1.0.0/"
  }
}
```

```typescript
// En tu código
import { OracleConnection } from "oracle-lib/mod.ts";
```

### **Uso con deps.ts (Patrón Recomendado)**

```typescript
// deps.ts
export {
  GenericController,
  initializePool,
  MemoryCache,
  OracleConnection,
  querySQL,
  SqlBuilder,
} from "https://raw.githubusercontent.com/tu-usuario/deno-oracle-lib/v1.0.0/mod.ts";
```

```typescript
// tu_archivo.ts
import { OracleConnection, querySQL } from "./deps.ts";
```

## 🔧 Uso Básico

### 1. Configuración de Conexión

```typescript
import { initializePool, OracleConnection } from "https://deno.land/x/deno-oracle-lib/mod.ts";

// Configuración de la base de datos
const dbConfig = {
  user: "tu_usuario",
  password: "tu_password",
  connectString: "localhost:1521/XE",
  poolMin: 2,
  poolMax: 10,
};

// Inicializar el pool global
await initializePool(dbConfig);

// O usar una instancia específica
const oracle = new OracleConnection(dbConfig);
await oracle.open();
```

### 2. Ejecutar Consultas

```typescript
import { querySQL } from "https://deno.land/x/deno-oracle-lib/mod.ts";

// Consulta simple
const result = await querySQL("SELECT * FROM usuarios WHERE id = :id", { id: 1 });
console.log(result.rows);

// Consulta con paginación
const paginatedResult = await querySQL(
  "SELECT * FROM usuarios",
  { limit: 10, offset: 0 },
);
```

### 3. Cache

```typescript
import { MemoryCache } from "https://deno.land/x/deno-oracle-lib/mod.ts";

const cache = new MemoryCache({
  defaultTTL: 300, // 5 minutos
  maxSize: 1000,
  cleanupInterval: 60000, // 1 minuto
});

// Guardar en cache
cache.set("usuario:1", { id: 1, nombre: "Juan" });

// Obtener del cache
const usuario = cache.get("usuario:1");

// Invalidar por patrón
cache.invalidatePattern("usuario:*");
```

### 4. SQL Builder

```typescript
import { SqlBuilder } from "https://deno.land/x/deno-oracle-lib/mod.ts";

const entityConfig = {
  tableName: "usuarios",
  primaryKey: "id",
  fields: {
    id: { type: "number", required: true },
    nombre: { type: "string", required: true, maxLength: 100 },
    email: { type: "string", required: true, maxLength: 255 },
  },
};

const builder = new SqlBuilder(entityConfig);

// Construir SELECT
const selectQuery = builder.buildSelectQuery({
  filters: { activo: true },
  orderBy: "nombre",
  orderDirection: "ASC",
});

// Construir INSERT
const insertQuery = builder.buildInsertQuery({
  nombre: "Juan Pérez",
  email: "juan@example.com",
});

// Construir UPDATE
const updateQuery = builder.buildUpdateQuery(1, {
  nombre: "Juan Carlos",
});
```

### 5. Controlador CRUD Completo

```typescript
import { EntityConfigManager, GenericController } from "https://deno.land/x/deno-oracle-lib/mod.ts";

// Configurar entidad
const userConfig = {
  tableName: "usuarios",
  primaryKey: "id",
  fields: {
    id: { type: "number", required: true },
    nombre: { type: "string", required: true, maxLength: 100 },
    email: { type: "string", required: true, maxLength: 255 },
    activo: { type: "boolean", defaultValue: true },
  },
};

// Crear controlador
const userController = new GenericController(userConfig);

// Operaciones CRUD automáticas
const usuarios = await userController.findAll({
  page: 1,
  pageSize: 10,
  filters: { activo: true },
  search: "Juan",
  searchFields: ["nombre", "email"],
});

const usuario = await userController.findById(1);

const nuevoUsuario = await userController.create({
  nombre: "Ana García",
  email: "ana@example.com",
});

const usuarioActualizado = await userController.update(1, {
  nombre: "Ana María García",
});

await userController.delete(1);

// Estadísticas
const stats = await userController.getStats();
console.log(`Total usuarios: ${stats.total}, Cache hits: ${stats.cacheHits}`);
```

### 6. Validación de Datos

```typescript
import { DataValidator } from "https://deno.land/x/deno-oracle-lib/mod.ts";

const validator = new DataValidator(entityConfig);

// Validar datos
const validationResult = validator.validate({
  nombre: "Juan",
  email: "juan@example.com",
});

if (!validationResult.isValid) {
  console.error("Errores de validación:", validationResult.errors);
}

// Limpiar datos (remove campos no definidos)
const cleanData = validator.sanitizeData({
  nombre: "Juan",
  email: "juan@example.com",
  campoExtra: "esto será removido",
});
```

## 🛠️ Configuración Avanzada

### Pool de Conexiones

```typescript
const dbConfig = {
  user: "usuario",
  password: "password",
  connectString: "host:puerto/servicio",
  poolMin: 5, // Conexiones mínimas
  poolMax: 20, // Conexiones máximas
  poolIncrement: 2, // Incremento de conexiones
  poolTimeout: 60, // Timeout del pool
  poolPingInterval: 60, // Ping de conexiones
  stmtCacheSize: 50, // Cache de statements
  autoCommit: false, // Auto commit transacciones
};
```

### Cache Personalizado

```typescript
const cacheConfig = {
  defaultTTL: 600, // 10 minutos
  maxSize: 5000, // Máximo 5000 entradas
  cleanupInterval: 30000, // Limpieza cada 30 segundos
};

const cache = new MemoryCache(cacheConfig);
```

### Gestión de Entidades

```typescript
import { EntityConfigManager } from "https://deno.land/x/deno-oracle-lib/mod.ts";

const configManager = new EntityConfigManager();

// Registrar múltiples entidades
configManager.register("usuarios", userConfig);
configManager.register("productos", productConfig);
configManager.register("pedidos", orderConfig);

// Obtener configuración
const config = configManager.get("usuarios");

// Listar entidades registradas
const entities = configManager.list();
```

## 🔒 Gestión de Errores

```typescript
try {
  const result = await querySQL("SELECT * FROM tabla_inexistente");
} catch (error) {
  if (error.message.includes("ORA-00942")) {
    console.error("Tabla no existe:", error.message);
  } else {
    console.error("Error de base de datos:", error);
  }
}
```

## 📈 Monitoreo y Estadísticas

```typescript
// Estadísticas del cache
const cacheStats = cache.getStats();
console.log(`Cache: ${cacheStats.size}/${cacheStats.maxSize} entradas`);
console.log(`Hit rate: ${cacheStats.hitRate}%`);

// Estadísticas de entidad
const entityStats = await controller.getStats();
console.log(`Total registros: ${entityStats.total}`);
console.log(`Cache hits: ${entityStats.cacheHits}`);
```

## 🧪 Testing

```typescript
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Oracle connection test", async () => {
  const oracle = new OracleConnection(testConfig);
  await oracle.open();

  const isConnected = await oracle.testConnection();
  assertEquals(isConnected, true);

  await oracle.close();
});
```

## 📚 API Reference

### Clases Principales

- **`OracleConnection`**: Gestión de conexiones Oracle
- **`MemoryCache`**: Cache en memoria con TTL
- **`SqlBuilder`**: Constructor dinámico de SQL
- **`DataValidator`**: Validador de datos
- **`GenericController`**: Controlador CRUD genérico
- **`EntityConfigManager`**: Gestión de configuraciones

### Funciones Globales

- **`initializePool(config)`**: Inicializa pool global
- **`querySQL(sql, params, options)`**: Ejecuta consulta SQL
- **`closePool()`**: Cierra pool global

### Interfaces Principales

- **`DatabaseConfig`**: Configuración de base de datos
- **`EntityConfig`**: Configuración de entidad
- **`SearchOptions`**: Opciones de búsqueda
- **`PaginatedResponse`**: Respuesta paginada
- **`QueryResult`**: Resultado de consulta

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles.

## 🚀 Publicación y Distribución

### **Estado Actual**

Esta librería está lista para uso, pero requiere corrección de algunos warnings de linting antes de publicación oficial.

### **Formas de Usar la Librería**

#### 1. **Desarrollo Local**

```bash
git clone https://github.com/tu-usuario/deno-oracle-lib.git
cd deno-oracle-lib
```

#### 2. **Desde GitHub Releases** (Recomendado)

```typescript
// Versión específica desde GitHub
import { OracleConnection } from "https://raw.githubusercontent.com/tu-usuario/deno-oracle-lib/v1.0.0/mod.ts";
```

#### 3. **Con Import Maps**

```json
// deno.json
{
  "imports": {
    "oracle-lib/": "https://raw.githubusercontent.com/tu-usuario/deno-oracle-lib/v1.0.0/"
  }
}
```

#### 4. **Patrón deps.ts** (Mejor práctica)

```typescript
// deps.ts
export * from "https://raw.githubusercontent.com/tu-usuario/deno-oracle-lib/v1.0.0/mod.ts";
```

### **Para Publicar en deno.land/x**

1. **Preparar el repositorio:**

```bash
# Corregir warnings de linting
deno lint --fix

# Verificar que compila
deno check mod.ts

# Ejecutar tests
deno test
```

2. **Crear release en GitHub:**

```bash
git tag v1.0.0
git push origin v1.0.0
```

3. **Registrar en https://deno.land/x**
   - Conectar cuenta GitHub
   - Agregar repositorio `deno-oracle-lib`

### **Versionado**

- `v1.0.0`: Primera versión estable
- `v1.1.0`: Nuevas características
- `v1.0.1`: Correcciones de bugs

### **Comandos de Mantenimiento**

```bash
# Verificar código
deno lint
deno fmt --check
deno check mod.ts

# Tests
deno test

# Actualizar dependencias
deno cache --reload mod.ts
```

## 🔗 Enlaces

- [Documentación de Oracle Database](https://docs.oracle.com/database/)
- [Deno Manual](https://deno.land/manual)
- [node-oracledb](https://oracle.github.io/node-oracledb/) (referencia)

---

**Nota**: Esta librería está diseñada para ser plug-and-play. Simplemente importa los módulos que necesites y comienza a usarlos. Todos los tipos están incluidos para una mejor experiencia de desarrollo con TypeScript.
