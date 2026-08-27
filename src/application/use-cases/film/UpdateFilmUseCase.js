const Film = require('../../../domain/entities/Film');

class UpdateFilmUseCase {
    constructor(filmRepository) {
        this.filmRepository = filmRepository;
    }

    async execute(id, filmData) {
        const film = new Film({ ...filmData, film_id: id }); // valida invariantes de negocio
        try {
            return await this.filmRepository.update(id, film);
        } catch (error) {
            throw new Error('Error al actualizar la película');
        }
    }
}

module.exports = UpdateFilmUseCase;
