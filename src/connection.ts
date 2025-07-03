/**
 * Oracle Database Connection Module - Librería Reutilizable
 * Módulo de conexión a Oracle Database optimizado para Deno
 */

import type { QueryResult } from "./types.ts";

// Interfaz para el driver Oracle
interface OracleDriver {
  OUT_FORMAT_OBJECT: number;
  CLOB: number;
  outFormat: number;
  fetchAsString: number[];
  initOracleClient: (options: { libDir?: string }) => void;
  createPool: (config: Record<string, unknown>) => Promise<OraclePool>;
}

interface OraclePool {
  getConnection: () => Promise<OracleConnectionInstance>;
  close: (timeout?: number) => Promise<void>;
  connectionsOpen: number;
  connectionsInUse: number;
}

interface OracleConnectionInstance {
  execute: (
    sql: string,
    binds: Record<string, unknown>,
    options: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  close: () => Promise<void>;
}

// Tipos principales
export interface DatabaseConfig {
  user: string;
  password: string;
  connectString: string;
  poolMax?: number;
  poolMin?: number;
  poolIncrement?: number;
  poolTimeout?: number;
  poolPingInterval?: number;
  stmtCacheSize?: number;
  libDir?: string;
}

export interface QueryOptions {
  outFormat?: number;
  autoCommit?: boolean;
  maxRows?: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Clase principal para manejo de conexiones Oracle
 */
export class OracleConnection {
  private config: DatabaseConfig;
  private isDriverInitialized = false;
  private connectionPool: OraclePool | null = null;
  private oracledb: OracleDriver;

  constructor(oracledb: OracleDriver, config: DatabaseConfig) {
    this.oracledb = oracledb;
    this.config = {
      poolMax: 10,
      poolMin: 2,
      poolIncrement: 2,
      poolTimeout: 60,
      poolPingInterval: 60,
      stmtCacheSize: 23,
      ...config,
    };
    this.initializeDriver();
  }

  /**
   * Inicializa el driver de Oracle una sola vez
   */
  private initializeDriver(): void {
    if (!this.isDriverInitialized) {
      try {
        // Configuración global de Oracle
        this.oracledb.outFormat = this.oracledb.OUT_FORMAT_OBJECT;
        this.oracledb.fetchAsString = [this.oracledb.CLOB];

        if (this.config.libDir) {
          this.oracledb.initOracleClient({ libDir: this.config.libDir });
        }

        this.isDriverInitialized = true;
        console.log("Oracle Client inicializado correctamente");
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error inicializando Oracle Client:", errorMessage);
        throw error;
      }
    }
  }

  /**
   * Actualiza la configuración de la conexión
   */
  setConfig(newConfig: Partial<DatabaseConfig>): void {
    if (newConfig && typeof newConfig === "object") {
      this.config = { ...this.config, ...newConfig };
      console.log("Configuración actualizada");

      // Reinicializar pool si existe
      if (this.connectionPool) {
        console.log("Reiniciando pool de conexiones...");
        this.close().then(() => this.open());
      }
    } else {
      throw new Error("La configuración debe ser un objeto válido");
    }
  }

  /**
   * Genera consulta con paginación usando ROWNUM
   */
  private getQueryWithPagination(query: string): string {
    return `
      SELECT * FROM (
        SELECT A.*, ROWNUM AS RNUM 
        FROM (${query}) A
        WHERE ROWNUM <= :limit + :offset
      ) WHERE RNUM > :offset
    `;
  }

  /**
   * Abre el pool de conexiones
   */
  async open(): Promise<void> {
    if (this.connectionPool) {
      console.log("Pool de conexiones ya está abierto");
      return;
    }

    try {
      this.initializeDriver();

      this.connectionPool = await this.oracledb.createPool({
        user: this.config.user,
        password: this.config.password,
        connectString: this.config.connectString,
        poolMax: this.config.poolMax,
        poolMin: this.config.poolMin,
        poolIncrement: this.config.poolIncrement,
        poolTimeout: this.config.poolTimeout,
        poolPingInterval: this.config.poolPingInterval,
        stmtCacheSize: this.config.stmtCacheSize,
      });

      console.log("Pool de conexiones Oracle creado exitosamente");
      console.log(`Pool configurado: min=${this.config.poolMin}, max=${this.config.poolMax}`);
    } catch (error) {
      console.error("Error creando pool de conexiones:", error);
      throw error;
    }
  }

