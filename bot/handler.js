const flowManager = require('flow-manager')

class Handler {
    constructor(bundle) {
        this.bundle = bundle;
    }

    start(user) {
        let { tg, event, db } = this.bundle

        flowManager
            .create()
            .addStep((flow, data) => {
                tg.telegram.sendMessage(data.user.id, 'Hi, thanks for joining. Please choose your username (it will precede your messages in the group chat)')

                flow.next(data)
            })
            .addStep((flow, data) => {
                event.once(data.user.id, msg => {
                    msg.text ? (
                        msg.text.length <= 20 ? (
                            data.user.chatUsername = msg.text.replace(/👑/g, ""),
                            flow.next(data)
                        ) : (
                                tg.telegram.sendMessage(data.user.id, 'Your username must be less than 20 characters. Try again please'),
                                flow.repeat(data)
                            )
                    ) : (
                            tg.telegram.sendMessage(data.user.id, 'Please enter your username'),
                            flow.repeat(data)
                        )
                })
            })
            .addStep((flow, data) => {
                db.getUser({ chatUsername: data.user.chatUsername }, user => {
                    user ? (
                        tg.telegram.sendMessage(data.user.id, 'Sorry, that username is already taken. Try another please'),
                        flow.nextFrom(2)
                    ) : (
                            data.user.save((err, user) => {
                                err && console.error('~~~ Error while saving chatUsername:', err)
                                flow.next(data)
                            })
                        )
                })
            })
            .addStep((flow, data) => {
                tg.telegram.sendMessage(data.user.id, `Great, ${data.user.chatUsername}! I’ve informed group admins that you’d like to join, please wait for the confirmation.`)

                event.emit('getApprove', data.user)

                flow.next(data)
            })
            .addStep((flow, data) => {
                flowManager.destroy(flow)
            })
            .execute({ user: user })
    }

    getAdmin(user, pass) {
        let { tg, event, db, config } = this.bundle

        flowManager
            .create()
            .addStep((flow, data) => {
                data.user.chatUsername ? (
                    data.user.status == 'admin' ? (
                        tg.telegram.sendMessage(data.user.id, 'You are already admin!'),
                        flow.next(data)
                    ) : (
                            pass == config.ADMIN_PASS ? (
                                data.user.status = 'admin',
                                data.user.save((err, user) => {
                                    err && console.error('~~~ Error while setting admin right:', err)
                                    tg.telegram.sendMessage(data.user.id, 'Granting you superpowers… Now you are group administrator!')
                                    flow.next(data)
                                })
                            ) : (
                                    tg.telegram.sendMessage(data.user.id, 'Enter command with the right pass!'),
                                    flow.next(data)
                                )
                        )
                ) : (
                        tg.telegram.sendMessage(data.user.id, 'Please, complete /start procedure'),
                        flow.next(data)
                    )
            })
            .addStep((flow, data) => {
                flowManager.destroy(flow)
            })
            .execute({ user: user })
    }

    refuseAdmin(user) {
        let { tg, event, db, config } = this.bundle

        flowManager
            .create()
            .addStep((flow, data) => {
                if (data.user.status == 'admin') {
                    data.user.status = 'approved'
                    data.user.save(() => { })

                    tg.telegram.sendMessage(data.user.id, 'You are free now!')
                    flow.next(data)
                } else {
                    tg.telegram.sendMessage(data.user.id, 'You weren`t an admin')
                    flow.next(data)
                }
            })
            .addStep((flow, data) => {
                flowManager.destroy(flow)
            })
            .execute({ user: user })
    }

    getApprove(user, userToApprove) {
        let { tg, event, db } = this.bundle

        flowManager
            .create()
            .addStep((flow, data) => {
                let options = {
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                    reply_markup: {
                        inline_keyboard: []
                    }
                }

                options.reply_markup.inline_keyboard.push([{ text: 'Yes', callback_data: JSON.stringify({ isApproved: true, id: userToApprove.id, approver: data.user.id }) }])
                options.reply_markup.inline_keyboard.push([{ text: 'No', callback_data: JSON.stringify({ isApproved: false, id: userToApprove.id }) }])
                console.log('getApprove options -', JSON.stringify(options))
                tg.telegram.sendMessage(data.user.id, `New join request from #${userToApprove.id} ${userToApprove.username ? '(@' + userToApprove.username + ')' : ''} with username ${userToApprove.chatUsername}. Accept?`, options)

                flow.next(data)
            })
            .addStep((flow, data) => {
                event.once(`getApprove:${userToApprove.id}`, query => {
                    event.removeAllListeners(`getApprove:${userToApprove.id}`)
                    console.log('getApprove')
                    if (query.approver == data.user.id) {
                        query.isApproved ? (
                            tg.telegram.sendMessage(data.user.id, `User ${userToApprove.chatUsername} joined the group chat.`),
                            flow.next(data)
                        ) : (
                                tg.telegram.sendMessage(data.user.id, `You refused to ${userToApprove.chatUsername} joining group chat.`),
                                flow.nextFrom(4, data)
                            )
                    } else {
                        flow.nextFrom(4, data)
                    }
                })
            })
            .addStep((flow, data) => {
                event.emit('initMessaging', userToApprove)
            })
            .addStep((flow, data) => {
                flowManager.destroy(flow)
            })
            .execute({ user: user })
    }

