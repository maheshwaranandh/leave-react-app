const { checkUser } = require("../middlewares/authMiddleware");
const { User, Request, File, Student } = require("../model/authModel");
const { handleErrors, createToken } = require("../controllers/authControllers");
const data = require("../../data/data.json");
const {
  drawTextOnPDF,
  addSignature,
  markLeaveApplied,
  convertDateFormat,
  getDatesBetween,
} = require("../helperFunctions/helperFunctions");
const fs = require("fs");
const { format } = require("date-fns");
const multer = require("multer");
const moment = require("moment");
const { log } = require("console");

// Read the PDF file as a buffer
const pdfBytes = fs.readFileSync("./177.pdf");

const router = require("express").Router();
const maxAge = 3 * 24 * 60 * 60;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/update", async (req, res) => {
  const studentNameToUpdate = "Vijay Bala A";
  const departToUpdate = "CSE";
  const sectionToUpdate = "C";
  const datesToUpdate = ["2024-01-21", "2024-01-22"]; // Add your array of dates

  // Your update data
  const newData = {
    $set: {
      "students.$[elem].leaveApplied": true, // Update leaveApplied to true

      // Add other fields you want to update
    },
  };

  // Use updateMany to update the document
  Student.updateMany(
    {
      depart: departToUpdate,
      section: sectionToUpdate,
      date: { $in: datesToUpdate.map((date) => new Date(date)) },
      students: {
        $elemMatch: {
          name: studentNameToUpdate,
        },
      },
    },
    newData,
    {
      arrayFilters: [{ "elem.name": studentNameToUpdate }],
    },
    (err, result) => {
      if (err) {
        res.json({ status: false });
      } else {
        res.json({ status: true });
      }
    }
  );
});

router.post("/leaveIndividual", async (req, res) => {
  Student.aggregate([
    {
      $unwind: "$students",
    },
    {
      $match: {
        "students.name": req.body.name,
        "students.present": false,
      },
    },
    {
      $group: {
        _id: null,
        leaveDates: { $addToSet: "$date" },
      },
    },
  ])
    .then((result) => {
      let leaveDates = result.length > 0 ? result[0].leaveDates : [];
      leaveDates = leaveDates.map((leave) => {
        return format(leave, "yyyy-MM-dd");
      });
      res.json({ status: true, result: leaveDates });
    })
    .catch((error) => {
      console.error("Error fetching leave dates:", error);
      res.json({ status: false });
    });
});

router.post("/getAbsentees", async (req, res) => {
  const { day } = req.query;
  const regisnos = await Student.aggregate([
    {
      $match: {
        date: new Date(day),
        depart: req.body.depart,
        section: req.body.section,
        batch: req.body.batch,
      },
    },
    {
      $unwind: "$students",
    },
    {
      $match: {
        "students.present": false,
      },
    },
    {
      $group: {
        _id: null,
        regisnos: { $addToSet: "$students.regisno" },
      },
    },
    {
      $project: {
        _id: 0,
        regisnos: 1,
      },
    },
  ]);

  const result = regisnos.length > 0 ? regisnos[0].regisnos : [];
  console.log(result);
  res.json({ status: true, regisnos: result });
});
router.post("/handleAbsentees", async (req, res) => {
  // updating the students to present true

  Student.updateMany(
    {
      date: new Date(req.body.date),
      depart: req.body.depart,
      section: req.body.section,
      batch: req.body.batch,
      "students.regisno": { $in: req.body.presentees },
    },
    {
      $set: {
        "students.$[elem].present": true,
      },
    },
    {
      arrayFilters: [{ "elem.regisno": { $in: req.body.presentees } }],
    },
    (innerError, innerResult) => {
      if (innerError) {
        console.error("Error updating present students:", innerError);
        res.json({ status: false });
      } else {
        // updating the students to present false
        Student.updateMany(
          {
            date: new Date(req.body.date),
            depart: req.body.depart,
            section: req.body.section,
            batch: req.body.batch,
            "students.regisno": { $in: req.body.absentees },
          },
          {
            $set: {
              "students.$[elem].present": false,
              enrolled: true,
            },
          },
          {
            arrayFilters: [{ "elem.regisno": { $in: req.body.absentees } }],
          },
          (error, result) => {
            if (error) {
              console.error("Error updating absent students:", error);
              res.json({ status: false });
            } else {
              res.json({ status: true, info: req.body.absentees });
            }
          }
        );
      }
    }
  );
});

