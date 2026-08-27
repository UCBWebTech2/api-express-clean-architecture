const request = require('supertest');
const PostgresActorRepository = require('../infrastructure/repositories/PostgresActorRepository');
const ActorDTO = require('../interface-adapters/presenters/ActorDTO');

jest.mock('../infrastructure/database/postgresPool', () => ({}));
jest.mock('../infrastructure/repositories/PostgresActorRepository');
jest.mock('../interface-adapters/presenters/ActorDTO');
jest.mock('../interface-adapters/middlewares/authenticateToken', () => () => (req, res, next) => next()); // simula usuario autenticado

const app = require('../server'); // Asegúrate de que server.js exporte la app

const actorRepository = PostgresActorRepository.mock.instances[0];

describe('Actor Routes', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/actors', () => {
        it('debería listar actores paginados (defaults page=1, limit=10) con DTO aplicado', async () => {
            const mockActors = [
                { id: 1, firstName: 'John', lastName: 'Doe' },
                { id: 2, firstName: 'Jane', lastName: 'Smith' },
            ];
            actorRepository.findAll.mockResolvedValue({ rows: mockActors, total: 2 });
            ActorDTO.mockImplementation((actor) => actor);

            const response = await request(app).get('/api/actors').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(200);
            expect(actorRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
            expect(response.body).toEqual({
                data: mockActors,
                meta: { page: 1, limit: 10, total: 2, pages: 1 },
            });
        });

        it('debería propagar page y limit de la query al repositorio', async () => {
            actorRepository.findAll.mockResolvedValue({ rows: [], total: 0 });
            ActorDTO.mockImplementation((actor) => actor);

            const response = await request(app)
                .get('/api/actors?page=3&limit=20')
                .set('Authorization', 'Bearer mockToken');

            expect(response.status).toBe(200);
            expect(actorRepository.findAll).toHaveBeenCalledWith({ page: 3, limit: 20 });
            expect(response.body).toEqual({ data: [], meta: { page: 3, limit: 20, total: 0, pages: 0 } });
        });

        it('debería devolver 400 si page o limit son inválidos', async () => {
            const response = await request(app)
                .get('/api/actors?page=-1')
                .set('Authorization', 'Bearer mockToken');

            expect(response.status).toBe(400);
            expect(actorRepository.findAll).not.toHaveBeenCalled();
        });

        it('debería manejar errores en el servidor', async () => {
            actorRepository.findAll.mockRejectedValue(new Error('Database error'));
            const response = await request(app).get('/api/actors').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Error al obtener los actores' });
        });
    });

    describe('GET /api/actors/:id', () => {
        it('debería devolver un actor específico con DTO aplicado', async () => {
            const mockActor = { id: 1, firstName: 'John', lastName: 'Doe' };
            const mockActorDTO = { id: 1, firstName: 'John', lastName: 'Doe' };
            actorRepository.findById.mockResolvedValue(mockActor);
            ActorDTO.mockImplementation((actor) => actor);
            const response = await request(app).get('/api/actors/1').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(200);
            expect(actorRepository.findById).toHaveBeenCalledWith('1');
            expect(response.body).toEqual(mockActorDTO);
        });

        it('debería devolver 404 si el actor no se encuentra', async () => {
            actorRepository.findById.mockResolvedValue(null);
            const response = await request(app).get('/api/actors/999').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Actor no encontrado' });
        });

        it('debería manejar errores en el servidor', async () => {
            actorRepository.findById.mockRejectedValue(new Error('Database error'));
            const response = await request(app).get('/api/actors/1').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Error al obtener el actor' });
        });
    });

    describe('POST /api/actors', () => {
        const validActor = { first_name: 'John', last_name: 'Doe' };

        it('debería crear un actor con DTO aplicado', async () => {
            const mockActor = { id: 1, firstName: 'John', lastName: 'Doe' };
            actorRepository.create.mockResolvedValue(mockActor);
            ActorDTO.mockImplementation((actor) => actor);

            const response = await request(app)
                .post('/api/actors')
                .set('Authorization', 'Bearer mockToken')
                .send(validActor);

            expect(response.status).toBe(201);
            expect(actorRepository.create).toHaveBeenCalled();
            expect(response.body).toEqual(mockActor);
        });

        it('debería devolver 400 si faltan campos obligatorios', async () => {
            const response = await request(app)
                .post('/api/actors')
                .set('Authorization', 'Bearer mockToken')
                .send({ first_name: 'John' });

            expect(response.status).toBe(400);
            expect(actorRepository.create).not.toHaveBeenCalled();
        });

        it('debería manejar errores en el servidor', async () => {
            actorRepository.create.mockRejectedValue(new Error('Database error'));
            const response = await request(app)
                .post('/api/actors')
                .set('Authorization', 'Bearer mockToken')
                .send(validActor);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Error al crear el actor' });
        });
    });

    describe('PUT /api/actors/:id', () => {
        const validActor = { first_name: 'John', last_name: 'Updated' };

        it('debería actualizar un actor con DTO aplicado', async () => {
            const mockActor = { id: 1, firstName: 'John', lastName: 'Updated' };
            actorRepository.update.mockResolvedValue(mockActor);
            ActorDTO.mockImplementation((actor) => actor);

            const response = await request(app)
                .put('/api/actors/1')
                .set('Authorization', 'Bearer mockToken')
                .send(validActor);

            expect(response.status).toBe(200);
            expect(actorRepository.update).toHaveBeenCalled();
            expect(response.body).toEqual(mockActor);
        });

        it('debería devolver 404 si el actor no existe', async () => {
            actorRepository.update.mockResolvedValue(null);
            const response = await request(app)
                .put('/api/actors/999')
                .set('Authorization', 'Bearer mockToken')
                .send(validActor);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Actor no encontrado' });
        });

        it('debería devolver 400 si faltan campos obligatorios', async () => {
            const response = await request(app)
                .put('/api/actors/1')
                .set('Authorization', 'Bearer mockToken')
                .send({});

            expect(response.status).toBe(400);
            expect(actorRepository.update).not.toHaveBeenCalled();
        });

        it('debería manejar errores en el servidor', async () => {
            actorRepository.update.mockRejectedValue(new Error('Database error'));
            const response = await request(app)
                .put('/api/actors/1')
                .set('Authorization', 'Bearer mockToken')
                .send(validActor);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Error al actualizar el actor' });
        });
    });

    describe('DELETE /api/actors/:id', () => {
        it('debería eliminar un actor', async () => {
            actorRepository.delete.mockResolvedValue(true);
            const response = await request(app).delete('/api/actors/1').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(204);
            expect(actorRepository.delete).toHaveBeenCalledWith('1');
        });

        it('debería devolver 404 si el actor no existe', async () => {
            actorRepository.delete.mockResolvedValue(false);
            const response = await request(app).delete('/api/actors/999').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Actor no encontrado' });
        });

        it('debería manejar errores en el servidor', async () => {
            actorRepository.delete.mockRejectedValue(new Error('Database error'));
            const response = await request(app).delete('/api/actors/1').set('Authorization', 'Bearer mockToken');
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Error al eliminar el actor' });
        });
    });
});
