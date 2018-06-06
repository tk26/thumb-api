var Expo = require('expo-server-sdk');

let expo = new Expo();
notifier.canNotify = (expoToken) => {
    if (!Expo.isExpoPushToken(expoToken)) {
        // TODO move to logger
        console.error(`Push token ${expoToken} is not a valid Expo push token`);
        return false;
    }
    return true;
}

notifier.notify = (async (message) => {
    try {
        let receipts = await expo.sendPushNotificationsAsync(message);
        // TODO move to logger
        console.log(receipts);
    } catch (error) {
        // TODO move to logger
        console.error(error);
    }
})();

module.exports = notifier;