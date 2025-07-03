/**
 * Deno Oracle Library
 * Una librería completa para conectar y manejar Oracle DB con Deno
 *
 * @author Tu Nombre
 * @version 1.0.0
 */

// Exportar todos los módulos principales
export { closePool, initializePool, OracleConnection, querySQL } from "./src/connection.ts";
export { MemoryCache } from "./src/cache.ts";
export { SqlBuilder } from "./src/sql-builder.ts";
export { DataValidator } from "./src/validator.ts";
export { GenericController } from "./src/controller.ts";

// Exportar tipos
export type {
  CacheConfig,
  EntityConfig,
  FieldConfig,
  PaginatedResponse,
  QueryParams,
  SearchOptions,
  SqlQuery,
} from "./src/types.ts";

// Exportar constantes y configuraciones
export { DEFAULT_CONFIG } from "./src/config.ts";
