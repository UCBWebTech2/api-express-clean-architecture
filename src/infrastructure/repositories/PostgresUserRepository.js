const User = require('../../domain/entities/User');

// El dominio solo habla de "usuarios". Que Sakila los guarde en la tabla
// "staff" (reusada, con first_name/last_name/address_id/store_id fijos)
// es un detalle que no debe filtrarse fuera de este adaptador.
//
// Contrato esperado por los casos de uso (duck typing):
//   findByUsername(username): Promise<User|null>
//   create({ username, password }): Promise<User>
class PostgresUserRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findByUsername(username) {
        const { rows } = await this.pool.query('SELECT * FROM staff WHERE username = $1', [username]);
        if (rows.length === 0) return null;
        return new User(rows[0]);
    }

    async create({ username, password }) {
        const { rows } = await this.pool.query(
            'INSERT INTO staff(first_name,last_name,address_id,store_id,username, password) VALUES (\' \',\' \',3,1,$1,$2) RETURNING staff_id, username, password',
            [username, password]
        );
        return new User(rows[0]);
    }
}

module.exports = PostgresUserRepository;
