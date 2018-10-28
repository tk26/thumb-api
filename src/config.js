function config(){
    const APP_NAME = 'Thumb API';
    switch(process.env.NODE_ENV){
        case 'dev':
            return {
                'BASE_URL_API': 'http://localhost:2611',
                'BASE_URL_WEBAPP': 'http://localhost:3000',
                'AUTH_SECRET': 'xX7pnOOAGvctC1TUVFgd',
                'RESET_SECRET': 'j7skAEnGdMElUgYfHV9l',
                'STRIPE_SECRET':'sk_test_G0A5SoF2Du8KVR0MPDzE4hRO',
                'TWILIO_ACCOUNT_SID': 'ACcb46b59216e608e3a21cf69b6fd3a28a',
                'TWILIO_AUTH_TOKEN': '66dad5c71f3201756d59fe7b31f71c80',
                'TWILIO_PHONE_NUMBER': '+15005550006',
                'APP': APP_NAME,
                'PORT': 2611,
                'SENDGRID_API_KEY': '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',
                'NEO4J_DATABASE_URL': 'localhost',
                'NEO4J_DATABASE_USER': 'thumb_dev',
                'NEO4J_DATABASE_PASSWORD': 'thumb_dev',
                'API_LOGGER_NAME': 'APILog',
                'DB_LOGGER_NAME': 'DBLog',
                'APP_SETTINGS': {
                  'WELCOME_EMAIL_MINUTE_DELAY': 1,
                  'TRIP_BOUNDARY_DISTANCE': 32186.9, //20 miles converted to meters
                  'PROFILE_PICTURE_BUCKET': 'thumb-profile-pictures'
                },
            };

        case 'test':
            return {
                'BASE_URL_API': 'http://localhost:2611',
                'BASE_URL_WEBAPP': 'http://localhost:3000',
                'AUTH_SECRET': '9XGaWPDp26SW8UjsQbOV',
                'RESET_SECRET': 'e25v32rmSd5Jk6CDvh0s',
                'STRIPE_SECRET':'sk_test_G0A5SoF2Du8KVR0MPDzE4hRO',
                'TWILIO_ACCOUNT_SID': 'ACcb46b59216e608e3a21cf69b6fd3a28a',
                'TWILIO_AUTH_TOKEN': '66dad5c71f3201756d59fe7b31f71c80',
                'TWILIO_PHONE_NUMBER': '+15005550006',
                'APP': APP_NAME,
                'PORT': 2611,
                'SENDGRID_API_KEY': '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' ,
                'NEO4J_DATABASE_URL': 'localhost',
                'NEO4J_DATABASE_USER': 'thumb_test',
                'NEO4J_DATABASE_PASSWORD': 'thumb_test',
                'API_LOGGER_NAME': 'APILog',
                'DB_LOGGER_NAME': 'DBLog',
                'APP_SETTINGS': {
                  'WELCOME_EMAIL_MINUTE_DELAY': 1,
                  'TRIP_BOUNDARY_DISTANCE': 32186.9, //20 miles converted to meters
                  'PROFILE_PICTURE_BUCKET': 'thumb-profile-pictures'
                },
            };

        case 'prod':
            var DB_USER = process.env.DB_USER;
            var DB_PASSWORD = process.env.DB_PASSWORD;

            return {
                'BASE_URL_API': 'https://vast-everglades-88283.herokuapp.com',
                'BASE_URL_WEBAPP': 'https://thumb-webapp.herokuapp.com',
                'AUTH_SECRET': process.env.AUTH_SECRET,
                'RESET_SECRET': process.env.RESET_SECRET,
                'STRIPE_SECRET':'sk_test_G0A5SoF2Du8KVR0MPDzE4hRO', // TODO change to production
                'TWILIO_ACCOUNT_SID': process.env.TWILIO_ACCOUNT_SID,
                'TWILIO_AUTH_TOKEN': process.env.TWILIO_AUTH_TOKEN,
                'TWILIO_PHONE_NUMBER': process.env.TWILIO_PHONE_NUMBER,
                'APP': APP_NAME,
                'PORT' : process.env.PORT,
                'SENDGRID_API_KEY': process.env.SENDGRID_API_KEY,
                'NEO4J_DATABASE_URL': process.env.NEO4J_DB_URL,
                'NEO4J_DATABASE_USER': process.env.NEO4J_DB_USER,
                'NEO4J_DATABASE_PASSWORD': process.env.NEO4J_DB_PASSWORD,
                'API_LOGGER_NAME': 'APILog',
                'DB_LOGGER_NAME': 'DBLog',
                'APP_SETTINGS': {
                  'WELCOME_EMAIL_MINUTE_DELAY': 1440,
                  'TRIP_BOUNDARY_DISTANCE': 32186.9, //20 miles converted to meters
                  'PROFILE_PICTURE_BUCKET': 'thumb-profile-pictures'
                },
            };

        default:
            throw "Invalid configuration choice. NODE_ENV include ('dev', 'test', 'prod')";
    }
}

// Export for use in init_api
module.exports = config()
