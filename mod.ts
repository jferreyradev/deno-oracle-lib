/**
 * Deno Oracle Library
 * Una librería completa para conectar y manejar Oracle DB con Deno
 *
 * @author jferreyradev
 * @version 1.0.0
 */

// Exportar todos los módulos principales
export { closePool, initializePool, initializePoolWithConfig, OracleConnection, querySQL } from "./src/connection.ts";
export { MemoryCache } from "./src/cache.ts";
export { SqlBuilder } from "./src/sql-builder.ts";
export { DataValidator } from "./src/validator.ts";
export { GenericController } from "./src/controller.ts";
export { StoredProcedureExecutor } from "./src/stored-procedure.ts";
export { ConfigManager, configManager } from "./src/config-manager.ts";

// Exportar tipos
export type {
  CacheConfig,
  EntityConfig,
  FieldConfig,
  PaginatedResponse,
  QueryParams,
  SearchOptions,
  SqlQuery,
  StoredProcedureConfig,
  StoredProcedureParam,
  StoredProcedureResult,
  ValidationRule,
  ValidationSchema,
} from "./src/types.ts";

// Exportar constantes y configuraciones
export { DEFAULT_CONFIG } from "./src/config.ts";
