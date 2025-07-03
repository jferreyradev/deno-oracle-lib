# 🚀 Guía Rápida de Publicación

## Resumen de Cómo Usar/Publicar la Librería

### 📦 **Para USUARIOS de la librería:**

#### 1. **Uso Directo (Recomendado)**

```typescript
// Importar versión específica desde GitHub
import {
  MemoryCache,
  OracleConnection,
  SqlBuilder,
} from "https://raw.githubusercontent.com/tu-usuario/deno-oracle-lib/v1.0.0/mod.ts";
```

#### 2. **Con Import Maps**

```json
// deno.json
{
  "imports": {
    "oracle/": "https://raw.githubusercontent.com/tu-usuario/deno-oracle-lib/v1.0.0/"
  }
}
```

```typescript
import { OracleConnection } from "oracle/mod.ts";
```

#### 3. **Con deps.ts (Mejor práctica)**

```typescript
// deps.ts
export * from "https://raw.githubusercontent.com/tu-usuario/deno-oracle-lib/v1.0.0/mod.ts";

// main.ts
import { OracleConnection } from "./deps.ts";
```

### 🛠️ **Para DESARROLLADORES/MANTENEDORES:**

#### **Preparación antes de publicar:**

```bash
# 1. Verificar código
deno lint
deno fmt
deno check mod.ts

# 2. Ejecutar tests
deno test --allow-all

# 3. Actualizar versión en deno.json manualmente
```

#### **Publicación Manual:**

```bash
# 1. Crear commit
git add .
git commit -m "Release v1.0.0"

# 2. Crear tag
git tag v1.0.0

# 3. Subir a GitHub
git push origin main
git push origin v1.0.0
```

#### **Publicación con Script:**

```bash
# Usar el script automatizado
deno run --allow-run --allow-read --allow-write scripts/publish.ts 1.0.0
```

#### **Desde VS Code:**

- `Ctrl+Shift+P` → "Tasks: Run Task" → "Publish Library"
- Introducir versión cuando se solicite

### 🌐 **Registro en deno.land/x:**

1. Ve a https://deno.land/x
2. Conecta tu cuenta GitHub
3. Agrega el repositorio `deno-oracle-lib`
4. El sistema detectará automáticamente los releases

**Una vez registrado, los usuarios podrán usar:**

```typescript
import { OracleConnection } from "https://deno.land/x/deno_oracle_lib@v1.0.0/mod.ts";
```

### ⚠️ **Notas Importantes:**

- **Estado actual**: La librería tiene algunos warnings de linting pero es funcional
- **Recomendación**: Corregir warnings antes de publicación oficial
- **Versionado**: Usar semantic versioning (1.0.0, 1.1.0, 1.0.1)
- **GitHub primero**: Siempre publicar en GitHub antes que en deno.land/x

### 🔄 **Actualizar una versión existente:**

```bash
# Nueva versión
git tag v1.1.0
git push origin v1.1.0

# Los usuarios actualizan cambiando la URL:
# v1.0.0 → v1.1.0
```

### 📚 **URLs de ejemplo para usuarios:**

```typescript
// Versión específica (recomendado para producción)
import {} from "https://raw.githubusercontent.com/tu-usuario/deno-oracle-lib/v1.0.0/mod.ts";

// Última versión (no recomendado para producción)
import {} from "https://raw.githubusercontent.com/tu-usuario/deno-oracle-lib/main/mod.ts";

// Desde deno.land/x (cuando esté registrado)
import {} from "https://deno.land/x/deno_oracle_lib@v1.0.0/mod.ts";
```
