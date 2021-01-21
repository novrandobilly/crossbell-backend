const express = require('express');
const { check } = require('express-validator');
const { applicantAvatar, companyAvatar, applicantResume } = require('../middleware/file-upload');

const usersControllers = require('../controllers/users-controllers');

const router = express.Router();

//==========================CHECKER==========================
const signupChecker = [ check('email').isEmail(), check('password').isLength({ min: 6 }) ];

//===========================ROUTES===========================
router.get('/ap', usersControllers.getAllApplicant);
router.get('/co', usersControllers.getAllCompany);
router.get('/co/:companyid', usersControllers.getCompanyDetails);
router.get('/ap/:applicantid', usersControllers.getApplicantDetails);
router.get('/feedback', usersControllers.getFeedback);
router.get('/reset/:token', usersControllers.checkResetToken);

router.patch('/co/:companyid', companyAvatar, usersControllers.updateCompanyProfile);
router.patch('/ap/:applicantid', applicantAvatar, usersControllers.updateApplicantProfile);
router.patch('/ap/:applicantid/resume', applicantResume, usersControllers.updateApplicantResume);
router.post('/feedback', usersControllers.createFeedback);
router.post('/signup', signupChecker, usersControllers.signup);
router.post('/login', usersControllers.login);
router.post('/login/google', usersControllers.googleLogin);
router.post('/forgot', usersControllers.forgotPwd);
router.post('/reset/:token', usersControllers.resetPwd);

router.delete('/segment', usersControllers.deleteSegment);
module.exports = router;
