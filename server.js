if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const schedule = require('node-schedule');

const jobsRoutes = require('./routes/jobs-routes');
const usersRoutes = require('./routes/users-routes');
const adminRoutes = require('./routes/admin-routes');

const cronControllers = require('./controllers/cron-controllers');
const { cleanUpNotification } = require('./controllers/notification-controller');
const HttpError = require('./models/http-error');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

app.use('/api/jobs', jobsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/alphaomega', adminRoutes);

schedule.scheduleJob('0 15 * * *', cronControllers.autoRemindExec); //Every Day at 15.00 autoRemind
schedule.scheduleJob('0 14 * * *', cronControllers.autoSendExec); //Every Day at 14.00 autoSend
schedule.scheduleJob('0 0 * * *', cronControllers.slotExpCheck()); //Every Day at 00.00 check slot expiration date
schedule.scheduleJob('0 1 * * *', cleanUpNotification()); //Every Day at 01.00 check notification expiration date
schedule.scheduleJob('0 0 * * 1', cronControllers.createPromo); //Every Monday at 00.00 refresh promo
cronControllers.createPromo();

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
  .connect(process.env.DB_AUTHENTICATION, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(process.env.PORT || 5000);
    console.log('Server is listening. Connected to the database');
  })
  .catch((err) => {
    console.log(err);
  });
