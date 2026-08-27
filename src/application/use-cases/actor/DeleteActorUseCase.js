class DeleteActorUseCase {
    constructor(actorRepository) {
        this.actorRepository = actorRepository;
    }

    async execute(id) {
        try {
            return await this.actorRepository.delete(id);
        } catch (error) {
            throw new Error('Error al eliminar el actor');
        }
    }
}

module.exports = DeleteActorUseCase;
