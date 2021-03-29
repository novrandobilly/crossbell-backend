const { validationResult } = require('express-validator');
const Applicant = require('../models/applicant-model');
const Company = require('../models/company-model');
const Admin = require('../models/admin-model');
const Feed = require('../models/feedback-model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const moment = require('moment');
const { cloudinary } = require('../cloudinary');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(
  '968047575665-o4ugi6bco8pp3j4ba10cs55av6cms52c.apps.googleusercontent.com'
);

const HttpError = require('../models/http-error');
const mail = require('@sendgrid/mail');

const getFeedback = async (req, res, next) => {
  let foundFeedback;
  try {
    foundFeedback = await Feed.find({}, '-__v');
  } catch (err) {
    return next(
      new HttpError('Fetching feedsfailed, please try again later', 500)
    );
  }

  if (!foundFeedback) {
    return next(new HttpError('No feedback found!', 404));
  }

  res.status(200).json({ Feedback: foundFeedback });
};

const createFeedback = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      'Invalid input properties, please check your data',
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
      'Could not create new feed. Please try again later',
      500
    );
    return next(error);
  }

  res.status(201).json({ feed: newFeed.toObject({ getters: true }) });
};

const getAllApplicant = async (req, res, next) => {
  let foundApplicant;
  try {
    foundApplicant = await Applicant.find({}, '-password');
  } catch (err) {
    return next(
      new HttpError('Fetching user failed, please try again later', 500)
    );
  }

  if (!foundApplicant) {
    return next(new HttpError('No user found', 404));
  }

  res.status(200).json({ applicant: foundApplicant });
};

const getAllCompany = async (req, res, next) => {
  let foundCompany;
  try {
    foundCompany = await Company.find({}, '-password');
  } catch (err) {
    return next(
      new HttpError('Fetching user failed, please try again later', 500)
    );
  }

  if (!foundCompany) {
    return next(new HttpError('Company not found', 404));
  }

  res.status(200).json({ company: foundCompany });
};

const getApplicantDetails = async (req, res, next) => {
  const applicantId = req.params.applicantid;

  let foundAdmin = await Admin.findById(req.userData.userId, '-password');

  if (!foundAdmin && req.userData.userId === !applicantId) {
    return next(
      new HttpError('You are unauthorized to access this end point', 401)
    );
  }

  let foundApplicant;
  try {
    foundApplicant = await Applicant.findOne({ _id: applicantId }, '-password');
  } catch (err) {
    return next(
      new HttpError('Fetching user failed, please try again later', 500)
    );
  }

  if (!foundApplicant) {
    return next(new HttpError('User not found', 404));
  }

  res
    .status(200)
    .json({ applicant: foundApplicant.toObject({ getters: true }) });
};

const getCompanyDetails = async (req, res, next) => {
  const companyId = req.params.companyid;
  let foundCompany;
  try {
    foundCompany = await Company.findOne({ _id: companyId }, '-password');
  } catch (err) {
    return next(
      new HttpError('Fetching user failed, please try again later', 500)
    );
  }

  if (!foundCompany) {
    return next(new HttpError('Company not found', 404));
  }
  res.status(200).json({ company: foundCompany.toObject({ getters: true }) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      'Invalid inputs properties. Please check your data',
      422
    );
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
    const error = new HttpError(
      'Could not create user. Email already exists.',
      422
    );
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
      briefDescriptions: null,
      NPWP: null,
      jobAds: [],
      isCompany,
      isActive: false,
    });
    try {
      await newCompany.save();
    } catch (err) {
      const error = new HttpError(
        'Could not create user. Please input a valid value',
        500
      );
      return next(error);
    }

    let token;
    try {
      token = jwt.sign(
        {
          userId: newCompany.id,
          email: newCompany.email,
          isCompany: newCompany.isCompany,
        },
        'one_batch_two_batch_penny_and_dime',
        {
          expiresIn: '3h',
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
      isActive: newCompany.isActive,
      token,
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
      isCompany,
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
          isCompany: newApplicant.isCompany,
        },
        'one_batch_two_batch_penny_and_dime',
        {
          expiresIn: '3h',
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
      token,
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
    return next(
      new HttpError('Could not logged you in. Please try again later', 500)
    );
  }

  if (!foundUser) {
    return next(
      new HttpError('Could not identify user. Authentication Failed', 401)
    );
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, foundUser.password);
  } catch (err) {
    const error = new HttpError(
      'Could not identified user, please try again',
      500
    );
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
        isCompany: foundUser.isCompany,
      },
      'one_batch_two_batch_penny_and_dime',
      { expiresIn: '3h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Could not generate token, please try again',
      500
    );
    return next(error);
  }

  res.status(200).json({
    userId: foundUser.id,
    email: foundUser.email,
    isCompany: foundUser.isCompany,
    isActive: foundUser.isActive || false,
    token,
  });
};

