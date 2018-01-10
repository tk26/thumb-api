function config(){
    const APP_NAME = 'Thumb API';
    const MAIL_SERVICE = 'gmail';

    switch(process.env.NODE_ENV){
        case 'dev':
            return {
                'AUTH_SECRET': 'xX7pnOOAGvctC1TUVFgd',
                'RESET_SECRET': 'j7skAEnGdMElUgYfHV9l',
                'APP': APP_NAME,
                'PORT': 2611,
                'MAIL_SERVICE': MAIL_SERVICE,
                'MAIL_USER': 'thethumbtravel@gmail.com',
                'MAIL_PASSWORD': 'thumbqwerty',
                'DATABASE': 'mongodb://localhost/thumb'
            };

        case 'test':
            return {
                'AUTH_SECRET': '9XGaWPDp26SW8UjsQbOV',
                'RESET_SECRET': 'e25v32rmSd5Jk6CDvh0s',
                'APP': APP_NAME,
                'PORT': 2611,
                'MAIL_SERVICE': MAIL_SERVICE,
                'MAIL_USER': 'thethumbtravel@gmail.com',
                'MAIL_PASSWORD': 'thumbqwerty',
                'DATABASE': 'mongodb://localhost/thumb_test'
            };

        case 'prod':
            var DB_USER = process.env.DB_USER;
            var DB_PASSWORD = process.env.DB_PASSWORD;

            return {
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