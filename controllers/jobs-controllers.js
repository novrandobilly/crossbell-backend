const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API);
const applyJobTemplate = require('../assets/htmlJobApplicationTemplate');

const HttpError = require('../models/http-error');
const Job = require('../models/job-model');
const Slotreg = require('../models/slotreg-model');
const Company = require('../models/company-model');
const Applicant = require('../models/applicant-model');
const { applicantAppliedNotif } = require('./notification-controller');

const getAllAvailableJobs = async (req, res, next) => {
  let availableJobs;
  try {
    availableJobs = await Job.find({
      expiredDate: { $gte: new Date() },
    }).populate('companyId', '-password');
  } catch (err) {
    const error = new HttpError('Fetching available jobs failed. Please try again later.', 500);
    return next(error);
  }
  if (availableJobs.length < 1) {
    const error = new HttpError('Could not find available jobs.', 404);
    return next(error);
  }
  res.json({ availableJobs });
};

const getJobsInCompany = async (req, res, next) => {
  const foundCompanyId = req.params.companyid;

  let foundJob;
  try {
    foundJob = await Job.find({ companyId: foundCompanyId });
  } catch (err) {
    const error = new HttpError('Fetching available jobs from company failed, please try again later', 500);
    return next(error);
  }

  if (!foundJob || foundJob.length === 0) {
    const error = new HttpError('Could not find the jobs this company posted yet', 404);
    return next(error);
  }
  res.json({
    foundJob: foundJob.map((job) => job.toObject({ getters: true })),
  });
};

const getSpecificJob = async (req, res, next) => {
  const foundJobId = req.params.jobid;

  let foundJob;
  try {
    foundJob = await Job.findById(foundJobId).populate('jobApplicants companyId', '-password');
  } catch (err) {
    console.log(err);
    const error = new HttpError('Fetching specific job failed, please try again later.', 500);
    return next(error);
  }

  if (!foundJob) {
    const error = new HttpError('Could not find the specific job', 404);
    return next(error);
  }

  res.json(foundJob.toObject({ getters: true }));
};

const createJob = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError('Invalid input properties, please check your data', 422);
    // return next(error);
    return next(errors);
  }
  const {
    jobTitle,
    isHidden,
    placementLocation,
    jobDescriptions,
    educationalStage,
    major,
    specialRequirement,
    emailRecipient,
    employment,
    benefit,
    rangeAge,
    slot,
    jobExperience,
    salary,
    companyId,
    fieldOfWork,
  } = req.body;

  let foundCompany;
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    return next(new HttpError('Could not find company data. Please try again later', 500));
  }

  if (!foundCompany) {
    return next(new HttpError('Could not find company with such id.', 404));
  }

  try {
    const res = await Company.findById(companyId, '-password').populate('slotREG');
    slotReg = res.slotREG;
  } catch (err) {
    const error = new HttpError('Fetching available jobs failed. Please try again later.', 500);
    return next(error);
  }

  if (!slotReg || slotReg.length < 1) {
    const error = new HttpError('No slot found, try approve some order first', 404);
    return next(error);
  }

  let parsedSlot = parseInt(slot);
  if (foundCompany.slotREG.length - parsedSlot < 0 || parsedSlot < 1) {
    return next(new HttpError('Your remaining slot is not sufficient', 401));
  }

  const expCalculation = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30 * parsedSlot);

  const newJob = new Job({
    companyId,
    isHidden: isHidden,
    jobTitle: jobTitle.trim(),
    placementLocation: placementLocation.trim(),
    jobDescriptions: jobDescriptions.trim(),
    educationalStage,
    major,
    employment,
    slot: parsedSlot,
    rangeAge,
    fieldOfWork,
    emailRecipient: emailRecipient.trim(),
    jobExperience,
    expiredDate: expCalculation.toISOString(),
    createdAt: new Date().toISOString(),
    releasedAt: new Date().toISOString(),
    salary: salary.trim() || null,
    benefit: benefit.trim() || null,
    specialRequirement: specialRequirement,
    jobApplicants: [],
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newJob.save({ session: sess });
    foundCompany.jobAds.push(newJob);
    await foundCompany.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError('Could not create new job. Please try again later', 500);
    return next(error);
  }

  filteredSlot = slotReg
    .filter((slot) => {
      return !slot.jobId;
    })
    .sort((a, b) => a.slotExpirationDate - b.slotExpirationDate)
    .slice(0, parsedSlot);

  for (i = 0; i < parsedSlot; i++) {
    updatedSlot = await Slotreg.findById(filteredSlot[i]._id);
    updatedSlot.jobId = newJob._id;
    updatedSlot.slotUsedDate = Date();
    updatedSlot.status = 'Used';
    await updatedSlot.save();
  }

  res.status(201).json({ job: newJob.toObject({ getters: true }) });
};

