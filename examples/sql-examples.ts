/**
 * Ejemplos Completos de Consultas SQL - Deno Oracle Library
 * 
 * Ejecutar con: deno run --allow-net --allow-read examples/sql-examples.ts
 */

import {
  closePool,
  GenericController,
  initializePool,
  MemoryCache,
  querySQL,
  SqlBuilder,
  StoredProcedureExecutor,
} from "../mod.ts";

console.log("🚀 EJEMPLOS DE CONSULTAS SQL - DENO ORACLE LIBRARY");
console.log("=================================================\n");

// Mock simplificado para ejemplos
const mockDriver = {
  OUT_FORMAT_OBJECT: 4001,
  CLOB: 4002,
  outFormat: 4001,
  fetchAsString: [],
  initOracleClient: () => {},
  createPool: () => Promise.resolve({
    getConnection: () => Promise.resolve({
      execute: (sql: string, binds: Record<string, unknown>) => {
        console.log(`📝 SQL: ${sql.replace(/\s+/g, ' ').trim().substring(0, 80)}...`);
        console.log(`📋 Params:`, binds);
        
        // Resultados simulados
        if (sql.includes('COUNT')) {
          return Promise.resolve({ rows: [{ total: 150, promedio: 55000 }] });
        } else if (sql.includes('level')) {
          return Promise.resolve({ rows: [
            { id: 1, nombre: 'Usuario 1', email: 'user1@test.com' },
            { id: 2, nombre: 'Usuario 2', email: 'user2@test.com' }
          ]});
        } else {
          return Promise.resolve({
            rows: [{ 
              mensaje: binds.mensaje || 'Consulta exitosa',
              resultado: 'OK',
              timestamp: new Date().toISOString()
            }]
          });
        }
      },
      close: () => Promise.resolve(),
    }),
    close: () => Promise.resolve(),
    connectionsOpen: 2,
    connectionsInUse: 0,
  })
};

