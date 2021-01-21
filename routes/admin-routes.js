const express = require('express');
const { check } = require('express-validator');
const adminControllers = require('../controllers/admin-controllers');
const { adminAvatar } = require('../middleware/file-upload');

const router = express.Router();
const checkAuth = require('../middleware/check-auth');

const regAdminChecker = [
  check('NIK').trim().notEmpty(),
  check('firstName').trim().notEmpty(),
  check('lastName').trim().notEmpty(),
  check('email').normalizeEmail().isEmail(),
  check('gender').trim().notEmpty(),
  check('dateOfBirth').trim().notEmpty(),
  check('address').trim().notEmpty(),
  check('phoneNumber').trim().notEmpty(),
  check('role').trim().notEmpty(),
  check('verificationKey').trim().notEmpty(),
];

// router.get('/admlog', adminControllers.admlog);

router.post('/admreg', regAdminChecker, adminControllers.admReg);
router.post('/admsign', adminControllers.admSign);
router.use(checkAuth);

router.patch(
  '/:adminid/profile',
  adminAvatar,
  adminControllers.updateAdminProfile
);
router.get('/:adminid/profile', adminControllers.getAdminDetails);

router.post('/order/es', adminControllers.createOrderES);
router.get('/order/es', adminControllers.getWholeOrderES);
router.get('/:companyid/order/es', adminControllers.getCompanyOrderES);
router.get('/order/es/:orderid', adminControllers.getOneOrderES);
router.post('/order/es/addcandidate', adminControllers.addCandidateES);
router.post(
  '/order/es/updatecandidate',
  adminControllers.updateCandidateStatusES
);
router.post('/order/es/updateorder', adminControllers.updateOrderStatusES);
router.delete('/order/es/deletecandidate', adminControllers.deleteCandidateES);

router.post('/order/bc', adminControllers.createOrderBC);
router.get('/order/bc', adminControllers.getWholeOrderBC);
router.post('/approve/bc', adminControllers.approveOrderBC);
router.get('/:companyid/order/bc', adminControllers.getCompanyOrderBC);
router.post('/order/bc/applicant', adminControllers.sentApplicantBC);

router.post('/order/reg', adminControllers.createOrderReg);
router.get('/order/reg', adminControllers.getWholeOrderREG);
router.post('/approve/reg', adminControllers.approveOrderReg);
router.get('/:companyid/order/reg', adminControllers.getCompanyOrder);

router.get('/order/promo', adminControllers.getPromo);
router.patch('/order/promo', adminControllers.updatePromo);
router.get('/order/:orderid/invoice', adminControllers.getOrderInvoice);

router.get('/applicants', adminControllers.getWholeApplicants);
router.get('/companies', adminControllers.getWholeCompanies);
router.get('/:jobid/applicants', adminControllers.getApplicantsFromJob);
router.get('/:applicantid/jobs', adminControllers.getJobsFromApplicant);
router.post('/:companyid/activate', adminControllers.activateCompany);
router.post('/:companyid/block', adminControllers.blockCompany);

router.delete('/feedback', adminControllers.deleteFeed);

module.exports = router;
