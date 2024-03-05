import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./StudentHome.css";
import LeaveForm from "./LeaveForm";
import StudentDetailsComponent from './StudentDetailsComponent'
import DetailsComponent from "./DetailsComponent";
import HodMainComponent from "./HodMainComponent";
import StudentMainComponent from "./StudentMainComponent";
import CouncellorMainComponent from "./CouncellorMainComponent";
import "react-datepicker/dist/react-datepicker.css";
import LimitReachedPage from "./LimitReachedPage";

const StudentHome = () => {
  const [user,setUser] = useState(null)
  const [activeButton, setActiveButton] = useState("request");
  const navigate = useNavigate();
  const [cookies, setCookie, removeCookie] = useCookies([]);

  useEffect(() => {
    const verifyUser = async () => {
      if (!cookies.jwt) {
        navigate("/login");
      } else {
        const { data } = await axios.post(
          "http://localhost:4000",
          {},
          {
            withCredentials: true,
          }
        );
        if (!data.status) {
          removeCookie("jwt");
          navigate("/login");
        } else{
          console.log("data: ",data.user);

          // if(data.user.role==="student"){
          //   setActiveButton("message")
          // }
          setUser(data.user)
        // toast(`Hi ${data.user.name} 🦄`, {
        //   theme: "dark",
        // });
        }
      }
    };
    verifyUser();
  }, [cookies, navigate, removeCookie]);

  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
    if (buttonName === "logout") {
      removeCookie("jwt");
      navigate("/login");
    }
  };
  
  

  return (
    <div className="app-container">
      {/* <div className="navbar">
        <button
          className={activeButton === "details" ? "active" : ""}
          onClick={() => handleButtonClick("details")}
        >
          Profile
        </button>
        {
          (user && user.role==="student") ?
          (<button
            className={activeButton === "message" ? "active" : ""}
            onClick={() => handleButtonClick("message")}
          >
            Message
          </button>):(<></>)

        }
        { 
        (user && (user.role==="councellor" || user.role==="hod" ) )?
          (
            <>
              <button
                className={activeButton === "studentDetails" ? "active" : ""}
                onClick={() => handleButtonClick("studentDetails")}
                >
                StudentDetails
              </button>
              <button
                className={activeButton === "request" ? "active" : ""}
                onClick={() => handleButtonClick("request")}
                >
                Request
              </button>
            </>
            ):
        (<button
          className={activeButton === "applyLeave" ? "active" : ""}
          onClick={() => handleButtonClick("applyLeave")}
        >
          Apply Leave
        </button>)
        }
        
        <button
          className={activeButton === "logout" ? "active" : ""}
          onClick={() => handleButtonClick("logout")}
        >
          Log Out
        </button>
      </div> */}
      <div className="content">
        { user && user.role==="student" && <StudentMainComponent user={user}/>}
        { user && user.role==="councellor" && <CouncellorMainComponent user={user}/>}
        { user && user.role==="hod" && <HodMainComponent user={user}/>}
        {/* {activeButton === "details" && <DetailsComponent user={user}/>}
        {(activeButton === "request" && user && (user.role==="councellor" || user.role==="hod") ) && <RequestComponent user={user}/>}
        {(activeButton === "studentDetails" && user && (user.role==="councellor" || user.role==="hod") ) && <StudentDetailsComponent user={user}/>}
        {activeButton === "applyLeave" && 
          ((user && user.leaves<5 )? <ApplyLeaveComponent user={user} />
            : <LimitReachedPage />)
          
        }
        {activeButton === "message" && <MessageComponent user={user} />} */}
      </div>
      <ToastContainer />
    </div>
  );
};



const MessageComponent = ({user}) => {
  const [requests,setRequests] = useState([])
  const [requestDetails,setRequestDetails] = useState(null)
  const [individualRequest,setIndividualRequest] = useState(false)
  const [allRequest,setAllRequest] = useState(true)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post('http://localhost:4000/messagePage',{
          userId:user._id,
        });

        const d = response.data;
        console.log("receivved Messages: ",d);
        if (d.status) {
          // If the response is successful, you can set the PDF data
          setRequests(d.messages);
        } else {
          // Handle errors
          console.error('Error:', d.message);
        }
      } catch (error) {
        console.error('Fetch error:', error.message);
      }
    };

    fetchData();
  }, [user]);
  const handleIndividualRequest = (request) => {
    setRequestDetails(request)
    setIndividualRequest(true)
    setAllRequest(false)
  }
  const handleViewPdf = () => {
    // Create a Blob from the PDF buffer
    // console.log("handlepdf: ",requestDetails.conId);
    console.log("pdf clicked");
    if(requestDetails.pdfUrl){
      // console.log("TYPE: ",requestDetails.pdfUrl);
      const d = Uint8Array.from(requestDetails.pdfUrl.data);
      const blob = new Blob([d], { type: 'application/pdf' });

      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);

      // Open a new tab with the PDF content
      window.open(url, '_blank');
    }
  }
  const handleBack = () => {
    setIndividualRequest(false)
    setAllRequest(true)
    window.location.reload();
  }
  return (
    <div className="main-Request">
      {allRequest && <div className="request">
        MessageComponent
        {user && user.name}
        {requests && requests.map((request)=>(
          <div className="request-row" key={request._id}>
            <h1>{request && request.result}</h1>
            <button onClick={()=> handleIndividualRequest(request)}> click</button>
            <br></br>
          </div>
        ))}
      </div>}
      {
        individualRequest && <div className="individual-Request">
          <h1>{requestDetails && requestDetails.userDetail[0]}</h1>
          <h1>{requestDetails && requestDetails.userDetail[1]}</h1>
          <h1>{requestDetails && requestDetails.userDetail[2]}</h1>
          {requestDetails && requestDetails.messageByCon!=" " && 
          <h1>Councellor: {requestDetails && requestDetails.messageByCon}</h1>}
          {requestDetails && requestDetails.messageByHOD!=" " && 
          <h1>HOD: {requestDetails && requestDetails.messageByHOD}</h1>}
          <h1>Reason: {requestDetails && requestDetails.reason}</h1>
          <h1>{requestDetails && requestDetails.singleDate}</h1>
          <button onClick={handleViewPdf}>View PDF</button>
          <button onClick={handleBack}>Back</button>
          
        </div>
      }
    </div>
  )
}



export default StudentHome;
