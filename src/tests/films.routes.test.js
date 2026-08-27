const request = require('supertest');
const PostgresFilmRepository = require('../infrastructure/repositories/PostgresFilmRepository');
const FilmDTO = require('../interface-adapters/presenters/FilmDTO');

jest.mock('../infrastructure/database/postgresPool', () => ({}));
jest.mock('../infrastructure/repositories/PostgresFilmRepository');
jest.mock('../interface-adapters/presenters/FilmDTO');
jest.mock('../interface-adapters/middlewares/authenticateToken', () => () => (req, res, next) => next()); // simula usuario autenticado

const app = require('../server'); // Asegúrate de que server.js exporte la app

// El container instancia "new PostgresFilmRepository(pool)" una sola vez al cargar el módulo;
// como la clase está automockeada, esa es la instancia que ve el controller.
const filmRepository = PostgresFilmRepository.mock.instances[0];

describe('Film Routes', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/films', () => {
        it('debería listar películas paginadas (defaults page=1, limit=10) con DTO aplicado', async () => {
            const mockFilms = [
                { id: 1, title: 'Film 1', description: 'Descripción 1' },
                { id: 2, title: 'Film 2', description: 'Descripción 2' },
            ];
            filmRepository.findAll.mockResolvedValue({ rows: mockFilms, total: 25 });
            FilmDTO.mockImplementation((film) => film);

            const response = await request(app).get('/api/films').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(200);
            expect(filmRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
            expect(response.body).toEqual({
                data: mockFilms,
                meta: { page: 1, limit: 10, total: 25, pages: 3 },
            });
        });

        it('debería propagar page y limit de la query al repositorio', async () => {
            filmRepository.findAll.mockResolvedValue({ rows: [], total: 0 });
            FilmDTO.mockImplementation((film) => film);

            const response = await request(app)
                .get('/api/films?page=2&limit=5')
                .set('Authorization', 'Bearer mockToken');

            expect(response.status).toBe(200);
            expect(filmRepository.findAll).toHaveBeenCalledWith({ page: 2, limit: 5 });
            expect(response.body).toEqual({ data: [], meta: { page: 2, limit: 5, total: 0, pages: 0 } });
        });

        it('debería devolver 400 si page o limit son inválidos', async () => {
            const response = await request(app)
                .get('/api/films?page=0&limit=1000')
                .set('Authorization', 'Bearer mockToken');

            expect(response.status).toBe(400);
            expect(filmRepository.findAll).not.toHaveBeenCalled();
        });

        it('debería manejar errores en el servidor', async () => {
            // El repositorio propaga el error tal cual; es el caso de uso (GetAllFilmsUseCase)
            // el que lo traduce a un mensaje de negocio — por eso no se espera "Database error".
            filmRepository.findAll.mockRejectedValue(new Error('Database error'));
            const response = await request(app).get('/api/films').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Error al obtener las películas' });
        });
    });

    describe('GET /api/films/:id', () => {
        it('debería devolver una película específica con DTO aplicado', async () => {
            const mockFilm = { id: 1, title: 'Film 1', description: 'Descripción 1' };
            const mockFilmDTO = { id: 1, title: 'Film 1', description: 'Descripción 1' };
            filmRepository.findById.mockResolvedValue(mockFilm);
            FilmDTO.mockImplementation((film) => film);
            const response = await request(app).get('/api/films/1').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(200);
            expect(filmRepository.findById).toHaveBeenCalledWith('1');
            expect(response.body).toEqual(mockFilmDTO);
        });

        it('debería devolver 404 si la película no se encuentra', async () => {
            filmRepository.findById.mockResolvedValue(null);
            const response = await request(app).get('/api/films/999').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Pelicula no encontrada' });
        });

        it('debería manejar errores en el servidor', async () => {
            filmRepository.findById.mockRejectedValue(new Error('Database error'));
            const response = await request(app).get('/api/films/1').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Error al obtener la película' });
        });
    });

    describe('POST /api/films', () => {
        const validFilm = { title: 'Nueva Película', language_id: 1 };

        it('debería crear una película con DTO aplicado', async () => {
            const mockFilm = { id: 1, title: 'Nueva Película', description: null, releaseYear: null };
            filmRepository.create.mockResolvedValue(mockFilm);
            FilmDTO.mockImplementation((film) => film);

            const response = await request(app)
                .post('/api/films')
                .set('Authorization', 'Bearer mockToken')
                .send(validFilm);

            expect(response.status).toBe(201);
            expect(filmRepository.create).toHaveBeenCalled();
            expect(response.body).toEqual(mockFilm);
        });

        it('debería devolver 400 si faltan campos obligatorios', async () => {
            const response = await request(app)
                .post('/api/films')
                .set('Authorization', 'Bearer mockToken')
                .send({ description: 'Sin título ni idioma' });

            expect(response.status).toBe(400);
            expect(filmRepository.create).not.toHaveBeenCalled();
        });

        it('debería manejar errores en el servidor', async () => {
            filmRepository.create.mockRejectedValue(new Error('Database error'));
            const response = await request(app)
                .post('/api/films')
                .set('Authorization', 'Bearer mockToken')
                .send(validFilm);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Error al crear la película' });
        });
    });

    describe('PUT /api/films/:id', () => {
        const validFilm = { title: 'Película Actualizada', language_id: 1 };

        it('debería actualizar una película con DTO aplicado', async () => {
            const mockFilm = { id: 1, title: 'Película Actualizada', description: null, releaseYear: null };
            filmRepository.update.mockResolvedValue(mockFilm);
            FilmDTO.mockImplementation((film) => film);

            const response = await request(app)
                .put('/api/films/1')
                .set('Authorization', 'Bearer mockToken')
                .send(validFilm);

            expect(response.status).toBe(200);
            expect(filmRepository.update).toHaveBeenCalled();
            expect(response.body).toEqual(mockFilm);
        });

        it('debería devolver 404 si la película no existe', async () => {
            filmRepository.update.mockResolvedValue(null);
            const response = await request(app)
                .put('/api/films/999')
                .set('Authorization', 'Bearer mockToken')
                .send(validFilm);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Pelicula no encontrada' });
        });

        it('debería devolver 400 si faltan campos obligatorios', async () => {
            const response = await request(app)
                .put('/api/films/1')
                .set('Authorization', 'Bearer mockToken')
                .send({ description: 'Sin título ni idioma' });

            expect(response.status).toBe(400);
            expect(filmRepository.update).not.toHaveBeenCalled();
        });

        it('debería manejar errores en el servidor', async () => {
            filmRepository.update.mockRejectedValue(new Error('Database error'));
            const response = await request(app)
                .put('/api/films/1')
                .set('Authorization', 'Bearer mockToken')
                .send(validFilm);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Error al actualizar la película' });
        });
    });

    describe('DELETE /api/films/:id', () => {
        it('debería eliminar una película', async () => {
            filmRepository.delete.mockResolvedValue(true);
            const response = await request(app).delete('/api/films/1').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(204);
            expect(filmRepository.delete).toHaveBeenCalledWith('1');
        });

        it('debería devolver 404 si la película no existe', async () => {
            filmRepository.delete.mockResolvedValue(false);
            const response = await request(app).delete('/api/films/999').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Pelicula no encontrada' });
        });

        it('debería manejar errores en el servidor', async () => {
            filmRepository.delete.mockRejectedValue(new Error('Database error'));
            const response = await request(app).delete('/api/films/1').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Error al eliminar la película' });
        });
    });
});
