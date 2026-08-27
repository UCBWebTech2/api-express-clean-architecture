// enmascarar campos
class ActorDTO {
    constructor({ actor_id, first_name, last_name }) {
        this.id = actor_id;
        this.firstName = first_name;
        this.lastName = last_name;
    }
}

module.exports = ActorDTO;