const googleLogin = async (req, res, next) => {
  const { idToken } = req.body;
  let response;

  try {
    response = await client.verifyIdToken({
      idToken,
      audience:
        '968047575665-o4ugi6bco8pp3j4ba10cs55av6cms52c.apps.googleusercontent.com',
    });
  } catch (err) {
    const error = new HttpError('Could not verified email.', 500);
    return next(error);
  }
  const { email_verified, given_name, family_name, email } = response.payload;

  let foundUser;
  if (email_verified) {
    try {
      foundUser = await Applicant.findOne({ email });
      if (!foundUser) foundUser = await Company.findOne({ email });
    } catch (err) {
      return next(new HttpError('Something went wrong.', 500));
    }

    if (!foundUser) {
      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(
          email + 'one_batch_two_batch_penny_and_dime',
          12
        );
      } catch (err) {
        const error = new HttpError(
          'Could not create user, please try again',
          500
        );
        return next(error);
      }

      const newApplicant = new Applicant({
        firstName: given_name,
        lastName: family_name,
        email,
        password: hashedPassword,
        resume: null,
        jobsApplied: [],
        isCompany: false,
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
            isCompany: newApplicant.isCompany,
          },
          'one_batch_two_batch_penny_and_dime',
          {
            expiresIn: '3h',
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
        token,
      });
    } else {
      let token;
      try {
        token = jwt.sign(
          {
            userId: foundUser.id,
            email: foundUser.email,
            isCompany: foundUser.isCompany,
          },
          'one_batch_two_batch_penny_and_dime',
          { expiresIn: '3h' }
        );
      } catch (err) {
        const error = new HttpError(
          'Could not generate token, please try again',
          500
        );
        return next(error);
      }

      res.status(200).json({
        userId: foundUser.id,
        email: foundUser.email,
        isCompany: foundUser.isCompany,
        isActive: foundUser.isActive || false,
        token,
      });
    }
  } else {
    const error = new HttpError('Email could not be verified.', 500);
    return next(error);
  }
};

