const { validationResult } = require('express-validator');

function createAuthController({ registerUserUseCase, loginUserUseCase }) {
    return {
        // POST /api/auth/register
        async register(req, res) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { username, password } = req.body;
            try {
                await registerUserUseCase.execute(username, password);
                res.json({ message: 'Usuario registrado correctamente' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },

        // POST /api/auth/login
        async login(req, res) {
            const { username, password } = req.body;
            try {
                const result = await loginUserUseCase.execute(username, password);
                res.json(result);
            } catch (error) {
                res.status(401).json({ error: error.message });
            }
        },
    };
}

module.exports = createAuthController;
