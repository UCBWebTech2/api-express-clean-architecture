class GetFilmByIdUseCase {
    constructor(filmRepository) {
        this.filmRepository = filmRepository;
    }

    async execute(id) {
        try {
            return await this.filmRepository.findById(id);
        } catch (error) {
            throw new Error('Error al obtener la película');
        }
    }
}

module.exports = GetFilmByIdUseCase;
