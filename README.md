# api-express-clean-architecture

API REST con Express y PostgreSQL sobre la base de datos de ejemplo **Sakila**, organizada siguiendo los principios de **Clean Architecture** (Robert C. Martin).

## Base de datos

Este proyecto usa **PostgreSQL** cargado con la base de datos de ejemplo **Sakila** (una tienda de alquiler de películas). Sakila trae muchas tablas, pero esta API solo lee y escribe en tres:

### `film`

Catálogo de películas. CRUD completo, con listado paginado.

| Columna | Tipo | Descripción |
|---|---|---|
| `film_id` | `integer` | Identificador único de la película |
| `title` | `varchar(255)` | Título |
| `description` | `text` | Sinopsis |
| `release_year` | `year` | Año de estreno |
| `language_id` | `integer` | Referencia al idioma (tabla `language`) |
| `rental_duration` | `smallint` | Días de alquiler por defecto |
| `rental_rate` | `numeric(4,2)` | Costo del alquiler |
| `length` | `smallint` | Duración en minutos |
| `rating` | `mpaa_rating` | Clasificación (G, PG, PG-13, R, NC-17) |

### `actor`

Actores. CRUD completo, con listado paginado.

| Columna | Tipo | Descripción |
|---|---|---|
| `actor_id` | `integer` | Identificador único del actor |
| `first_name` | `varchar(45)` | Nombre |
| `last_name` | `varchar(45)` | Apellido |

### `staff`

Empleados de la tienda. Aquí se guardan las cuentas usadas para registrarse e iniciar sesión.

| Columna | Tipo | Descripción |
|---|---|---|
| `staff_id` | `integer` | Identificador único |
| `first_name` | `varchar(45)` | Nombre (se completa con un valor fijo al registrar) |
| `last_name` | `varchar(45)` | Apellido (se completa con un valor fijo al registrar) |
| `address_id` | `integer` | Referencia a la dirección (se completa con un valor fijo al registrar) |
| `store_id` | `integer` | Referencia a la tienda (se completa con un valor fijo al registrar) |
| `username` | `varchar(16)` | Usuario para login |
| `password` | `varchar(255)`¹ | Contraseña (hash de bcrypt) |

¹ En el dump original de Sakila esta columna es `varchar(40)`, insuficiente para un hash de bcrypt (60 caracteres). Por eso se amplía a 255 en `sql/03-fix.sql`.

## Arquitectura

El proyecto sigue **Clean Architecture** (Robert C. Martin): el código se organiza en capas concéntricas donde las dependencias solo pueden apuntar hacia adentro. Las capas externas (framework HTTP, base de datos, librerías) conocen a las internas; las internas no saben que las externas existen.

```
src/
├── domain/                  # Entidades del negocio
│   └── entities/              # Film, Actor, User
├── application/              # Casos de uso
│   └── use-cases/              # Un archivo por acción: CreateFilmUseCase, LoginUserUseCase, ...
├── interface-adapters/        # Traducen HTTP <-> casos de uso
│   ├── controllers/
│   ├── presenters/              # DTOs de salida
│   ├── middlewares/
│   └── routes/                   # Endpoints, validación de entrada, Swagger
├── infrastructure/             # Detalles técnicos: PostgreSQL, bcrypt, jsonwebtoken
│   ├── database/
│   ├── repositories/
│   └── security/
├── container.js                # Composition root
├── app.js                      # Fábrica de la app Express
└── server.js                    # Punto de entrada
```

### Capas

**`domain/`** — las entidades del negocio, sin ninguna dependencia externa. Validan sus propias reglas en el constructor: `Film` lanza un error si falta `title` o `language_id`, sin importar quién la esté creando (un controller, un caso de uso, un test). Es la capa más interna: nada de lo que hay fuera de ella puede filtrarse hacia adentro — ni Express, ni PostgreSQL, ni siquiera `express-validator`.

**`application/`** — un caso de uso por cada acción del sistema (`CreateFilmUseCase`, `GetAllFilmsUseCase`, `LoginUserUseCase`, etc.). Cada uno recibe sus dependencias por constructor — un repositorio, un hasher de contraseñas, un servicio de tokens — sin conocer su implementación concreta, solo la forma que deben tener. Acá vive la lógica de negocio propiamente dicha: qué hacer si el usuario no existe, cómo se calculan `meta.pages` en la paginación, qué mensaje mostrar si falla la base de datos.

**`interface-adapters/`** — el punto de contacto con HTTP:
- `routes/` define los endpoints, valida la entrada (`express-validator`) y documenta con Swagger.
- `controllers/` reciben `req`/`res`, invocan el caso de uso correspondiente y arman la respuesta.
- `presenters/` (los DTOs de salida) deciden qué campos ve el cliente — `FilmDTO`, por ejemplo, no expone `rental_rate` ni `rating`.
- `middlewares/authenticateToken` recibe el servicio de tokens por inyección; no importa `jsonwebtoken` directamente.

**`infrastructure/`** — la capa más externa, el detalle técnico reemplazable: `PostgresFilmRepository`/`PostgresActorRepository`/`PostgresUserRepository` (los queries reales), `BcryptPasswordHasher` y `JwtTokenService` (envuelven `bcryptjs` y `jsonwebtoken`). Es el único lugar del proyecto que sabe que la base es PostgreSQL.

### Cómo se conectan las piezas

