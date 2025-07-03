/**
 * GenericController - Controlador genérico para operaciones CRUD con Oracle
 */

import { querySQL } from "./connection.ts";
import { MemoryCache } from "./cache.ts";
import { SqlBuilder } from "./sql-builder.ts";
import { DataValidator } from "./validator.ts";
import { EntityConfigManager } from "./entity-config.ts";
import type { EntityConfig, PaginatedResponse, QueryResult, SearchOptions, ValidationResult } from "./types.ts";

export class GenericController {
  private entityConfig: EntityConfig;
  private sqlBuilder: SqlBuilder;
  private validator: DataValidator;
  private cache: MemoryCache;
  private configManager: EntityConfigManager;

  constructor(
    entityConfig: EntityConfig,
    cache?: MemoryCache,
    configManager?: EntityConfigManager,
  ) {
    this.entityConfig = entityConfig;
    this.sqlBuilder = new SqlBuilder(entityConfig);
    this.validator = new DataValidator(entityConfig);
    this.cache = cache || new MemoryCache({
      defaultTTL: 300, // 5 minutos
      maxSize: 1000,
      cleanupInterval: 60000, // 1 minuto
    });
    this.configManager = configManager || new EntityConfigManager();
  }

  /**
   * Busca registros con paginación y filtros
   */
  async findAll(options: SearchOptions = {}): Promise<PaginatedResponse> {
    const cacheKey = `${this.entityConfig.tableName}_findAll_${JSON.stringify(options)}`;

    // Verificar caché primero
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as PaginatedResponse;
    }

