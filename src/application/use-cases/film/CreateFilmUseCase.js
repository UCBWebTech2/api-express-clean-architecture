const Film = require('../../../domain/entities/Film');

class CreateFilmUseCase {
    constructor(filmRepository) {
        this.filmRepository = filmRepository;
    }

    async execute(filmData) {
        // Si viola una regla de negocio (falta título/language_id), el error de la
        // entidad se propaga tal cual: no es un fallo de infraestructura para enmascarar.
        const film = new Film(filmData);
        try {
            return await this.filmRepository.create(film);
        } catch (error) {
            throw new Error('Error al crear la película');
        }
    }
}

module.exports = CreateFilmUseCase;