  /**
   * Obtiene una conexión del pool
   */
  async getConnection(): Promise<OracleConnectionInstance> {
    if (!this.connectionPool) {
      await this.open();
    }
    if (!this.connectionPool) {
      throw new Error("No se pudo inicializar el pool de conexiones");
    }
    return await this.connectionPool.getConnection();
  }

  /**
   * Ejecuta una consulta SQL
   */
  async execute(
    statement: string,
    binds: Record<string, unknown> = {},
    opts: QueryOptions = {},
  ): Promise<QueryResult> {
    if (!statement || typeof statement !== "string") {
      throw new Error("La consulta SQL es requerida y debe ser una cadena");
    }

    let connection: OracleConnectionInstance | null = null;
    let query = statement;

    // Configurar opciones por defecto
    const options = {
      outFormat: this.oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...opts,
    };

    try {
      // Obtener conexión del pool
      connection = await this.getConnection();

      // Manejar paginación si se especifica
      if (binds && typeof binds === "object" && "limit" in binds) {
        if (!("offset" in binds)) {
          binds.offset = 0;
        }
        query = this.getQueryWithPagination(statement);

        // Validar parámetros de paginación
        const limit = binds.limit as number;
        const offset = binds.offset as number;
        if (limit < 0 || offset < 0) {
          throw new Error("Los parámetros limit y offset deben ser >= 0");
        }
      }

      // Ejecutar consulta
      if (!connection) {
        throw new Error("No se pudo obtener conexión del pool");
      }

      const result = await connection.execute(query, binds, options) as QueryResult;

      // El resultado ya viene con el formato correcto desde Oracle
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error ejecutando consulta:", errorMessage);
      console.error("SQL:", statement);
      console.error("Binds:", JSON.stringify(binds));
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (error) {
          console.error("Error cerrando conexión:", error);
        }
      }
    }
  }

  /**
   * Prueba la conexión a la base de datos
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.execute("SELECT 1 as test FROM dual");
      return !!(result.rows && result.rows.length > 0 && result.rows[0].TEST === 1);
    } catch (error) {
      console.error("Error probando conexión:", error);
      return false;
    }
  }

  /**
   * Obtiene información de la base de datos
   */
  async getDatabaseInfo(): Promise<Record<string, unknown> | null> {
    try {
      const result = await this.execute(`
        SELECT 
          banner as version,
          'Oracle Database' as name
        FROM v$version 
        WHERE banner LIKE 'Oracle Database%'
      `);
      return result.rows?.[0] || null;
    } catch (error) {
      console.error("Error obteniendo información de la BD:", error);
      return null;
    }
  }

  /**
   * Cierra el pool de conexiones
   */
  async close(): Promise<void> {
    if (this.connectionPool) {
      try {
        await this.connectionPool.close(5); // 5 segundos de timeout
        this.connectionPool = null;
        console.log("Pool de conexiones cerrado correctamente");
      } catch (error) {
        console.error("Error cerrando pool:", error);
        throw error;
      }
    }
  }

  /**
   * Obtiene estadísticas del pool
   */
  getPoolStatistics(): Record<string, unknown> | null {
    if (this.connectionPool) {
      return {
        connectionsOpen: this.connectionPool.connectionsOpen,
        connectionsInUse: this.connectionPool.connectionsInUse,
        poolMax: this.config.poolMax,
        poolMin: this.config.poolMin,
      };
    }
    return null;
  }
}

// Instancia global para uso simplificado
let globalConnection: OracleConnection | null = null;

/**
 * Inicializa una conexión global
 */
export function initializePool(oracledb: OracleDriver, config: DatabaseConfig): void {
  globalConnection = new OracleConnection(oracledb, config);
}

/**
 * Ejecuta una consulta SQL usando la conexión global
 */
export async function querySQL(sql: string, params: Record<string, unknown> = {}): Promise<QueryResult> {
  if (!globalConnection) {
    throw new Error("Pool de conexiones no inicializado. Llama a initializePool() primero.");
  }
  return await globalConnection.execute(sql, params, {});
}

/**
 * Cierra el pool de conexiones global
 */
export async function closePool(): Promise<void> {
  if (globalConnection) {
    await globalConnection.close();
    globalConnection = null;
  }
}
