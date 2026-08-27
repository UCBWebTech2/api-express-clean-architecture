// Tests de casos de uso puros para Film: repositorio fake en memoria, cero mocks de librerías.
const CreateFilmUseCase = require('../application/use-cases/film/CreateFilmUseCase');
const UpdateFilmUseCase = require('../application/use-cases/film/UpdateFilmUseCase');
const GetFilmByIdUseCase = require('../application/use-cases/film/GetFilmByIdUseCase');
const GetAllFilmsUseCase = require('../application/use-cases/film/GetAllFilmsUseCase');

class FakeFilmRepository {
    constructor(seedFilms = []) {
        this.films = [...seedFilms];
        this.nextId = this.films.length + 1;
    }

    async findAll({ page, limit }) {
        const start = (page - 1) * limit;
        return { rows: this.films.slice(start, start + limit), total: this.films.length };
    }

    async findById(id) {
        return this.films.find(f => String(f.film_id) === String(id)) || null;
    }

    async create(film) {
        const stored = { ...film, film_id: this.nextId++ };
        this.films.push(stored);
        return stored;
    }

    async update(id, film) {
        const idx = this.films.findIndex(f => String(f.film_id) === String(id));
        if (idx === -1) return null;
        this.films[idx] = { ...film, film_id: id };
        return this.films[idx];
    }
}

describe('GetAllFilmsUseCase', () => {
    const seed = Array.from({ length: 25 }, (_, i) => ({ film_id: i + 1, title: `Film ${i + 1}`, language_id: 1 }));

    it('usa page=1 y limit=10 por defecto', async () => {
        const useCase = new GetAllFilmsUseCase(new FakeFilmRepository(seed));

        const result = await useCase.execute();

        expect(result.data).toHaveLength(10);
        expect(result.data[0].film_id).toBe(1);
        expect(result.meta).toEqual({ page: 1, limit: 10, total: 25, pages: 3 });
    });

    it('respeta page y limit explícitos y calcula "pages" correctamente', async () => {
        const useCase = new GetAllFilmsUseCase(new FakeFilmRepository(seed));

        const result = await useCase.execute({ page: 3, limit: 10 });

        expect(result.data).toHaveLength(5); // últimos 5 de 25
        expect(result.data[0].film_id).toBe(21);
        expect(result.meta).toEqual({ page: 3, limit: 10, total: 25, pages: 3 });
    });
});

describe('CreateFilmUseCase', () => {
    it('crea la película delegando en el repositorio', async () => {
        const repository = new FakeFilmRepository();
        const useCase = new CreateFilmUseCase(repository);

        const film = await useCase.execute({ title: 'Mi Película', language_id: 1 });

        expect(film.film_id).toBe(1);
        expect(film.title).toBe('Mi Película');
    });

    it('rechaza antes de tocar el repositorio si falta el título (regla de negocio en la entidad)', async () => {
        const repository = new FakeFilmRepository();
        repository.create = jest.fn();
        const useCase = new CreateFilmUseCase(repository);

        await expect(useCase.execute({ language_id: 1 })).rejects.toThrow('Film requiere un título');
        expect(repository.create).not.toHaveBeenCalled();
    });
});

describe('UpdateFilmUseCase / GetFilmByIdUseCase', () => {
    it('actualiza una película existente y se puede volver a leer', async () => {
        const repository = new FakeFilmRepository([{ film_id: 5, title: 'Original', language_id: 1 }]);
        const updateUseCase = new UpdateFilmUseCase(repository);
        const getUseCase = new GetFilmByIdUseCase(repository);

        await updateUseCase.execute(5, { title: 'Actualizada', language_id: 1 });
        const film = await getUseCase.execute(5);

        expect(film.title).toBe('Actualizada');
    });

    it('devuelve null si la película no existe', async () => {
        const repository = new FakeFilmRepository();
        const useCase = new UpdateFilmUseCase(repository);

        const result = await useCase.execute(999, { title: 'X', language_id: 1 });

        expect(result).toBeNull();
    });
});
