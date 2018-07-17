const config = require('../config.json')
const Controller = require('./controller')

class Client {
    constructor() {
        let db = new Controller(config.MONGO_URL)

        this.User = db.User
        this.Chat = db.Chat
    }

    getUser(query, cb) {
        
    }

    createUser(tgUser, cb) {
        
    }

    getChat(cb) {
        db.getChat(chat => {
            chat ? (
                cb(chat)
            ) : (
                cb(new this.Chat())
            )
        })
    }
}

module.exports = Client;

