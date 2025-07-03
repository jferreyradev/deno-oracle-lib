# Guía de Publicación - Deno Oracle Library

## ✅ Checklist Pre-Publicación

### 1. **Verificación del Código**

- [x] Todos los archivos TypeScript compilan sin errores
- [x] Tests pasan correctamente
- [x] Documentación está actualizada
- [x] Ejemplos funcionan
- [x] No hay dependencias faltantes

### 2. **Configuración de Archivos**

- [x] `deno.json` tiene la versión correcta
- [x] `mod.ts` exporta todos los módulos necesarios
- [x] `README.md` está completo con ejemplos
- [x] `LICENSE` archivo existe

### 3. **Versionado**

- [x] Versión en `deno.json` es correcta
- [ ] Git tag creado para la versión
- [ ] CHANGELOG.md actualizado (opcional pero recomendado)

## 🚀 Comandos de Publicación

### Verificar antes de publicar:

```bash
# Linter
deno lint

# Formatter
deno fmt

# Tests
deno test

# Verificar exportaciones
deno check mod.ts
```

### Publicar versión:

```bash
# 1. Actualizar versión en deno.json
# 2. Commit cambios
git add .
git commit -m "Release v1.0.0"

# 3. Crear tag
git tag v1.0.0
git push origin main
git push origin v1.0.0

# 4. Publicar en JSR (opcional)
deno publish
```

## 📦 Formas de Instalación para Usuarios

### 1. **Desde deno.land/x**

```typescript
import { OracleConnection } from "https://deno.land/x/deno_oracle_lib@v1.0.0/mod.ts";
```

### 2. **Desde GitHub**

```typescript
import { OracleConnection } from "https://raw.githubusercontent.com/tu-usuario/deno-oracle-lib/v1.0.0/mod.ts";
```

### 3. **Con import maps**

```json
// deno.json
{
  "imports": {
    "oracle-lib": "https://deno.land/x/deno_oracle_lib@v1.0.0/mod.ts"
  }
}
```

```typescript
// En tu código
import { OracleConnection } from "oracle-lib";
```

### 4. **Con deps.ts (patrón recomendado)**

```typescript
// deps.ts
export { MemoryCache, OracleConnection, SqlBuilder } from "https://deno.land/x/deno_oracle_lib@v1.0.0/mod.ts";
```

```typescript
// tu_archivo.ts
import { OracleConnection } from "./deps.ts";
```

## 🔄 Actualizaciones

### Para usuarios existentes:

```bash
# Actualizar cache de Deno
deno cache --reload https://deno.land/x/deno_oracle_lib@v1.1.0/mod.ts
```

### Para el mantenedor:

```bash
# Nueva versión
# 1. Actualizar deno.json
# 2. Hacer cambios
# 3. Crear nuevo tag
git tag v1.1.0
git push origin v1.1.0
```

## 📚 Documentación de Referencia

- [Deno.land/x Publishing](https://deno.land/x)
- [JSR Publishing](https://jsr.io)
- [Deno Module Guidelines](https://deno.land/manual/contributing/style_guide)
