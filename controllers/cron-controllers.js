const Applicant = require('../models/applicant-model');
const Company = require('../models/company-model');
const Job = require('../models/job-model');
const HttpError = require('../models/http-error');
const moment = require('moment');
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API);

const autoRemindExec = async () => {
	let foundApplicants;
	try {
		foundApplicants = await Applicant.find({ autoRemind: true }, 'firstName lastName email autoRemind interest headline jobsReminded');
	} catch (err) {
		console.log(err);
		return new HttpError('Could not fetch Applicants. Please try again later', 500);
	}

	for (const app of foundApplicants) {
		let foundJobs;
		try {
			foundJobs = await Job.find(
				{ _id: { $nin: app.jobsReminded }, fieldOfWork: app.interest, expiredDate: { $gte: moment() } },
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
					`<li><a href='http://localhost:3000/jobs/${job._id}'><strong>${job.jobTitle}</strong></a> - ${job.placementLocation}, by ${job
						.companyId.companyName} (<em>${job.fieldOfWork}</em>)</li>`;
				app.jobsReminded.push(job);
			}
			const emailData = {
				to: app.email,
				from: 'crossbellcorps@gmail.com',
				subject: `Crossbell New Jobs Reminder ${moment().format('LL')}`,
				text: `This email is intended for ${app.firstName} ${app.lastName}, (${app.headline})`,
				html: `This email is intended for ${app.firstName} ${app.lastName}, (${app.headline})
					<ul style="list-style: none;">${jobLists}</ul>`
			};

			try {
				// await sgMail.send(emailData);
				// await app.save();
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
		foundApplicants = await Applicant.find({ autoSend: true }, 'firstName lastName email autoSend interest headline jobsApplied');
	} catch (err) {
		console.log(err);
		return new HttpError('Could not fetch Applicants. Please try again later', 500);
	}

	for (const app of foundApplicants) {
		let foundJobs;
		try {
			foundJobs = await Job.find(
				{ _id: { $nin: app.jobsApplied }, fieldOfWork: app.interest, expiredDate: { $gte: moment() } },
				'jobTitle fieldOfWork placementLocation jobApplicants emailRecipient'
			).populate('companyId', 'companyName');
		} catch (err) {
			console.log(err);
			return new HttpError('Could not fetch Jobs. Please try again later', 500);
		}

		if (foundJobs && foundJobs.length > 0) {
			for (const job of foundJobs) {
				const emailData = {
					to: job.emailRecipient,
					from: 'crossbellcorps@gmail.com',
					subject: `Crossbell Job Application from ${app.firstName} ${app.lastName}`,
					html: `
					<p><strong>${app.firstName} ${app.lastName}</strong> send an application for ${job.jobTitle}</p>
					<p>Below is the quick resume of <strong>${app.firstName} ${app.lastName}</strong></p>
					<p>Please check this email's attachment to see if there is additional CV/Resume from the candidate</p>
					`
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

exports.autoRemindExec = autoRemindExec;
exports.autoSendExec = autoSendExec;
