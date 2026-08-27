const express = require('express');
const { body, query } = require('express-validator');

const paginationValidators = [
    query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero mayor o igual a 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe ser un entero entre 1 y 100'),
];

const filmValidators = [
    body('title').notEmpty().withMessage('El título es obligatorio'),
    body('language_id').notEmpty().withMessage('language_id es obligatorio').isInt().withMessage('language_id debe ser un número entero'),
    body('description').optional({ nullable: true }).isString().withMessage('La descripción debe ser texto'),
    body('release_year').optional({ nullable: true }).isInt({ min: 1901, max: 2155 }).withMessage('release_year debe estar entre 1901 y 2155'),
    body('rental_duration').optional({ nullable: true }).isInt({ min: 1 }).withMessage('rental_duration debe ser un entero positivo'),
    body('rental_rate').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('rental_rate debe ser un número positivo'),
    body('length').optional({ nullable: true }).isInt({ min: 0 }).withMessage('length debe ser un entero positivo'),
    body('rating').optional({ nullable: true }).isIn(['G', 'PG', 'PG-13', 'R', 'NC-17']).withMessage('rating inválido'),
];

// El router se arma con el controller y el middleware ya inyectados desde el composition root.
module.exports = (filmController, authenticateToken) => {
    const router = express.Router();

    /**
     * @swagger
     * components:
     *   securitySchemes:
     *     BearerAuth:
     *       type: http
     *       scheme: bearer
     *       bearerFormat: JWT
     *
     * tags:
     *   - name: Películas
     *     description: Endpoints para gestionar películas
     */

    /**
     * @swagger
     * /api/films:
     *   get:
     *     summary: Obtiene la lista de películas paginada (requiere autenticación)
     *     tags: [Películas]
     *     description: Retorna una página de películas, junto con metadatos de paginación.
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         required: false
     *         description: Número de página (por defecto 1)
     *         schema:
     *           type: integer
     *           example: 1
     *       - in: query
     *         name: limit
     *         required: false
     *         description: Cantidad de resultados por página, máximo 100 (por defecto 10)
     *         schema:
     *           type: integer
     *           example: 10
     *     responses:
     *       200:
     *         description: Página de películas obtenida con éxito
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                 meta:
     *                   type: object
     *                   properties:
     *                     page:
     *                       type: integer
     *                       example: 1
     *                     limit:
     *                       type: integer
     *                       example: 10
     *                     total:
     *                       type: integer
     *                       example: 1000
     *                     pages:
     *                       type: integer
     *                       example: 100
     *       400:
     *         description: page o limit inválidos
     *       401:
     *         description: Acceso no autorizado, token inválido o no proporcionado
     *       500:
     *         description: Error interno del servidor
     */
    router.get('/', authenticateToken, paginationValidators, filmController.getAllFilms);

    /**
     * @swagger
     * /api/films/{id}:
     *   get:
     *     summary: Obtiene una película por ID (requiere autenticación)
     *     tags: [Películas]
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: ID de la película a obtener
     *         schema:
     *           type: integer
     *           example: 1
     *     responses:
     *       200:
     *         description: Película obtenida con éxito
     *       401:
     *         description: Acceso no autorizado, token inválido o no proporcionado
     *       404:
     *         description: Película no encontrada
     *       500:
     *         description: Error interno del servidor
     */
    router.get('/:id', authenticateToken, filmController.getFilmById);

    /**
     * @swagger
     * /api/films:
     *   post:
     *     summary: Crea una nueva película (requiere autenticación)
     *     tags: [Películas]
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [title, language_id]
     *             properties:
     *               title:
     *                 type: string
     *                 example: Mi Película
     *               description:
     *                 type: string
     *                 example: Una gran historia
     *               release_year:
     *                 type: integer
     *                 example: 2024
     *               language_id:
     *                 type: integer
     *                 example: 1
     *               rental_duration:
     *                 type: integer
     *                 example: 3
     *               rental_rate:
     *                 type: number
     *                 example: 4.99
     *               length:
     *                 type: integer
     *                 example: 120
     *               rating:
     *                 type: string
     *                 example: PG-13
     *     responses:
     *       201:
     *         description: Película creada con éxito
     *       400:
     *         description: Error en los datos de entrada
     *       401:
     *         description: Acceso no autorizado, token inválido o no proporcionado
     *       500:
     *         description: Error interno del servidor
     */
    router.post('/', authenticateToken, filmValidators, filmController.createFilm);

    /**
     * @swagger
     * /api/films/{id}:
     *   put:
     *     summary: Actualiza una película existente (requiere autenticación)
     *     tags: [Películas]
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: ID de la película a actualizar
     *         schema:
     *           type: integer
     *           example: 1
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [title, language_id]
     *             properties:
     *               title:
     *                 type: string
     *                 example: Mi Película Actualizada
     *               description:
     *                 type: string
     *                 example: Una gran historia
     *               release_year:
     *                 type: integer
     *                 example: 2024
     *               language_id:
     *                 type: integer
     *                 example: 1
     *               rental_duration:
     *                 type: integer
     *                 example: 3
     *               rental_rate:
     *                 type: number
     *                 example: 4.99
     *               length:
     *                 type: integer
     *                 example: 120
     *               rating:
     *                 type: string
     *                 example: PG-13
     *     responses:
     *       200:
     *         description: Película actualizada con éxito
     *       400:
     *         description: Error en los datos de entrada
     *       401:
     *         description: Acceso no autorizado, token inválido o no proporcionado
     *       404:
     *         description: Película no encontrada
     *       500:
     *         description: Error interno del servidor
     */
    router.put('/:id', authenticateToken, filmValidators, filmController.updateFilm);

    /**
     * @swagger
     * /api/films/{id}:
     *   delete:
     *     summary: Elimina una película (requiere autenticación)
     *     tags: [Películas]
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: ID de la película a eliminar
     *         schema:
     *           type: integer
     *           example: 1
     *     responses:
     *       204:
     *         description: Película eliminada con éxito
     *       401:
     *         description: Acceso no autorizado, token inválido o no proporcionado
     *       404:
     *         description: Película no encontrada
     *       500:
     *         description: Error interno del servidor
     */
    router.delete('/:id', authenticateToken, filmController.deleteFilm);

    return router;
};
