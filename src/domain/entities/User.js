// El dominio solo conoce "un usuario con username y password (hasheado)".
// Que en la base física se guarde en la tabla "staff" es un detalle de infraestructura.
class User {
    constructor({ staff_id, username, password }) {
        if (!username) {
            throw new Error('User requiere username');
        }
        if (!password) {
            throw new Error('User requiere password');
        }

        this.staff_id = staff_id;
        this.username = username;
        this.password = password; // hash, nunca texto plano
    }
}

module.exports = User;
