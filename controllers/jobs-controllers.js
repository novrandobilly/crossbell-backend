const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API);

const HttpError = require("../models/http-error");
const Job = require("../models/job-model");
const Company = require("../models/company-model");
const Applicant = require("../models/applicant-model");

const getAllAvailableJobs = async (req, res, next) => {
  let availableJobs;
  try {
    availableJobs = await Job.find({
      expiredDate: { $gte: new Date() },
    }).populate("companyId", "-password");
    // availableJobs = await Job.find().populate('companyId', '-password');
  } catch (err) {
    const error = new HttpError(
      "Fetching available jobs failed. Please try again later.",
      500
    );
    return next(error);
  }

  if (availableJobs.length < 1) {
    const error = new HttpError("Could not find available jobs.", 404);
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
    const error = new HttpError(
      "Fetching available jobs from company failed, please try again later",
      500
    );
    return next(error);
  }

  if (!foundJob || foundJob.length === 0) {
    const error = new HttpError(
      "Could not find the jobs this company posted yet",
      404
    );
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
    foundJob = await Job.findById(foundJobId).populate(
      "companyId",
      "-password"
    );
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching specific job failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!foundJob) {
    const error = new HttpError("Could not find the specific job", 404);
    return next(error);
  }

  res.json(foundJob.toObject({ getters: true }));
};

const createJob = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid input properties, please check your data",
      422
    );
    return next(error);
  }
  const {
    jobTitle,
    placementLocation,
    jobDescriptions,
    jobQualification,
    technicalRequirement,
    emailRecipient,
    employment,
    benefit,
    slot,
    salary,
    companyId,
  } = req.body;

  let foundCompany;
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    return next(
      new HttpError("Could not find company data. Please try again later", 500)
    );
  }
  if (!foundCompany) {
    return next(new HttpError("Could not find company with such id.", 404));
  }

  let parsedSlot = parseInt(slot);
  parsedSlot = parsedSlot / 2;
  if (foundCompany.slotREG - parsedSlot < 0 || parsedSlot < 1) {
    return next(new HttpError("Your remaining slot is not sufficient", 401));
  }

  const expCalculation = new Date(
    new Date().getTime() + 1000 * 60 * 60 * 24 * 14 * parsedSlot
  );

  const newJob = new Job({
    jobTitle,
    placementLocation,
    jobDescriptions,
    jobQualification,
    technicalRequirement,
    emailRecipient,
    employment,
    expiredDate: expCalculation.toISOString(),
    createdAt: new Date().toISOString(),
    releasedAt: new Date().toISOString(),
    slot: parsedSlot,
    benefit: benefit || null,
    salary: salary || null,
    jobApplicants: [],
    companyId,
  });

  foundCompany.slotREG = foundCompany.slotREG - parsedSlot;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newJob.save({ session: sess });
    foundCompany.jobAds.push(newJob);
    await foundCompany.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Could not create new job. Please try again later",
      500
    );
    return next(error);
  }

  res.status(201).json({ job: newJob.toObject({ getters: true }) });
};

const saveJobDraft = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid input properties, please check your data",
      422
    );
    return next(error);
  }
  const {
    jobTitle,
    placementLocation,
    jobDescriptions,
    jobQualification,
    technicalRequirement,
    emailRecipient,
    employment,
    benefit,
    slot,
    salary,
    companyId,
  } = req.body;

  let foundCompany;
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    return next(
      new HttpError("Could not find company data. Please try again later", 500)
    );
  }
  if (!foundCompany) {
    return next(new HttpError("Could not find company with such id.", 404));
  }

  let parsedSlot = parseInt(slot);
  parsedSlot = parsedSlot / 2;

  const newJob = new Job({
    jobTitle,
    placementLocation,
    jobDescriptions,
    jobQualification,
    technicalRequirement,
    emailRecipient,
    employment,
    createdAt: new Date().toISOString(),
    slot: parsedSlot,
    benefit: benefit || null,
    salary: salary || null,
    jobApplicants: [],
    companyId,
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
    const error = new HttpError(
      "Could not create new job. Please try again later",
      500
    );
    return next(error);
  }

  res.status(201).json({ job: newJob.toObject({ getters: true }) });
};

const releaseJob = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid input properties, please check your data",
      422
    );
    return next(error);
  }

  const jobId = req.params.jobid;

  let updatedJob;
  try {
    updatedJob = await Job.findById(jobId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Please try again later",
      500
    );
    return next(error);
  }

  if (!updatedJob) {
    const error = new HttpError("Job not found, update failed", 404);
    return next(error);
  }
  let parsedSlot = parseInt(updatedJob.slot);
  parsedSlot = parsedSlot / 2;
  const expCalculation = new Date(
    new Date().getTime() + 1000 * 60 * 60 * 24 * 14 * parsedSlot
  );

  updatedJob.releasedAt = new Date().toISOString();
  updatedJob.expiredDate = expCalculation.toISOString();

  try {
    await updatedJob.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Cannot save the updates",
      500
    );
    return next(error);
  }

  res.status(200).json(updatedJob.toObject({ getters: true }));
};

