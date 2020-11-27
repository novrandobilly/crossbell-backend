const HttpError = require("../models/http-error");
const Job = require("../models/job-model");
const Applicant = require("../models/applicant-model");
const Company = require("../models/company-model");
const Feed = require("../models/feedback-model");

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

  let allFeed;
  let foundFeed;
  try {
    // allFeed = await Feed.find({}, "-__v");
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
    // await foundJob.save();
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

exports.getWholeJobs = getWholeJobs;
exports.getWholeApplicants = getWholeApplicants;
exports.getWholeCompanies = getWholeCompanies;
exports.getApplicantsFromJob = getApplicantsFromJob;
exports.getJobsFromApplicant = getJobsFromApplicant;
exports.deleteFeed = deleteFeed;
