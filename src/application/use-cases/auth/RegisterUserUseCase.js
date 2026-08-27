class RegisterUserUseCase {
    constructor(userRepository, passwordHasher) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
    }

    async execute(username, password) {
        try {
            const hashedPassword = await this.passwordHasher.hash(password);
            return await this.userRepository.create({ username, password: hashedPassword });
        } catch (error) {
            throw new Error('Error al registrar el usuario');
        }
    }
}

module.exports = RegisterUserUseCase;
