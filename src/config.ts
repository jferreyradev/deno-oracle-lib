/**
 * Configuraciones por defecto para la librería Deno Oracle
 */

import type { CacheConfig, OracleConfig } from "./types.ts";

// Configuración por defecto del cache
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 300000, // 5 minutos en milisegundos
  maxSize: 1000,
  enabled: true,
};

// Configuración por defecto de Oracle
export const DEFAULT_ORACLE_CONFIG: Partial<OracleConfig> = {
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 60,
  queueMax: 500,
  queueTimeout: 60000,
  autoCommit: false,
  stmtCacheSize: 30,
  externalAuth: false,
  homogeneous: true,
};

// Configuración por defecto de la aplicación
export const DEFAULT_CONFIG = {
  oracle: DEFAULT_ORACLE_CONFIG,
  cache: DEFAULT_CACHE_CONFIG,
  api: {
    defaultPageSize: 10,
    maxPageSize: 100,
    dateFormat: "YYYY-MM-DD",
    timestampFormat: "YYYY-MM-DD HH24:MI:SS",
  },
  validation: {
    strictMode: true,
    allowUnknownFields: false,
  },
  debug: {
    logQueries: false,
    logConnections: false,
    logCache: false,
  },
};

// Constantes útiles
export const ORACLE_TYPES = {
  VARCHAR2: "VARCHAR2",
  CHAR: "CHAR",
  NUMBER: "NUMBER",
  INTEGER: "INTEGER",
  DATE: "DATE",
  TIMESTAMP: "TIMESTAMP",
  CLOB: "CLOB",
  BLOB: "BLOB",
} as const;

export const SQL_OPERATORS = {
  EQUALS: "=",
  NOT_EQUALS: "<>",
  GREATER_THAN: ">",
  GREATER_THAN_OR_EQUAL: ">=",
  LESS_THAN: "<",
  LESS_THAN_OR_EQUAL: "<=",
  LIKE: "LIKE",
  NOT_LIKE: "NOT LIKE",
  IN: "IN",
  NOT_IN: "NOT IN",
  IS_NULL: "IS NULL",
  IS_NOT_NULL: "IS NOT NULL",
} as const;

export const VALIDATION_FORMATS = {
  EMAIL: "email",
  URL: "url",
  PHONE: "phone",
  DATE: "date",
  DATETIME: "datetime",
} as const;
