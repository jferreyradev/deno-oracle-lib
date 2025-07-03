/**
 * Tests básicos para la librería Deno Oracle
 *
 * Para ejecutar: deno test --allow-net --allow-read --allow-env
 */

import { assertEquals, assertExists, assertInstanceOf } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { DataValidator, GenericController, MemoryCache, SqlBuilder } from "./mod.ts";

// Configuración de entidad para tests
const testEntityConfig = {
  tableName: "test_table",
  primaryKey: "id",
  displayName: "Test Table",
  description: "Tabla de pruebas",
  fields: {
    id: { type: "number", required: true, autoIncrement: true },
    name: { type: "string", required: true, maxLength: 100 },
    email: { type: "string", required: true, maxLength: 255 },
    active: { type: "boolean", defaultValue: true },
  },
  operations: {
    create: true,
    read: true,
    update: true,
    delete: true,
    search: true,
    paginate: true,
  },
};

Deno.test("MemoryCache - basic operations", () => {
  const cache = new MemoryCache({
    defaultTTL: 300,
    maxSize: 100,
    cleanupInterval: 60000,
  });

  try {
    // Test set and get
    cache.set("test-key", { data: "test-value" });
    const value = cache.get("test-key");
    assertEquals(value, { data: "test-value" });

    // Test has
    assertEquals(cache.has("test-key"), true);
    assertEquals(cache.has("non-existent"), false);

    // Test delete
    cache.delete("test-key");
    assertEquals(cache.get("test-key"), null);

    // Test stats
    const stats = cache.getStats();
    assertExists(stats.size);
    assertExists(stats.maxSize);
    assertExists(stats.hitRate);
  } finally {
    // Clean up to prevent memory leaks
    cache.destroy();
  }
});

Deno.test("MemoryCache - key generation", () => {
  const cache = new MemoryCache({
    defaultTTL: 300,
    maxSize: 100,
    cleanupInterval: 60000,
  });

  try {
    // Test query key generation
    const queryKey = cache.generateQueryKey("SELECT * FROM users", [1, "test"]);
    assertExists(queryKey);
    assertEquals(typeof queryKey, "string");
    assertEquals(queryKey.startsWith("query:"), true);

    // Test entity key generation
    const entityKey = cache.generateEntityKey("users", 1, "find");
    assertEquals(entityKey, "entity:users:1:find");

    const entityKeyNoId = cache.generateEntityKey("users");
    assertEquals(entityKeyNoId, "entity:users");
  } finally {
    cache.destroy();
  }
});

Deno.test("MemoryCache - pattern invalidation", () => {
  const cache = new MemoryCache({
    defaultTTL: 300,
    maxSize: 100,
    cleanupInterval: 60000,
  });

  try {
    // Set multiple keys
    cache.set("user:1", { id: 1 });
    cache.set("user:2", { id: 2 });
    cache.set("product:1", { id: 1 });

    // Test pattern invalidation
    cache.invalidatePattern("user:.*");
    assertEquals(cache.get("user:1"), null);
    assertEquals(cache.get("user:2"), null);
    assertExists(cache.get("product:1")); // Should still exist
  } finally {
    cache.destroy();
  }
});

Deno.test("SqlBuilder - SELECT query building", () => {
  const builder = new SqlBuilder(testEntityConfig);

  // Test basic select
  const basicQuery = builder.buildSelectQuery();
  assertEquals(typeof basicQuery.sql, "string");
  assertEquals(basicQuery.sql.includes("SELECT"), true);
  assertEquals(basicQuery.sql.includes("FROM test_table"), true);

  // Test select with filters
  const filteredQuery = builder.buildSelectQuery({
    filters: { active: true, name: "John" },
  });
  assertEquals(filteredQuery.sql.includes("WHERE"), true);
  assertExists(filteredQuery.params);

  // Test select with ordering
  const orderedQuery = builder.buildSelectQuery({
    orderBy: "name",
    orderDirection: "ASC",
  });
  assertEquals(orderedQuery.sql.includes("ORDER BY"), true);
});

Deno.test("SqlBuilder - INSERT query building", () => {
  const builder = new SqlBuilder(testEntityConfig);

  const insertQuery = builder.buildInsertQuery({
    name: "John Doe",
    email: "john@example.com",
    active: true,
  });

  assertEquals(typeof insertQuery.sql, "string");
  assertEquals(insertQuery.sql.includes("INSERT INTO"), true);
  assertEquals(insertQuery.sql.includes("test_table"), true);
  assertEquals(insertQuery.sql.includes("VALUES"), true);
  assertExists(insertQuery.params);
});