const saveJobDraft = async (req, res, next) => {
  const {
    jobTitle,
    isHidden,
    placementLocation,
    jobDescriptions,
    educationalStage,
    major,
    specialRequirement,
    emailRecipient,
    rangeAge,
    employment,
    jobExperience,
    benefit,
    slot,
    salary,
    companyId,
    fieldOfWork,
  } = req.body;

  let foundCompany;
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    return next(new HttpError('Could not find company data. Please try again later', 500));
  }
  if (!foundCompany) {
    return next(new HttpError('Could not find company with such id.', 404));
  }

  let parsedSlot = parseInt(slot);

  const newJob = new Job({
    jobTitle: jobTitle.trim() || '-',
    isHidden: isHidden,
    placementLocation: placementLocation.trim() || '-',
    jobDescriptions: jobDescriptions.trim() || '-',
    educationalStage: educationalStage || '-',
    major: major || [],
    specialRequirement: specialRequirement || '-',
    emailRecipient: emailRecipient.trim() || '-',
    employment: employment || 'permanent',
    rangeAge,
    jobExperience: jobExperience || '-',
    createdAt: new Date().toISOString(),
    slot: parsedSlot || 0,
    benefit: benefit.trim() || null,
    salary: salary.trim() || null,
    jobApplicants: [],
    companyId,
    fieldOfWork: fieldOfWork || [],
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newJob.save({ session: sess });
    foundCompany.jobAds.push(newJob);
    await foundCompany.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError('Could not create new job. Please try again later', 500);
    return next(err);
    // return next(error);
  }

  res.status(201).json({ job: newJob.toObject({ getters: true }) });
};

const releaseJob = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError('Invalid input properties, please check your data', 422);
    return next(error);
  }

  const jobId = req.params.jobid;
  let slotReg, filteredSlot, updatedJob, updatedSlot, i;

  const {
    jobTitle,
    isHidden,
    placementLocation,
    jobDescriptions,
    educationalStage,
    major,
    specialRequirement,
    emailRecipient,
    rangeAge,
    employment,
    benefit,
    slot,
    salary,
    companyId,
    fieldOfWork,
  } = req.body;

  try {
    const res = await Company.findById(companyId, '-password').populate('slotREG');
    slotReg = res.slotREG;
  } catch (err) {
    const error = new HttpError('Fetching available jobs failed. Please try again later.', 500);
    return next(error);
  }

  if (!slotReg || slotReg.length < 1) {
    const error = new HttpError('No slot found, try approve some order first', 404);
    return next(error);
  }

  filteredSlot = slotReg
    .filter((slot) => {
      return !slot.jobId;
    })
    .sort((a, b) => a.slotExpirationDate - b.slotExpirationDate)
    .slice(0, slot);

  for (i = 0; i < slot; i++) {
    try {
      updatedSlot = await Slotreg.findById(filteredSlot[i]._id);
    } catch (err) {
      const error = new HttpError(err.message, 400);
      return next(error);
    }
    updatedSlot.jobId = jobId;
    updatedSlot.slotUsedDate = Date();
    updatedSlot.status = 'Used';
    await updatedSlot.save();
  }

  try {
    updatedJob = await Job.findById(jobId);
  } catch (err) {
    const error = new HttpError('Something went wrong. Please try again later', 500);
    return next(error);
  }

  if (!updatedJob) {
    const error = new HttpError('Job not found, update failed', 404);
    return next(error);
  }
  let parsedSlot = parseInt(slot);
  const expCalculation = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30 * parsedSlot);

  updatedJob.jobTitle = jobTitle.trim();
  updatedJob.isHidden = isHidden;
  updatedJob.placementLocation = placementLocation.trim();
  updatedJob.jobDescriptions = jobDescriptions.trim();
  updatedJob.educationalStage = educationalStage;
  updatedJob.major = major;
  updatedJob.specialRequirement = specialRequirement;
  updatedJob.emailRecipient = emailRecipient.trim();
  updatedJob.employment = employment;
  updatedJob.rangeAge = rangeAge;
  updatedJob.slot = parsedSlot;
  updatedJob.benefit = benefit.trim();
  updatedJob.salary = salary.trim();
  updatedJob.fieldOfWork = fieldOfWork;
  updatedJob.releasedAt = new Date().toISOString();
  updatedJob.expiredDate = expCalculation.toISOString();

  try {
    await updatedJob.save();
  } catch (err) {
    const error = new HttpError('Something went wrong. Cannot save the updates', 500);
    return next(error);
  }

  res.status(200).json(updatedJob.toObject({ getters: true }));
};

