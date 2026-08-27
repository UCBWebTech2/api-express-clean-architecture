class GetActorByIdUseCase {
    constructor(actorRepository) {
        this.actorRepository = actorRepository;
    }

    async execute(id) {
        try {
            return await this.actorRepository.findById(id);
        } catch (error) {
            throw new Error('Error al obtener el actor');
        }
    }
}

module.exports = GetActorByIdUseCase;
