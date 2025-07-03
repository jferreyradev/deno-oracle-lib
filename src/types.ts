/**
 * Tipos compartidos para la librería Deno Oracle
 */

// Configuración de Cache
export interface CacheConfig {
  ttl: number;
  maxSize: number;
  enabled: boolean;
}

// Parámetros de consulta SQL
export interface QueryParams {
  [key: string]: string | number | boolean | null;
}

// Consulta SQL construida
export interface SqlQuery {
  sql: string;
  params: QueryParams;
}

// Opciones de búsqueda
export interface SearchOptions {
  search?: string;
  searchFields?: string[];
  filters?: Record<string, string | number | boolean>;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
}

// Respuesta paginada
export interface PaginatedResponse<T = Record<string, unknown>> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Configuración de campo
export interface FieldConfig {
  type: string;
  column?: string; // Nombre de la columna en la base de datos
  length?: number;
  required?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  unique?: boolean;
  readonly?: boolean;
  default?: string | number | boolean;
  displayName?: string;
  description?: string;
  searchable?: boolean;
  format?: string;
  values?: Array<{ value: string | number | boolean; label: string }>;
}

// Configuración de filtro
export interface FilterConfig {
  field: string;
  operator: string;
  value: string | number | boolean;
  displayName: string;
}

// Configuración de validación
export interface ValidationConfig {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  allowedValues?: (string | number | boolean)[];
  message: string;
}

// Configuración de acción personalizada
export interface CustomActionConfig {
  type: string;
  sql: string;
  displayName: string;
  description: string;
}

// Configuración de entidad
export interface EntityConfig {
  tableName: string;
  primaryKey: string;
  autoIncrement?: boolean;
  displayName?: string;
  description?: string;
  fields: Record<string, FieldConfig>;
  operations?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
    search?: boolean;
    paginate?: boolean;
  };
  filters?: Record<string, FilterConfig>;
  validations?: Record<string, ValidationConfig>;
  validationSchema?: ValidationSchema;
  cacheConfig?: CacheConfig;
  customActions?: Record<string, CustomActionConfig>;
}

// Configuración completa de la aplicación
export interface AppConfig {
  entities: Record<string, EntityConfig>;
  settings: {
    defaultPageSize: number;
    maxPageSize: number;
    dateFormat: string;
    timestampFormat: string;
    errorMessages: Record<string, string>;
    features: Record<string, boolean>;
  };
}

// Error de validación
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// Resultado de validación
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  validData: Record<string, unknown>;
}

// Configuración de conexión Oracle
export interface OracleConfig {
  user: string;
  password: string;
  connectString: string;
  poolMin?: number;
  poolMax?: number;
  poolIncrement?: number;
  poolTimeout?: number;
  queueMax?: number;
  queueTimeout?: number;
  _enableStats?: boolean;
  externalAuth?: boolean;
  homogeneous?: boolean;
  privilege?: number;
  autoCommit?: boolean;
  stmtCacheSize?: number;
  edition?: string;
  events?: boolean;
  sessionCallback?: (connection: unknown, requestedTag?: string) => Promise<void>;
  tag?: string;
  poolAlias?: string;
  newPassword?: string;
  _drainTime?: number;
  clientId?: string;
  module?: string;
  action?: string;
}

// Opciones de consulta
export interface QueryOptions {
  outFormat?: number;
  autoCommit?: boolean;
  bindDefs?: Record<string, unknown>;
  extendedMetaData?: boolean;
  fetchArraySize?: number;
  maxRows?: number;
  resultSet?: boolean;
  prefetchRows?: number;
}

// Resultado de consulta
export interface QueryResult<T = Record<string, unknown>> {
  rows?: T[];
  metaData?: Array<{
    name: string;
    fetchType?: number;
    dbType?: number;
    dbTypeName?: string;
    precision?: number;
    scale?: number;
    nullable?: boolean;
  }>;
  outBinds?: Record<string, unknown>;
  rowsAffected?: number;
  implicitResults?: unknown[];
  lastRowid?: string;
}

// Error personalizado de Oracle
export interface OracleError extends Error {
  errorNum?: number;
  offset?: number;
}

// Tipos para procedimientos almacenados
export interface StoredProcedureParam {
  name: string;
  type: "IN" | "OUT" | "IN_OUT";
  dataType: "VARCHAR2" | "NUMBER" | "DATE" | "TIMESTAMP" | "CLOB" | "BLOB" | "CURSOR";
  size?: number;
  value?: unknown;
}

export interface StoredProcedureConfig {
  name: string;
  schema?: string;
  parameters: StoredProcedureParam[];
  description?: string;
}

export interface StoredProcedureResult {
  success: boolean;
  outParams?: Record<string, unknown>;
  resultSets?: Record<string, unknown>[][];
  returnValue?: unknown;
  executionTime?: number;
}

// Tipos para validación de esquemas
export interface ValidationRule {
  type: "string" | "number" | "boolean" | "date";
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  default?: unknown;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}