async function runExamples() {
  try {
    // 1. INICIALIZACIÓN
    console.log("📡 1. INICIALIZACIÓN");
    console.log("===================");
    await initializePool(mockDriver, {
      user: "demo",
      password: "demo",
      connectString: "localhost:1521/XE"
    });
    console.log("✅ Pool inicializado\n");

    // 2. CONSULTAS DIRECTAS
    console.log("🔍 2. CONSULTAS SQL DIRECTAS");
    console.log("============================");

    console.log("📋 2.1 Consulta Simple:");
    const simple = await querySQL("SELECT 'Hola Oracle!' as mensaje FROM dual");
    console.log("✅ Resultado:", simple.rows?.[0]);
    console.log("");

    console.log("📋 2.2 Consulta con Parámetros:");
    const withParams = await querySQL(
      "SELECT :mensaje as texto, :numero * 2 as doble FROM dual",
      { mensaje: "Parámetros funcionan", numero: 21 }
    );
    console.log("✅ Resultado:", withParams.rows?.[0]);
    console.log("");

    // 3. PAGINACIÓN
    console.log("📄 3. PAGINACIÓN");
    console.log("================");
    
    const paginated = await querySQL(
      "SELECT level as id, 'Usuario ' || level as nombre FROM dual CONNECT BY level <= 10",
      { limit: 3, offset: 5 }
    );
    console.log("✅ Página 2 (3 registros desde posición 5):", paginated.rows?.length, "registros");
    console.log("");

    // 4. SQL BUILDER
    console.log("🏗️ 4. SQL BUILDER DINÁMICO");
    console.log("===========================");

    const entityConfig = {
      tableName: "usuarios",
      primaryKey: "id",
      displayName: "Usuarios",
      description: "Tabla de usuarios del sistema",
      fields: {
        id: { type: "number", required: true },
        nombre: { type: "string", required: true },
        email: { type: "string", required: true },
        activo: { type: "boolean", defaultValue: true }
      },
      operations: { create: true, read: true, update: true, delete: true, search: true, paginate: true }
    };

    const builder = new SqlBuilder(entityConfig);

    // SELECT dinámico
    const selectQuery = builder.buildSelectQuery({
      filters: { activo: true },
      orderBy: 'nombre',
      orderDirection: 'ASC'
    });
    console.log("📋 4.1 SELECT dinámico:");
    console.log("📝 SQL:", selectQuery.sql);
    console.log("🔗 Params:", selectQuery.params);
    console.log("");

    // INSERT dinámico
    const insertQuery = builder.buildInsertQuery({
      nombre: "Ana García",
      email: "ana@test.com",
      activo: true
    });
    console.log("📋 4.2 INSERT dinámico:");
    console.log("📝 SQL:", insertQuery.sql);
    console.log("🔗 Params:", insertQuery.params);
    console.log("");

    // 5. CONSULTAS COMPLEJAS
    console.log("🔬 5. CONSULTAS COMPLEJAS");
    console.log("=========================");

    const _complex = await querySQL(`
      SELECT u.nombre, d.departamento, COUNT(*) as proyectos
      FROM usuarios u 
      JOIN departamentos d ON u.dept_id = d.id
      WHERE u.activo = :activo
      GROUP BY u.nombre, d.departamento
      ORDER BY proyectos DESC
    `, { activo: 1 });
    console.log("✅ Consulta con JOIN y GROUP BY ejecutada");
    console.log("");

    // 6. TIPOS DE DATOS
    console.log("🗃️ 6. TIPOS DE DATOS");
    console.log("====================");

    const dataTypes = await querySQL(`
      SELECT 
        :texto as campo_texto,
        :numero as campo_numero,
        :fecha as campo_fecha,
        :booleano as campo_booleano
      FROM dual
    `, {
      texto: "Texto de ejemplo",
      numero: 42,
      fecha: new Date(),
      booleano: true
    });
    console.log("✅ Tipos de datos manejados:", dataTypes.rows?.[0]);
    console.log("");

    // 7. CACHE
    console.log("💾 7. CACHE INTEGRADO");
    console.log("=====================");

    const cache = new MemoryCache({ 
      defaultTTL: 300, 
      maxSize: 1000, 
      cleanupInterval: 60000 
    });
    cache.set("query:usuarios", { total: 150 });
    const cached = cache.get("query:usuarios");
    console.log("✅ Resultado desde cache:", cached);
    
    const stats = cache.getStats();
    console.log("📊 Stats del cache:", {
      size: stats.size,
      hitRate: stats.hitRate + "%"
    });
    console.log("");

    // 8. MANEJO DE ERRORES
    console.log("⚠️ 8. MANEJO DE ERRORES");
    console.log("=======================");

    try {
      await querySQL("SELECT * FORM tabla_inexistente");
    } catch (_error) {
      console.log("✅ Error SQL capturado correctamente");
    }
    console.log("");

    // 9. PROCEDIMIENTOS ALMACENADOS
    console.log("🏗️ 9. PROCEDIMIENTOS ALMACENADOS");
    console.log("=================================");

    const _spExecutor = new StoredProcedureExecutor("DEMO_SCHEMA");
    console.log("📋 Executor creado para schema: DEMO_SCHEMA");
    console.log("✅ Métodos disponibles:");
    console.log("   • executeStoredProcedure()");
    console.log("   • executeStoredFunction()");
    console.log("   • executePlSqlBlock()");
    console.log("   • getStoredProcedureInfo()");
    console.log("");

    // 10. CONTROLLER CRUD
    console.log("🎮 10. GENERIC CONTROLLER");
    console.log("=========================");

    const _controller = new GenericController(entityConfig, cache);
    console.log("✅ Controller CRUD creado");
    console.log("📋 Operaciones disponibles:");
    console.log("   • findAll(), findById(), create(), update(), delete()");
    console.log("   • search(), getStats()");
    console.log("   • Procedimientos almacenados integrados");
    console.log("");

    // Limpiar
    cache.destroy();
    await closePool();

    console.log("🎉 ¡EJEMPLOS COMPLETADOS EXITOSAMENTE!");
    console.log("======================================");
    console.log("");
    console.log("📚 Funcionalidades demostradas:");
    console.log("   ✅ Consultas SQL directas con parámetros");
    console.log("   ✅ Paginación automática con ROWNUM");
    console.log("   ✅ SQL Builder dinámico (CRUD)");
    console.log("   ✅ Consultas complejas (JOIN, GROUP BY)");
    console.log("   ✅ Manejo de tipos de datos Oracle");
    console.log("   ✅ Cache integrado con TTL");
    console.log("   ✅ Manejo robusto de errores");
    console.log("   ✅ Procedimientos almacenados");
    console.log("   ✅ Controller CRUD genérico");
    console.log("");
    console.log("💡 Para usar con Oracle real:");
    console.log("   1. npm install oracledb");
    console.log("   2. Reemplazar mockDriver con require('oracledb')");
    console.log("   3. Configurar credenciales reales");

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error:", errorMessage);
  }
}

// Ejecutar si es el módulo principal
if (import.meta.main) {
  runExamples();
}

export { runExamples };
