var Expo = require('expo-server-sdk');
let expo = new Expo();

module.exports = (expoToken, message) => {
    return async function(expoToken, message) {
        if (!Expo.isExpoPushToken(expoToken)) {
            // TODO move to logger
            console.error(`Push token ${expoToken} is not a valid Expo push token`); // eslint-disable-line no-console
            return;
        }
        try {
            let receipts = await expo.sendPushNotificationsAsync(message);
            // TODO move to logger
            console.log(receipts); // eslint-disable-line no-console
        } catch (error) {
            // TODO move to logger
            console.error(error); // eslint-disable-line no-console
        }
    }
}