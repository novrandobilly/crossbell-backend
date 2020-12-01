
const { validationResult } = require("express-validator");
const Applicant = require("../models/applicant-model");
const { update } = require("../models/company-model");
const Company = require("../models/company-model");
const Feed = require("../models/feedback-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");

const getFeedback = async (req, res, next) => {
  let foundFeedback;
  try {
    foundFeedback = await Feed.find({}, "-__v");
  } catch (err) {
    return next(
      new HttpError("Fetching feedsfailed, please try again later", 500)
    );
  }

  if (!foundFeedback) {
    return next(new HttpError("No feedback found!", 404));
  }

  res.status(200).json({ Feedback: foundFeedback });
};


const createFeedback = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid input properties, please check your data",
      422
    );
    return next(error);
  }

  const { name, email, phone, feed } = req.body;

  const newFeed = new Feed({
    name,
    email,
    phone,
    feed,
    createdAt: new Date(),
  });

  try {
    await newFeed.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Could not create new feed. Please try again later",
      500
    );
    return next(error);
  }

  res.status(201).json({ feed: newFeed.toObject({ getters: true }) });
};

const getAllApplicant = async (req, res, next) => {
  let foundApplicant;
  try {
    foundApplicant = await Applicant.find({}, "-password");
  } catch (err) {
    return next(
      new HttpError("Fetching user failed, please try again later", 500)
    );
  }

  if (!foundApplicant) {
    return next(new HttpError("No user found", 404));
  }

  res.status(200).json({ applicant: foundApplicant });
};

const getAllCompany = async (req, res, next) => {
  let foundCompany;
  try {
    foundCompany = await Company.find({}, "-password");
  } catch (err) {
    return next(
      new HttpError("Fetching user failed, please try again later", 500)
    );
  }

  if (!foundCompany) {
    return next(new HttpError("Company not found", 404));
  }

  res.status(200).json({ company: foundCompany });
};

const getApplicantDetails = async (req, res, next) => {
  const applicantId = req.params.applicantid;

  let foundApplicant;
  try {
    foundApplicant = await Applicant.findOne({ _id: applicantId }, "-password");
  } catch (err) {
    return next(
      new HttpError("Fetching user failed, please try again later", 500)
    );
  }

  if (!foundApplicant) {
    return next(new HttpError("User not found", 404));
  }

  res
    .status(200)
    .json({ applicant: foundApplicant.toObject({ getters: true }) });
};

const getCompanyDetails = async (req, res, next) => {
  const companyId = req.params.companyid;
  let foundCompany;
  try {
    foundCompany = await Company.findOne({ _id: companyId }, "-password");
  } catch (err) {
    return next(
      new HttpError("Fetching user failed, please try again later", 500)
    );
  }

  if (!foundCompany) {
    return next(new HttpError("Company not found", 404));
  }
  res.status(200).json({ company: foundCompany.toObject({ getters: true }) });
};

const signup = async (req, res, next) => {


	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new HttpError('Invalid inputs properties. Please check your data', 422);
		return next(error);
	}

	const { email, password, isCompany } = req.body;
	let existingApplicant, existingCompany;
	try {
		existingApplicant = await Applicant.findOne({ email: email });
		existingCompany = await Company.findOne({ email: email });
	} catch (err) {
		const error = new HttpError('Signing up failed. Please try again.', 500);
		return next(error);
	}

	if (existingApplicant || existingCompany) {
		const error = new HttpError('Could not create user. Email already exists.', 422);
		return next(error);
	}

	let hashedPassword;
	try {
		hashedPassword = await bcrypt.hash(password, 12);
	} catch (err) {
		const error = new HttpError('Could not create user, please try again', 500);
		return next(error);
	}

	if (isCompany) {
		const { companyName } = req.body;
		const newCompany = new Company({
			companyName,
			email,
			password: hashedPassword,
			logo: null,
			details: null,
			jobAds: [],
			isCompany
		});
		try {
			await newCompany.save();
		} catch (err) {
			const error = new HttpError('Could not create user. Please input a valid value', 500);
			return next(error);
		}

		let token;
		try {
			token = jwt.sign(
				{
					userId: newCompany.id,
					email: newCompany.email,
					isCompany: newCompany.isCompany
				},
				'one_batch_two_batch_penny_and_dime',
				{
					expiresIn: '3h'
				}
			);
		} catch (err) {
			const error = new HttpError('Could not create user.', 500);
			return next(error);
		}

		return res.status(201).json({
			userId: newCompany.id,
			email: newCompany.email,
			isCompany: newCompany.isCompany,
			token
		});
	} else {
		const { firstName, lastName } = req.body;
		const newApplicant = new Applicant({
			firstName,
			lastName,
			email,
			password: hashedPassword,
			resume: null,
			jobsApplied: [],
			isCompany
		});

		try {
			await newApplicant.save();
		} catch (err) {
			const error = new HttpError('Could not create user.', 500);
			return next(error);
		}

		let token;
		try {
			token = jwt.sign(
				{
					userId: newApplicant.id,
					email: newApplicant.email,
					isCompany: newApplicant.isCompany
				},
				'one_batch_two_batch_penny_and_dime',
				{
					expiresIn: '3h'
				}
			);
		} catch (err) {
			const error = new HttpError('Could not create user.', 500);
			return next(error);
		}

		return res.status(201).json({
			userId: newApplicant.id,
			email: newApplicant.email,
			isCompany: newApplicant.isCompany,
			token
		});
	}

};

