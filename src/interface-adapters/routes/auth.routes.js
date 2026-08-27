const express = require('express');
const { body } = require('express-validator');

module.exports = (authController) => {
    const router = express.Router();

    /**
     * @swagger
     * tags:
     *   - name: Autenticación
     *     description: Endpoints para autenticación de usuarios
     */

    /**
     * @swagger
     * /api/auth/register:
     *   post:
     *     summary: Registra un nuevo usuario
     *     tags: [Autenticación]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 type: string
     *                 example: usuario123
     *               password:
     *                 type: string
     *                 example: "Password.123"
     *     responses:
     *       200:
     *         description: Usuario registrado correctamente
     *       400:
     *         description: Error en los datos de entrada
     *       500:
     *         description: Error en el servidor
     */
    router.post('/register',
    [
        body('username').notEmpty().withMessage('El nombre de usuario es obligatorio'),
        body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
    ],
    authController.register);

    /**
     * @swagger
     * /api/auth/login:
     *   post:
     *     summary: Inicia sesión y obtiene un token JWT
     *     tags: [Autenticación]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 type: string
     *                 example: usuario123
     *               password:
     *                 type: string
     *                 example: "Password.123"
     *     responses:
     *       200:
     *         description: Devuelve el token JWT
     *       401:
     *         description: Credenciales incorrectas
     *       500:
     *         description: Error en el servidor
     */
    router.post('/login', authController.login);

    return router;
};