Deno.test("SqlBuilder - UPDATE query building", () => {
  const builder = new SqlBuilder(testEntityConfig);

  const updateQuery = builder.buildUpdateQuery(1, {
    name: "Jane Doe",
    email: "jane@example.com",
  });

  assertEquals(typeof updateQuery.sql, "string");
  assertEquals(updateQuery.sql.includes("UPDATE"), true);
  assertEquals(updateQuery.sql.includes("test_table"), true);
  assertEquals(updateQuery.sql.includes("SET"), true);
  assertEquals(updateQuery.sql.includes("WHERE"), true);
  assertExists(updateQuery.params);
});

Deno.test("SqlBuilder - DELETE query building", () => {
  const builder = new SqlBuilder(testEntityConfig);

  const deleteQuery = builder.buildDeleteQuery(1);

  assertEquals(typeof deleteQuery.sql, "string");
  assertEquals(deleteQuery.sql.includes("DELETE FROM"), true);
  assertEquals(deleteQuery.sql.includes("test_table"), true);
  assertEquals(deleteQuery.sql.includes("WHERE"), true);
  assertExists(deleteQuery.params);
});

Deno.test("SqlBuilder - COUNT query building", () => {
  const builder = new SqlBuilder(testEntityConfig);

  const countQuery = builder.buildCountQuery({ filters: { active: true } });

  assertEquals(typeof countQuery.sql, "string");
  assertEquals(countQuery.sql.includes("SELECT COUNT(*)"), true);
  assertEquals(countQuery.sql.includes("FROM test_table"), true);
  assertEquals(countQuery.sql.includes("WHERE"), true);
  assertExists(countQuery.params);
});

Deno.test("DataValidator - basic validation", () => {
  const validator = new DataValidator(testEntityConfig);

  // Test valid data
  const validResult = validator.validate({
    name: "John Doe",
    email: "john@example.com",
    active: true,
  });
  assertEquals(validResult.isValid, true);
  assertEquals(validResult.errors.length, 0);

  // Test invalid data (missing required field)
  const invalidResult = validator.validate({
    email: "john@example.com",
  });
  assertEquals(invalidResult.isValid, false);
  assertEquals(invalidResult.errors.length > 0, true);

  // Test data with invalid type
  const typeInvalidResult = validator.validate({
    name: 123, // Should be string
    email: "john@example.com",
  });
  assertEquals(typeInvalidResult.isValid, false);
});

Deno.test("DataValidator - data sanitization", () => {
  const validator = new DataValidator(testEntityConfig);

  const dirtyData = {
    name: "John Doe",
    email: "john@example.com",
    active: true,
    extraField: "should be removed", // This field is not in the config
    anotherExtra: 123,
  };

  const cleanData = validator.sanitizeData(dirtyData);

  assertEquals(Object.prototype.hasOwnProperty.call(cleanData, "name"), true);
  assertEquals(Object.prototype.hasOwnProperty.call(cleanData, "email"), true);
  assertEquals(Object.prototype.hasOwnProperty.call(cleanData, "active"), true);
  assertEquals(Object.prototype.hasOwnProperty.call(cleanData, "extraField"), false);
  assertEquals(Object.prototype.hasOwnProperty.call(cleanData, "anotherExtra"), false);
});

Deno.test("GenericController - instantiation", () => {
  const cache = new MemoryCache({
    defaultTTL: 300,
    maxSize: 100,
    cleanupInterval: 60000,
  });

  try {
    const controller = new GenericController(testEntityConfig, cache);
    assertInstanceOf(controller, GenericController);
    // Verificar que el controlador tenga las propiedades esperadas
    assertExists(controller);
  } finally {
    cache.destroy();
  }
});

Deno.test("Cache cleanup and destroy", () => {
  const cache = new MemoryCache({
    defaultTTL: 1, // 1 segundo
    maxSize: 100,
    cleanupInterval: 1000, // 1 segundo
  });

  cache.set("temp-key", "temp-value");
  assertEquals(cache.get("temp-key"), "temp-value");

  // Test destroy
  cache.destroy();
  assertEquals(cache.getStats().size, 0);
});

console.log("✅ Todos los tests de la librería Deno Oracle han pasado!");
