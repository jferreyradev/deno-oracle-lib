/**
 * Ejemplos Completos de Configuración de Credenciales
 *
 * Ejecutar con: deno run --allow-net --allow-read --allow-env --allow-write examples/config-examples.ts
 */

import { closePool, configManager, initializePool, initializePoolWithConfig, querySQL } from "../mod.ts";

// Mock del driver Oracle para ejemplos
const mockOracledb = {
  OUT_FORMAT_OBJECT: 4001,
  CLOB: 4002,
  outFormat: 4001,
  fetchAsString: [],
  initOracleClient: () => {},
  createPool: () =>
    Promise.resolve({
      getConnection: () =>
        Promise.resolve({
          execute: () => Promise.resolve({ rows: [{ mensaje: "Conexión exitosa" }] }),
          close: () => Promise.resolve(),
        }),
      close: () => Promise.resolve(),
      connectionsOpen: 2,
      connectionsInUse: 0,
    }),
};

async function ejemplosConfiguracion() {
  console.log("🔐 EJEMPLOS DE CONFIGURACIÓN DE CREDENCIALES");
  console.log("============================================\n");

  try {
    // 1. CONFIGURACIÓN DIRECTA (Método más simple)
    console.log("📋 1. CONFIGURACIÓN DIRECTA");
    console.log("===========================");

    const configDirecta = {
      user: "mi_usuario",
      password: "mi_password",
      connectString: "localhost:1521/XE",
      poolMax: 10,
      poolMin: 2,
    };

    await initializePool(mockOracledb, configDirecta);
    console.log("✅ Pool inicializado con configuración directa");

    const resultado1 = await querySQL("SELECT 'Método directo' as metodo FROM dual");
    console.log("📄 Resultado:", resultado1.rows?.[0]);
    await closePool();
    console.log("");

    // 2. CONFIGURACIÓN DESDE VARIABLES DE ENTORNO
    console.log("📋 2. CONFIGURACIÓN DESDE VARIABLES DE ENTORNO");
    console.log("===============================================");

    // Simular variables de entorno
    Deno.env.set("ORACLE_USER", "env_usuario");
    Deno.env.set("ORACLE_PASSWORD", "env_password");
    Deno.env.set("ORACLE_CONNECT_STRING", "env-server:1521/ENVDB");
    Deno.env.set("ORACLE_POOL_MAX", "15");

    const configEnv = configManager.fromEnvironment();
    console.log("🔧 Config desde env vars:", configManager.getMaskedConfig(configEnv));

    await initializePool(mockOracledb, configEnv);
    const resultado2 = await querySQL("SELECT 'Desde env vars' as metodo FROM dual");
    console.log("✅ Resultado:", resultado2.rows?.[0]);
    await closePool();
    console.log("");

    // 3. CONFIGURACIÓN DESDE ARCHIVO JSON
    console.log("📋 3. CONFIGURACIÓN DESDE ARCHIVO JSON");
    console.log("======================================");

    // Generar archivo de ejemplo
    await configManager.generateExampleConfig("./config/database.json");
    console.log("📁 Archivo de configuración generado en: ./config/database.json");

    // Cargar desde archivo
    const configArchivo = await configManager.fromFile("./config/database.json", "development");
    console.log("🔧 Config desde archivo:", configManager.getMaskedConfig(configArchivo));

    await initializePool(mockOracledb, configArchivo);
    const resultado3 = await querySQL("SELECT 'Desde archivo' as metodo FROM dual");
    console.log("✅ Resultado:", resultado3.rows?.[0]);
    await closePool();
    console.log("");

    // 4. CONFIGURACIÓN DESDE CONNECTION STRING
    console.log("📋 4. CONFIGURACIÓN DESDE CONNECTION STRING");
    console.log("===========================================");

    const configConnString = configManager.fromConnectionString(
      "prod-server:1521/PRODDB",
      { user: "prod_user", password: "prod_pass" },
    );
    console.log("🔧 Config desde conn string:", configManager.getMaskedConfig(configConnString));

    await initializePool(mockOracledb, configConnString);
    const resultado4 = await querySQL("SELECT 'Connection string' as metodo FROM dual");
    console.log("✅ Resultado:", resultado4.rows?.[0]);
    await closePool();
    console.log("");

    // 5. CONFIGURACIÓN DESDE COMPONENTES SEPARADOS
    console.log("📋 5. CONFIGURACIÓN DESDE COMPONENTES");
    console.log("=====================================");

    const configComponentes = configManager.fromComponents(
      { user: "comp_user", password: "comp_pass" },
      { host: "db-server", port: 1521, serviceName: "COMPDB" },
      { poolMax: 20, poolMin: 5 },
    );
    console.log("🔧 Config desde componentes:", configManager.getMaskedConfig(configComponentes));

    await initializePool(mockOracledb, configComponentes);
    const resultado5 = await querySQL("SELECT 'Componentes' as metodo FROM dual");
    console.log("✅ Resultado:", resultado5.rows?.[0]);
    await closePool();
    console.log("");

    // 6. CONFIGURACIÓN HÍBRIDA (archivo + env + overrides)
    console.log("📋 6. CONFIGURACIÓN HÍBRIDA");
    console.log("===========================");

    const configHibrida = await configManager.hybrid(
      "./config/database.json",
      "development",
      true, // usar env vars
      { poolMax: 25, connectString: "override-server:1521/HYBRIDDB" }, // overrides
    );
    console.log("🔧 Config híbrida:", configManager.getMaskedConfig(configHibrida));

    await initializePool(mockOracledb, configHibrida);
    const resultado6 = await querySQL("SELECT 'Híbrida' as metodo FROM dual");
    console.log("✅ Resultado:", resultado6.rows?.[0]);
    await closePool();
    console.log("");

    // 7. CONFIGURACIÓN CON FUNCIÓN PERSONALIZADA
    console.log("📋 7. CONFIGURACIÓN CON FUNCIÓN PERSONALIZADA");
    console.log("=============================================");

    const configPersonalizada = async () => {
      // Lógica personalizada para obtener credenciales
      console.log("🔍 Ejecutando lógica personalizada de configuración...");

      // Simular consulta a un servicio de credenciales
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        user: "custom_user",
        password: "custom_password",
        connectString: "custom-server:1521/CUSTOMDB",
        poolMax: 12,
        poolMin: 3,
      };
    };

    await initializePoolWithConfig(mockOracledb, configPersonalizada);
    const resultado7 = await querySQL("SELECT 'Función personalizada' as metodo FROM dual");
    console.log("✅ Resultado:", resultado7.rows?.[0]);
    await closePool();
    console.log("");

    // 8. VALIDACIÓN DE CONFIGURACIÓN
    console.log("📋 8. VALIDACIÓN DE CONFIGURACIÓN");
    console.log("=================================");

    const configInvalida = {
      user: "", // Inválido: usuario vacío
      password: "password",
      connectString: "formato-inválido", // Inválido: formato incorrecto
      poolMax: -5, // Inválido: valor negativo
    };

    const validacion = configManager.validate(configInvalida);
    console.log("❌ Configuración inválida:");
    console.log("🔍 Errores encontrados:", validacion.errors);
    console.log("✅ Es válida:", validacion.isValid);
    console.log("");

    // Configuración válida
    const configValida = {
      user: "usuario_valido",
      password: "password_valido",
      connectString: "servidor:1521/SERVICIO",
      poolMax: 10,
      poolMin: 2,
    };

    const validacionValida = configManager.validate(configValida);
    console.log("✅ Configuración válida:");
    console.log("🔍 Errores:", validacionValida.errors);
    console.log("✅ Es válida:", validacionValida.isValid);
    console.log("");

    // 9. CONFIGURACIONES POR ENTORNO
    console.log("📋 9. CONFIGURACIONES POR ENTORNO");
    console.log("=================================");

    const entornos = ["development", "test", "production"];

    for (const entorno of entornos) {
      try {
        const configEntorno = await configManager.fromFile("./config/database.json", entorno);
        console.log(`🌍 Entorno ${entorno}:`, configManager.getMaskedConfig(configEntorno));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Error en entorno ${entorno}:`, errorMessage);
      }
    }
    console.log("");

    // 10. MEJORES PRÁCTICAS
    console.log("📋 10. MEJORES PRÁCTICAS");
    console.log("========================");
    console.log("🔐 Seguridad:");
    console.log("   • Nunca hardcodear credenciales en el código");
    console.log("   • Usar variables de entorno para producción");
    console.log("   • Usar archivos de config para desarrollo");
    console.log("   • Validar siempre la configuración");
    console.log("");
    console.log("⚡ Rendimiento:");
    console.log("   • Configurar pool sizes según carga esperada");
    console.log("   • Ajustar timeouts según latencia de red");
    console.log("   • Usar statement cache para consultas repetitivas");
    console.log("");
    console.log("🛠️ Mantenimiento:");
    console.log("   • Usar configuración híbrida para flexibilidad");
    console.log("   • Separar configuración por entornos");
    console.log("   • Implementar validación de credenciales");

    console.log("\n🎉 ¡EJEMPLOS DE CONFIGURACIÓN COMPLETADOS!");
    console.log("==========================================");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error en ejemplos:", errorMessage);
  } finally {
    await closePool();
    console.log("🔌 Conexiones cerradas");
  }
}

// Ejecutar ejemplos si es el módulo principal
if (import.meta.main) {
  ejemplosConfiguracion();
}

export { ejemplosConfiguracion };
