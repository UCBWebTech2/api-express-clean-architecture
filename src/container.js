// Composition root: el único módulo que conoce TODAS las capas a la vez
// y decide qué implementación concreta usar detrás de cada puerto/interfaz.
// Nada dentro de domain/ ni application/ debería requerir este archivo.
require('dotenv').config();

const pool = require('./infrastructure/database/postgresPool');

// Adaptadores de repositorio (los casos de uso solo esperan su forma — findAll, findById, etc. — por duck typing)
const PostgresFilmRepository = require('./infrastructure/repositories/PostgresFilmRepository');
const PostgresActorRepository = require('./infrastructure/repositories/PostgresActorRepository');
const PostgresUserRepository = require('./infrastructure/repositories/PostgresUserRepository');

// Adaptadores de seguridad
const BcryptPasswordHasher = require('./infrastructure/security/BcryptPasswordHasher');
const JwtTokenService = require('./infrastructure/security/JwtTokenService');

// Casos de uso
const GetAllFilmsUseCase = require('./application/use-cases/film/GetAllFilmsUseCase');
const GetFilmByIdUseCase = require('./application/use-cases/film/GetFilmByIdUseCase');
const CreateFilmUseCase = require('./application/use-cases/film/CreateFilmUseCase');
const UpdateFilmUseCase = require('./application/use-cases/film/UpdateFilmUseCase');
const DeleteFilmUseCase = require('./application/use-cases/film/DeleteFilmUseCase');

const GetAllActorsUseCase = require('./application/use-cases/actor/GetAllActorsUseCase');
const GetActorByIdUseCase = require('./application/use-cases/actor/GetActorByIdUseCase');
const CreateActorUseCase = require('./application/use-cases/actor/CreateActorUseCase');
const UpdateActorUseCase = require('./application/use-cases/actor/UpdateActorUseCase');
const DeleteActorUseCase = require('./application/use-cases/actor/DeleteActorUseCase');

const RegisterUserUseCase = require('./application/use-cases/auth/RegisterUserUseCase');
const LoginUserUseCase = require('./application/use-cases/auth/LoginUserUseCase');

// Interface adapters
const createFilmController = require('./interface-adapters/controllers/film.controller');
const createActorController = require('./interface-adapters/controllers/actor.controller');
const createAuthController = require('./interface-adapters/controllers/auth.controller');
const createAuthenticateToken = require('./interface-adapters/middlewares/authenticateToken');

function buildContainer() {
    // --- Repositorios (adaptadores de persistencia) ---
    const filmRepository = new PostgresFilmRepository(pool);
    const actorRepository = new PostgresActorRepository(pool);
    const userRepository = new PostgresUserRepository(pool);

    // --- Servicios de seguridad (adaptadores) ---
    const passwordHasher = new BcryptPasswordHasher();
    const tokenService = new JwtTokenService(process.env.JWT_SECRET);
    const tokenExpiration = process.env.JWT_TIME_EXPIRE || '1h';

    // --- Casos de uso ---
    const filmUseCases = {
        getAllFilmsUseCase: new GetAllFilmsUseCase(filmRepository),
        getFilmByIdUseCase: new GetFilmByIdUseCase(filmRepository),
        createFilmUseCase: new CreateFilmUseCase(filmRepository),
        updateFilmUseCase: new UpdateFilmUseCase(filmRepository),
        deleteFilmUseCase: new DeleteFilmUseCase(filmRepository),
    };

    const actorUseCases = {
        getAllActorsUseCase: new GetAllActorsUseCase(actorRepository),
        getActorByIdUseCase: new GetActorByIdUseCase(actorRepository),
        createActorUseCase: new CreateActorUseCase(actorRepository),
        updateActorUseCase: new UpdateActorUseCase(actorRepository),
        deleteActorUseCase: new DeleteActorUseCase(actorRepository),
    };

    const registerUserUseCase = new RegisterUserUseCase(userRepository, passwordHasher);
    const loginUserUseCase = new LoginUserUseCase(userRepository, passwordHasher, tokenService, tokenExpiration);

    // --- Interface adapters ---
    const filmController = createFilmController(filmUseCases);
    const actorController = createActorController(actorUseCases);
    const authController = createAuthController({ registerUserUseCase, loginUserUseCase });
    const authenticateToken = createAuthenticateToken(tokenService);

    return { filmController, actorController, authController, authenticateToken };
}

module.exports = buildContainer;
