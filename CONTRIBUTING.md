# Guía de Contribución

¡Gracias por tu interés en contribuir a Deno Oracle Library! 🎉

## 📋 Antes de Contribuir

1. **Fork** el repositorio
2. **Clone** tu fork localmente
3. **Instala Deno** (versión 1.40 o superior)
4. **Lee** esta guía completamente

## 🛠️ Configuración del Entorno

```bash
# Clonar tu fork
git clone https://github.com/tu-usuario/deno-oracle-lib.git
cd deno-oracle-lib

# Verificar que Deno esté instalado
deno --version

# Ejecutar tests
deno run --allow-read --allow-net test.ts

# Verificar linting
deno lint

# Verificar formateo
deno fmt --check
```

## 🔍 Tipos de Contribuciones

### 🐛 Reportar Bugs
- Usa el template de issue para bugs
- Incluye pasos para reproducir
- Especifica versión de Deno y OS
- Incluye logs de error si es posible

### ✨ Solicitar Features
- Usa el template de issue para features
- Explica el caso de uso
- Proporciona ejemplos de la API deseada
- Discute la implementación si es posible

### 📖 Mejorar Documentación
- Corrige errores tipográficos
- Mejora ejemplos existentes
- Agrega ejemplos de casos de uso
- Traduce documentación (español/inglés)

### 🔧 Contribuir Código
- Sigue las convenciones de estilo existentes
- Agrega tests para nuevas funcionalidades
- Actualiza documentación relevante
- Asegúrate de que todos los tests pasen

## 📝 Proceso de Desarrollo

### 1. Crear Branch
```bash
git checkout -b feature/nueva-funcionalidad
# o
git checkout -b fix/corregir-bug
```

### 2. Hacer Cambios
- Escribe código claro y bien documentado
- Sigue las convenciones TypeScript existentes
- Agrega JSDoc a funciones públicas
- Usa nombres descriptivos para variables y funciones

### 3. Ejecutar Tests
```bash
# Tests unitarios
deno run --allow-read --allow-net test.ts

# Verificar ejemplos
deno run --allow-read --allow-net examples/sql-examples.ts
deno run --allow-read --allow-net --allow-env --allow-write examples/config-examples.ts

# Linting
deno lint

# Formateo
deno fmt
```

### 4. Commit Changes
```bash
git add .
git commit -m "feat: agregar nueva funcionalidad X"
# o
git commit -m "fix: corregir problema con Y"
# o
git commit -m "docs: actualizar ejemplo de Z"
```

**Convenciones de Commit:**
- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` cambios en documentación
- `style:` formateo, punto y coma faltante, etc.
- `refactor:` refactoring de código
- `test:` agregar o corregir tests
- `chore:` mantención (dependencias, build, etc.)

### 5. Push y Pull Request
```bash
git push origin feature/nueva-funcionalidad
```

Luego crea un Pull Request desde GitHub con:
- Título descriptivo
- Descripción detallada de los cambios
- Referencias a issues relacionados
- Screenshots si es aplicable

## 🎯 Estándares de Código

### TypeScript
- Usa tipos explícitos siempre que sea posible
- Evita `any`, usa tipos específicos
- Documenta funciones públicas con JSDoc
- Sigue las convenciones de naming existentes

### Estructura de Archivos
```
src/
├── cache.ts           # Gestión de cache
├── connection.ts      # Conexiones Oracle
├── controller.ts      # Controladores CRUD
├── sql-builder.ts     # Constructor SQL
├── validator.ts       # Validación de datos
├── types.ts           # Tipos TypeScript
└── stored-procedure.ts # Procedimientos almacenados

examples/
├── sql-examples.ts    # Ejemplos de SQL
├── config-examples.ts # Ejemplos de configuración
└── stored-procedures.ts # Ejemplos de SP
```

### Tests
- Escribe tests para nuevas funcionalidades
- Mantén tests existentes funcionando
- Usa nombres descriptivos para tests
- Incluye casos edge y manejo de errores

### Documentación
- Actualiza README.md si es necesario
- Agrega ejemplos para nuevas funcionalidades
- Documenta parámetros y valores de retorno
- Incluye ejemplos de uso

## 🔍 Review Process

### Lo que Buscamos
- ✅ Código limpio y bien estructurado
- ✅ Tests que cubren la funcionalidad
- ✅ Documentación actualizada
- ✅ Sin warnings de linting
- ✅ Compatibilidad con versiones de Deno soportadas

### Lo que Evitamos
- ❌ Cambios masivos sin discusión previa
- ❌ Código sin tests
- ❌ Breaking changes sin justificación
- ❌ Funcionalidades sin documentación

## 🚀 Release Process

1. Todos los cambios pasan por Pull Request
2. Review por mantenedores
3. Tests automáticos deben pasar
4. Merge a main branch
5. Tag de versión siguiendo semver
6. Publicación en deno.land/x

## 🤝 Código de Conducta

- Sé respetuoso y constructivo
- Acepta feedback y críticas constructivas
- Ayuda a otros contributors
- Mantén discusiones técnicas y profesionales

## 📞 Contacto

- **Issues**: [GitHub Issues](https://github.com/jferreyradev/deno-oracle-lib/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jferreyradev/deno-oracle-lib/discussions)
- **Email**: [Crear issue para contacto privado]

## 🙏 Reconocimientos

Todos los contributors serán reconocidos en:
- README.md
- Release notes
- Hall of fame (contributors destacados)

¡Gracias por contribuir a hacer esta librería mejor! 🚀
