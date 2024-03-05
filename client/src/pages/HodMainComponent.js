import React,{ useState,useEffect } from 'react'
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import DetailsComponent from './DetailsComponent';
import HodDepartmentDetails from './HodDepartmentDetails';
import axios from 'axios';
import HodRequestComponent from './HodRequestComponent';

const HodMainComponent = ({user}) => {
    const [cookies, setCookie, removeCookie] = useCookies([]);
    const [activeButton, setActiveButton] = useState("request");
    const [selectedStaff, setSelectedStaff] = useState('');
    const staffs = user.staffs;
    const navigate = useNavigate();
    
    const handleButtonClick = (buttonName) => {
        setActiveButton(buttonName);
        if (buttonName === "logout") {
          removeCookie("jwt");
          navigate("/login");
        }
      };
      

    const handleSelectChange = (e) => {
        setSelectedStaff(e.target.value);
    };
    return (
        <div className='student-main'>
            <div className="navbar navbar-councellor">
                <button
                className={activeButton === "profile" ? "active" : ""}
                onClick={() => handleButtonClick("profile")}
                >
                Profile
                </button>

                <button
                className={activeButton === "departdetails" ? "active" : ""}
                onClick={() => handleButtonClick("departdetails")}
                >
                Depart Details
                </button>

                <button
                className={activeButton === "hodrequest" ? "active" : ""}
                onClick={() => handleButtonClick("hodrequest")}
                >
                Requests 
                </button>
                
                
                <button
                    className={activeButton === "logout" ? "active" : ""}
                    onClick={() => handleButtonClick("logout")}
                >
                    Log Out
                </button>
            </div> 
            <div className='councellor-toggle'>
            <select id="select-staff" value={selectedStaff} onChange={handleSelectChange}>
                <option value="">Choose Staff</option>
                {staffs.map((staff,index)=> (
                    <option key={index} value={staff}>{staff}</option>
                ))}
            </select>
            </div>
            <div className='content-student'>
                {activeButton==="profile" && <DetailsComponent user={user}/>}
                {activeButton==="hodrequest" && <HodRequestComponent user={user} selectedStaff={selectedStaff}/>}
                {activeButton==="departdetails" && <HodDepartmentDetails user={user}/>}

            </div>
        </div>
    )
}





export default HodMainComponent
