/**
 * StoredProcedureExecutor - Ejecutor de procedimientos almacenados para Oracle
 */

import { querySQL } from "./connection.ts";
import type { StoredProcedureConfig, StoredProcedureParam, StoredProcedureResult } from "./types.ts";

export class StoredProcedureExecutor {
  private schema?: string;

  constructor(schema?: string) {
    this.schema = schema;
  }

  /**
   * Ejecuta un procedimiento almacenado
   */
  async execute(
    procedureName: string,
    parameters: Record<string, unknown> = {},
    config?: Partial<StoredProcedureConfig>,
  ): Promise<StoredProcedureResult> {
    const startTime = performance.now();

    try {
      const fullProcedureName = this.schema ? `${this.schema}.${procedureName}` : procedureName;

      // Construir la llamada al procedimiento
      const { sql, binds } = this.buildProcedureCall(
        fullProcedureName,
        parameters,
        config?.parameters || [],
      );

      // Ejecutar el procedimiento
      const result = await querySQL(sql, binds);

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        outParams: result.outBinds || {},
        resultSets: result.implicitResults as Record<string, unknown>[][] || [],
        returnValue: (result.outBinds as Record<string, unknown>)?.return_value,
        executionTime,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      throw new Error(
        `Error ejecutando procedimiento '${procedureName}': ${
          error instanceof Error ? error.message : "Error desconocido"
        } (Tiempo: ${executionTime.toFixed(2)}ms)`,
      );
    }
  }

