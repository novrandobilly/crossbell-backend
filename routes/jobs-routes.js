const express = require('express');
const { check } = require('express-validator');

const jobsControllers = require('../controllers/jobs-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

//=======================CHECKER=======================
const createJobChecker = [
	check('jobTitle').trim().notEmpty(),
	check('description').trim().isLength({ min: 5 }),
	check('city').trim().notEmpty(),
	check('emailRecipient').normalizeEmail().isEmail(),
	check('region').trim().notEmpty(),
	check('salary').trim().notEmpty(),
	check('companyId').trim().notEmpty()
];
const updateJobChecker = [ check('description').trim().isLength({ min: 5 }), check('salary').trim().notEmpty() ];

// =======================ROUTES=======================
router.get('/', jobsControllers.getAllAvailableJobs);
router.get('/:jobid', jobsControllers.getSpecificJob);

router.use(checkAuth);

router.post('/:jobid/apply', jobsControllers.applyJob);
router.post('/', createJobChecker, jobsControllers.createJob);
router.patch('/:jobid', updateJobChecker, jobsControllers.updateJob);

router.delete('/:jobid', jobsControllers.deleteJob);
router.get('/:companyid/jobs', jobsControllers.getJobsInCompany);

module.exports = router;