const updateJob = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid input properties, please check your data",
      422
    );
    return next(error);
  }

  const {
    jobDescriptions,
    salary,
    jobQualification,
    technicalRequirement,
    employment,
  } = req.body;
  const jobId = req.params.jobid;

  let updatedJob;
  try {
    updatedJob = await Job.findById(jobId).populate("companyId", "-password");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Please try again later",
      500
    );
    return next(error);
  }

  if (req.userData.userId !== updatedJob.companyId.id) {
    const error = new HttpError("You are not allowed to do that", 401);
    return next(error);
  }

  if (!updatedJob) {
    const error = new HttpError("Job not found, update failed", 404);
    return next(error);
  }

  updatedJob.jobDescriptions = jobDescriptions
    ? jobDescriptions
    : updatedJob.jobDescriptions;
  updatedJob.salary = salary ? salary : updatedJob.salary;
  updatedJob.jobQualification = jobQualification
    ? jobQualification
    : updatedJob.jobQualification;
  updatedJob.technicalRequirement = technicalRequirement
    ? technicalRequirement
    : updatedJob.technicalRequirement;
  updatedJob.employment = employment ? employment : updatedJob.employment;

  try {
    await updatedJob.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Cannot save the updates",
      500
    );
    return next(error);
  }

  res.status(200).json(updatedJob.toObject({ getters: true }));
};

const applyJob = async (req, res, next) => {
  const jobId = req.params.jobid;
  const { applicantId } = req.body;

  let foundJob, foundApplicant;
  try {
    foundJob = await Job.findById(jobId);
    foundApplicant = await Applicant.findById(applicantId);
  } catch (err) {
    return next(
      new HttpError(
        "Cannot retrieve for job/applicant ID failed. Please try again later",
        500
      )
    );
  }

  if (!foundJob || !foundApplicant) {
    return next(
      new HttpError(
        "Job/Applicant could not not found. Please try again later",
        404
      )
    );
  }

  let applicantHasApplied = foundApplicant.jobsApplied
    .toObject({ getters: true })
    .some((job) => job.toString() === jobId);
  if (applicantHasApplied) {
    return next(new HttpError("You have applied to this job", 500));
  }

  //========================================SEND EMAIL USING SENDGRID========================================
  // const emailData = {
  // 	to: companyEmail,
  // 	from: 'crossbellcorps@gmail.com',
  // 	subject: `Job Application from ${foundApplicant.firstName} ${foundApplicant.lastName}`,
  // 	text: `Test Email Send - Job Application from ${foundApplicant.firstName} ${foundApplicant.lastName} \n Email: ${foundApplicant.email}`,
  // 	html: `
  // 	<strong>Test Email Send - Job Application from ${foundApplicant.firstName} ${foundApplicant.lastName}</strong>
  // 	<p>Ini contoh email sending job application dari ${foundApplicant.email}</p>
  // 	`
  // };
  const emailData = {
    to: foundJob.emailRecipient,
    from: "crossbellcorps@gmail.com",
    subject: `Job Application from Crossbell Front-End`,
    text: `Test Email Send - Job Application from Crossbell Front-End for jobid ${jobId} \n To Email: ${foundJob.emailRecipient}`,
    html: `
		<strong>Test Email Send - Job Application for jobid ${jobId}</strong>
		<p>Ini contoh email sending job application ke email ${foundJob.emailRecipient}</p>
		`,
  };

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    foundJob.jobApplicants.push(foundApplicant);
    foundApplicant.jobsApplied.push(foundJob);
    await foundJob.save({ session: sess });
    await foundApplicant.save({ session: sess });
    await sgMail.send(emailData);
    sess.commitTransaction();
  } catch (err) {
    return next(
      new HttpError("Applying for job failed. Please try again later", 500)
    );
  }

  res.status(200).json({ message: "Successfully applied to the job" });
};

const deleteJob = async (req, res, next) => {
  const jobId = req.params.jobid;

  let foundJob;
  try {
    foundJob = await Job.findById(jobId).populate(
      "companyId jobApplicants",
      "-password"
    );
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Cannot delete the jobs",
      500
    );
    return next(error);
  }

  if (req.userData.userId !== foundJob.companyId.id) {
    const error = new HttpError("You are not allowed to do that", 401);
    return next(error);
  }

  if (!foundJob) {
    const error = new HttpError("Job not found", 404);
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
        return next(
          new HttpError(
            "Something went wrong. Cannot delete the jobs on each applicants",
            500
          )
        );
      }
    });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong. Cannot delete the jobs",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Job successfully deleted!" });
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