router.post("/departDetails", async (req, res) => {
  const aggregationPipeline = [
    {
      $match: {
        depart: req.body.depart,
      },
    },
    {
      $unwind: "$students",
    },
    {
      $match: {
        "students.present": false,
      },
    },
    {
      $sort: {
        "students.regisno": 1,
      },
    },
    {
      $group: {
        _id: {
          name: "$students.name",
          batch: "$batch",
          section: "$section", // Include section in the grouping key
        },
        regisno: { $first: "$students.regisno" },
        rollno: { $first: "$students.rollno" },
        data: {
          $push: {
            date: { $dateToString: { format: "%d.%m.%Y", date: "$date" } },
            leaveReason: "$students.leaveReason",
            leaveCategory: "$students.leaveCategory",
            leaveRequestId: "$students.leaveRequestId",
            leaveApplied: "$students.leaveApplied",
            leaveApproved: "$students.leaveApproved",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        name: "$_id.name",
        batch: "$_id.batch",
        section: "$_id.section", // Project the section field
        regisno: 1,
        rollno: 1,
        data: 1,
      },
    },
  ];

  // Assuming your model is named StudentModel
  Student.aggregate(aggregationPipeline, (err, result) => {
    if (err) {
      console.error(err);
      res.json({ err: err });
    } else {
      const output = result.reduce(
        (acc, { name, batch, section, regisno, rollno, data }) => {
          const key = `${name}`; // Combine name, batch, and section to create a unique key
          acc[key] = { regisno, rollno, data, batch, section };
          return acc;
        },
        {}
      );
      console.log({ result: output });
      res.json({ status: true, result: output });
    }
  });
});

router.post("/classDetails", async (req, res) => {
  const aggregationPipeline = [
    {
      $match: {
        section: req.body.section,
        depart: req.body.depart,
        batch: req.body.batch,
      },
    },
    {
      $unwind: "$students",
    },
    {
      $match: {
        "students.present": false,
      },
    },
    {
      $sort: {
        "students.regisno": 1,
      },
    },
    {
      $group: {
        _id: "$students.name",
        regisno: { $first: "$students.regisno" },
        rollno: { $first: "$students.rollno" },
        data: {
          $push: {
            date: { $dateToString: { format: "%d.%m.%Y", date: "$date" } },
            leaveReason: "$students.leaveReason",
            leaveCategory: "$students.leaveCategory",
            leaveRequestId: "$students.leaveRequestId",
            leaveApplied: "$students.leaveApplied",
            leaveApproved: "$students.leaveApproved",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        name: "$_id",
        regisno: 1,
        rollno: 1,
        data: 1,
      },
    },
  ];

  // Assuming your model is named StudentModel
  Student.aggregate(aggregationPipeline, (err, result) => {
    if (err) {
      console.error(err);
      res.json({ err: err });
    } else {
      const output = result.reduce((acc, { name, regisno, rollno, data }) => {
        acc[name] = { regisno, rollno, data };
        return acc;
      }, {});
      console.log({ result: output });
      res.json({ status: true, result: output });
    }
  });
});

router.get("/insertDoc", async (req, res) => {
  const date = new Date();
  await Student.create({
    date: format("2024-01-20", "yyyy-MM-dd"),
    depart: "CSE",
    section: "C",
    batch: 2021,
    students: [
      {
        name: "Saii Varun M R",
        rollno: "21cs234",
        regisno: 312321104142,
        present: true,
        leaveReason: "",
        leaveCategory: "",
        leaveRequestId: "",
        leaveApplied: false,
        leaveApproved: false,
      },
      {
        name: "Vijay Bala A",
        rollno: "21cs213",
        regisno: 312321104192,
        present: true,
        leaveReason: "",
        leaveCategory: "",
        leaveRequestId: "",
        leaveApplied: false,
        leaveApproved: false,
      },
      {
        name: "Rupesh A",
        rollno: "21cs200",
        regisno: 312321104136,
        present: true,
        leaveReason: "",
        leaveCategory: "",
        leaveRequestId: "",
        leaveApplied: false,
        leaveApproved: false,
      },
      // Add more students as needed
    ],
    enrolled: false,
  }).then((result) => {
    console.log("Document Inserted!!!");
    res.json({ status: true, result: result });
  });
});

router.post("/", checkUser);
router.post("/login", async (req, res) => {
  const { regis, password } = req.body;
  try {
    const user = await User.findOne({ regisno: regis });
    if (user) {
      if (user.password === password) {
        console.log("user: ", user);
        console.log(password);
        const token = createToken(user._id);
        res.cookie("jwt", token, { httpOnly: false, maxAge: maxAge * 1000 });
        res.status(200).json({ user: user._id, role: user.role, status: true });
      } else {
        throw Error("incorrect password");
      }
    } else {
      throw Error("incorrect Register No");
    }
  } catch (err) {
    const errors = handleErrors(err);
    res.json({ errors, status: false });
  }
});

router.post("/input", async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    drawTextOnPDF(pdfBytes, user, req.body).then(async (modifiedPdfBuffer) => {
      // create the request Doc
      console.log("INPUT");

      const newRequest = new Request({
        userDetail: [user.name, user.depart, user.section],
        userId: req.body.userId,
        reason: req.body.reason,
        singleDate: req.body.selectedDate,
        fromDate: req.body.startDate,
        toDate: req.body.endDate,
        pdfUrl: modifiedPdfBuffer,
        leaveType: req.body.leaveType,
        messageByCon: " ",
        messageByHOD: " ",
        conVerified: false,
        hodVerified: false,
      });
      newRequest
        .save()
        .then(async (result) => {
          // Put absent for him in Student collection
          res.json({ status: true, result: result });
        })
        .catch((error) => {
          console.log("error paaa");
          res.json({ status: false });
        });
    });
  } catch (err) {
    console.log(err);
    res.json({ status: false, errors: err });
  }
});
router.post("/upload", upload.array("files"), async (req, res) => {
  try {
    const files = req.files;

    for (let i = 0; i < files.length; i++) {
      await File.create({
        filename: files[i].originalname,
        contentType: files[i].mimetype,
        data: Buffer.from(files[i].buffer, "base64"),
        fileDetails: req.body.fileDetails[i],
        commonId: req.body.commonId,
      });
    }
    console.log("success file upload");
    res.json({ status: true });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.json({ status: false });
  }
});
router.post("/hodrequestPage", async (req, res) => {
  try {
    const requests = await Request.find({
      userDetail: { $all: [req.body.depart] },
      conVerified: true,
      hodVerified: false,
      result: " ",
    });
    console.log(requests.length);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=file.bin`);
    res.json({
      status: true,
      requests: requests,
    });
  } catch (err) {
    res.json({
      status: false,
      errors: err,
    });
  }
});
router.post("/requestPage", async (req, res) => {
  try {
    const arrayClass = req.body.class.split(" ");
    console.log(arrayClass);
    const requests = await Request.find({
      userDetail: { $all: [arrayClass[0], arrayClass[1]] },
      conVerified: false,
      hodVerified: false,
      result: " ",
    });
    console.log(requests.length);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=file.bin`);
    res.json({
      status: true,
      requests: requests,
    });
  } catch (err) {
    res.json({
      status: false,
      errors: err,
    });
  }
});

router.post("/getDocsForRequestId", async (req, res) => {
  let files = await File.find({ commonId: req.body.id });
  for (let fileObject of files) {
    // fileObject.data=Buffer.from(fileObject.data).toString('base64')
    // fileObject.fileDetails="hellosai"
    res.setHeader("Content-Type", fileObject.contentType);
  }
  res.setHeader("Content-Disposition", `inline; filename=hello`);
  if (files) {
    res.json({ status: true, files: files });
  } else {
    res.json({ status: false });
  }
}).data;

router.post("/convertTobase64", async (req, res) => {
  console.log(req.body);
  const d = Buffer.from(req.body.data, "base64");
  res.json({ image: d });
});

router.post("/messagePage", async (req, res) => {
  try {
    const ID = req.body.userId;
    const messages = await Request.find({
      userId: ID,
      $or: [{ result: "Accepted" }, { result: "Rejected" }],
    });
    res.json({ status: true, messages: messages });
  } catch (err) {
    res.json({
      status: false,
      errors: err,
    });
  }
});

const updateStudentsBasedOnRequests = async (requestId) => {
  try {
    // Step 1: Retrieve requests based on IDs
    console.log(requestId);
    const requests = await Request.find({ _id: { $in: requestId } });

    // Step 2: Extract necessary information from each request
    const updateOperations = requests.map((request) => {
      const { userDetail } = request;
      let datesToUpdate = [];
      if (request.singleDate === " ") {
        datesToUpdate.push(
          ...getDatesBetween(
            convertDateFormat(request.fromDate),
            convertDateFormat(request.toDate)
          )
        );
      } else {
        datesToUpdate.push(convertDateFormat(request.singleDate));
      }
      console.log(datesToUpdate);
      // Prepare the update operation for each student
      return {
        updateOne: {
          filter: {
            "students.name": userDetail[0],
            depart: userDetail[1],
            section: userDetail[2],
            // Add the condition for the specific date
            date: { $in: datesToUpdate.map((d) => new Date(d)) },
          },
          update: {
            $set: {
              "students.$.leaveApproved": true,
            },
          },
        },
      };
    });

    // Step 3: Use bulkWrite to execute all update operations
    const result = await Student.bulkWrite(updateOperations);

    console.log(result);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

router.post("/handleStudentSchema", async (req, res) => {
  try {
    console.log(req.body.selectedRequests);
    const result = updateStudentsBasedOnRequests(req.body.selectedRequests);
    res.json({ status: true, result: result });
  } catch (err) {
    res.json({ status: false });
  }
});

router.post("/handleAcceptAll", async (req, res) => {
  try {
    let selectedIds = req.body.selectedRequests;
    for (let index = 0; index < selectedIds.length; index++) {
      const id = selectedIds[index];
      const requestDoc = await Request.findById(id);
      addSignature(
        requestDoc.pdfUrl,
        req.body.role,
        req.body.selectedStaff
      ).then(async (modifiedPdfBuffer) => {
        const r = await Request.updateOne(
          { _id: id },
          {
            $set: {
              pdfUrl: modifiedPdfBuffer,
              hodVerified: true,
              result: "Accepted",
              messageByHOD: "NA",
            },
          }
        );
        console.log(r);
      });
    }
    res.json({ status: true });
  } catch (err) {
    console.log(err);
    res.json({ status: false, errors: err });
  }
});

router.post("/handleStatus", async (req, res) => {
  try {
    console.log(req.body.status);
    const requestDoc = await Request.findById(req.body.requestId);
    if (req.body.status === "accept") {
      // add selectedStaff sign to the requested pdf
      console.log("Councellor: ", req.body.selectedStaff);
      console.log("Role: ", req.body.role);

      addSignature(
        requestDoc.pdfUrl,
        req.body.role,
        req.body.selectedStaff
      ).then(async (modifiedPdfBuffer) => {
        if (req.body.role === "councellor") {
          const r = await Request.updateOne(
            { _id: req.body.requestId },
            {
              $set: {
                pdfUrl: modifiedPdfBuffer,
                conVerified: true,
                messageByHod: req.body.messageByFaculty,
              },
            }
          );
          console.log(r);
          console.log(req.body.role);
        } else if (req.body.role === "hod") {
          const r = await Request.updateOne(
            { _id: req.body.requestId },
            {
              $set: {
                pdfUrl: modifiedPdfBuffer,
                hodVerified: true,
                messageByCon: req.body.messageByFaculty,
              },
            }
          );
          console.log(r);
          console.log(req.body.role);
        }
      });
    }
    console.log(req.body.role);
    // updating the fields of the request doc after councellor verified
    const result = await Request.updateOne(
      { _id: req.body.requestId },
      {
        $set: {
          result:
            req.body.status === "reject"
              ? "Rejected"
              : req.body.role === "hod"
              ? "Accepted"
              : " ",
          hodVerified: req.body.role === "hod" ? true : false,
          conVerified: true,
        },
      }
    );

    if (req.body.status === "accept" && req.body.role === "hod") {
      let datesToUpdate = [];
      if (requestDoc.singleDate === " ") {
        datesToUpdate.push(
          ...getDatesBetween(
            convertDateFormat(requestDoc.fromDate),
            convertDateFormat(requestDoc.toDate)
          )
        );
      } else {
        datesToUpdate.push(convertDateFormat(requestDoc.singleDate));
      }

      let out = markLeaveApplied(
        requestDoc.userDetail[0],
        requestDoc.userDetail[1],
        requestDoc.userDetail[2],
        requestDoc.reason,
        requestDoc.singleDate,
        requestDoc.fromDate,
        requestDoc.toDate,
        requestDoc._id,
        requestDoc.leaveType
      );
    }
    res.json({ status: true, result: result });
  } catch (err) {
    res.json({
      status: false,
      errors: err,
    });
  }
});

router.post("/fetchStudentDetails", async (req, res) => {
  try {
    const outputArray = req.body.class.flatMap((entry) => {
      const [depart, section] = entry.split(" ");
      return section ? [depart, section] : [depart];
    });
    const uniqueOutputArray = [...new Set(outputArray)];
    const students = await User.find({
      section: { $in: uniqueOutputArray },
      depart: { $in: uniqueOutputArray },
    });
    res.json({ status: true, details: students });
  } catch (err) {
    res.json({ status: false });
  }
});

module.exports = router;
