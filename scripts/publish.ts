#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write

/**
 * Script para preparar y publicar la librería Deno Oracle
 *
 * Uso:
 * deno run --allow-run --allow-read --allow-write scripts/publish.ts [version]
 *
 * Ejemplo:
 * deno run --allow-run --allow-read --allow-write scripts/publish.ts 1.0.0
 */

const args = {
  _: Deno.args,
};
const version = args._[0] as string;

if (!version) {
  console.error("❌ Error: Debe especificar una versión");
  console.log("Uso: deno run --allow-run --allow-read --allow-write scripts/publish.ts 1.0.0");
  Deno.exit(1);
}

console.log(`🚀 Preparando publicación de la versión ${version}...`);

// Función para ejecutar comandos
async function runCommand(cmd: string[], description: string): Promise<boolean> {
  console.log(`\n⏳ ${description}...`);

  const process = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: "inherit",
    stderr: "inherit",
  });

  const { success } = await process.output();

  if (success) {
    console.log(`✅ ${description} completado`);
  } else {
    console.error(`❌ Error en: ${description}`);
  }

  return success;
}

// Función para actualizar versión en deno.json
async function updateVersion(version: string): Promise<boolean> {
  try {
    const denoJsonPath = "./deno.json";
    const content = await Deno.readTextFile(denoJsonPath);
    const config = JSON.parse(content);

    config.version = version;

    await Deno.writeTextFile(denoJsonPath, JSON.stringify(config, null, 2) + "\n");
    console.log(`✅ Versión actualizada a ${version} en deno.json`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error actualizando versión: ${errorMessage}`);
    return false;
  }
}

// Proceso de publicación
async function publish() {
  console.log("🔍 Verificando estado del proyecto...\n");

  // 1. Verificar formato
  if (!await runCommand(["deno", "fmt", "--check"], "Verificando formato")) {
    console.log("💡 Ejecutando formato automático...");
    await runCommand(["deno", "fmt"], "Aplicando formato");
  }

  // 2. Verificar linting (solo advertir, no fallar)
  console.log("\n⚠️  Verificando linting (solo advertencias)...");
  await runCommand(["deno", "lint"], "Verificando linting");

  // 3. Verificar compilación
  if (!await runCommand(["deno", "check", "mod.ts"], "Verificando compilación")) {
    console.error("❌ La compilación falló. No se puede publicar.");
    Deno.exit(1);
  }

  // 4. Ejecutar tests
  if (!await runCommand(["deno", "test"], "Ejecutando tests")) {
    console.error("❌ Los tests fallaron. No se puede publicar.");
    Deno.exit(1);
  }

  // 5. Actualizar versión
  if (!await updateVersion(version)) {
    Deno.exit(1);
  }

  // 6. Crear commit
  if (!await runCommand(["git", "add", "."], "Agregando archivos a git")) {
    Deno.exit(1);
  }

  if (!await runCommand(["git", "commit", "-m", `Release v${version}`], "Creando commit")) {
    console.log("ℹ️  No hay cambios para commit o ya está commitado");
  }

  // 7. Crear tag
  if (!await runCommand(["git", "tag", `v${version}`], "Creando tag")) {
    console.error("❌ Error creando tag. Puede que ya existe.");
    Deno.exit(1);
  }

  // 8. Push cambios
  if (!await runCommand(["git", "push", "origin", "main"], "Subiendo cambios")) {
    Deno.exit(1);
  }

  // 9. Push tag
  if (!await runCommand(["git", "push", "origin", `v${version}`], "Subiendo tag")) {
    Deno.exit(1);
  }

  console.log("\n🎉 ¡Publicación completada con éxito!");
  console.log(`\n📦 La versión v${version} está disponible en:`);
  console.log(`   - GitHub: https://github.com/tu-usuario/deno-oracle-lib/releases/tag/v${version}`);
  console.log(`   - Import: https://raw.githubusercontent.com/tu-usuario/deno-oracle-lib/v${version}/mod.ts`);

  console.log("\n🔗 Próximos pasos:");
  console.log("   1. Registrar en https://deno.land/x si no está hecho");
  console.log("   2. Actualizar documentación si es necesario");
  console.log("   3. Anunciar la nueva versión");
}

// Ejecutar publicación
await publish();
