const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

class GetAllActorsUseCase {
    constructor(actorRepository) {
        this.actorRepository = actorRepository;
    }

    async execute({ page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) {
        try {
            const { rows, total } = await this.actorRepository.findAll({ page, limit });
            return {
                data: rows,
                meta: { page, limit, total, pages: Math.ceil(total / limit) },
            };
        } catch (error) {
            throw new Error('Error al obtener los actores');
        }
    }
}

module.exports = GetAllActorsUseCase;
