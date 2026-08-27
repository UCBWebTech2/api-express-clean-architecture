// Tests de casos de uso puros: sin Express, sin PostgreSQL, sin jest.mock de librerías.
// Se le pasan implementaciones fake de los puertos (repositorio, hasher, tokenService)
// escritas a mano — esta es la ganancia concreta de aislar la lógica de negocio
// detrás de interfaces (Dependency Inversion).
const RegisterUserUseCase = require('../application/use-cases/auth/RegisterUserUseCase');
const LoginUserUseCase = require('../application/use-cases/auth/LoginUserUseCase');

class FakeUserRepository {
    constructor(seedUsers = []) {
        this.users = [...seedUsers];
        this.nextId = this.users.length + 1;
    }

    async findByUsername(username) {
        return this.users.find(u => u.username === username) || null;
    }

    async create({ username, password }) {
        const user = { staff_id: this.nextId++, username, password };
        this.users.push(user);
        return user;
    }
}

class FakePasswordHasher {
    async hash(plainPassword) {
        return `hashed:${plainPassword}`;
    }

    async compare(plainPassword, hashedPassword) {
        return `hashed:${plainPassword}` === hashedPassword;
    }
}

class FakeTokenService {
    sign(payload, options) {
        this.lastSignedPayload = payload;
        this.lastOptions = options;
        return 'fake-signed-token';
    }
}

describe('RegisterUserUseCase', () => {
    it('hashea la contraseña y guarda al usuario a través del repositorio', async () => {
        const userRepository = new FakeUserRepository();
        const passwordHasher = new FakePasswordHasher();
        const useCase = new RegisterUserUseCase(userRepository, passwordHasher);

        const created = await useCase.execute('nuevo_usuario', 'Password.123');

        expect(created.username).toBe('nuevo_usuario');
        expect(created.password).toBe('hashed:Password.123');
        expect(await userRepository.findByUsername('nuevo_usuario')).toBeTruthy();
    });

    it('convierte cualquier fallo del repositorio en un error genérico', async () => {
        const userRepository = new FakeUserRepository();
        userRepository.create = async () => { throw new Error('constraint violation'); };
        const useCase = new RegisterUserUseCase(userRepository, new FakePasswordHasher());

        await expect(useCase.execute('user', 'pass')).rejects.toThrow('Error al registrar el usuario');
    });
});

describe('LoginUserUseCase', () => {
    it('devuelve un token firmado cuando las credenciales son correctas', async () => {
        const userRepository = new FakeUserRepository([
            { staff_id: 7, username: 'mike', password: 'hashed:Admin.123' },
        ]);
        const tokenService = new FakeTokenService();
        const useCase = new LoginUserUseCase(userRepository, new FakePasswordHasher(), tokenService, '2h');

        const result = await useCase.execute('mike', 'Admin.123');

        expect(result).toEqual({ token: 'fake-signed-token' });
        expect(tokenService.lastSignedPayload).toEqual({ id: 7, username: 'mike' });
        expect(tokenService.lastOptions).toEqual({ expiresIn: '2h' }); // la expiración viene inyectada, no de process.env
    });

    it('rechaza con "Usuario no encontrado" si el username no existe', async () => {
        const useCase = new LoginUserUseCase(new FakeUserRepository(), new FakePasswordHasher(), new FakeTokenService(), '1h');
        await expect(useCase.execute('nadie', 'pass')).rejects.toThrow('Usuario no encontrado');
    });

    it('rechaza con "Contraseña incorrecta" si el hash no coincide', async () => {
        const userRepository = new FakeUserRepository([
            { staff_id: 1, username: 'mike', password: 'hashed:otra-cosa' },
        ]);
        const useCase = new LoginUserUseCase(userRepository, new FakePasswordHasher(), new FakeTokenService(), '1h');
        await expect(useCase.execute('mike', 'Admin.123')).rejects.toThrow('Contraseña incorrecta');
    });
});
