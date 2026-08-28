const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');

const routesPath = path.join(__dirname, '..', '..', 'interface-adapters', 'routes');
const routeFiles = fs
    .readdirSync(routesPath)
    .filter(file => file.endsWith('.js'))
    // swagger-jsdoc resuelve estas rutas como patrones glob, que solo entienden
    // "/" como separador. path.join usa "\" en Windows, lo que hace que no
    // matchee ningún archivo ahí y Swagger quede sin documentar nada.
    .map(file => path.join(routesPath, file).split(path.sep).join('/'));

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Gestión de Películas - Sakila (Clean Architecture)',
            version: '1.0.0',
            description: 'Documentación de la API de películas, organizada con Clean Architecture',
        },
        servers: [
        {
           url: 'http://localhost:3000',
           description: 'Servidor local',
        },
        ],
    },
    apis: routeFiles, // Rutas donde están los endpoints
};

const swaggerSpec = swaggerJSDoc(options);
const swaggerDocs = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = swaggerDocs;
