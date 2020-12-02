const HttpError = require("../models/http-error");
const Job = require("../models/job-model");
const Applicant = require("../models/applicant-model");
const Company = require("../models/company-model");
const Admin = require("../models/admin-model");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getWholeJobs = async (req, res, next) => {
  let wholeJobs;
  try {
    wholeJobs = await Job.find();
  } catch (err) {
    const error = new HttpError(
      "Fetching data failed. Please try again later",
      500
    );
    return next(error);
  }

  if (wholeJobs.length < 1) {
    const error = new HttpError("No job has ever been posted yet here.", 404);
    return next(error);
  }
  res.json({
    wholeJobs: wholeJobs.map((job) => job.toObject({ getters: true })),
  });
};

const getWholeApplicants = async (req, res, next) => {
  let wholeApplicants;
  try {
    wholeApplicants = await Applicant.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching data failed. Please try again later",
      500
    );
    return next(error);
  }

  if (wholeApplicants.length < 1) {
    const error = new HttpError("No applicant has ever registered yet .", 404);
    return next(error);
  }
  res.json({
    wholeApplicants: wholeApplicants.map((ap) =>
      ap.toObject({ getters: true })
    ),
  });
};

const getWholeCompanies = async (req, res, next) => {
  let wholeCompanies;
  try {
    wholeCompanies = await Company.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching data failed. Please try again later",
      500
    );
    return next(error);
  }

  if (wholeCompanies.length < 1) {
    const error = new HttpError("No company has ever registered yet .", 404);
    return next(error);
  }
  res.json({
    wholeCompanies: wholeCompanies.map((co) => co.toObject({ getters: true })),
  });
};

const getApplicantsFromJob = async (req, res, next) => {
  const jobId = req.params.jobid;

  let foundJob;
  try {
    foundJob = await Job.findById(jobId).populate(
      "jobApplicants",
      "-password -jobsApplied"
    );
  } catch (err) {
    return next(
      new HttpError(
        "Fetching job & applicants data failed. Please try again",
        500
      )
    );
  }

  if (!foundJob) {
    return next(new HttpError("Job is not found", 404));
  }

  res.status(200).json({
    applicantsApplied: foundJob.jobApplicants.map((ap) =>
      ap.toObject({ getters: true })
    ),
  });
};

const getJobsFromApplicant = async (req, res, next) => {
  const applicantId = req.params.applicantid;

  let foundApplicant;
  try {
    foundApplicant = await Applicant.findById(applicantId).populate(
      "jobsApplied",
      "-jobApplicants"
    );
  } catch (err) {
    return next(
      new HttpError(
        "Fetching applicant & jobs applied data failed. Please try again",
        500
      )
    );
  }

  if (!foundApplicant) {
    return next(new HttpError("Applicant is not found", 404));
  }

  res.status(200).json({
    applicantsApplied: foundApplicant.jobsApplied.map((job) =>
      job.toObject({ getters: true })
    ),
  });
};

const deleteFeed = async (req, res, next) => {
  const { feedId } = req.body;

  let foundFeed;
  try {
    foundFeed = await Feed.findById(feedId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Cannot delete the feed",
      500
    );
    return next(error);
  }

  if (!foundFeed) {
    const error = new HttpError("No feed found", 404);
    return next(error);
  }

  try {
    await foundFeed.remove();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong. Cannot delete the jobs",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Feed successfully deleted!" });
};

const admReg = async (req, res, next) => {
  const errors = validationResult(req);
  const { verificationKey } = req.body;
  if (!errors.isEmpty() || verificationKey !== process.env.ADMVERIFICATIONKEY) {
    const error = new HttpError(
      "Invalid inputs properties. Please check your data",
      422
    );
    return next(error);
  }

  const {
    NIK,
    firstName,
    lastName,
    email,
    password,
    gender,
    dateOfBirth,
    address,
    phoneNumber,
    jobTitle,
  } = req.body;
  let existingAdmin, existingApplicant, existingCompany;
  try {
    existingAdmin = await Admin.findOne({ email: email });
    existingApplicant = await Applicant.findOne({ email: email });
    existingCompany = await Company.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Signing up failed. Please try again.", 500);
    return next(error);
  }

  if (existingAdmin || existingApplicant || existingCompany) {
    const error = new HttpError(
      "Could not create user. Email already exists.",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Could not create user, please try again", 500);
    return next(error);
  }

  const newAdmin = new Admin({
    NIK,
    firstName,
    lastName,
    email,
    password: hashedPassword,
    gender,
    dateOfBirth,
    address,
    phoneNumber,
    jobTitle,
    isAdmin: true,
  });
  try {
    await newAdmin.save();
  } catch (err) {
    const error = new HttpError(
      "Could not create admin user. Please input a valid value",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: newAdmin.id,
        email: newAdmin.email,
        isAdmin: newAdmin.isAdmin,
      },
      "one_batch_two_batch_penny_and_dime",
      {
        expiresIn: "3h",
      }
    );
  } catch (err) {
    const error = new HttpError("Could not create admin.", 500);
    return next(error);
  }

  return res.status(201).json({
    userId: newAdmin._id,
    email: newAdmin.email,
    isAdmin: newAdmin.isAdmin,
    token,
  });
};

const admSign = async (req, res, next) => {
  const { email, password } = req.body;

  let foundAdmin = null;
  try {
    foundAdmin = await Admin.findOne({ email });
  } catch (err) {
    return next(
      new HttpError("Could not logged you in. Please try again later", 500)
    );
  }

  if (!foundAdmin) {
    return next(
      new HttpError("Could not identify admin. Authentication Failed", 401)
    );
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, foundAdmin.password);
  } catch (err) {
    const error = new HttpError(
      "Could not identified user, please try again",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError("Invalid credential, please try again", 401);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: foundAdmin.id,
        email: foundAdmin.email,
        isAdmin: foundAdmin.isAdmin,
      },
      "one_batch_two_batch_penny_and_dime",
      { expiresIn: "3h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Could not generate token, please try again",
      500
    );
    return next(error);
  }

  res.status(200).json({
    userId: foundAdmin.id,
    email: foundAdmin.email,
    isAdmin: foundAdmin.isAdmin,
    token,
  });
};

exports.getWholeJobs = getWholeJobs;
exports.getWholeApplicants = getWholeApplicants;
exports.getWholeCompanies = getWholeCompanies;
exports.getApplicantsFromJob = getApplicantsFromJob;
exports.getJobsFromApplicant = getJobsFromApplicant;

exports.admReg = admReg;
exports.admSign = admSign;

exports.deleteFeed = deleteFeed;
