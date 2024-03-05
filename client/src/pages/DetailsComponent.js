import React from 'react';
import '../css/DetailsComponent.css'

const DetailsComponent = ({ user }) => {
  return (
    <div className="details-container">
      <h1 className="detail-heading">Profile</h1>
      <div className="detail-item">
        <strong>Name:</strong> {user && user.name}
      </div>
      <div className="detail-item">
        <strong>Department:</strong> {user && user.depart}
      </div>
      <div className="detail-item">
        <strong>Section:</strong> {user && user.section}
      </div>
      <div className="detail-item">
        <strong>Registration Number:</strong> {user && user.regisno}
      </div>
      <div className="detail-item">
        <strong>Batch:</strong> {user && user.batch}
      </div>
      {/* Add other properties as needed */}
    </div>
  );
};
export default DetailsComponent;