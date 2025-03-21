import * as React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import resume from '../../assets/resume.pdf';
import "../../styles/Profile.css";

// Set the worker source (using unpkg CDN)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const Profile = () => {
  return (
    <div className="profile" >
      <h1>This is my current CV</h1>
      <button onClick={() => window.open(resume, '_blank')}>Download Resume</button>
      <Document
        file={resume}
        onLoadError={(error) => console.error('PDF load error:', error)}
      >
        <Page pageNumber={1} />
      </Document>
    </div>
  );
};

export default Profile;