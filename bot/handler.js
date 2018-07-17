const flowManager = require('flow-manager')

class Handler {
    constructor(bundle) {
        this.bundle = bundle;
    }

    onStart(user) {
        let bundle = this.bundle;
        let { tg, event, db } = bundle;

        flowManager
            .create()
            .addStep((flow, data) => {
                tg.telegram.sendMessage(data.user.id, 'Hi, thanks for joining. Please choose your username (it will precede your messages in the group chat)')

                event.on(data.user.id, msg => {
                    msg.text
                })

                flow.next(data);
            })
            .addStep((flow, data) => {
                step.askETH(data, bundle, () => {
                    event.once(data.user.userid, message => {
                        const address = message.text;
                        verifyETH(
                            address,
                            (res) => {
                                db.saveUserData(data.user, message, () => {
                                    
                                });
                            },

                            (res) => {
                                if (res.data.message === 'This address is blacklisted') {
                                    db.saveUserData(data.user, message, async () => {
                                        tg.telegram.sendMessage(data.user.userid,
                                            'Your ETH address was successfully added. You will now autmatically receive notifications on all transactions. For statistics you can at any tie just send "stats" and the system will return a message with all your statistics.');
                                        flow.next(data);
                                    });
                                } else {
                                    tg.telegram.sendMessage(
                                        data.user.userid, 'Sorry, but your ETH address was not found in our system. Please check your ETH address and try again later by command /update_address');
                                    flowManager.destroy(flow);
                                }
                            }
                        );
                    });
                });
            })
            .addStep((flow, data) => {
                flowManager.destroy(flow);
            })
            .execute({ user: user });
    }
}

module.exports = Handler;