const updateApplicantProfile = async (req, res, next) => {
  const applicantId = req.params.applicantid;

  const data = req.body;
  let foundApplicant;
  try {
    foundApplicant = await Applicant.findOne({ _id: applicantId });
  } catch (err) {
    const error = new HttpError(
      'Something went wrong. Please try again later',
      500
    );
    return next(error);
  }

  if (foundApplicant.picture.url) {
    await cloudinary.uploader.destroy(foundApplicant.picture.fileName);
  }
  let splitInterest = [...foundApplicant.interest];

  if (data && data.interest) {
    splitInterest = data.interest.split(',');
  }

  foundApplicant.picture = req.file
    ? {
        url: req.file.path,
        fileName: req.file.filename,
      }
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
  foundApplicant.address = data.address ? data.address : foundApplicant.address;
  foundApplicant.city = data.city ? data.city : foundApplicant.city;
  foundApplicant.state = data.state ? data.state : foundApplicant.state;
  foundApplicant.zip = data.zip ? data.zip : foundApplicant.zip;
  foundApplicant.phone = data.phone ? data.phone : foundApplicant.phone;
  foundApplicant.gender = data.gender ? data.gender : foundApplicant.gender;
  foundApplicant.details = data.details ? data.details : foundApplicant.details;
  foundApplicant.dateOfBirth = data.dateOfBirth
    ? new Date(data.dateOfBirth).toISOString()
    : foundApplicant.dateOfBirth;
  foundApplicant.outOfTown = data.outOfTown;
  foundApplicant.workShifts = data.workShifts;
  foundApplicant.autoRemind = data.autoRemind;
  foundApplicant.autoSend = data.autoSend;
  foundApplicant.headhunterProgram = data.headhunterProgram;
  foundApplicant.interest = splitInterest
    ? splitInterest
    : foundApplicant.interest;
  foundApplicant.skills = data.skills ? data.skills : foundApplicant.skills;

  if (data.education) {
    if (data.index) {
      foundApplicant.education[data.index] = data.education;
    } else {
      foundApplicant.education.push(data.education);
    }
  }

  if (data.experience) {
    if (data.index) {
      foundApplicant.experience[data.index] = data.experience;
    } else {
      foundApplicant.experience.push(data.experience);
    }
  }

  if (data.certification) {
    if (data.index) {
      foundApplicant.certification[data.index] = data.certification;
    } else {
      foundApplicant.certification.push(data.certification);
    }
  }

  try {
    await foundApplicant.save();
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  return res.status(200).json({ foundApplicant: foundApplicant });
};

const updateApplicantResume = async (req, res, next) => {
  const applicantId = req.params.applicantid;
  let foundApplicant;
  try {
    foundApplicant = await Applicant.findById(applicantId);
  } catch (err) {
    return next(
      new HttpError('Retreiving applicant error. Please try again later', 500)
    );
  }

  if (!foundApplicant) {
    return next(new HttpError('Applicant not found.', 500));
  }

  if (foundApplicant.resume.url) {
    await cloudinary.uploader.destroy(foundApplicant.resume.fileName);
  }

  foundApplicant.resume = req.file
    ? {
        url: req.file.path,
        fileName: req.file.filename,
      }
    : foundApplicant.resume;

  try {
    await foundApplicant.save();
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  return res.status(200).json({ message: 'resume uploaded successfuly' });
};

const updateCompanyProfile = async (req, res, next) => {
  const companyId = req.params.companyid;

  const data = req.body;

  let foundCompany;

  try {
    foundCompany = await Company.findOne({
      email: data.email,
      _id: { $ne: companyId },
    });
    if (!foundCompany)
      foundCompany = await Applicant.findOne({ email: data.email });
    if (!foundCompany)
      foundCompany = await Admin.findOne({ email: data.email });
  } catch (err) {
    const error = new HttpError(
      'Failed checking email. Please try again later',
      500
    );
    return next(error);
  }

  if (foundCompany) {
    const error = new HttpError(
      'Email already exist. Please use another email',
      500
    );
    return next(error);
  }

  try {
    foundCompany = await Company.findOne({ _id: companyId });
  } catch (err) {
    const error = new HttpError(
      'Something went wrong. Please try again later',
      500
    );
    return next(error);
  }

  if (foundCompany.logo.url) {
    await cloudinary.uploader.destroy(foundCompany.logo.fileName);
  }

  foundCompany.logo = req.file
    ? {
        url: req.file.path,
        fileName: req.file.filename,
      }
    : foundCompany.logo;
  foundCompany.companyName = data.companyName
    ? data.companyName
    : foundCompany.companyName;
  foundCompany.email = data.email ? data.email : foundCompany.email;
  foundCompany.picName = data.picName ? data.picName : foundCompany.picName;
  foundCompany.picJobTitle = data.picJobTitle
    ? data.picJobTitle
    : foundCompany.picJobTitle;
  foundCompany.picEmail = data.picEmail ? data.picEmail : foundCompany.picEmail;
  foundCompany.picOfficePhone = data.picOfficePhone
    ? data.picOfficePhone
    : foundCompany.picOfficePhone;
  foundCompany.picPhone = data.picPhone ? data.picPhone : foundCompany.picPhone;
  foundCompany.address = data.address ? data.address : foundCompany.address;
  foundCompany.industry = data.industry ? data.industry : foundCompany.industry;
  foundCompany.emailRecipient = data.emailRecipient
    ? data.emailRecipient
    : foundCompany.emailRecipient;
  foundCompany.website = data.website ? data.website : foundCompany.website;
  foundCompany.NPWP = data.NPWP ? data.NPWP : foundCompany.NPWP;
  foundCompany.briefDescriptions = data.briefDescriptions
    ? data.briefDescriptions
    : foundCompany.briefDescriptions;

  try {
    await foundCompany.save();
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  return res.status(200).json({ foundCompany: foundCompany });
};

const deleteSegment = async (req, res, next) => {
  const { applicantId, segment, index, elementId } = req.body;

  let foundApplicant;
  try {
    foundApplicant = await Applicant.findById(applicantId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong. Cannot delete the feed',
      500
    );
    return next(error);
  }

  if (!foundApplicant) {
    const error = new HttpError('No applicant found', 404);
    return next(error);
  }

  const filteredSegment = foundApplicant[segment].filter(
    (el) => el._id.toString() !== elementId
  );
  foundApplicant[segment] = filteredSegment;

  try {
    await foundApplicant.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Something went wrong. Cannot delete the segment at the moment',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'successfully delete segment element!' });
};

const forgotPwd = async (req, res, next) => {
  const userEmail = req.body.email;

  let foundUser;
  try {
    foundUser = await Applicant.findOne({ email: userEmail });
    if (!foundUser) {
      foundUser = await Company.findOne({ email: userEmail });
    }
  } catch (err) {
    const error = new HttpError(
      'Something went wrong. Cannot retreive any users',
      500
    );
    return next(error);
  }

  if (!foundUser) {
    const error = new HttpError(
      'There is no user with that email, please try again',
      404
    );
    return next(error);
  }

  const token = crypto.randomBytes(20).toString('hex');

  foundUser.resetPasswordToken = token;
  foundUser.resetPasswordExpire = moment().add(60, 'm');

  try {
    await foundUser.save();
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  const smptTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'crossbellcorps@gmail.com',
      pass: process.env.MAILPASS,
    },
  });

  const mailOptions = {
    to: userEmail,
    from: 'crossbellcorps@gmail.com',
    subject: '<Crossbell> Account Password Reset Request',
    html: `
		<h2>Password Reset Instruction</h2>
		<hr/>
		<p>Hello ${foundUser.firstName} ${foundUser.lastName},</p>
		<p>You are receiving this because you (or someone else) have requested to reset your Crossbell account's password.</p>
		<p>Please click on the following link, or paste this onto your browser to complete the process.</p> 
		<p><strong><a href='http://localhost:3000/reset/${token}'>Click For Resetting Your Password</a></strong><p/>
		<p>This link will only valid for <strong>1 hour</strong>.</p>
		<p>If you did not request this, please ignore this email and your password will remain unchanged</p>`,
  };

  try {
    await smptTransport.sendMail(mailOptions);
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }
  res.status(200).json({
    message: `An email has been sent to ${userEmail} with further instructions.`,
  });
};

const checkResetToken = async (req, res, next) => {
  const { token } = req.params;

  let foundUser;

  try {
    foundUser = await Applicant.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: new Date() },
    });
    if (!foundUser) {
      foundUser = await Company.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: new Date() },
      });
    }
  } catch (err) {
    const error = new HttpError(
      'Retreiveng user failed, please try again later',
      500
    );
    return next(error);
  }

  if (!foundUser) {
    const error = new HttpError(
      'Password reset token invalid or has expired',
      500
    );
    return next(error);
  }

  res.status(200).json({ tokenIsValid: true, foundUser });
};

