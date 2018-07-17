const Handler = require('./handler')

class Bot {
    constructor(bundle) {
        this.bundle = bundle
        this.handler = new Handler(bundle)

        this.handleUpdates()
    }

    handleUpdates() {
        let { handler } = this
        let { tg, event, db } = this.bundle

        tg.command('start', ctx => {
            let tgUser = ctx.message.from

            db.getUser(tgUser.id, user => {
                !user && db.createUser(tgUser, user => {  
                    handler.start(user)
                })
            })
        })

        tg.on('message', ctx => {
            let { event, db } = this.bundle;
            let user = ctx.message.from;
            user.source = 'tg';
            user.userid = user.id;

            db.trackUser(user, () => {
                event.emit(user.userid, ctx.message);
            });
        })
    }
}

module.exports = Bot;