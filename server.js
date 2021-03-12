if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const schedule = require('node-schedule');

const jobsRoutes = require('./routes/jobs-routes');
const usersRoutes = require('./routes/users-routes');
const adminRoutes = require('./routes/admin-routes');

const cronControllers = require('./controllers/cron-controllers');
const HttpError = require('./models/http-error');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.options((req, res, next) => {
// 	res.setHeader('Access-Control-Allow-Origin', '*');
// 	res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token');
// 	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
// 	res.setHeader('Access-Control-Allow-Credentas', 'true');
// 	next();
// });

app.use(
	cors({
		origin: [ 'https://crossbell.web.app', 'http://localhost:3000' ],
		credentials: true
	})
);

app.use('/api/jobs', jobsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/alphaomega', adminRoutes);

schedule.scheduleJob('0 15 * * *', cronControllers.autoRemindExec);
schedule.scheduleJob('0 14 * * *', cronControllers.autoSendExec);
schedule.scheduleJob('0 0 * * 1', cronControllers.createPromo);

app.use((req, res, next) => {
	throw new HttpError('Could not find the requested route', 404);
});

app.use((error, req, res, next) => {
	if (res.headerSent) {
		return next(error);
	}

	res.status(error.code || 500);
	res.json({ message: error.message || 'An unknown error occurred' });
});
//==================================================================================

mongoose
	.connect(
		`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@crossbelldb.fiwox.mongodb.net/${process.env
			.DB_NAME}?retryWrites=true&w=majority`,
		// `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1ncnh.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
		// 'mongodb://localhost/crossbelldev',
		{
			useNewUrlParser: true,
			useFindAndModify: false,
			useCreateIndex: true,
			useUnifiedTopology: true
		}
	)
	.then(() => {
		app.listen(process.env.PORT || 5000);
		console.log('Server is listening. Connected to the database');
	})
	.catch(err => {
		console.log(err);
	});
