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
            // TODO change DB_USER, DB_PASSWORD, 
            // AUTH_SECRET, RESET_SECRET, 
            // MAIL_USER, MAIL_PASSWORD to be taken from process.env
            var DB_USER = 'thumb_user';
            var DB_PASSWORD = 'HJeeqNQnvSncZXzfnHKn';

            return {
                'AUTH_SECRET': 'nJ2SPP2H7U2uTrrykzzs',
                'RESET_SECRET': 'sTXcC660tV8PgGxNG8FC',
                'APP': APP_NAME,
                'PORT': 80,
                'MAIL_SERVICE': MAIL_SERVICE,
                'MAIL_USER': 'thethumbtravel@gmail.com',
                'MAIL_PASSWORD': 'thumbqwerty',
                'DATABASE': 'mongodb://'+DB_USER+':'+DB_PASSWORD+'@ds151207.mlab.com:51207/thumb'
            };

        default:
            throw "Invalid configuration choice. NODE_ENV include ('dev', 'test', 'prod')";
    }
};

// Export for use in init_api
module.exports = config()