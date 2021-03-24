const express = require('express');
const { check } = require('express-validator');

const jobsControllers = require('../controllers/jobs-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

//=======================CHECKER=======================
const createJobChecker = [
  check('jobTitle').trim().notEmpty(),
  check('jobDescriptions').trim().isLength({ min: 5 }),
  check('placementLocation').trim().notEmpty(),
  check('emailRecipient').normalizeEmail().isEmail(),
  check('companyId').trim().notEmpty(),
];
const updateJobChecker = [check('jobDescriptions').trim().isLength({ min: 5 })];

// =======================ROUTES=======================
router.get('/', jobsControllers.getAllAvailableJobs);
router.get('/:jobid', jobsControllers.getSpecificJob);
router.get('/:companyid/all/jobs', jobsControllers.getJobsInCompany);

router.use(checkAuth);

router.post('/', createJobChecker, jobsControllers.createJob);
router.post('/:jobid/apply', jobsControllers.applyJob);
router.patch('/draft/:jobid', jobsControllers.editJobDraft);
router.post('/draft', jobsControllers.saveJobDraft);
router.patch('/:jobid/release', createJobChecker, jobsControllers.saveJobDraft);
router.patch('/:jobid', updateJobChecker, jobsControllers.updateJob);

router.delete('/:jobid', jobsControllers.deleteJob);

module.exports = router;