const editJobDraft = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError('Invalid input properties, please check your data', 422);
    return next(error);
  }

  const {
    jobTitle,
    isHidden,
    placementLocation,
    jobDescriptions,
    educationalStage,
    major,
    specialRequirement,
    emailRecipient,
    rangeAge,
    employment,
    benefit,
    slot,
    salary,
    fieldOfWork,
  } = req.body;

  const jobId = req.params.jobid;

  let parsedSlot = parseInt(slot);

  let updatedJob;
  try {
    updatedJob = await Job.findById(jobId).populate('companyId', '-password');
  } catch (err) {
    const error = new HttpError('Something went wrong. Please try again later', 500);
    return next(error);
  }

  if (req.userData.userId !== updatedJob.companyId.id) {
    const error = new HttpError('You are not allowed to do that', 401);
    return next(error);
  }

  if (!updatedJob) {
    const error = new HttpError('Job not found, update failed', 404);
    return next(error);
  }

  updatedJob.jobTitle = jobTitle ? jobTitle.trim() : updatedJob.jobTitle;
  updatedJob.isHidden = isHidden;
  updatedJob.placementLocation = placementLocation ? placementLocation.trim() : updatedJob.placementLocation;
  updatedJob.jobDescriptions = jobDescriptions ? jobDescriptions.trim() : updatedJob.jobDescriptions;
  updatedJob.educationalStage = educationalStage ? educationalStage : updatedJob.educationalStage;
  updatedJob.major = major.length ? major : updatedJob.major;
  updatedJob.rangeAge = rangeAge ? rangeAge : updatedJob.rangeAge;

  updatedJob.specialRequirement = specialRequirement ? specialRequirement : updatedJob.specialRequirement;
  updatedJob.emailRecipient = emailRecipient ? emailRecipient.trim() : updatedJob.emailRecipient;

  updatedJob.employment = employment ? employment : updatedJob.employment;
  updatedJob.createdAt = new Date().toISOString();
  updatedJob.slot = parsedSlot ? parsedSlot : updatedJob.slot;
  updatedJob.benefit = benefit ? benefit.trim() : updatedJob.benefit;
  updatedJob.salary = salary ? salary.trim() : updatedJob.salary;
  updatedJob.fieldOfWork = fieldOfWork ? fieldOfWork : updatedJob.fieldOfWork;

  try {
    await updatedJob.save();
  } catch (err) {
    const error = new HttpError('Something went wrong. Cannot save the updates', 500);
    return next(error);
  }

  res.status(200).json(updatedJob.toObject({ getters: true }));
};

const updateJob = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError('Invalid input properties, please check your data', 422);
    return next(error);
  }

  const { jobDescriptions, salary, isHidden, educationalStage, specialRequirement, employment } = req.body;
  const jobId = req.params.jobid;

  let updatedJob;
  try {
    updatedJob = await Job.findById(jobId).populate('companyId', '-password');
  } catch (err) {
    const error = new HttpError('Something went wrong. Please try again later', 500);
    return next(error);
  }

  if (req.userData.userId !== updatedJob.companyId.id) {
    const error = new HttpError('You are not allowed to do that', 401);
    return next(error);
  }

  if (!updatedJob) {
    const error = new HttpError('Job not found, update failed', 404);
    return next(error);
  }

  updatedJob.jobDescriptions = jobDescriptions ? jobDescriptions.trim() : updatedJob.jobDescriptions;
  updatedJob.isHidden = isHidden;
  updatedJob.salary = salary ? salary.trim() : updatedJob.salary;

  updatedJob.educationalStage = educationalStage ? educationalStage.trim() : updatedJob.educationalStage;
  updatedJob.specialRequirement = specialRequirement ? specialRequirement : updatedJob.specialRequirement;

  updatedJob.employment = employment ? employment : updatedJob.employment;

  try {
    await updatedJob.save();
  } catch (err) {
    const error = new HttpError('Something went wrong. Cannot save the updates', 500);
    return next(error);
  }

  res.status(200).json(updatedJob.toObject({ getters: true }));
};

