/**
 * Configuration Manager - Gestión de credenciales y configuración de conexión
 */

import type { DatabaseConfig } from "./connection.ts";

export interface EnvironmentConfig {
  prefix?: string;
  throwOnMissing?: boolean;
}

export interface ConfigFile {
  development?: DatabaseConfig;
  production?: DatabaseConfig;
  test?: DatabaseConfig;
  [environment: string]: DatabaseConfig | undefined;
}

export interface ConnectionStringComponents {
  host: string;
  port: number;
  serviceName?: string;
  sid?: string;
}

/**
 * Clase para gestionar configuraciones de conexión de múltiples fuentes
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private currentConfig: DatabaseConfig | null = null;

  private constructor() {}

  /**
   * Obtiene la instancia singleton
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 1. CONFIGURACIÓN DIRECTA - Método más simple
   */
  setDirect(config: DatabaseConfig): DatabaseConfig {
    this.currentConfig = { ...config };
    return this.currentConfig;
  }

  /**
   * 2. CONFIGURACIÓN DESDE VARIABLES DE ENTORNO
   */
  fromEnvironment(options: EnvironmentConfig = {}): DatabaseConfig {
    const { prefix = "ORACLE", throwOnMissing = true } = options;

    const getEnvVar = (name: string, required = true): string | undefined => {
      const fullName = `${prefix}_${name}`;
      const value = Deno.env.get(fullName);

      if (required && !value && throwOnMissing) {
        throw new Error(`Variable de entorno requerida no encontrada: ${fullName}`);
      }

      return value;
    };

    const config: DatabaseConfig = {
      user: getEnvVar("USER") || "",
      password: getEnvVar("PASSWORD") || "",
      connectString: getEnvVar("CONNECT_STRING") || "",
      poolMax: parseInt(getEnvVar("POOL_MAX", false) || "10"),
      poolMin: parseInt(getEnvVar("POOL_MIN", false) || "2"),
      poolIncrement: parseInt(getEnvVar("POOL_INCREMENT", false) || "2"),
      poolTimeout: parseInt(getEnvVar("POOL_TIMEOUT", false) || "60"),
      poolPingInterval: parseInt(getEnvVar("POOL_PING_INTERVAL", false) || "60"),
      stmtCacheSize: parseInt(getEnvVar("STMT_CACHE_SIZE", false) || "23"),
      libDir: getEnvVar("LIB_DIR", false),
    };

    this.currentConfig = config;
    return config;
  }

  /**
   * 3. CONFIGURACIÓN DESDE ARCHIVO JSON
   */
  async fromFile(filePath: string, environment = "development"): Promise<DatabaseConfig> {
    try {
      const configText = await Deno.readTextFile(filePath);
      const configFile: ConfigFile = JSON.parse(configText);

      const config = configFile[environment];
      if (!config) {
        throw new Error(`Configuración para entorno '${environment}' no encontrada en ${filePath}`);
      }

      this.currentConfig = { ...config };
      return this.currentConfig;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error cargando configuración desde archivo: ${errorMessage}`);
    }
  }

  /**
   * 4. CONFIGURACIÓN DESDE CONNECTION STRING
   */
  fromConnectionString(connectionString: string, credentials: { user: string; password: string }): DatabaseConfig {
    const config: DatabaseConfig = {
      user: credentials.user,
      password: credentials.password,
      connectString: connectionString,
    };

    this.currentConfig = config;
    return config;
  }

  /**
   * 5. CONFIGURACIÓN DESDE COMPONENTES SEPARADOS
   */
  fromComponents(
    credentials: { user: string; password: string },
    connection: ConnectionStringComponents,
    poolOptions?: Partial<DatabaseConfig>,
  ): DatabaseConfig {
    const { host, port, serviceName, sid } = connection;

    let connectString: string;
    if (serviceName) {
      connectString = `${host}:${port}/${serviceName}`;
    } else if (sid) {
      connectString = `${host}:${port}:${sid}`;
    } else {
      connectString = `${host}:${port}/XE`; // Default
    }

    const config: DatabaseConfig = {
      user: credentials.user,
      password: credentials.password,
      connectString,
      poolMax: 10,
      poolMin: 2,
      poolIncrement: 2,
      poolTimeout: 60,
      poolPingInterval: 60,
      stmtCacheSize: 23,
      ...poolOptions,
    };

    this.currentConfig = config;
    return config;
  }

  /**
   * 6. CONFIGURACIÓN HÍBRIDA (archivo + env vars + overrides)
   */
  async hybrid(
    baseConfigPath?: string,
    environment = "development",
    envOverrides = true,
    directOverrides?: Partial<DatabaseConfig>,
  ): Promise<DatabaseConfig> {
    let config: DatabaseConfig;

    // 1. Empezar con configuración base desde archivo si existe
    if (baseConfigPath) {
      try {
        config = await this.fromFile(baseConfigPath, environment);
      } catch {
        // Si falla, usar configuración mínima
        config = {
          user: "",
          password: "",
          connectString: "localhost:1521/XE",
        };
      }
    } else {
      config = {
        user: "",
        password: "",
        connectString: "localhost:1521/XE",
      };
    }

    // 2. Sobrescribir con variables de entorno si están disponibles
    if (envOverrides) {
      try {
        const envConfig = this.fromEnvironment({ throwOnMissing: false });
        config = { ...config, ...envConfig };
      } catch {
        // Ignorar errores de env vars si no son obligatorias
      }
    }

    // 3. Aplicar overrides directos
    if (directOverrides) {
      config = { ...config, ...directOverrides };
    }

    this.currentConfig = config;
    return config;
  }

  /**
   * 7. CONFIGURACIÓN CON VALIDACIÓN
   */
  validate(config: DatabaseConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.user) errors.push("Usuario es requerido");
    if (!config.password) errors.push("Contraseña es requerida");
    if (!config.connectString) errors.push("String de conexión es requerido");

    // Validar formato de connectString
    if (config.connectString && !this.isValidConnectionString(config.connectString)) {
      errors.push("Formato de string de conexión inválido");
    }

    // Validar valores numéricos
    if (config.poolMax && config.poolMax <= 0) errors.push("poolMax debe ser mayor a 0");
    if (config.poolMin && config.poolMin < 0) errors.push("poolMin debe ser mayor o igual a 0");
    if (config.poolMax && config.poolMin && config.poolMax < config.poolMin) {
      errors.push("poolMax debe ser mayor o igual a poolMin");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida formato de connection string
   */
  private isValidConnectionString(connectString: string): boolean {
    // Patrones válidos:
    // host:port/service
    // host:port:sid
    // Easy Connect string
    const patterns = [
      /^[\w.-]+:\d+\/[\w.-]+$/, // host:port/service
      /^[\w.-]+:\d+:[\w.-]+$/, // host:port:sid
      /^[\w.-]+:\d+$/, // host:port (default service)
    ];

    return patterns.some((pattern) => pattern.test(connectString));
  }

  /**
   * Obtiene la configuración actual
   */
  getCurrentConfig(): DatabaseConfig | null {
    return this.currentConfig;
  }

  /**
   * Limpia la configuración actual
   */
  clear(): void {
    this.currentConfig = null;
  }

  /**
   * UTILITY: Genera archivo de configuración de ejemplo
   */
  async generateExampleConfig(filePath: string): Promise<void> {
    const exampleConfig: ConfigFile = {
      development: {
        user: "dev_user",
        password: "dev_password",
        connectString: "localhost:1521/XEPDB1",
        poolMax: 5,
        poolMin: 1,
      },
      test: {
        user: "test_user",
        password: "test_password",
        connectString: "localhost:1521/XEPDB1",
        poolMax: 3,
        poolMin: 1,
      },
      production: {
        user: "prod_user",
        password: "prod_password",
        connectString: "prod-db:1521/PRODDB",
        poolMax: 20,
        poolMin: 5,
        poolIncrement: 5,
        poolTimeout: 300,
        poolPingInterval: 120,
        stmtCacheSize: 50,
      },
    };

    const configJson = JSON.stringify(exampleConfig, null, 2);
    await Deno.writeTextFile(filePath, configJson);
  }

  /**
   * UTILITY: Muestra configuración enmascarada (sin password)
   */
  getMaskedConfig(config?: DatabaseConfig): Record<string, unknown> {
    const cfg = config || this.currentConfig;
    if (!cfg) return {};

    return {
      user: cfg.user,
      password: cfg.password ? "***" + cfg.password.slice(-2) : undefined,
      connectString: cfg.connectString,
      poolMax: cfg.poolMax,
      poolMin: cfg.poolMin,
      poolIncrement: cfg.poolIncrement,
      poolTimeout: cfg.poolTimeout,
      poolPingInterval: cfg.poolPingInterval,
      stmtCacheSize: cfg.stmtCacheSize,
      libDir: cfg.libDir,
    };
  }
}

// Exportar instancia singleton
export const configManager = ConfigManager.getInstance();