No hay clases abstractas ni interfaces que haya que heredar — en JavaScript eso no aporta chequeo de tipos y termina siendo código muerto. El contrato entre capas es implícito (duck typing) y se documenta con un comentario al inicio de cada adaptador: un caso de uso como `CreateFilmUseCase` simplemente espera un objeto con un método `create(film)`, sin que le importe si por detrás hay PostgreSQL, una base en memoria o un repositorio falso de test.

Quien decide qué implementación concreta usar es `container.js`, el **composition root**: es el único archivo del proyecto que conoce todas las capas a la vez. Instancia los adaptadores reales (`PostgresFilmRepository`, `BcryptPasswordHasher`, ...) y se los inyecta a los casos de uso; luego `app.js` arma la app Express con los controllers ya resueltos.

### Por qué está organizado así

- **La lógica de negocio no depende de la base de datos.** Las reglas viven en `domain/` y `application/`, que no importan `pg`. Cambiar de motor de base de datos implicaría reescribir `infrastructure/`, sin tocar una línea de la lógica.
- **Los casos de uso se testean sin mocks.** Como reciben sus dependencias por parámetro en vez de importarlas, los tests les pasan repositorios *fake* escritos a mano (`src/tests/*.usecases.test.js`) en lugar de mockear PostgreSQL o el framework HTTP.
- **El framework es un detalle, no el centro.** Reemplazar Express implicaría reescribir `interface-adapters/` e `infrastructure/`, pero `domain/` y `application/` — donde vive el negocio — quedarían intactos.
- **Los errores se manejan en la capa que corresponde.** El repositorio solo ejecuta queries; si PostgreSQL falla, el caso de uso es quien decide traducir ese fallo a un mensaje de negocio (p. ej. `'Error al obtener las películas'`). Las violaciones de reglas de negocio (como un `title` faltante) se dejan propagar sin enmascarar, porque no son un error de infraestructura.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Registra un usuario |
| `POST` | `/api/auth/login` | Inicia sesión y devuelve un token JWT |
| `GET` | `/api/films?page=&limit=` | Lista películas, paginado |
| `GET` | `/api/films/:id` | Obtiene una película por ID |
| `POST` | `/api/films` | Crea una película |
| `PUT` | `/api/films/:id` | Actualiza una película |
| `DELETE` | `/api/films/:id` | Elimina una película |
| `GET` | `/api/actors?page=&limit=` | Lista actores, paginado |
| `GET` | `/api/actors/:id` | Obtiene un actor por ID |
| `POST` | `/api/actors` | Crea un actor |
| `PUT` | `/api/actors/:id` | Actualiza un actor |
| `DELETE` | `/api/actors/:id` | Elimina un actor |

Todos los endpoints de `films` y `actors` requieren autenticación (`Authorization: Bearer <token>`).

## Requisitos

- Node.js 18+
- Una instancia de PostgreSQL (local o remota) — o Docker, si preferís levantar todo containerizado.

## Puesta en marcha

### Node.js local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear una base de datos vacía y cargar Sakila en ella. Hay que correr, **en orden**, los 3 scripts de la carpeta `sql/`:
   - `01-schema.sql`: crea las tablas de Sakila.
   - `02-data.sql`: carga los datos de ejemplo.
   - `03-fix.sql`: amplía la columna `staff.password` para que entre un hash de bcrypt.

   Por ejemplo, con `psql` (el mismo comando sirve en Windows, macOS y Linux):

   ```bash
   createdb sakila
   psql -d sakila -f sql/01-schema.sql
   psql -d sakila -f sql/02-data.sql
   psql -d sakila -f sql/03-fix.sql
   ```

3. Copiar las variables de entorno y ajustarlas según tu instancia de Postgres:

   ```bash
   # macOS / Linux
   cp .env.example .env
   ```

   ```powershell
   # Windows (cmd o PowerShell)
   copy .env.example .env
   ```

4. Iniciar el servidor:

   ```bash
   npm run dev   # con recarga automática
   # o
   npm start
   ```

5. Abrir la documentación interactiva (Swagger) en [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

### Con Docker

```bash
docker build -t api-express-clean-architecture .
docker run --rm -p 3000:3000 --env-file .env api-express-clean-architecture
```

Las variables se inyectan desde `.env` al arrancar el contenedor (`--env-file`), no se copian a la imagen. Si tu PostgreSQL corre en el host, `DB_HOST=localhost` no sirve *dentro* del contenedor — sobreescribilo:

```bash
docker run --rm -p 3000:3000 --env-file .env -e DB_HOST=host.docker.internal api-express-clean-architecture
```

### Con Docker Compose (API + base de datos incluida)

Levanta todo el stack, incluyendo una base PostgreSQL propia ya cargada con Sakila — no necesitás tener Postgres instalado:

```bash
docker compose up -d --build
```

- La primera vez, la base se inicializa con los 3 scripts de `sql/`. Las siguientes veces reusa los datos ya cargados.
- Para parar: `docker compose down`. Para parar y borrar también los datos: `docker compose down -v`.

## Autenticación

No hay un usuario cargado por defecto para hacer login: primero hay que registrar uno.

```bash
# Registrar un usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"usuario123","password":"Password.123"}'

# Iniciar sesión y obtener el token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"usuario123","password":"Password.123"}'

# Usar el token para consultar películas
curl http://localhost:3000/api/films \
  -H "Authorization: Bearer <token>"
```

## Tests

```bash
npm test
```

Incluye tests de ruta (`*.routes.test.js`, con `supertest` contra la app real) y tests de caso de uso (`*.usecases.test.js`), que prueban la lógica de negocio con repositorios en memoria, sin Express ni PostgreSQL de por medio.
