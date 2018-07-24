const Handler = require('./handler')

class Bot {
    constructor(bundle) {
        this.bundle = bundle
        this.handler = new Handler(bundle)

        bundle.db.getChat(chat => {
            this.bundle.chat = chat

            this.handleUpdates()
        })
    }

    handleUpdates() {
        let { handler } = this
        let { tg, event, db, moment, config, chat } = this.bundle

        //console.log('The chat is - ' + JSON.stringify(chat))

        tg.command('start', ctx => {
            let tgUser = ctx.message.from

            event.removeAllListeners(tgUser.id)

            console.log('start command for user: ', JSON.stringify(tgUser))

            db.getUser(tgUser.id, user => {
                !user ? db.createUser(tgUser, user => {
                    handler.start(user)
                }) : !user.chatUsername && handler.start(user)
            })
        })

        tg.command('getadminrights', ctx => {
            let tgUser = ctx.message.from
            let pass = ctx.message.text.split(' ')[1]

            console.log('getadminrights command for user: ', JSON.stringify(tgUser))
            console.log('entered pass is - ' + pass)
            console.log('pass is - ' + config.ADMIN_PASS)

            //event.removeAllListeners(tgUser.id)

            db.getUser(tgUser.id, user => {
                user && handler.getAdmin(user, pass)
            })
        })
        
        tg.command('refuseadminrights', ctx => {
            let tgUser = ctx.message.from

            console.log('refuseadminrights command for user: ', JSON.stringify(tgUser))

            db.getUser(tgUser.id, user => {
                user && handler.refuseAdmin(user)
            })
        })

        tg.command('delete', ctx => {
            let tgUser = ctx.message.from
            let chatUsername = ctx.message.text.split(' ')[1]

            console.log(`[INFO] delete command from ${tgUser.id} for ${chatUsername}`)

            db.getUser(tgUser.id, user => {
                user && handler.delete(user, chatUsername)
            })
        })

        tg.command('add', ctx => {
            let tgUser = ctx.message.from
            let chatUsername = ctx.message.text.split(' ')[1]

            console.log(`[INFO] add command from ${tgUser.id} for ${chatUsername}`)

            db.getUser(tgUser.id, user => {
                user && handler.add(user, chatUsername)
            })
        })

        tg.on('message', ctx => {
            let tgUser = ctx.message.from

            console.log('message from user: ', JSON.stringify(ctx.message))

            !event.emit(tgUser.id, ctx.message) && event.emit('messaging', tgUser, ctx.message)
        })

        tg.on('callback_query', (ctx) => {
            let callback_query = JSON.parse(ctx.callbackQuery.data)
            console.log('callback_query data - ', JSON.stringify(callback_query))

            ctx.answerCbQuery()

            event.emit(`getApprove:${callback_query.id}`, callback_query)
            event.emit(`initMessaging:${callback_query.id}`, callback_query)
        })

        event.on('getApprove', user => {
            console.log('getApprove for user', JSON.stringify(user))

            db.getUsers({ status: 'admin' }, admins => {
                admins && admins.forEach(admin => {
                    handler.getApprove(admin, user)
                })
            })
        })

        event.on('initMessaging', user => {
            console.log('initMessaging for user', JSON.stringify(user))
            handler.initMessaging(user)
        })

        event.on('messaging', (user, message) => {
            console.log('messaging for user', JSON.stringify(user))
            console.log('message', JSON.stringify(message))

            db.getUser(user.id, user => {
                if (user && (user.status == 'approved' || user.status == 'admin')) {
                    let msg = {
                        chatUsername: user.status == 'admin' ? '👑 _' + user.chatUsername + '_' : user.chatUsername,
                        /* message: {
                            type: message.text ? 'text' : message.photo ? 'photo' : message.document ? 'document' : 'undefined',
                            data: message.text ? message.text : message.photo ? message.photo[0].file_id : message.document ? message.document : 'undefined',
                        }, */
                        message,
                        ts: Date.now(),
                        label_ts:moment().format('h:mm - DD/MM/YY')
                    }

                    chat.history.push(msg)
                    chat.save(() => { })
                    
                    console.log(JSON.stringify(chat))

                    db.getUsers({ $or: [{ status: 'approved' }, { status: 'admin' }] }, users => {
                        users && users.forEach(receiver => {
                            receiver.id != user.id && handler.sendMessage(receiver.id, msg)
                        })
                    })
                }
            })
        })
    }
}

module.exports = Bot;