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
schedule.scheduleJob('0 0 * * 1', cronControllers.createPromo); //Every Monday at 00.00 refresh promo
schedule.scheduleJob('0 0 * * *', cronControllers.notificationCleanUp()); //Every Day at 00.00 clean notification
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
  .connect(
    // `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@crossbelldb.fiwox.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    // `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@crossbelldb-shard-00-00.fiwox.mongodb.net:27017,crossbelldb-shard-00-01.fiwox.mongodb.net:27017,crossbelldb-shard-00-02.fiwox.mongodb.net:27017/${process.env.DB_NAME}?ssl=true&replicaSet=atlas-13v3tm-shard-0&authSource=admin&retryWrites=true&w=majority`,
    // `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1ncnh.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0-shard-00-00.1ncnh.mongodb.net:27017,cluster0-shard-00-01.1ncnh.mongodb.net:27017,cluster0-shard-00-02.1ncnh.mongodb.net:27017/${process.env.DB_NAME}?ssl=true&replicaSet=atlas-99le7k-shard-0&authSource=admin&retryWrites=true&w=majority`,

    // 'mongodb://localhost/crossbelldev',
    {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    app.listen(process.env.PORT || 5000);
    console.log('Server is listening. Connected to the database');
  })
  .catch((err) => {
    console.log(err);
  });
