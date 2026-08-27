// Solo acceso a datos. El manejo de errores vive en application/use-cases/actor/*.
//
// Contrato esperado por los casos de uso (duck typing):
//   findAll({ page, limit }): Promise<{ rows: Actor[], total: number }>
//   findById(id): Promise<Actor|null>
//   create(actor): Promise<Actor>
//   update(id, actor): Promise<Actor|null>
//   delete(id): Promise<boolean>
const Actor = require('../../domain/entities/Actor');

class PostgresActorRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findAll({ page, limit }) {
        const offset = (page - 1) * limit;
        const [rowsResult, countResult] = await Promise.all([
            this.pool.query('SELECT * FROM actor ORDER BY actor_id LIMIT $1 OFFSET $2', [limit, offset]),
            this.pool.query('SELECT COUNT(*) FROM actor'),
        ]);
        return {
            rows: rowsResult.rows.map(row => new Actor(row)),
            total: parseInt(countResult.rows[0].count, 10),
        };
    }

    async findById(id) {
        const { rows } = await this.pool.query('SELECT * FROM actor WHERE actor_id = $1', [id]);
        if (rows.length === 0) return null;
        return new Actor(rows[0]);
    }

    async create(actor) {
        const { rows } = await this.pool.query(
            'INSERT INTO actor (first_name, last_name) VALUES ($1, $2) RETURNING *',
            [actor.first_name, actor.last_name]
        );
        return new Actor(rows[0]);
    }

    async update(id, actor) {
        const { rows } = await this.pool.query(
            'UPDATE actor SET first_name = $1, last_name = $2 WHERE actor_id = $3 RETURNING *',
            [actor.first_name, actor.last_name, id]
        );
        if (rows.length === 0) return null;
        return new Actor(rows[0]);
    }

    async delete(id) {
        const { rows } = await this.pool.query('DELETE FROM actor WHERE actor_id = $1 RETURNING actor_id', [id]);
        return rows.length > 0;
    }
}

module.exports = PostgresActorRepository;
