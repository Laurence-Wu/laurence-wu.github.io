import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/AdditionalInformationBar.css';

const AdditionalInformationBar = () => {
  return (
    <div className="additional-information-bar">
      <Link to="/about">About</Link>
      <Link to="/contact">Contact</Link>
      <Link to="/storybehindthewebsite">Story Behind The Website</Link>
    </div>
  );
};

export default AdditionalInformationBar;
