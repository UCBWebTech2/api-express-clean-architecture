const Actor = require('../../../domain/entities/Actor');

class UpdateActorUseCase {
    constructor(actorRepository) {
        this.actorRepository = actorRepository;
    }

    async execute(id, actorData) {
        const actor = new Actor({ ...actorData, actor_id: id }); // valida invariantes de negocio
        try {
            return await this.actorRepository.update(id, actor);
        } catch (error) {
            throw new Error('Error al actualizar el actor');
        }
    }
}

module.exports = UpdateActorUseCase;
