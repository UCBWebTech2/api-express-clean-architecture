const { validationResult } = require('express-validator');
const ActorDTO = require('../presenters/ActorDTO');

function createActorController({ getAllActorsUseCase, getActorByIdUseCase, createActorUseCase, updateActorUseCase, deleteActorUseCase }) {
    return {
        // GET /api/actors?page=&limit=
        async getAllActors(req, res) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            try {
                const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
                const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
                const { data: actors, meta } = await getAllActorsUseCase.execute({ page, limit });
                res.json({ data: actors.map(actor => new ActorDTO(actor)), meta });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },

        // GET /api/actors/:id
        async getActorById(req, res) {
            try {
                const actor = await getActorByIdUseCase.execute(req.params.id);
                if (!actor)
                    return res.status(404).json({ error: 'Actor no encontrado' });
                res.json(new ActorDTO(actor));
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },

        // POST /api/actors
        async createActor(req, res) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            try {
                const actor = await createActorUseCase.execute(req.body);
                res.status(201).json(new ActorDTO(actor));
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },

        // PUT /api/actors/:id
        async updateActor(req, res) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            try {
                const actor = await updateActorUseCase.execute(req.params.id, req.body);
                if (!actor)
                    return res.status(404).json({ error: 'Actor no encontrado' });
                res.json(new ActorDTO(actor));
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },

        // DELETE /api/actors/:id
        async deleteActor(req, res) {
            try {
                const deleted = await deleteActorUseCase.execute(req.params.id);
                if (!deleted)
                    return res.status(404).json({ error: 'Actor no encontrado' });
                res.status(204).send();
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },
    };
}

module.exports = createActorController;