const login = async (req, res, next) => {
	const { email, password } = req.body;

	let foundUser = null;
	try {
		foundUser = await Company.findOne({ email });
		if (!foundUser) {
			foundUser = await Applicant.findOne({ email });
		}
	} catch (err) {
		return next(new HttpError('Could not logged you in. Please try again later', 500));
	}

	if (!foundUser) {
		return next(new HttpError('Could not identify user. Authentication Failed', 401));
	}

	let isValidPassword = false;
	try {
		isValidPassword = await bcrypt.compare(password, foundUser.password);
	} catch (err) {
		const error = new HttpError('Could not identified user, please try again', 500);
		return next(error);
	}

	if (!isValidPassword) {
		const error = new HttpError('Invalid credential, please try again', 401);
		return next(error);
	}

	let token;
	try {
		token = jwt.sign(
			{
				userId: foundUser.id,
				email: foundUser.email,
				isCompany: foundUser.isCompany
			},
			'one_batch_two_batch_penny_and_dime',
			{ expiresIn: '3h' }
		);
	} catch (err) {
		const error = new HttpError('Could not generate token, please try again', 500);
		return next(error);
	}

	res.status(200).json({
		userId: foundUser.id,
		email: foundUser.email,
		isCompany: foundUser.isCompany,
		token
	});

};

const updateApplicantProfile = async (req, res, next) => {
  const applicantId = req.params.applicantid;

  const data = req.body;
  let foundApplicant;

  try {
    foundApplicant = await Applicant.findOne({ _id: applicantId });

    foundApplicant.picture = data.picture
      ? data.picture
      : foundApplicant.picture;
    foundApplicant.firstName = data.firstName
      ? data.firstName
      : foundApplicant.firstName;
    foundApplicant.lastName = data.lastName
      ? data.lastName
      : foundApplicant.lastName;
    foundApplicant.email = data.email ? data.email : foundApplicant.email;
    foundApplicant.headline = data.headline
      ? data.headline
      : foundApplicant.headline;
    foundApplicant.address = data.address
      ? data.address
      : foundApplicant.address;
    foundApplicant.city = data.city ? data.city : foundApplicant.city;
    foundApplicant.state = data.state ? data.state : foundApplicant.state;
    foundApplicant.zip = data.zip ? data.zip : foundApplicant.zip;
    foundApplicant.phone = data.phone ? data.phone : foundApplicant.phone;
    foundApplicant.website = data.website
      ? data.website
      : foundApplicant.website;
    foundApplicant.details = data.details
      ? data.details
      : foundApplicant.details;
    foundApplicant.dateOfBirth = data.dateOfBirth
      ? data.dateOfBirth
      : foundApplicant.dateOfBirth;

    if (data.education) {
      if (data.index) {
        foundApplicant.education[data.index] = data.education;
      } else {
        foundApplicant.education.push(data.education);
      }
    } else {
    }

    if (data.experience) {
      if (data.index) {
        foundApplicant.experience[data.index] = data.experience;
      } else {
        foundApplicant.experience.push(data.experience);
      }
    } else {
    }

    if (data.certification) {
      if (data.index) {
        foundApplicant.certification[data.index] = data.certification;
      } else {
        foundApplicant.certification.push(data.certification);
      }
    } else {
    }
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Please try again later",
      500
    );
    return next(error);
  }

  try {
    await foundApplicant.save();
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  return res.status(200).json({ foundApplicant: foundApplicant });
};

const updateCompanyProfile = async (req, res, next) => {
  const companyId = req.params.companyid;

  const data = req.body;
  let foundCompany;

  try {
    foundCompany = await Company.findOne({ _id: companyId });

    foundCompany.logo = data.logo ? data.logo : foundCompany.logo;
    foundCompany.companyName = data.companyName
      ? data.companyName
      : foundCompany.companyName;
    foundCompany.email = data.email ? data.email : foundCompany.email;
    foundCompany.size = data.size ? data.size : foundCompany.size;
    foundCompany.address = data.address ? data.address : foundCompany.address;
    foundCompany.industry = data.industry
      ? data.industry
      : foundCompany.industry;
    foundCompany.emailRecipient = data.emailRecipient
      ? data.emailRecipient
      : foundCompany.emailRecipient;
    foundCompany.website = data.website ? data.website : foundCompany.website;
    foundCompany.details = data.details ? data.details : foundCompany.details;
    foundCompany.mission = data.mission ? data.mission : foundCompany.mission;
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Please try again later",
      500
    );
    return next(error);
  }

  try {
    await foundCompany.save();
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  return res.status(200).json({ foundCompany: foundCompany });
};

exports.getAllCompany = getAllCompany;
exports.getAllApplicant = getAllApplicant;
exports.getApplicantDetails = getApplicantDetails;
exports.getCompanyDetails = getCompanyDetails;
exports.signup = signup;
exports.login = login;
exports.updateApplicantProfile = updateApplicantProfile;
exports.updateCompanyProfile = updateCompanyProfile;
exports.getFeedback = getFeedback;
exports.createFeedback = createFeedback;
