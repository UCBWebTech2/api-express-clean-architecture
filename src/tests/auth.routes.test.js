const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../infrastructure/database/postgresPool');

jest.mock('../infrastructure/database/postgresPool', () => ({ query: jest.fn() }));
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const app = require('../server'); // Asegúrate de que server.js exporte la app

describe('Auth API', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('POST /api/auth/register debe registrar un usuario', async () => {
        // Simula el comportamiento de hashing de contraseña y consulta a la base de datos
        bcrypt.hash.mockResolvedValue('hashed_password');
        pool.query.mockResolvedValue({ rows: [{ staff_id: 1, username: 'testuser', password: 'hashed_password' }] });

        // Llama a la ruta de registro
        const response = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser', password: 'password123' });

        // Verifica que todo ocurra según lo esperado
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Usuario registrado correctamente' });
        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
        expect(pool.query).toHaveBeenCalledWith(
            'INSERT INTO staff(first_name,last_name,address_id,store_id,username, password) VALUES (\' \',\' \',3,1,$1,$2) RETURNING staff_id, username, password',
            ['testuser', 'hashed_password']
        );
    });

    test('POST /api/auth/register debe devolver 400 si faltan campos', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser' }); // sin password

        expect(response.status).toBe(400);
        expect(pool.query).not.toHaveBeenCalled();
    });

    test('POST /api/auth/login debe devolver un token si las credenciales son correctas', async () => {
        const mockUser = { staff_id: 1, username: 'testuser', password: 'hashed_password' };

        // Simula la respuesta de la base de datos y las funciones de bcrypt y jwt
        pool.query.mockResolvedValue({ rows: [mockUser] });
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('fake_token');

        // Llama a la ruta de inicio de sesión
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'testuser', password: 'password123' });

        // Verifica que todo ocurra según lo esperado
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ token: 'fake_token' });
        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM staff WHERE username = $1', ['testuser']);
        expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
        expect(jwt.sign).toHaveBeenCalledWith(
            { id: mockUser.staff_id, username: mockUser.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_TIME_EXPIRE || '1h' }
        );
    });

    test('POST /api/auth/login debe fallar con credenciales incorrectas', async () => {
        // Simula que no se encontró un usuario
        pool.query.mockResolvedValue({ rows: [] });

        // Llama a la ruta de inicio de sesión
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'invaliduser', password: 'password123' });

        // Verifica que todo ocurra según lo esperado
        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Usuario no encontrado' });
    });

    test('POST /api/auth/login debe fallar con contraseña incorrecta', async () => {
        const mockUser = { staff_id: 1, username: 'testuser', password: 'hashed_password' };

        // Simula la respuesta de la base de datos y un intento de comparación fallido
        pool.query.mockResolvedValue({ rows: [mockUser] });
        bcrypt.compare.mockResolvedValue(false);

        // Llama a la ruta de inicio de sesión
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'testuser', password: 'wrongpassword' });

        // Verifica que todo ocurra según lo esperado
        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Contraseña incorrecta' });
    });
});
