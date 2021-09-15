const Applicant = require('../models/applicant-model');
const Company = require('../models/company-model');
const Job = require('../models/job-model');
const Promo = require('../models/promo-model');
const Admin = require('../models/admin-model');
const SlotReg = require('../models/slotreg-model');
const HttpError = require('../models/http-error');
const moment = require('moment');
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API);

const applyJobTemplate = require('../assets/htmlJobApplicationTemplate');

const autoRemindExec = async () => {
  let foundApplicants;
  try {
    foundApplicants = await Applicant.find({ autoRemind: true }, 'firstName lastName email autoRemind interest headline jobsReminded');
  } catch (err) {
    console.log(err);
    return new HttpError('Could not fetch Applicants. Please try again later', 500);
  }

  if (!foundApplicants) {
    return new HttpError('Applicant is empty', 500);
  }
  for (const app of foundApplicants) {
    let foundJobs;
    try {
      foundJobs = await Job.find(
        {
          _id: { $nin: app.jobsReminded },
          fieldOfWork: app.interest,
          expiredDate: { $gte: moment() },
        },
        'jobTitle fieldOfWork placementLocation'
      ).populate('companyId', 'companyName');
    } catch (err) {
      console.log(err);
      return new HttpError('Could not fetch Jobs. Please try again later', 500);
    }
    if (foundJobs && foundJobs.length > 0) {
      let jobLists = '';
      for (const job of foundJobs) {
        jobLists =
          jobLists +
          `<li><a href='http://localhost:3000/jobs/${job._id}'><strong>${job.jobTitle}</strong></a> - ${job.placementLocation}, by ${job.companyId.companyName} (<em>${job.fieldOfWork}</em>)</li>`;
        app.jobsReminded.push(job);
      }
      const emailData = {
        to: app.email,
        from: 'crossbellcorps@gmail.com',
        subject: `<Crossbell> New Jobs You Might Interested ${moment().format('LL')}`,
        html: `This email is intended for ${app.firstName} ${app.lastName})
					<p>Below is a list of new posted job(s) that match your interest</p>
					<p>Click the link on certain job to see the job's detail</p>
					<ul style="list-style: none;">${jobLists}</ul>
					<br/>
					<br/>
					<p>To stop receiving this email, you can deactivate Jobs Auto Reminder by click <a href='#'>this link</a> and follow the next procedure.</p>
					`,
      };

      try {
        await sgMail.send(emailData);
        await app.save();
        console.log('Success');
      } catch (err) {
        console.log(err);
        return new HttpError('Sending job reminder failed. Please try again later', 500);
      }
    } else {
      console.log('foundJob is empty');
    }
  }
};

const autoSendExec = async () => {
  let foundApplicants;
  try {
    foundApplicants = await Applicant.find({ autoSend: true }, '-password');
  } catch (err) {
    console.log(err);
    return new HttpError('Could not fetch Applicants. Please try again later', 500);
  }

  for (const app of foundApplicants) {
    let foundJobs;
    try {
      foundJobs = await Job.find(
        {
          _id: { $nin: app.jobsApplied },
          fieldOfWork: app.interest,
          expiredDate: { $gte: moment() },
        },
        'jobTitle fieldOfWork placementLocation jobApplicants emailRecipient'
      ).populate('companyId', 'companyName');
    } catch (err) {
      console.log(err);
      return new HttpError('Could not fetch Jobs. Please try again later', 500);
    }

    if (foundJobs && foundJobs.length > 0) {
      for (const job of foundJobs) {
        const payload = {
          companyName: job.companyId.companyName || '-',
          avatarUrl: app.picture.url || 'User has not posted any photo yet',
          firstName: app.firstName || '-',
          lastName: app.lastName || '-',
          dateOfBirth: app.dateOfBirth,
          gender: app.gender || '-',
          email: app.email || '-',
          address: app.address || '-',
          phone: app.phone || '-',
          outOfTown: app.outOfTown,
          workShifts: app.workShifts,
          headline: app.headline || '-',
          experience: app.experience,
          education: app.education,
          certification: app.certification,
          skills: app.skills,
        };

        const htmlBody = applyJobTemplate(payload);

        const emailData = {
          to: job.emailRecipient,
          from: 'crossbellcorps@gmail.com',
          subject: `<Crossbell> Application for ${job.jobTitle} - ${app.firstName} ${app.lastName}`,
          html: htmlBody,
        };

        try {
          const sess = await mongoose.startSession();
          sess.startTransaction();
          job.jobApplicants.push(app);
          app.jobsApplied.push(job);
          await job.save({ session: sess });
          await app.save({ session: sess });
          await sgMail.send(emailData);
          sess.commitTransaction();
          console.log('success');
        } catch (err) {
          console.log(err);
          return new HttpError('Applying for job failed. Please try again later', 500);
        }
      }
    } else {
      console.log('foundJob is empty');
    }
  }
};

const createPromo = async (req, res, next) => {
  let foundPromo;
  try {
    foundPromo = await Promo.find();
  } catch (err) {
    return new HttpError('Fetching promo failed, please try again later', 500);
  }

  if (foundPromo[0] && foundPromo.length === 1) {
    if (!foundPromo[0].promoReg) {
      foundPromo[0].promoReg = 0;
      await foundPromo[0].save();
    } else if (!foundPromo[0].promoBC) {
      foundPromo[0].promoBC = 0;
      await foundPromo[0].save();
    }
  }

  if (foundPromo.length < 1) {
    foundPromo = new Promo({
      promoReg: 0,
      promoBC: 0,
    });
    await foundPromo.save();
  }

  if (foundPromo.length > 1) {
    await Promo.deleteMany({});
    foundPromo = new Promo({
      promoReg: 0,
      promoBC: 0,
    });
    await foundPromo.save();
  }
};

const notificationCleanUp = async () => {
  let foundAdmins = [];
  try {
    foundAdmins = await Admin.find();
  } catch (err) {
    console.log(err);
  }

  for (const admin of foundAdmins) {
    const cleanedUpNotification = admin.notifications.filter(notif => {
      const today = moment();
      const notificationDate = moment(notif.date);
      const daySinceNotificationDate = today.diff(notificationDate, 'days');
      const inTheLastTwoWeeks = daySinceNotificationDate <= 14;
      return inTheLastTwoWeeks;
    });
    admin.notifications = cleanedUpNotification;
    admin.save();
  }
};

const slotExpCheck = async () => {
  let foundSlotReg = [];
  try {
    foundSlotReg = await SlotReg.find();
  } catch (err) {
    console.log(err);
  }

  for (const slot of foundSlotReg) {
    const today = moment();
    const expirationDate = moment(slot.slotExpirationDate);
    const expirationDueDate = today.diff(expirationDate, 'days');
    if (expirationDueDate > 0) {
      slot.status = 'Expired';
      slot.save();
    }
  }

  // foundSlotReg.map((slot, i) => {
  //   const today = moment();
  //   const expirationDate = moment(slot.slotExpirationDate);
  //   const expirationDueDate = today.diff(expirationDate, 'days');
  //   if (expirationDueDate < 0) {
  //     slot.status = 'Expired';
  //     slot.save();
  //   }
  //   return slot;
  // });
};

exports.autoRemindExec = autoRemindExec;
exports.autoSendExec = autoSendExec;
exports.createPromo = createPromo;
exports.notificationCleanUp = notificationCleanUp;
exports.slotExpCheck = slotExpCheck;
