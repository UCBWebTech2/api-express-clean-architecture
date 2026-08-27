// Adapta HTTP (req/res) hacia los casos de uso. No conoce PostgreSQL.
const { validationResult } = require('express-validator');
const FilmDTO = require('../presenters/FilmDTO');

function createFilmController({ getAllFilmsUseCase, getFilmByIdUseCase, createFilmUseCase, updateFilmUseCase, deleteFilmUseCase }) {
    return {
        // GET /api/films?page=&limit=
        async getAllFilms(req, res) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            try {
                const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
                const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
                const { data: films, meta } = await getAllFilmsUseCase.execute({ page, limit });
                res.json({ data: films.map(film => new FilmDTO(film)), meta });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },

        // GET /api/films/:id
        async getFilmById(req, res) {
            try {
                const film = await getFilmByIdUseCase.execute(req.params.id);
                if (!film)
                    return res.status(404).json({ error: 'Pelicula no encontrada' });
                res.json(new FilmDTO(film));
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },

        // POST /api/films
        async createFilm(req, res) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            try {
                const film = await createFilmUseCase.execute(req.body);
                res.status(201).json(new FilmDTO(film));
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },

        // PUT /api/films/:id
        async updateFilm(req, res) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            try {
                const film = await updateFilmUseCase.execute(req.params.id, req.body);
                if (!film)
                    return res.status(404).json({ error: 'Pelicula no encontrada' });
                res.json(new FilmDTO(film));
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },

        // DELETE /api/films/:id
        async deleteFilm(req, res) {
            try {
                const deleted = await deleteFilmUseCase.execute(req.params.id);
                if (!deleted)
                    return res.status(404).json({ error: 'Pelicula no encontrada' });
                res.status(204).send();
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },
    };
}

module.exports = createFilmController;
