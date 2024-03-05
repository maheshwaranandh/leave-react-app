const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is Required"],
    unique: true,
  },
  role: {
    type: String,
    enum: ['student', 'councellor', 'hod'],
  },
  staffs:{
    type:[String]
  },
  depart:{
    type: String,
  },
  regisno: {
    type: Number,
    unique: true,
  },
  batch:{
    type: Number,
    unique: true,
  },
  section:{
    type: String,
  },
  leaves:{
    type: Number,
  },
  password: {
    type: String,
  },
  rollno:{
    type: String,
  },
  semStartDate:{
    type: Date,
  }
});
const requestSchema = new mongoose.Schema({
  userDetail:{
    type:[String],
    default:[],
    required:true
  },
  userId:{
    type: String,
  },
  reason:{
    type: String,
  },
  singleDate:{
    type: String,
  },
  fromDate:{
    type: String,
  },
  toDate:{
    type: String,
  },
  messageByCon: {
    type: String,
  },
  messageByHOD: {
    type: String,
  },
  pdfUrl:{
    type: Buffer,
    // unique:true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  conVerified:{
    type:Boolean
  },
  hodVerified:{
    type:Boolean
  },
  result:{
    type: String,
    default:" "
  },
  leaveType:{
    type:String
  }
})

const FileSchema= new mongoose.Schema({
  commonId: String, 
  filename: String,
  contentType: String,
  data: Buffer,
  fileDetails: String,
});

const classSchema = new mongoose.Schema({
  name:{
      type:String
  },
  rollno:{
      type:String
  },
  regisno:{
      type:Number
  },
  present:{
      type:Boolean,
      default:true
  },
  leaveReason:{
      type:String
  },
  leaveCategory:{
      type:String
  },
  leaveRequestId:{
    type:String
  },
  leaveApplied:{
      type:Boolean,
      default:false
  },
  leaveApproved:{
      type:Boolean,
      default:false
  },
})
const StudentSchema = new mongoose.Schema({
  date:{
    type:Date
  },
  depart:{
    type:String
  },
  section:{
    type:String
  },
  batch:{
    type:Number
  },
  students:{
    type:[classSchema]
  },
  enrolled:{
    type:Boolean,
    default:false
  }
})

const User = mongoose.model("users", userSchema);
const Request = mongoose.model("requests", requestSchema);
const File = mongoose.model("files", FileSchema);
const Student = mongoose.model("students",StudentSchema);

module.exports = {
  User, Request, File, Student
};
