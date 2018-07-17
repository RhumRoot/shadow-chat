const Init = require('./init.js')

class Controller {
    constructor(url) {
        const init = new Init(url)

        this.User = init.User
        this.Chat = init.Chat
    }

    getChat(cb) {
        this.Chat.findOne({}, (err, chat) => {
            (err || !chat) ? cb() : cb(chat)
        })
    }
}

module.exports = Controller
