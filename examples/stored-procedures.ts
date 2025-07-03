/**
 * Ejemplos de uso de Procedimientos Almacenados
 * Deno Oracle Library - Stored Procedures Examples
 */

import { GenericController, initializePool, StoredProcedureExecutor } from "../mod.ts";

// Configuración de base de datos (ejemplo)
const dbConfig = {
  user: "tu_usuario",
  password: "tu_password",
  connectString: "localhost:1521/XE",
  poolMin: 2,
  poolMax: 5,
};

// Configuración de entidad para usuarios
const userEntityConfig = {
  tableName: "usuarios",
  primaryKey: "id",
  displayName: "Usuarios",
  description: "Gestión de usuarios del sistema",
  fields: {
    id: { type: "number", required: true, autoIncrement: true },
    nombre: { type: "string", required: true, maxLength: 100 },
    email: { type: "string", required: true, maxLength: 255 },
    activo: { type: "boolean", defaultValue: true },
  },
  operations: { create: true, read: true, update: true, delete: true, search: true, paginate: true },
};

async function ejemplosProcedimientosAlmacenados() {
  console.log("🏗️ Ejemplos de Procedimientos Almacenados - Deno Oracle Library");
  console.log("================================================================\n");

  try {
    // Usar un mock de oracledb para demostración
    const mockOracleDb = {
      OUT_FORMAT_OBJECT: 4001,
      CLOB: 2006,
      outFormat: 4001,
      fetchAsString: [],
      initOracleClient: () => {},
      createPool: () =>
        Promise.resolve({
          getConnection: () =>
            Promise.resolve({
              execute: (sql: string, binds: Record<string, unknown>) => {
                console.log(`📝 Ejecutando: ${sql}`);
                console.log(`📋 Parámetros:`, binds);

                // Simular respuestas según el tipo de SQL
                if (sql.includes("sp_crear_usuario")) {
                  return Promise.resolve({
                    outBinds: { nuevo_id: 123, resultado: "Usuario creado exitosamente" },
                    rowsAffected: 1,
                  });
                } else if (sql.includes("fn_calcular_edad")) {
                  return Promise.resolve({
                    outBinds: { return_value: 25 },
                  });
                } else if (sql.includes("sp_obtener_usuarios_activos")) {
                  return Promise.resolve({
                    implicitResults: [
                      [
                        { id: 1, nombre: "Juan Pérez", email: "juan@example.com" },
                        { id: 2, nombre: "Ana García", email: "ana@example.com" },
                      ],
                    ],
                  });
                } else if (sql.includes("all_procedures")) {
                  return Promise.resolve({
                    rows: [
                      { OBJECT_NAME: "SP_CREAR_USUARIO" },
                      { OBJECT_NAME: "SP_ACTUALIZAR_USUARIO" },
                      { OBJECT_NAME: "FN_CALCULAR_EDAD" },
                    ],
                  });
                }

                return Promise.resolve({ rowsAffected: 1 });
              },
              close: () => Promise.resolve(),
            }),
          close: () => Promise.resolve(),
          connectionsOpen: 2,
          connectionsInUse: 1,
        }),
    };

    // Inicializar pool (simulado)
    await initializePool(mockOracleDb, dbConfig);

    // === 1. USO BÁSICO DE PROCEDIMIENTOS ALMACENADOS ===
    console.log("1️⃣ Uso básico de StoredProcedureExecutor");
    console.log("==========================================");

    const spExecutor = new StoredProcedureExecutor("MI_SCHEMA");

    // Ejecutar procedimiento simple
    console.log("\n📞 Ejecutando procedimiento almacenado:");
    const result1 = await spExecutor.execute("sp_crear_usuario", {
      p_nombre: "Carlos López",
      p_email: "carlos@example.com",
      p_activo: 1,
    });

    console.log("✅ Resultado:", {
      success: result1.success,
      outParams: result1.outParams,
      tiempo: `${result1.executionTime?.toFixed(2)}ms`,
    });

    // === 2. EJECUTAR FUNCIÓN CON VALOR DE RETORNO ===
    console.log("\n2️⃣ Ejecutar función con valor de retorno");
    console.log("=========================================");

    const result2 = await spExecutor.executeFunction(
      "fn_calcular_edad",
      { p_fecha_nacimiento: new Date("1998-05-15") },
      "NUMBER",
    );

    console.log("✅ Resultado función:", {
      returnValue: result2.returnValue,
      tiempo: `${result2.executionTime?.toFixed(2)}ms`,
    });

    // === 3. BLOQUE PL/SQL ANÓNIMO ===
    console.log("\n3️⃣ Ejecutar bloque PL/SQL anónimo");
    console.log("==================================");

    const plsqlBlock = `
      DECLARE
        v_count NUMBER;
      BEGIN
        SELECT COUNT(*) INTO v_count FROM usuarios WHERE activo = :p_activo;
        :resultado := 'Total usuarios activos: ' || v_count;
      END;
    `;

    const result3 = await spExecutor.executePlSqlBlock(plsqlBlock, {
      p_activo: 1,
      resultado: { dir: "OUT", type: "STRING" },
    });

    console.log("✅ Resultado PL/SQL:", result3.outParams);

    // === 4. USO CON GENERICCONTROLLER ===
    console.log("\n4️⃣ Uso integrado con GenericController");
    console.log("======================================");

    const userController = new GenericController(userEntityConfig, undefined, undefined, "MI_SCHEMA");

    // Ejecutar procedimiento a través del controller
    const result4 = await userController.executeStoredProcedure("sp_obtener_usuarios_activos", {
      p_limite: 10,
    });

    console.log("✅ Usuarios activos:", {
      resultSets: result4.resultSets?.length || 0,
      tiempo: `${result4.executionTime?.toFixed(2)}ms`,
    });

    // === 5. LISTADO DE PROCEDIMIENTOS DISPONIBLES ===
    console.log("\n5️⃣ Listado de procedimientos disponibles");
    console.log("========================================");

    const procedimientos = await userController.listStoredProcedures();
    console.log("📋 Procedimientos disponibles:", procedimientos);

    // === 6. INFORMACIÓN DETALLADA DE UN PROCEDIMIENTO ===
    console.log("\n6️⃣ Información detallada de procedimiento");
    console.log("=========================================");

    try {
      const info = await userController.getStoredProcedureInfo("SP_CREAR_USUARIO");
      console.log("📖 Información del procedimiento:", {
        nombre: info.name,
        schema: info.schema,
        parametros: info.parameters.length,
      });
    } catch (_error) {
      console.log("ℹ️ Información del procedimiento no disponible (simulación)");
    }

    // === 7. EJEMPLOS DE PROCEDIMIENTOS COMUNES ===
    console.log("\n7️⃣ Ejemplos de procedimientos comunes");
    console.log("=====================================");

    // Procedimiento de auditoría
    console.log("\n🔍 Procedimiento de auditoría:");
    await userController.executeStoredProcedure("sp_auditoria_usuario", {
      p_usuario_id: 123,
      p_accion: "UPDATE",
      p_tabla: "usuarios",
    });

    // Función de validación
    console.log("\n✅ Función de validación:");
    const validationResult = await userController.executeStoredFunction(
      "fn_validar_email",
      { p_email: "test@example.com" },
      "NUMBER",
    );
    console.log("Resultado validación:", validationResult.returnValue === 1 ? "Válido" : "Inválido");

    // Procedimiento con cursor de salida
    console.log("\n📊 Procedimiento con cursor:");
    await userController.executeStoredProcedure("sp_reporte_usuarios", {
      p_fecha_desde: "2024-01-01",
      p_fecha_hasta: "2024-12-31",
    });
  } catch (error) {
    console.error("❌ Error en ejemplos:", error instanceof Error ? error.message : error);
  }

  console.log("\n🎉 ¡Ejemplos de procedimientos almacenados completados!");
  console.log("\n💡 Casos de uso comunes:");
  console.log("   • Validaciones complejas de negocio");
  console.log("   • Operaciones de auditoría");
  console.log("   • Reportes con lógica compleja");
  console.log("   • Procesos batch o de migración");
  console.log("   • Cálculos financieros");
  console.log("   • Integración con sistemas externos");
}

