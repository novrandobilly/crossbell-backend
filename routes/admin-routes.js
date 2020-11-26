const express = require('express');

const adminControllers = require('../controllers/admin-controllers');

const router = express.Router();

router.get('/jobs', adminControllers.getWholeJobs);
router.get('/applicants', adminControllers.getWholeApplicants);
router.get('/companies', adminControllers.getWholeCompanies);
router.get('/:jobid/applicants', adminControllers.getApplicantsFromJob);
router.get('/:applicantid/jobs', adminControllers.getJobsFromApplicant);

module.exports = router;
