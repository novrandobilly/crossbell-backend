const express = require('express');
const { check } = require('express-validator');

const usersControllers = require('../controllers/users-controllers');

const router = express.Router();

//==========================CHECKER==========================
const signupChecker = [ check('email').normalizeEmail().isEmail(), check('password').isLength({ min: 6 }) ];

//===========================ROUTES===========================
router.get('/ap', usersControllers.getAllApplicant);
router.get('/co', usersControllers.getAllCompany);
router.get('/co/:companyid', usersControllers.getCompanyDetails);
router.get('/ap/:applicantid', usersControllers.getApplicantDetails);
router.get('/feedback', usersControllers.getFeedback);
router.get('/reset/:token', usersControllers.checkResetToken);

router.post('/feedback', usersControllers.createFeedback);
router.post('/signup', signupChecker, usersControllers.signup);
router.post('/login', usersControllers.login);
router.post('/forgot', usersControllers.forgotPwd);
router.post('/reset/:token', usersControllers.resetPwd);
router.patch('/ap/:applicantid', usersControllers.updateApplicantProfile);
router.patch('/co/:companyid', usersControllers.updateCompanyProfile);

router.delete('/segment', usersControllers.deleteSegment);
module.exports = router;
