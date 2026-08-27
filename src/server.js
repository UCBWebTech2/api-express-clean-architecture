// Bootstrap: arma el container real (PostgreSQL, bcrypt, jwt) y levanta la app.
require('dotenv').config();
const buildContainer = require('./container');
const createApp = require('./app');
const swaggerDocs = require('./infrastructure/config/swagger');

const NODE_ENV = process.env.NODE_ENV || 'development';

const container = buildContainer();
const app = createApp(container);

module.exports = app; // Exporta la app sin iniciar el servidor

// La documentación Swagger solo se activa fuera de producción:
// expone el detalle de los endpoints y no debería quedar pública en un entorno real.
if (NODE_ENV !== 'production') {
    swaggerDocs(app);
}

if (require.main === module) { // Solo inicia el servidor si se ejecuta directamente
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT} (${NODE_ENV})`);
        if (NODE_ENV !== 'production') {
            console.log(`Documentación disponible en http://localhost:${PORT}/api-docs`);
        }
    });
}
