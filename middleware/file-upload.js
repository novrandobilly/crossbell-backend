const multer = require('multer');
const HttpError = require('../models/http-error');
const { applicantStorage, companyStorage, adminStorage } = require('../cloudinary');
const applicantUpload = multer({
	storage: applicantStorage,
	limits: { fileSize: 500000 }
});
const companyUpload = multer({
	storage: companyStorage,
	limits: { fileSize: 500000 }
});
const adminUpload = multer({
	storage: adminStorage,
	limits: { fileSize: 500000 }
});

const applicantAvatar = (req, res, next) => {
	const uploadProcess = applicantUpload.single('picture');

	uploadProcess(req, res, err => {
		if (err instanceof multer.MulterError) {
			return next(new HttpError(err, 500));
		} else if (err) {
			return next(new HttpError(err, 500));
		}
		next();
	});
};

const companyAvatar = (req, res, next) => {
	const uploadProcess = companyUpload.single('logo');

	uploadProcess(req, res, err => {
		if (err instanceof multer.MulterError) {
			return next(new HttpError(err, 500));
		} else if (err) {
			return next(new HttpError(err, 500));
		}
		next();
	});
};

const adminAvatar = (req, res, next) => {
	const uploadProcess = adminUpload.single('picture');

	uploadProcess(req, res, err => {
		if (err instanceof multer.MulterError) {
			return next(new HttpError(err, 500));
		} else if (err) {
			return next(new HttpError(err, 500));
		}
		next();
	});
};

module.exports = { applicantAvatar, companyAvatar, adminAvatar };