const applyJob = async (req, res, next) => {
  const jobId = req.params.jobid;
  const { applicantId } = req.body;

  let foundJob, foundApplicant;
  try {
    foundJob = await Job.findById(jobId).populate('companyId', '-password');
    foundApplicant = await Applicant.findById(applicantId, '-password');
  } catch (err) {
    return next(new HttpError('Cannot retrieve for job/applicant ID failed. Please try again later', 500));
  }

  if (!foundJob || !foundApplicant) {
    return next(new HttpError('Job/Applicant could not not found. Please try again later', 404));
  }

  let applicantHasApplied = foundApplicant.jobsApplied
    .toObject({ getters: true })
    .some((job) => job.toString() === jobId);
  if (applicantHasApplied) {
    return next(new HttpError('You have applied to this job', 500));
  }

  const payload = {
    applicantId: applicantId,
    companyName: foundJob.companyId.companyName || '-',
    jobTitle: foundJob.jobTitle || '',
    avatarUrl: foundApplicant.picture.url || 'User has not posted any photo yet',
    firstName: foundApplicant.firstName || '-',
    lastName: foundApplicant.lastName || '-',
    dateOfBirth: foundApplicant.dateOfBirth,
    gender: foundApplicant.gender || '-',
    email: foundApplicant.email || '-',
    address: foundApplicant.address || '-',
    phone: foundApplicant.phone || '-',
    outOfTown: foundApplicant.outOfTown,
    workShifts: foundApplicant.workShifts,
    details: foundApplicant.details || '-',
    experience: foundApplicant.experience,
    education: foundApplicant.education,
    organization: foundApplicant.organization,
    certification: foundApplicant.certification,
    skills: foundApplicant.skills,
    resume: foundApplicant.resume.url || '',
  };

  const htmlBody = applyJobTemplate(payload);

  const emailData = {
    to: foundJob.emailRecipient,
    from: 'crossbellcorps@gmail.com',
    subject: `<Crossbell> Application for ${foundJob.jobTitle} - ${foundApplicant.firstName} ${foundApplicant.lastName}`,
    html: htmlBody,
  };

  const jobApplied = {
    jobItem: foundJob,
    appliedDate: new Date(),
  };

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    foundJob.jobApplicants.push(foundApplicant);
    foundApplicant.jobsApplied.push(jobApplied);

    await foundJob.save({ session: sess });
    await foundApplicant.save({ session: sess });
    await sgMail.send(emailData);
    await applicantAppliedNotif({
      firstName: foundApplicant.firstName,
      lastName: foundApplicant.lastName,
      jobTitle: foundJob.jobTitle,
      jobId: foundJob._id,
      sess,
      companyId: foundJob.companyId?._id,
    });
    sess.commitTransaction();
  } catch (err) {
    console.log(err);
    return next(new HttpError('Applying for job failed. Please try again later', 500));
  }

  res.status(200).json({ message: 'Successfully applied to the job' });
};

const deleteJob = async (req, res, next) => {
  const jobId = req.params.jobid;

  let foundJob;
  try {
    foundJob = await Job.findById(jobId).populate('companyId jobApplicants', '-password');
  } catch (err) {
    const error = new HttpError('Something went wrong. Cannot delete the jobs', 500);
    return next(error);
  }

  if (req.userData.userId !== foundJob.companyId.id) {
    const error = new HttpError('You are not allowed to do that', 401);
    return next(error);
  }

  if (!foundJob) {
    const error = new HttpError('Job not found', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await foundJob.remove({ session: sess });
    foundJob.companyId.jobAds.pull(foundJob);
    foundJob.jobApplicants.map((ap) => ap.jobsApplied.pull(foundJob));
    await foundJob.companyId.save({ session: sess });
    await foundJob.jobApplicants.map(async (ap) => {
      try {
        await ap.save({ session: sess });
      } catch (err) {
        return next(new HttpError('Something went wrong. Cannot delete the jobs on each applicants', 500));
      }
    });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError('Something went wrong. Cannot delete the jobs', 500);
    return next(error);
  }

  res.status(200).json({ message: 'Job successfully deleted!' });
};

exports.getAllAvailableJobs = getAllAvailableJobs;
exports.getJobsInCompany = getJobsInCompany;
exports.getSpecificJob = getSpecificJob;
exports.createJob = createJob;
exports.updateJob = updateJob;
exports.applyJob = applyJob;
exports.deleteJob = deleteJob;
exports.saveJobDraft = saveJobDraft;
exports.releaseJob = releaseJob;
exports.editJobDraft = editJobDraft;
