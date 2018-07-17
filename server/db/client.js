const config = require('../config.json')
const Controller = require('./controller')

class Client {
    constructor() {
        this.db = new Controller(config.MONGO_URL)

        this.User = this.db.User
        this.Chat = this.db.Chat
    }

    getUser(id, cb) {
        this.User.findOne({ id }, (err, user) => {
            cb(err ? undefined : (!user && Object.keys(user).length == 0 ? undefined : user))
        })
    }

    getUsers(query, cb) {
        this.User.find(query, (err, users) => {
            cb(err ? undefined : (users.length ? users : undefined))
        })
    }

    createUser(tgUser, cb) {
        let user = new this.User()

        user.id = tgUser.id
        user.status = 'pending'
        user.username = tgUser.username
        user.first_name = tgUser.first_name
        user.last_name = tgUser.last_name
        user.created = Date.now()
        user.lastSeen = Date.now()

        user.save((err, user) => {
            cb(err ? undefined : user)
        })
    }

    getChat(cb) {
        this.db.getChat(chat => {
            chat ? (
                cb(chat)
            ) : (
                    cb(new this.Chat())
                )
        })
    }
}

module.exports = Client;

