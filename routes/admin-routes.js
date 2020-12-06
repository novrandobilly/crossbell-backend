const express = require('express');
const { check } = require('express-validator');
const adminControllers = require('../controllers/admin-controllers');

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
	check('jobTitle').trim().notEmpty(),
	check('verificationKey').trim().notEmpty()
];

// router.get('/admlog', adminControllers.admlog);

router.post('/admreg', regAdminChecker, adminControllers.admReg);
router.post('/admsign', adminControllers.admSign);
router.use(checkAuth);
router.get('/jobs', adminControllers.getWholeJobs);
router.get('/applicants', adminControllers.getWholeApplicants);
router.get('/companies', adminControllers.getWholeCompanies);
router.post('/order', adminControllers.createOrder);
router.post('/approve', adminControllers.approveOrder);
router.get('/:jobid/applicants', adminControllers.getApplicantsFromJob);
router.get('/:applicantid/jobs', adminControllers.getJobsFromApplicant);
router.post('/:companyid/activate', adminControllers.activateCompany);
router.post('/:companyid/block', adminControllers.blockCompany);

router.delete('/feedback', adminControllers.deleteFeed);

module.exports = router;
