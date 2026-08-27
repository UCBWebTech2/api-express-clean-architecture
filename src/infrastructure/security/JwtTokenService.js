//
// Contrato esperado por los casos de uso (duck typing):
//   sign(payload, options): string
//   verify(token): object
const jwt = require('jsonwebtoken');

class JwtTokenService {
    constructor(secret) {
        this.secret = secret;
    }

    sign(payload, options) {
        return jwt.sign(payload, this.secret, options);
    }

    verify(token) {
        return jwt.verify(token, this.secret);
    }
}

module.exports = JwtTokenService;
