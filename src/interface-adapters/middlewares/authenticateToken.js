// Factory: recibe el TokenService (puerto) inyectado desde el composition root,
// así el middleware no depende directamente de jsonwebtoken.
function createAuthenticateToken(tokenService) {
    return function authenticateToken(req, res, next) {
        const token = req.header('Authorization')?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Acceso denegado, token no proporcionado' });
        }
        try {
            const decoded = tokenService.verify(token);
            req.user = decoded;
            next();
        } catch (error) {
            res.status(403).json({ error: 'Token inválido o expirado' });
        }
    };
}

module.exports = createAuthenticateToken;
