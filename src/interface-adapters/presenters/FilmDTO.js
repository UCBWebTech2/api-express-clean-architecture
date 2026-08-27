// enmascarar campos: da forma a la respuesta HTTP, no es parte del dominio.
class FilmDTO {
    constructor({ film_id, title, description, release_year }) {
        this.id = film_id;
        this.title = title;
        this.description = description;
        this.releaseYear = release_year;
    }
}

module.exports = FilmDTO;
