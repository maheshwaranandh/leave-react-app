import React from "react";
import LeaveForm from "./LeaveForm";

const ApplyLeaveComponent = ({user}) => {
    return (
      <div className="apply-leave-component">
        <LeaveForm user={user}/>
      </div>
    );
  };
export default ApplyLeaveComponent;