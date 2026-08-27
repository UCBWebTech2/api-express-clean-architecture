class Actor {
    constructor({ actor_id, first_name, last_name }) {
        if (!first_name) {
            throw new Error('Actor requiere first_name');
        }
        if (!last_name) {
            throw new Error('Actor requiere last_name');
        }

        this.actor_id = actor_id;
        this.first_name = first_name;
        this.last_name = last_name;
    }
}

module.exports = Actor;