// Mostrar ejemplos de definición de procedimientos
function mostrarEjemplosProcedimientos() {
  console.log("\n📚 Ejemplos de definición de procedimientos Oracle:");
  console.log("==================================================");

  console.log(`
-- 1. Procedimiento simple para crear usuario
CREATE OR REPLACE PROCEDURE sp_crear_usuario(
  p_nombre IN VARCHAR2,
  p_email IN VARCHAR2,
  p_activo IN NUMBER DEFAULT 1,
  p_nuevo_id OUT NUMBER,
  p_resultado OUT VARCHAR2
) AS
BEGIN
  INSERT INTO usuarios (nombre, email, activo)
  VALUES (p_nombre, p_email, p_activo)
  RETURNING id INTO p_nuevo_id;
  
  p_resultado := 'Usuario creado exitosamente';
  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    p_resultado := 'Error: ' || SQLERRM;
END;
`);

  console.log(`
-- 2. Función para calcular edad
CREATE OR REPLACE FUNCTION fn_calcular_edad(
  p_fecha_nacimiento DATE
) RETURN NUMBER AS
  v_edad NUMBER;
BEGIN
  v_edad := FLOOR(MONTHS_BETWEEN(SYSDATE, p_fecha_nacimiento) / 12);
  RETURN v_edad;
END;
`);

  console.log(`
-- 3. Procedimiento con cursor de salida
CREATE OR REPLACE PROCEDURE sp_obtener_usuarios_activos(
  p_limite IN NUMBER,
  p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
  OPEN p_cursor FOR
    SELECT id, nombre, email, fecha_creacion
    FROM usuarios
    WHERE activo = 1
    ORDER BY fecha_creacion DESC
    FETCH FIRST p_limite ROWS ONLY;
END;
`);
}

// Ejecutar ejemplos si se ejecuta directamente
if (import.meta.main) {
  await ejemplosProcedimientosAlmacenados();
  mostrarEjemplosProcedimientos();
}