  /**
   * Ejecuta una función almacenada (con valor de retorno)
   */
  async executeFunction(
    functionName: string,
    parameters: Record<string, unknown> = {},
    returnType: "VARCHAR2" | "NUMBER" | "DATE" | "TIMESTAMP" = "VARCHAR2",
  ): Promise<StoredProcedureResult> {
    const startTime = performance.now();

    try {
      const fullFunctionName = this.schema ? `${this.schema}.${functionName}` : functionName;

      // Construir llamada a función con valor de retorno
      const { sql, binds } = this.buildFunctionCall(
        fullFunctionName,
        parameters,
        returnType,
      );

      const result = await querySQL(sql, binds);
      const executionTime = performance.now() - startTime;

      return {
        success: true,
        outParams: result.outBinds || {},
        returnValue: (result.outBinds as Record<string, unknown>)?.return_value,
        executionTime,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      throw new Error(
        `Error ejecutando función '${functionName}': ${
          error instanceof Error ? error.message : "Error desconocido"
        } (Tiempo: ${executionTime.toFixed(2)}ms)`,
      );
    }
  }

  /**
   * Ejecuta un bloque PL/SQL anónimo
   */
  async executePlSqlBlock(
    plsqlBlock: string,
    parameters: Record<string, unknown> = {},
  ): Promise<StoredProcedureResult> {
    const startTime = performance.now();

    try {
      // Preparar binds para el bloque PL/SQL
      const binds: Record<string, unknown> = {};

      // Agregar parámetros de entrada
      Object.entries(parameters).forEach(([key, value]) => {
        binds[key] = value;
      });

      const result = await querySQL(plsqlBlock, binds);
      const executionTime = performance.now() - startTime;

      return {
        success: true,
        outParams: result.outBinds || {},
        executionTime,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      throw new Error(
        `Error ejecutando bloque PL/SQL: ${error instanceof Error ? error.message : "Error desconocido"} (Tiempo: ${
          executionTime.toFixed(2)
        }ms)`,
      );
    }
  }

  /**
   * Obtiene información de un procedimiento almacenado desde el diccionario de datos
   */
  async getProcedureInfo(procedureName: string): Promise<StoredProcedureConfig> {
    try {
      const schema = this.schema || "USER";
      const sql = `
        SELECT 
          p.object_name,
          p.procedure_name,
          a.argument_name,
          a.data_type,
          a.in_out,
          a.data_length,
          a.position
        FROM all_procedures p
        LEFT JOIN all_arguments a ON p.object_name = a.object_name 
          AND p.owner = a.owner
          AND (p.procedure_name = a.object_name OR p.procedure_name IS NULL)
        WHERE p.object_name = UPPER(:procedureName)
          AND p.owner = UPPER(:schema)
        ORDER BY a.position
      `;

      const result = await querySQL(sql, {
        procedureName: procedureName.toUpperCase(),
        schema: schema.toUpperCase(),
      });

      if (!result.rows || result.rows.length === 0) {
        throw new Error(`Procedimiento '${procedureName}' no encontrado`);
      }

      const parameters: StoredProcedureParam[] = [];
      const rows = result.rows as Record<string, unknown>[];

      rows.forEach((row) => {
        if (row.ARGUMENT_NAME) {
          parameters.push({
            name: row.ARGUMENT_NAME as string,
            type: this.mapInOutType(row.IN_OUT as string),
            dataType: this.mapOracleType(row.DATA_TYPE as string),
            size: row.DATA_LENGTH as number,
          });
        }
      });

      return {
        name: procedureName,
        schema: this.schema,
        parameters,
        description: `Procedimiento almacenado ${procedureName}`,
      };
    } catch (error) {
      throw new Error(
        `Error obteniendo información del procedimiento: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      );
    }
  }

  /**
   * Lista todos los procedimientos disponibles en el schema
   */
  async listProcedures(): Promise<string[]> {
    try {
      const schema = this.schema || "USER";
      const sql = `
        SELECT DISTINCT object_name
        FROM all_procedures
        WHERE owner = UPPER(:schema)
          AND object_type IN ('PROCEDURE', 'FUNCTION')
        ORDER BY object_name
      `;

      const result = await querySQL(sql, { schema: schema.toUpperCase() });
      const rows = result.rows as Record<string, unknown>[];

      return rows.map((row) => row.OBJECT_NAME as string);
    } catch (error) {
      throw new Error(
        `Error listando procedimientos: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  }

  /**
   * Construye la llamada SQL para un procedimiento
   */
  private buildProcedureCall(
    procedureName: string,
    parameters: Record<string, unknown>,
    paramConfig: StoredProcedureParam[],
  ): { sql: string; binds: Record<string, unknown> } {
    const binds: Record<string, unknown> = {};
    const paramList: string[] = [];

    // Si no hay configuración de parámetros, usar los parámetros tal como vienen
    if (paramConfig.length === 0) {
      Object.entries(parameters).forEach(([key, value]) => {
        paramList.push(`:${key}`);
        binds[key] = value;
      });
    } else {
      // Usar configuración de parámetros
      paramConfig.forEach((param) => {
        if (param.type === "IN" || param.type === "IN_OUT") {
          binds[param.name] = parameters[param.name];
        }
        if (param.type === "OUT" || param.type === "IN_OUT") {
          binds[param.name] = {
            dir: "OUT",
            type: this.getOracleType(param.dataType),
          };
        }
        paramList.push(`:${param.name}`);
      });
    }

    const sql = `BEGIN ${procedureName}(${paramList.join(", ")}); END;`;

    return { sql, binds };
  }

  /**
   * Construye la llamada SQL para una función
   */
  private buildFunctionCall(
    functionName: string,
    parameters: Record<string, unknown>,
    returnType: string,
  ): { sql: string; binds: Record<string, unknown> } {
    const binds: Record<string, unknown> = {};
    const paramList: string[] = [];

    // Agregar parámetros
    Object.entries(parameters).forEach(([key, value]) => {
      paramList.push(`:${key}`);
      binds[key] = value;
    });

    // Agregar valor de retorno
    binds.return_value = {
      dir: "OUT",
      type: this.getOracleType(returnType),
    };

    const paramString = paramList.length > 0 ? `(${paramList.join(", ")})` : "";
    const sql = `BEGIN :return_value := ${functionName}${paramString}; END;`;

    return { sql, binds };
  }

  /**
   * Mapea tipos Oracle a tipos internos
   */
  private mapOracleType(oracleType: string): StoredProcedureParam["dataType"] {
    const typeMap: Record<string, StoredProcedureParam["dataType"]> = {
      VARCHAR2: "VARCHAR2",
      CHAR: "VARCHAR2",
      NUMBER: "NUMBER",
      DATE: "DATE",
      TIMESTAMP: "TIMESTAMP",
      CLOB: "CLOB",
      BLOB: "BLOB",
      "REF CURSOR": "CURSOR",
    };

    return typeMap[oracleType.toUpperCase()] || "VARCHAR2";
  }

  /**
   * Mapea IN/OUT a tipos internos
   */
  private mapInOutType(inOut: string): StoredProcedureParam["type"] {
    switch (inOut?.toUpperCase()) {
      case "IN":
        return "IN";
      case "OUT":
        return "OUT";
      case "IN/OUT":
        return "IN_OUT";
      default:
        return "IN";
    }
  }

  /**
   * Obtiene el tipo Oracle para node-oracledb
   */
  private getOracleType(dataType: string): string {
    const typeMap: Record<string, string> = {
      VARCHAR2: "STRING",
      NUMBER: "NUMBER",
      DATE: "DATE",
      TIMESTAMP: "TIMESTAMP",
      CLOB: "CLOB",
      BLOB: "BLOB",
      CURSOR: "CURSOR",
    };

    return typeMap[dataType] || "STRING";
  }
}
