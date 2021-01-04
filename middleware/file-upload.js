const multer = require('multer');
const HttpError = require('../models/http-error');
const { storage } = require('../cloudinary');
const upload = multer({
	storage,
	limits: { fileSize: 500000 }
});

const uploadFile = (req, res, next) => {
	const uploadProcess = upload.single('picture');

	uploadProcess(req, res, err => {
		if (err instanceof multer.MulterError) {
			return next(new HttpError(err, 500));
		} else if (err) {
			return next(new HttpError(err, 500));
		}
		next();
	});
};

module.exports = uploadFile;