    try {
      // Construir consultas
      const selectQuery = this.sqlBuilder.buildSelectQuery(options);
      const countQuery = this.sqlBuilder.buildCountQuery(options);

      // Ejecutar consultas
      const [dataResult, countResult] = await Promise.all([
        querySQL(selectQuery.sql, selectQuery.params),
        querySQL(countQuery.sql, countQuery.params),
      ]);

      const data = dataResult.rows || [];
      const total = (countResult.rows?.[0] as Record<string, unknown>)?.total as number || 0;
      const page = options.page || 1;
      const pageSize = options.pageSize || 10;
      const totalPages = Math.ceil(total / pageSize);

      const result: PaginatedResponse = {
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

      // Guardar en caché
      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      throw new Error(`Error en findAll: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  }

  /**
   * Busca un registro por ID
   */
  async findById(id: string | number): Promise<Record<string, unknown> | null> {
    const cacheKey = `${this.entityConfig.tableName}_findById_${id}`;

    // Verificar caché primero
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as Record<string, unknown>;
    }

    try {
      const query = this.sqlBuilder.buildSelectByIdQuery(id);
      const result = await querySQL(query.sql, query.params);

      const record = result.rows?.[0] || null;

      // Guardar en caché si se encontró
      if (record) {
        this.cache.set(cacheKey, record);
      }

      return record;
    } catch (error) {
      throw new Error(`Error en findById: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  }

  /**
   * Crea un nuevo registro
   */
  async create(data: Record<string, unknown>): Promise<{ id?: string | number; record: Record<string, unknown> }> {
    try {
      // Validar datos
      const validation = this.validator.validate(data, false);
      if (!validation.isValid) {
        throw new Error(`Datos inválidos: ${this.validator.getErrorMessages(validation.errors).join(", ")}`);
      }

      // Limpiar datos
      const sanitizedData = this.validator.sanitizeData(data);

      // Construir consulta de inserción
      const query = this.sqlBuilder.buildInsertQuery(sanitizedData);

      // Ejecutar inserción
      let insertResult: QueryResult;
      let newId: string | number | undefined;

      if (this.entityConfig.autoIncrement) {
        // Para auto-increment, usar RETURNING
        const outBinds = { new_id: { type: "NUMBER", dir: "OUT" } };
        insertResult = await querySQL(query.sql, { ...query.params, ...outBinds });
        newId = (insertResult.outBinds as Record<string, unknown>)?.new_id as string | number;
      } else {
        insertResult = await querySQL(query.sql, query.params);
        newId = sanitizedData[this.entityConfig.primaryKey] as string | number;
      }

      // Obtener el registro creado
      const record = newId ? await this.findById(newId) : null;

      // Limpiar caché relacionado
      this.invalidateCache();

      return {
        id: newId || undefined,
        record: record || {},
      };
    } catch (error) {
      throw new Error(`Error en create: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  }

  /**
   * Actualiza un registro existente
   */
  async update(id: string | number, data: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      // Verificar que el registro existe
      const existingRecord = await this.findById(id);
      if (!existingRecord) {
        throw new Error("Registro no encontrado");
      }

      // Validar datos
      const validation = this.validator.validate(data, true);
      if (!validation.isValid) {
        throw new Error(`Datos inválidos: ${this.validator.getErrorMessages(validation.errors).join(", ")}`);
      }

      // Limpiar datos
      const sanitizedData = this.validator.sanitizeData(data);

      // Construir consulta de actualización
      const query = this.sqlBuilder.buildUpdateQuery(id, sanitizedData);

      // Ejecutar actualización
      await querySQL(query.sql, query.params);

      // Obtener el registro actualizado
      const updatedRecord = await this.findById(id);

      // Limpiar caché relacionado
      this.invalidateCache();

      return updatedRecord;
    } catch (error) {
      throw new Error(`Error en update: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  }

  /**
   * Elimina un registro
   */
  async delete(id: string | number): Promise<boolean> {
    try {
      // Verificar que el registro existe
      const existingRecord = await this.findById(id);
      if (!existingRecord) {
        throw new Error("Registro no encontrado");
      }

      // Construir consulta de eliminación
      const query = this.sqlBuilder.buildDeleteQuery(id);

      // Ejecutar eliminación
      const result = await querySQL(query.sql, query.params);

      // Limpiar caché relacionado
      this.invalidateCache();

      return (result.rowsAffected || 0) > 0;
    } catch (error) {
      throw new Error(`Error en delete: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  }

  /**
   * Ejecuta una acción personalizada
   */
  async executeCustomAction(
    actionName: string,
    id: string | number,
    additionalParams: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    try {
      const actionConfig = this.entityConfig.customActions?.[actionName];
      if (!actionConfig) {
        throw new Error(`Acción '${actionName}' no encontrada`);
      }

      const query = this.sqlBuilder.buildCustomActionQuery(
        actionConfig.sql,
        id,
        additionalParams as Record<string, string | number | boolean | null>,
      );

      const result = await querySQL(query.sql, query.params);

      // Limpiar caché si la acción podría haber modificado datos
      if (actionConfig.type !== "read") {
        this.invalidateCache();
      }

      return { result: result.rows || [] };
    } catch (error) {
      throw new Error(`Error en executeCustomAction: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  }

  /**
   * Obtiene los campos buscables de la entidad
   */
  getSearchableFields(): string[] {
    return Object.entries(this.entityConfig.fields)
      .filter(([_, fieldConfig]) => fieldConfig.searchable === true)
      .map(([fieldName, _]) => fieldName);
  }

  /**
   * Obtiene información de la entidad
   */
  getEntityInfo() {
    return {
      tableName: this.entityConfig.tableName,
      primaryKey: this.entityConfig.primaryKey,
      displayName: this.entityConfig.displayName,
      description: this.entityConfig.description,
      operations: this.entityConfig.operations,
      fields: Object.entries(this.entityConfig.fields).map(([name, config]) => ({
        name,
        ...config,
      })),
    };
  }

  /**
   * Valida datos sin persistir
   */
  validateData(data: Record<string, unknown>, isUpdate = false): ValidationResult {
    return this.validator.validate(data, isUpdate);
  }

  /**
   * Invalida todo el caché relacionado con esta entidad
   */
  private invalidateCache(): void {
    const patterns = [
      `${this.entityConfig.tableName}_findAll`,
      `${this.entityConfig.tableName}_findById`,
    ];

    patterns.forEach((pattern) => {
      this.cache.invalidatePattern(pattern);
    });
  }

  /**
   * Obtiene estadísticas de la entidad
   */
  async getStats(): Promise<{ total: number; cacheHits: number; cacheSize: number }> {
    try {
      const countQuery = this.sqlBuilder.buildCountQuery();
      const result = await querySQL(countQuery.sql, countQuery.params);
      const total = (result.rows?.[0] as Record<string, unknown>)?.total as number || 0;

      return {
        total,
        cacheHits: Math.round(this.cache.getStats().averageAccessCount),
        cacheSize: this.cache.getStats().size,
      };
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  }
}
