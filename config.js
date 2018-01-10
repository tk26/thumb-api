function config(){
    const APP_NAME = 'Thumb API';
    const MAIL_SERVICE = 'gmail';

    switch(process.env.NODE_ENV){
        case 'dev':
            return {
                'BASE_URL_API': 'http://localhost:2611',
                'BASE_URL_WEBAPP': 'http://localhost:3000',
                'AUTH_SECRET': 'xX7pnOOAGvctC1TUVFgd',
                'RESET_SECRET': 'j7skAEnGdMElUgYfHV9l',
                'APP': APP_NAME,
                'PORT': 2611,
                'MAIL_SERVICE': MAIL_SERVICE,
                'MAIL_USER': 'thethumbtravel@gmail.com',
                'MAIL_PASSWORD': 'thumbqwerty',
                'SENDGRID_API_KEY': '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' ,
                'DATABASE': 'mongodb://localhost/thumb'
            };

        case 'test':
            return {
                'BASE_URL_API': 'http://localhost:2611',
                'BASE_URL_WEBAPP': 'http://localhost:3000',
                'AUTH_SECRET': '9XGaWPDp26SW8UjsQbOV',
                'RESET_SECRET': 'e25v32rmSd5Jk6CDvh0s',
                'APP': APP_NAME,
                'PORT': 2611,
                'MAIL_SERVICE': MAIL_SERVICE,
                'MAIL_USER': 'thethumbtravel@gmail.com',
                'MAIL_PASSWORD': 'thumbqwerty',
                'SENDGRID_API_KEY': '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' ,
                'DATABASE': 'mongodb://localhost/thumb_test'
            };

        case 'prod':
            var DB_USER = process.env.DB_USER;
            var DB_PASSWORD = process.env.DB_PASSWORD;

            return {
                'BASE_URL_API': 'https://vast-everglades-88283.herokuapp.com',
                'BASE_URL_WEBAPP': 'https://thumb-webapp.herokuapp.com',
                'AUTH_SECRET': process.env.AUTH_SECRET,
                'RESET_SECRET': process.env.RESET_SECRET,
                'APP': APP_NAME,
                'PORT' : process.env.PORT,
                'MAIL_SERVICE': process.env.MAIL_SERVICE,
                'MAIL_USER': process.env.MAIL_USER,
                'MAIL_PASSWORD': process.env.MAIL_PASSWORD,
                'DATABASE': 'mongodb://'+DB_USER+':'+DB_PASSWORD+'@ds151207.mlab.com:51207/thumb'
            };

        default:
            throw "Invalid configuration choice. NODE_ENV include ('dev', 'test', 'prod')";
    }
};

// Export for use in init_api
module.exports = config()
