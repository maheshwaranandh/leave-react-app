import React, {useState,useEffect} from 'react'
import axios from 'axios'

const HodDepartmentDetails = ({user}) => {
  const [data,setData]=useState({})

  useEffect(()=>{
    const fetchDetails = async () => {
      try{
        const response = await axios.post("http://localhost:4000/departDetails",{
          depart:user.name
        })
        if(response.data.status===true){
          setData(response.data.result);
          console.log(response.data.result);
        }
      }catch(err){
        console.log(err);
      }
    }
    fetchDetails()
  },[])
  return (
    <div>HodDepartmentDetails
      <DepartLeaveTable information={data}/>
    </div>
  )
}

const DepartLeaveTable = ({ information }) => {
  const [section,setSection] = useState('')
  const [year,setYear] = useState('')
  const [info,setInfo]=useState({})
  const currentYear = new Date().getFullYear(); // Get the current year
  
  useEffect(()=>{
    console.log("section: ",section);
  },[section])

  useEffect(()=>{
    console.log("year: ",year);
  },[year])

  function getFourYearsBeforeYear(currentYear,year) {
    const currentYearObj = new Date(currentYear, 0); // January 1 of the current year
    const fourYearsAgo = new Date(currentYearObj);
    fourYearsAgo.setFullYear(currentYearObj.getFullYear() - (year));
  
    return fourYearsAgo.getFullYear();
  }

  const handleFilter = () => {
    if(section!='' && year!=''){
      
      console.log("information: ",information);
      // Example usage:
      
      const fourYearsBefore = getFourYearsBeforeYear(currentYear,parseInt(year,10));
      const cseStudents = Object.fromEntries(
        Object.entries(information).filter(([key, value]) => (value.section === section && value.batch ===fourYearsBefore ))
      );
      console.log("cse: ",cseStudents);
      setInfo(cseStudents)
    }
  }
  function getDepartYear(n){
    if(n===1) return "I"
    if(n===2) return "II"
    if(n===3) return "III"
    if(n===4) return "IV"
    return ""
  }

  return (
    <div>
      <h2>Student Leave Information</h2>

      <select id="select-staff" value={section} onChange={(e)=>setSection(e.target.value)}>
        <option value="">Choose Section</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
      </select>
      <select id="select-staff" value={year} onChange={(e)=>setYear(e.target.value)}>
        <option value="">Choose Year</option>
        <option value="2">II</option>
        <option value="3">III</option>
        <option value="4">IV</option>
      </select>
      <button onClick={handleFilter}>Filter</button>
      <table>
        <thead>
          <tr>
            <th>Year</th>
            <th>Section</th>
            <th>Regisno</th>
            <th>Rollno</th>
            <th>Name</th>
            {[...Array(10)].map((_, index) => (
              <th key={index}>Day {index + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {info && Object.keys(info).map((studentName) => {
            const studentData = info[studentName];
            const dateCols = Array.from({ length: 10 }, (_, index) => (
              studentData.data[index] ? studentData.data[index].date : ''
            ));
            const arrDates = dateCols.map((date) => date).filter(date => date !== '');

            arrDates.sort();

            return (
              <tr key={studentName}>
                <td>{getDepartYear(getFourYearsBeforeYear(currentYear,studentData.batch))}</td>
                <td>{studentData.section}</td>
                <td>{studentData.regisno}</td>
                <td>{studentData.rollno}</td>
                <td>{studentName}</td>
                {arrDates.map((date, index) => (
                  <td key={index} title={getReasonForDate(studentData.data, date)}>
                    {date}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const getReasonForDate = (data, date) => {
  const entry = data.find((item) => item.date === date);
  let str = '';
  if(entry.leaveReason!='') str+=`Reason: ${entry.leaveReason}\n`;
  str+=`LeaveApplied: ${entry.leaveApplied}\nLeaveApproved: ${entry.leaveApproved}`
  return str!='' ? str : '';
};


export default HodDepartmentDetails


