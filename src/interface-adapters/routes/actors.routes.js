const express = require('express');
const { body, query } = require('express-validator');

const paginationValidators = [
    query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero mayor o igual a 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe ser un entero entre 1 y 100'),
];

const actorValidators = [
    body('first_name').notEmpty().withMessage('El nombre es obligatorio'),
    body('last_name').notEmpty().withMessage('El apellido es obligatorio'),
];

module.exports = (actorController, authenticateToken) => {
    const router = express.Router();

    /**
     * @swagger
     * tags:
     *   - name: Actores
     *     description: Endpoints para gestionar actores
     */

    /**
     * @swagger
     * /api/actors:
     *   get:
     *     summary: Obtiene la lista de actores paginada (requiere autenticación)
     *     tags: [Actores]
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
     *         description: Página de actores obtenida con éxito
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
     *                       example: 200
     *                     pages:
     *                       type: integer
     *                       example: 20
     *       400:
     *         description: page o limit inválidos
     *       401:
     *         description: Acceso no autorizado, token inválido o no proporcionado
     *       500:
     *         description: Error interno del servidor
     */
    router.get('/', authenticateToken, paginationValidators, actorController.getAllActors);

    /**
     * @swagger
     * /api/actors/{id}:
     *   get:
     *     summary: Obtiene un actor por ID (requiere autenticación)
     *     tags: [Actores]
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: ID del actor a obtener
     *         schema:
     *           type: integer
     *           example: 1
     *     responses:
     *       200:
     *         description: Actor obtenido con éxito
     *       401:
     *         description: Acceso no autorizado, token inválido o no proporcionado
     *       404:
     *         description: Actor no encontrado
     *       500:
     *         description: Error interno del servidor
     */
    router.get('/:id', authenticateToken, actorController.getActorById);

    /**
     * @swagger
     * /api/actors:
     *   post:
     *     summary: Crea un nuevo actor (requiere autenticación)
     *     tags: [Actores]
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [first_name, last_name]
     *             properties:
     *               first_name:
     *                 type: string
     *                 example: John
     *               last_name:
     *                 type: string
     *                 example: Doe
     *     responses:
     *       201:
     *         description: Actor creado con éxito
     *       400:
     *         description: Error en los datos de entrada
     *       401:
     *         description: Acceso no autorizado, token inválido o no proporcionado
     *       500:
     *         description: Error interno del servidor
     */
    router.post('/', authenticateToken, actorValidators, actorController.createActor);

    /**
     * @swagger
     * /api/actors/{id}:
     *   put:
     *     summary: Actualiza un actor existente (requiere autenticación)
     *     tags: [Actores]
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: ID del actor a actualizar
     *         schema:
     *           type: integer
     *           example: 1
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [first_name, last_name]
     *             properties:
     *               first_name:
     *                 type: string
     *                 example: John
     *               last_name:
     *                 type: string
     *                 example: Doe
     *     responses:
     *       200:
     *         description: Actor actualizado con éxito
     *       400:
     *         description: Error en los datos de entrada
     *       401:
     *         description: Acceso no autorizado, token inválido o no proporcionado
     *       404:
     *         description: Actor no encontrado
     *       500:
     *         description: Error interno del servidor
     */
    router.put('/:id', authenticateToken, actorValidators, actorController.updateActor);

    /**
     * @swagger
     * /api/actors/{id}:
     *   delete:
     *     summary: Elimina un actor (requiere autenticación)
     *     tags: [Actores]
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: ID del actor a eliminar
     *         schema:
     *           type: integer
     *           example: 1
     *     responses:
     *       204:
     *         description: Actor eliminado con éxito
     *       401:
     *         description: Acceso no autorizado, token inválido o no proporcionado
     *       404:
     *         description: Actor no encontrado
     *       500:
     *         description: Error interno del servidor
     */
    router.delete('/:id', authenticateToken, actorController.deleteActor);

    return router;
};
