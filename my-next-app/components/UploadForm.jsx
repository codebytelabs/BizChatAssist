import React, { useState } from 'react';

const UploadForm = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [workflow, setWorkflow] = useState(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Invalid file type. Only PDF, JPEG, and PNG are allowed.');
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      alert('File size exceeds 10MB limit.');
      return;
    }
    
    setSelectedFile(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/parse-file', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      setWorkflow(result.workflow);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };
  return (
    <div>
      <input type="file" onChange={handleFileUpload} />
      {workflow && (
        <div>
          <h2>AI Suggestions:</h2>
          <pre>{JSON.stringify(workflow, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default UploadForm;