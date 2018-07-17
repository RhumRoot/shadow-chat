const Handler = require('./handler')

class Bot {
    constructor(bundle) {
        this.bundle = bundle
        this.handler = new Handler(bundle)

        this.bundle.chat = bundle.db.getChat()

        this.handleUpdates()
    }

    handleUpdates() {
        let { handler } = this
        let { tg, event, db, config } = this.bundle

        tg.command('start', ctx => {
            let tgUser = ctx.message.from

            db.getUser(tgUser.id, user => {
                !user && db.createUser(tgUser, user => {
                    handler.start(user)
                })
            })
        })

        tg.command('getadminrights', ctx => {
            let tgUser = ctx.message.from
            let pass = ctx.message.text.split(' ')[1]

            event.removeAllListeners(tgUser.id)

            db.getUser(tgUser.id, user => {
                user && handler.getAdmin(user, pass)
            })
        })

        tg.on('message', ctx => {
            let tgUser = ctx.message.from

            event.emit(tgUser.id, ctx.message)
        })

        tg.on('callback_query', (ctx) => {
            console.log('callback_query data - ', JSON.stringify(ctx.callbackQuery.data))
            
            ctx.answerCbQuery()

            //emitter.emit(`getApprove:${ctx.callbackQuery.data.split("${}")[0]}${ctx.from.id}`, ctx.callbackQuery.data.split("${}")[1])
        })

        event.on('getApprove', user => {
            db.getUsers({isAdmin: true}, admins => {
                admins.forEach(admin => {
                    handler.getApprove(admin, user)
                })
            })
        })

        event.on('initMessaging', user => {
            handler.initMessaging(user)
        })
    }
}

module.exports = Bot;