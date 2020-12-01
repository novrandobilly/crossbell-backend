require("dotenv").config();

const upload = require("./uploads/multer");
const cloudinary = require("./uploads/cloudinary");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const jobsRoutes = require("./routes/jobs-routes");
const usersRoutes = require("./routes/users-routes");
const adminRoutes = require("./routes/admin-routes");
const HttpError = require("./models/http-error");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/jobs", jobsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/alphaomega", adminRoutes);

// =============================== Image uploader ===================================

app.use("/api/image", upload.array("image"), async (req, res) => {
  const uploader = async (path) => await cloudinary.uploads(path, "Images");
  if (req.method === "POST") {
    const urls = [];

    const files = req.files;

    for (const file of files) {
      const { path } = file;
      const newPath = await uploader(path);
      urls.push(newPath);
      fs.unlinkSync(path);
    }
    res.status(200).json({
      message: "Image upload success",
      data: urls,
    });
  } else {
    res.status(405).json({ err: "Failed to upload image" });
  }
});

app.use((req, res, next) => {
  throw new HttpError("Could not find the requested route", 404);
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred" });
});
//==================================================================================

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1ncnh.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
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
    console.log("Server is listening. Connected to the database");
  })
  .catch((err) => {
    console.log(err);
  });
