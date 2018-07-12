const flowManager = require('flow-manager')

class Flow {
    constructor(bundle) {
        this.bundle = bundle;
    }

    onStart(user) {
        let bundle = this.bundle;
        let { event, db, tg_bot } = bundle;

        flowManager
            .create()
            //welcome - 1
            .addStep((flow, data) => {
                step.welcome(data, bundle, () => {
                    db.createUserData(data.user, (isNewUser) => {
                        flow.next(data);
                    });
                });
            })

            //askETH - 2
            .addStep((flow, data) => {
                step.askETH(data, bundle, () => {
                    event.once(data.user.userid, message => {
                        const address = message.text;
                        verifyETH(
                            address,
                            (res) => {
                                db.saveUserData(data.user, message, () => {
                                    tg_bot.telegram.sendMessage(data.user.userid,
                                        'Your ETH address was successfully added. You will now autmatically receive notifications on all transactions. For statistics you can at any tie just send "stats" and the system will return a message with all your statistics.');
                                    flow.next(data);
                                });
                            },

                            (res) => {
                                if (res.data.message === 'This address is blacklisted') {
                                    db.saveUserData(data.user, message, async () => {
                                        tg_bot.telegram.sendMessage(data.user.userid,
                                            'Your ETH address was successfully added. You will now autmatically receive notifications on all transactions. For statistics you can at any tie just send "stats" and the system will return a message with all your statistics.');
                                        flow.next(data);
                                    });
                                } else {
                                    tg_bot.telegram.sendMessage(
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

module.exports = Flow;