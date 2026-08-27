//
// Contrato esperado por los casos de uso (duck typing):
//   hash(plainPassword): Promise<string>
//   compare(plainPassword, hashedPassword): Promise<boolean>
const bcrypt = require('bcryptjs');

class BcryptPasswordHasher {
    constructor(saltRounds = 10) {
        this.saltRounds = saltRounds;
    }

    async hash(plainPassword) {
        return bcrypt.hash(plainPassword, this.saltRounds);
    }

    async compare(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = BcryptPasswordHasher;