    initMessaging(user) {
        let { tg, event, db, chat } = this.bundle

        flowManager
            .create()
            .addStep((flow, data) => {
                let options = {
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                    reply_markup: {
                        inline_keyboard: []
                    }
                }

                options.reply_markup.inline_keyboard.push([{ text: 'Yes', callback_data: JSON.stringify({ isAgreed: true, id: data.user.id }) }])
                options.reply_markup.inline_keyboard.push([{ text: 'No', callback_data: JSON.stringify({ isAgreed: false, id: data.user.id }) }])

                tg.telegram.sendMessage(data.user.id, `Good news, ${data.user.chatUsername}! You were authorized to join the group. Please note the rules before we proceed: “...........”`, options)

                flow.next(data)
            })
            .addStep((flow, data) => {
                event.once(`initMessaging:${data.user.id}`, query => {
                    query.isAgreed ? (
                        tg.telegram.sendMessage(data.user.id, `Nice to have you on board. Here’s the recent history of group communication:`),
                        data.user.status = 'approved',
                        data.user.save((err, user) => {
                            flow.next(data)
                        })
                    ) : (
                            flow.nextFrom(4, data)
                        )
                })
            })
            .addStep((flow, data) => {
                let lastHistory = chat.history.slice(-30), timerCounter = 0

                let options = {
                    parse_mode: "Markdown"
                }

                lastHistory && lastHistory.forEach(msg => {
                    setTimeout(() => {
                        handler.sendMessage(data.user.id, msg)
                        //tg.telegram.sendMessage(data.user.id, `${msg.chatUsername} | ${msg.label_ts}\n${msg.message.data}`, options)
                    }, timerCounter * 35)
                })

                setTimeout(() => {
                    tg.telegram.sendMessage(data.user.id, `Everything you type now will be forwarded to the group. Enjoy!`)
                    flow.next(data)
                }, lastHistory.length * 37)
            })
            .addStep((flow, data) => {
                flowManager.destroy(flow)
            })
            .execute({ user: user })
    }

    delete(user, chatUsername) {
        let { tg, event, db, config } = this.bundle

        flowManager
            .create()
            .addStep((flow, data) => {
                if (data.user.status == 'admin') {
                    db.getUsers({ chatUsername }, users => {
                        if (users && users.length) {
                            data.userForDeletion = users[0]
                            tg.telegram.sendMessage(data.user.id, `Are you sure you want to delete ${chatUsername} from the group? Type Delete to confirm`)
                            flow.next(data)
                        } else {
                            tg.telegram.sendMessage(data.user.id, `There is no user with ${chatUsername} username`)
                            flow.nextFrom(3, data)
                        }
                    })
                } else {
                    tg.telegram.sendMessage(data.user.id, 'You don`t have access for using this command!')
                    flow.nextFrom(3, data)
                }
            })
            .addStep((flow, data) => {
                event.once(data.user.id, msg => {
                    msg.text ? (
                        msg.text == 'Delete' ? (
                            data.userForDeletion.status = 'deleted',
                            data.userForDeletion.save(() => { }),
                            tg.telegram.sendMessage(data.user.id, `Ok, ${chatUsername} was deleted from the group. Type /add ${chatUsername} to get him back`),
                            flow.next(data)
                        ) : (
                                tg.telegram.sendMessage(data.user.id, 'User still alive!'),
                                flow.next(data)
                            )
                    ) : (
                            tg.telegram.sendMessage(data.user.id, 'User still alive!'),
                            flow.next(data)
                        )
                })
            })
            .addStep((flow, data) => {
                flowManager.destroy(flow)
            })
            .execute({ user: user })
    }

    add(user, chatUsername) {
        let { tg, event, db, config } = this.bundle

        flowManager
            .create()
            .addStep((flow, data) => {
                if (data.user.status == 'admin') {
                    db.getUsers({ chatUsername }, users => {
                        if (users && users.length) {
                            data.userForDeletion = users[0]
                            flow.next(data)
                        } else {
                            tg.telegram.sendMessage(data.user.id, `There is no user with ${chatUsername} username`)
                            flow.nextFrom(3, data)
                        }
                    })
                } else {
                    tg.telegram.sendMessage(data.user.id, 'You don`t have access for using this command!')
                    flow.nextFrom(3, data)
                }
            })
            .addStep((flow, data) => {
                data.userForDeletion.status = 'approved'
                data.userForDeletion.save(() => { })
                tg.telegram.sendMessage(data.user.id, `Ok, ${chatUsername} was added to the group again.`)

                flow.next(data)
            })
            .addStep((flow, data) => {
                flowManager.destroy(flow)
            })
            .execute({ user: user })
    }

    sendMessage(id, msg) {
        let { tg } = this.bundle

        let options = {
            parse_mode: "Markdown"
        }

        if(msg.message.text) {
            tg.telegram.sendMessage(id, `${msg.chatUsername} | ${msg.label_ts}\n${msg.message.text}`, options)
        }

        if(msg.message.photo) {
            options.caption = `${msg.chatUsername} | ${msg.label_ts}`
            tg.telegram.sendPhoto(id, msg.message.photo[0].file_id, options)
        }
        
        if(msg.message.document) {
            options.caption = `${msg.chatUsername} | ${msg.label_ts}`
            tg.telegram.sendDocument(id, msg.message.document.file_id, options)
        }
        /* tg.telegram.sendMessage(receiver.id, `${msg.chatUsername} | ${msg.label_ts}\n${msg.message.data}`, options) */
    }
}

module.exports = Handler;