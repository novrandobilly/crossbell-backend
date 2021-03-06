const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const applicantStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'crossbell-applicant',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});
const companyStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'crossbell-company',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const adminStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'crossbell-admin',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const orderRegStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'crossbell-order-reguler',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'crossbell-resume',
    allowed_formats: ['pdf'],
  },
});

module.exports = {
  cloudinary,
  applicantStorage,
  companyStorage,
  adminStorage,
  resumeStorage,
  orderRegStorage,
};
