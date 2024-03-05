const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const cron = require('node-cron');
const childProcess = require('child_process');

const app = express();

app.listen(4000, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Server Started Successfully.");
  }
});

mongoose               
  .connect("mongodb://root:example@mongodb:27017/sjce_leave?authMechanism=DEFAULT&authSource=admin", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connection Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);


app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use("/", authRoutes);

cron.schedule('50 22 * * *', () => {
  console.log('Running addNewDayDocument script...');
  childProcess.exec('npm run addNewDayDocument', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running addNewDayDocument script: ${error.message}`);
      return;
    }
    console.log(stdout);
  });
});