const resetPwd = async (req, res, next) => {
  const { newPassword, confirmPassword } = req.body;
  const { token } = req.params;

  let foundUser;

  try {
    foundUser = await Applicant.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: new Date() },
    });
    if (!foundUser) {
      foundUser = await Company.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: new Date() },
      });
    }
  } catch (err) {
    const error = new HttpError(
      'Retreiveng user failed, please try again later',
      500
    );
    return next(error);
  }

  if (!foundUser) {
    const error = new HttpError(
      'Password reset token invalid or has expired',
      500
    );
    return next(error);
  }

  if (newPassword === confirmPassword) {
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(newPassword, 12);
    } catch (err) {
      const error = new HttpError(
        'Could not change password, please try again',
        500
      );
      return next(error);
    }
    foundUser.password = hashedPassword;
    foundUser.resetPasswordToken = undefined;
    foundUser.resetPasswordExpire = undefined;

    try {
      await foundUser.save();
    } catch (err) {
      const error = new HttpError(
        'Could not save new password. Please input a valid value',
        500
      );
      return next(error);
    }

    let token;
    try {
      token = jwt.sign(
        {
          userId: foundUser._id,
          email: foundUser.email,
          isCompany: foundUser.isCompany,
        },
        'one_batch_two_batch_penny_and_dime',
        { expiresIn: '3h' }
      );
    } catch (err) {
      const error = new HttpError(
        'Could not generate token, please try again',
        500
      );
      return next(error);
    }
    res.status(200).json({
      userId: foundUser.id,
      email: foundUser.email,
      isCompany: foundUser.isCompany,
      isActive: foundUser.isActive || false,
      token,
    });
  } else {
    const error = new HttpError('Password do not match', 500);
    return next(error);
  }
};

const getApplicantAppliedJobs = async (req, res, next) => {
  const applicantId = req.params.applicantid;

  let foundApplicant;

  try {
    foundApplicant = await Applicant.findById(applicantId).populate({
      path: 'jobsApplied',
      populate: {
        path: 'companyId',
        model: 'Company',
      },
    });
  } catch (err) {
    return next(
      new HttpError(
        'Fetching applicant & jobs applied data failed. Please try again',
        500
      )
    );
  }

  res.status(200).json({
    Jobs: foundApplicant.jobsApplied.map((job) =>
      job.toObject({ getters: true })
    ),
  });
};

exports.forgotPwd = forgotPwd;
exports.checkResetToken = checkResetToken;
exports.resetPwd = resetPwd;
exports.deleteSegment = deleteSegment;
exports.getAllCompany = getAllCompany;
exports.getAllApplicant = getAllApplicant;
exports.getApplicantDetails = getApplicantDetails;
exports.getCompanyDetails = getCompanyDetails;
exports.signup = signup;
exports.login = login;
exports.googleLogin = googleLogin;
exports.updateApplicantProfile = updateApplicantProfile;
exports.updateApplicantResume = updateApplicantResume;
exports.updateCompanyProfile = updateCompanyProfile;
exports.getFeedback = getFeedback;
exports.createFeedback = createFeedback;
exports.getApplicantAppliedJobs = getApplicantAppliedJobs;
