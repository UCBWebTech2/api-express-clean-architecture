// Fábrica de la app Express: recibe las piezas ya armadas (controllers, middleware)
// en vez de construirlas él mismo. Así se puede levantar la app tanto con el
// container real (PostgreSQL) como con uno de prueba (repositorios en memoria).
const express = require('express');
const cors = require('cors');
const createFilmRoutes = require('./interface-adapters/routes/films.routes');
const createActorRoutes = require('./interface-adapters/routes/actors.routes');
const createAuthRoutes = require('./interface-adapters/routes/auth.routes');

function createApp({ filmController, actorController, authController, authenticateToken }) {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use('/api/films', createFilmRoutes(filmController, authenticateToken));
    app.use('/api/actors', createActorRoutes(actorController, authenticateToken));
    app.use('/api/auth', createAuthRoutes(authController));

    return app;
}

module.exports = createApp;
