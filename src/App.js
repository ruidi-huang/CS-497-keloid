import React from 'react';
import './App.css';
import ImageUploader from './ImageUploader'; // Import your component
// import DrawingCanvas from './test';

function App() {
  return (
    <div className="App">
        <h1>Keloid Segmentation</h1>
        
        <ImageUploader />
        {/* <DrawingCanvas /> */}
    </div>
  );
}

export default App;
