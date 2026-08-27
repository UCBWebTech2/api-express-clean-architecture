// Entidad de negocio: no conoce Express, ni PostgreSQL, ni HTTP.
// Encapsula las reglas invariantes de una película, sin importar quién la use.
class Film {
    constructor({ film_id, title, description, release_year, language_id, rental_duration, rental_rate, length, rating }) {
        if (!title) {
            throw new Error('Film requiere un título');
        }
        if (language_id === undefined || language_id === null) {
            throw new Error('Film requiere un language_id');
        }

        this.film_id = film_id;
        this.title = title;
        this.description = description ?? null;
        this.release_year = release_year ?? null;
        this.language_id = language_id;
        this.rental_duration = rental_duration ?? null;
        this.rental_rate = rental_rate ?? null;
        this.length = length ?? null;
        this.rating = rating ?? null;
    }
}

module.exports = Film;
