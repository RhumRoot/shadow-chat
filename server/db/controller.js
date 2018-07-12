const Init = require('./init.js')

class Controller {
    constructor(url) {
        const init = new Init(url)

        this.User = init.User
    }
}

module.exports = Controller
