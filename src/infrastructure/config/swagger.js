const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
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
    apis: [path.join(__dirname, '..', '..', 'interface-adapters', 'routes', '*.js')], // Rutas donde están los endpoints
};

const swaggerSpec = swaggerJSDoc(options);
const swaggerDocs = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = swaggerDocs;
