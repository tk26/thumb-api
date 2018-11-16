const multer = require('multer');
const multerS3 = require('multer-s3');
const config = require('config.js');
const AWS = require('aws-sdk');
const uuid = require('uuid/v1');
const s3 = new AWS.S3();

exports.profilePictureUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: config.APP_SETTINGS.PROFILE_PICTURE_BUCKET,
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname, id: file.fileId});
    },
    key: function (req, file, cb) {
      file.fileId = uuid();
      cb(null, file.fileId + "_" + file.originalname);
    }
  })
});
