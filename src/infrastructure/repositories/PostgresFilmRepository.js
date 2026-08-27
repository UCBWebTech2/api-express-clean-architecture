// Adaptador de persistencia: acá viven los queries reales contra PostgreSQL.
// Solo hace acceso a datos — decidir qué hacer si algo falla es responsabilidad
// del caso de uso que lo use (ver application/use-cases/film/*), no de este archivo.
//
// Contrato esperado por los casos de uso (duck typing):
//   findAll({ page, limit }): Promise<{ rows: Film[], total: number }>
//   findById(id): Promise<Film|null>
//   create(film): Promise<Film>
//   update(id, film): Promise<Film|null>
//   delete(id): Promise<boolean>
const Film = require('../../domain/entities/Film');

class PostgresFilmRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findAll({ page, limit }) {
        const offset = (page - 1) * limit;
        const [rowsResult, countResult] = await Promise.all([
            this.pool.query('SELECT * FROM film ORDER BY film_id LIMIT $1 OFFSET $2', [limit, offset]),
            this.pool.query('SELECT COUNT(*) FROM film'),
        ]);
        return {
            rows: rowsResult.rows.map(row => new Film(row)),
            total: parseInt(countResult.rows[0].count, 10),
        };
    }

    async findById(id) {
        const { rows } = await this.pool.query('SELECT * FROM film WHERE film_id = $1', [id]);
        if (rows.length === 0) return null;
        return new Film(rows[0]);
    }

    async create(film) {
        const { rows } = await this.pool.query(
            `INSERT INTO film (title, description, release_year, language_id, rental_duration, rental_rate, length, rating)
             VALUES ($1, $2, $3, $4, COALESCE($5, 3), COALESCE($6, 4.99), $7, COALESCE($8::mpaa_rating, 'G'))
             RETURNING *`,
            [film.title, film.description, film.release_year, film.language_id, film.rental_duration, film.rental_rate, film.length, film.rating]
        );
        return new Film(rows[0]);
    }

    async update(id, film) {
        const { rows } = await this.pool.query(
            `UPDATE film
             SET title = $1, description = $2, release_year = $3, language_id = $4,
                 rental_duration = COALESCE($5, 3), rental_rate = COALESCE($6, 4.99),
                 length = $7, rating = COALESCE($8::mpaa_rating, 'G')
             WHERE film_id = $9
             RETURNING *`,
            [film.title, film.description, film.release_year, film.language_id, film.rental_duration, film.rental_rate, film.length, film.rating, id]
        );
        if (rows.length === 0) return null;
        return new Film(rows[0]);
    }

    async delete(id) {
        const { rows } = await this.pool.query('DELETE FROM film WHERE film_id = $1 RETURNING film_id', [id]);
        return rows.length > 0;
    }
}

module.exports = PostgresFilmRepository;
