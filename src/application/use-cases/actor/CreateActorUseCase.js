const Actor = require('../../../domain/entities/Actor');

class CreateActorUseCase {
    constructor(actorRepository) {
        this.actorRepository = actorRepository;
    }

    async execute(actorData) {
        const actor = new Actor(actorData); // valida invariantes de negocio
        try {
            return await this.actorRepository.create(actor);
        } catch (error) {
            throw new Error('Error al crear el actor');
        }
    }
}

module.exports = CreateActorUseCase;
