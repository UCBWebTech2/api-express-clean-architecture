class DeleteFilmUseCase {
    constructor(filmRepository) {
        this.filmRepository = filmRepository;
    }

    async execute(id) {
        try {
            return await this.filmRepository.delete(id);
        } catch (error) {
            throw new Error('Error al eliminar la película');
        }
    }
}

module.exports = DeleteFilmUseCase;
