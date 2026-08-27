class LoginUserUseCase {
    constructor(userRepository, passwordHasher, tokenService, tokenExpiration) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
        this.tokenService = tokenService;
        this.tokenExpiration = tokenExpiration; // p. ej. "1h" — inyectado desde config, no leído de process.env acá
    }

    async execute(username, password) {
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        const isMatch = await this.passwordHasher.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Contraseña incorrecta');
        }

        const token = this.tokenService.sign(
            { id: user.staff_id, username: user.username },
            { expiresIn: this.tokenExpiration }
        );
        return { token };
    }
}

module.exports = LoginUserUseCase;
