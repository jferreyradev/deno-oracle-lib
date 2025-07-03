# Deno Oracle Library

Una librería reutilizable para Deno que proporciona una capa de abstracción completa para trabajar con Oracle Database. Incluye gestión de conexiones, cache, SQL builder, validación de datos y controladores CRUD genéricos.

> ✅ **Estado del Proyecto**: Librería lista para producción. Todos los warnings de linting han sido corregidos y los tests pasan correctamente.

> 🔗 **Repositorio**: [https://github.com/jferreyradev/deno-oracle-lib](https://github.com/jferreyradev/deno-oracle-lib)

> 👤 **Autor**: jferreyradev

## 🚀 Características

- ✅ **Gestión de Conexiones**: Pool de conexiones Oracle optimizado
- ✅ **Cache en Memoria**: Sistema de cache configurable con TTL
- ✅ **SQL Builder**: Constructor dinámico de consultas SQL
- ✅ **Validación de Datos**: Validador genérico configurable
- ✅ **Controladores CRUD**: Operaciones CRUD automáticas
- ✅ **Configuración de Entidades**: Gestión de metadatos de tablas
- ✅ **Procedimientos Almacenados**: Ejecución de SP, funciones y bloques PL/SQL
- ✅ **TypeScript**: Completamente tipado para mejor DX

## 📦 Instalación y Uso

### **Instalación Local (Desarrollo)**

```typescript
// Clonar el repositorio
git clone https://github.com/jferreyradev/deno-oracle-lib.git
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
  StoredProcedureExecutor,
} from "https://raw.githubusercontent.com/jferreyradev/deno-oracle-lib/v1.0.0/mod.ts";

// Última versión de main (no recomendado para producción)
import { OracleConnection } from "https://raw.githubusercontent.com/jferreyradev/deno-oracle-lib/main/mod.ts";
```

### **Uso con Import Maps**

```json
// deno.json
{
  "imports": {
    "oracle-lib/": "https://raw.githubusercontent.com/jferreyradev/deno-oracle-lib/v1.0.0/"
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
  StoredProcedureExecutor,
} from "https://raw.githubusercontent.com/jferreyradev/deno-oracle-lib/v1.0.0/mod.ts";
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

// Consulta con paginación automática
const paginatedResult = await querySQL(
  "SELECT * FROM usuarios ORDER BY nombre",
  { limit: 10, offset: 0 },
);

// Consulta con múltiples parámetros
const complexResult = await querySQL(
  `
  SELECT u.nombre, d.departamento, COUNT(*) as proyectos
  FROM usuarios u 
  JOIN departamentos d ON u.dept_id = d.id
  WHERE u.activo = :activo AND u.fecha_creacion >= :desde
  GROUP BY u.nombre, d.departamento
  ORDER BY proyectos DESC
`,
  {
    activo: 1,
    desde: new Date("2024-01-01"),
  },
);

// Tipos de datos soportados
const dataQuery = await querySQL(
  `
  SELECT 
    :texto as campo_texto,
    :numero as campo_numero,
    :decimal as campo_decimal,
    :fecha as campo_fecha,
    :booleano as campo_booleano
  FROM dual
`,
  {
    texto: "Ejemplo",
    numero: 42,
    decimal: 3.14159,
    fecha: new Date(),
    booleano: true,
  },
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

### 7. Procedimientos Almacenados

```typescript
import {
  GenericController,
  StoredProcedureExecutor,
} from "https://raw.githubusercontent.com/jferreyradev/deno-oracle-lib/v1.0.0/mod.ts";

// Ejecutor independiente
const spExecutor = new StoredProcedureExecutor("MI_SCHEMA");

// Ejecutar procedimiento almacenado
const resultado = await spExecutor.execute("sp_crear_usuario", {
  p_nombre: "Juan Pérez",
  p_email: "juan@example.com",
  p_activo: 1,
});

console.log("Resultado:", resultado.outParams);
console.log("Tiempo ejecución:", resultado.executionTime + "ms");

// Ejecutar función con valor de retorno
const edad = await spExecutor.executeFunction(
  "fn_calcular_edad",
  { p_fecha_nacimiento: new Date("1990-05-15") },
  "NUMBER",
);

console.log("Edad calculada:", edad.returnValue);

// Bloque PL/SQL anónimo
const plsqlResult = await spExecutor.executePlSqlBlock(
  `
  DECLARE
    v_count NUMBER;
  BEGIN
    SELECT COUNT(*) INTO v_count FROM usuarios WHERE activo = :p_activo;
    :resultado := 'Total usuarios: ' || v_count;
  END;
`,
  {
    p_activo: 1,
    resultado: { dir: "OUT", type: "STRING" },
  },
);

// Usar con GenericController
const userController = new GenericController(userConfig, undefined, undefined, "MI_SCHEMA");

// Listar procedimientos disponibles
const procedimientos = await userController.listStoredProcedures();
console.log("Procedimientos:", procedimientos);

// Ejecutar procedimiento a través del controller
await userController.executeStoredProcedure("sp_auditoria_usuario", {
  p_usuario_id: 123,
  p_accion: "UPDATE",
});

// Obtener información de un procedimiento
const info = await userController.getStoredProcedureInfo("sp_crear_usuario");
console.log("Parámetros:", info.parameters);
```

## 📁 Ejemplos

La librería incluye ejemplos completos y ejecutables:

### **Ejemplo Básico** (`example.ts`)

```bash
deno run --allow-net --allow-read example.ts
```

Demuestra todas las funcionalidades principales con datos simulados.

### **Ejemplos de Consultas SQL** (`examples/sql-examples.ts`)

```bash
deno run --allow-net --allow-read examples/sql-examples.ts
```

Ejemplos específicos de:

- Consultas SQL directas con parámetros
- Paginación automática
- SQL Builder dinámico
- Consultas complejas (JOIN, GROUP BY)
- Manejo de tipos de datos
- Cache integrado
- Manejo de errores
- Procedimientos almacenados

### **Ejemplos de Procedimientos Almacenados** (`examples/stored-procedures.ts`)

```bash
deno run --allow-net --allow-read examples/stored-procedures.ts
```

Casos de uso específicos para procedimientos, funciones y bloques PL/SQL.

### **Estructura de Archivos**

```
examples/
├── sql-examples.ts          # Ejemplos de consultas SQL
├── stored-procedures.ts     # Ejemplos de procedimientos almacenados
└── README.md               # Documentación de ejemplos
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
- **`StoredProcedureExecutor`**: Ejecutor de procedimientos almacenados

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
- **`StoredProcedureConfig`**: Configuración de procedimiento almacenado
- **`StoredProcedureResult`**: Resultado de procedimiento almacenado

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
git clone https://github.com/jferreyradev/deno-oracle-lib.git
cd deno-oracle-lib
```

#### 2. **Desde GitHub Releases** (Recomendado)

```typescript
// Versión específica desde GitHub
import { OracleConnection } from "https://raw.githubusercontent.com/jferreyradev/deno-oracle-lib/v1.0.0/mod.ts";
```

#### 3. **Con Import Maps**

```json
// deno.json
{
  "imports": {
    "oracle-lib/": "https://raw.githubusercontent.com/jferreyradev/deno-oracle-lib/v1.0.0/"
  }
}
```

#### 4. **Patrón deps.ts** (Mejor práctica)

```typescript
// deps.ts
export * from "https://raw.githubusercontent.com/jferreyradev/deno-oracle-lib/v1.0.0/mod.ts";
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

- **Repositorio**: [https://github.com/jferreyradev/deno-oracle-lib](https://github.com/jferreyradev/deno-oracle-lib)
- **Issues**: [https://github.com/jferreyradev/deno-oracle-lib/issues](https://github.com/jferreyradev/deno-oracle-lib/issues)
- **Releases**: [https://github.com/jferreyradev/deno-oracle-lib/releases](https://github.com/jferreyradev/deno-oracle-lib/releases)
- **Documentación de Oracle Database**: [https://docs.oracle.com/database/](https://docs.oracle.com/database/)
- **Deno Manual**: [https://deno.land/manual](https://deno.land/manual)
- **node-oracledb**: [https://oracle.github.io/node-oracledb/](https://oracle.github.io/node-oracledb/) (referencia)

---

**Nota**: Esta librería está diseñada para ser plug-and-play. Simplemente importa los módulos que necesites y comienza a usarlos. Todos los tipos están incluidos para una mejor experiencia de desarrollo con TypeScript.

**Autor**: [jferreyradev](https://github.com/jferreyradev) | **Licencia**: MIT

## 🔐 Configuración de Credenciales

La librería ofrece múltiples formas flexibles de configurar las credenciales de conexión:

### **1. Configuración Directa (Más Simple)**

```typescript
import { initializePool } from "./mod.ts";

const config = {
  user: "mi_usuario",
  password: "mi_password",
  connectString: "localhost:1521/XE",
  poolMax: 10,
  poolMin: 2,
};

await initializePool(oracledb, config);
```

### **2. Variables de Entorno (Recomendado para Producción)**

```bash
# Establecer variables de entorno
export ORACLE_USER=mi_usuario
export ORACLE_PASSWORD=mi_password
export ORACLE_CONNECT_STRING=localhost:1521/XE
export ORACLE_POOL_MAX=10
export ORACLE_POOL_MIN=2
```

```typescript
import { configManager, initializePool } from "./mod.ts";

// Cargar desde variables de entorno
const config = configManager.fromEnvironment();
await initializePool(oracledb, config);

// Con prefijo personalizado
const configCustom = configManager.fromEnvironment({
  prefix: "DB", // DB_USER, DB_PASSWORD, etc.
  throwOnMissing: false,
});
```

### **3. Archivo de Configuración JSON**

```json
// config/database.json
{
  "development": {
    "user": "dev_user",
    "password": "dev_password",
    "connectString": "localhost:1521/XEPDB1",
    "poolMax": 5,
    "poolMin": 1
  },
  "production": {
    "user": "prod_user",
    "password": "prod_password",
    "connectString": "prod-server:1521/PRODDB",
    "poolMax": 20,
    "poolMin": 5
  }
}
```

```typescript
import { configManager, initializePool } from "./mod.ts";

const config = await configManager.fromFile("./config/database.json", "development");
await initializePool(oracledb, config);
```

### **4. Connection String**

```typescript
import { configManager, initializePool } from "./mod.ts";

const config = configManager.fromConnectionString(
  "prod-server:1521/PRODDB",
  { user: "mi_usuario", password: "mi_password" },
);
await initializePool(oracledb, config);
```

### **5. Componentes Separados**

```typescript
import { configManager, initializePool } from "./mod.ts";

const config = configManager.fromComponents(
  { user: "usuario", password: "password" },
  { host: "db-server", port: 1521, serviceName: "PRODDB" },
  { poolMax: 15, poolMin: 3 }, // opciones del pool
);
await initializePool(oracledb, config);
```

### **6. Configuración Híbrida (Recomendada)**

```typescript
import { configManager, initializePoolWithConfig } from "./mod.ts";

// Combina: archivo base + variables de entorno + overrides
const config = await configManager.hybrid(
  "./config/database.json", // archivo base
  "production", // entorno
  true, // usar variables de entorno si están disponibles
  { poolMax: 25 }, // overrides específicos
);

await initializePool(oracledb, config);
```

### **7. Función Personalizada**

```typescript
import { initializePoolWithConfig } from "./mod.ts";

const customConfig = async () => {
  // Lógica personalizada (consultar servicio de credenciales, etc.)
  const credentials = await fetchCredentialsFromVault();

  return {
    user: credentials.username,
    password: credentials.password,
    connectString: credentials.connectionString,
    poolMax: 20,
  };
};

await initializePoolWithConfig(oracledb, customConfig);
```

### **8. Validación de Configuración**

```typescript
import { configManager } from "./mod.ts";

const config = {/* tu configuración */};
const validation = configManager.validate(config);

if (!validation.isValid) {
  console.error("Errores de configuración:", validation.errors);
  return;
}

await initializePool(oracledb, config);
```

### **Parámetros de Configuración Disponibles**

| Parámetro          | Tipo   | Requerido | Descripción                                  |
| ------------------ | ------ | --------- | -------------------------------------------- |
| `user`             | string | ✅        | Usuario de la base de datos                  |
| `password`         | string | ✅        | Contraseña del usuario                       |
| `connectString`    | string | ✅        | String de conexión (host:puerto/servicio)    |
| `poolMax`          | number | ❌        | Máximo conexiones del pool (default: 10)     |
| `poolMin`          | number | ❌        | Mínimo conexiones del pool (default: 2)      |
| `poolIncrement`    | number | ❌        | Incremento de conexiones (default: 2)        |
| `poolTimeout`      | number | ❌        | Timeout del pool en segundos (default: 60)   |
| `poolPingInterval` | number | ❌        | Intervalo de ping en segundos (default: 60)  |
| `stmtCacheSize`    | number | ❌        | Tamaño del cache de statements (default: 23) |
| `libDir`           | string | ❌        | Directorio de librerías Oracle               |

### **Variables de Entorno Soportadas**

Con prefijo `ORACLE_` (configurable):

- `ORACLE_USER`
- `ORACLE_PASSWORD`
- `ORACLE_CONNECT_STRING`
- `ORACLE_POOL_MAX`
- `ORACLE_POOL_MIN`
- `ORACLE_POOL_INCREMENT`
- `ORACLE_POOL_TIMEOUT`
- `ORACLE_POOL_PING_INTERVAL`
- `ORACLE_STMT_CACHE_SIZE`
- `ORACLE_LIB_DIR`

### **Mejores Prácticas de Seguridad**

🔐 **Seguridad:**

- ❌ Nunca hardcodear credenciales en el código
- ✅ Usar variables de entorno para producción
- ✅ Usar archivos de config para desarrollo (con .gitignore)
- ✅ Validar siempre la configuración antes de conectar
- ✅ Usar servicios de gestión de secretos en producción

⚡ **Rendimiento:**

- Configurar `poolMax` según la carga esperada
- Ajustar `poolTimeout` según la latencia de red
- Usar `stmtCacheSize` para consultas repetitivas
- Configurar `poolPingInterval` según la estabilidad de la red

🛠️ **Mantenimiento:**

- Separar configuración por entornos
- Usar configuración híbrida para flexibilidad
- Implementar validación de credenciales
- Documentar las variables de entorno requeridas
