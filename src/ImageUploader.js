import React, { useRef, useState } from 'react';
import './ImageUploader.css';
import axios from 'axios';

const baseURL = "https://19ac-35-237-123-73.ngrok-free.app/";

function ImageUploader() {
  const [imageLoaded, setImageLoaded] = useState(false); // New state to track if image is loaded
  const [coordinates, setCoordinates] = useState([]);
  const [imageFile, setImageFile] = useState(null); // New state to store the image file
  const canvasRef = useRef(null);
  const lesionRef = useRef(null);
  const imageLoaderRef = useRef(null);
  const imgRef = useRef(null); // Ref to store the loaded image element
  const lesionImageRef = useRef(null);
  const coinImageRef = useRef(null);
  const [rect, setRect] = useState({});
  const [drag, setDrag] = useState(false);
  const [mode, setMode] = useState("draw"); // Default mode is "draw"
  const [globalScaleFactor, setGlobalScaleFactor] = useState(1);
  const [pixelPerMetric, setPixelPerMetric] = useState(false);
  const [pointCoordinates, setPointCoordinates] = useState([]);
  const [pointLabels, setPointLabels] = useState([]); // New state to store the point labels
  // const [originalCanvasSize, setOriginalCanvasSize] = useState([0, 0]);
  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };
  const handleImage = (e) => {
    const reader = new FileReader();
    setImageFile(e.target.files[0]); // Store the image file in state
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        // setOriginalCanvasSize([canvas.width, canvas.height]);
        const ctx = canvas.getContext('2d');
        // ctx.clearRect(0, 0, canvas.width, canvas.height);
        // console.log('Image loaded:', img.width, img.height);
        // Use a fixed width for the canvas
        const scaleFactor = 700 / img.width;
        setGlobalScaleFactor(scaleFactor);
        const scaledHeight = img.height * scaleFactor;
        // const scaleFactor = 700 / img.width;
        // const scaledHeight = img.height;
        
        // Set canvas size
        canvas.width = 700; 
        canvas.height = scaledHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, scaledHeight);
        imgRef.current = img;
        setImageLoaded(true); // Indicate that the image is now loaded
      };
      img.src = event.target.result;
    };
    
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleUploadImage = async (event) => {
    // const canvas = canvasRef.current;
  // const imageData = canvas.toDataURL('image/jpeg'); // Convert canvas to base64 data URL
  event.preventDefault();
  const formData = new FormData();
  formData.append('file', imageFile);
  // console.log('Image data:', formData);
  // for (let pair of formData.entries()) {
  //   console.log(pair[0] + ': ' + pair[1]);
  // }

  // You can now send the imageData to your backend using Axios or any other HTTP library
  axios.post(`${baseURL}upload/`, formData )
    .then(response => {
      console.log('Image uploaded successfully:', response.data);
      
      // const imageUrl = URL.createObjectURL(blob);
      
      // Now you can use the imageUrl to display the image in your React component
      // For example, you can set it as the src attribute of an <img> element
      // document.getElementById('imageElement').src = imageUrl
      // Optionally, handle success response
    })
    .catch(error => {
      console.error('Error uploading image:', error);
      // Optionally, handle error
    });
};

const handleCoin = async (event) => {
  event.preventDefault();
  const RectangleData = {
    x: coordinates[coordinates.length-1].startX/globalScaleFactor,
    y: coordinates[coordinates.length-1].startY/globalScaleFactor,
    width: coordinates[coordinates.length-1].w/globalScaleFactor,
    height: coordinates[coordinates.length-1].h/globalScaleFactor
  };
  // console.log('Rectangle data:', RectangleData);
  axios.post(`${baseURL}uploadCoin/`, RectangleData, {responseType: 'arraybuffer'})
    .then(response => {
      console.log('Image uploaded successfully:', response.data);
      // const { img, pixelsPerMetric: ppm } = response.data;
      // console.log('Image:', img);
      // console.log('Pixels per metric:', ppm);
      const base64Image = arrayBufferToBase64(response.data);
      setPixelPerMetric(true);
      const image = new Image();

        // Set the src of the image to the data received from the backend
      image.src = `data:image/jpeg;base64,${base64Image}`;
      image.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Convert BGR to RGB
          for (let i = 0; i < imageData.data.length; i += 4) {
            const temp = imageData.data[i];
            imageData.data[i] = imageData.data[i + 2];
            imageData.data[i + 2] = temp;
          }
          ctx.putImageData(imageData, 0, 0);
        coinImageRef.current = image;
        setImageLoaded(true); // Indicate that the image is now loaded
      }
    })
    .catch(error => {
      console.error('Error uploading image:', error);
      // Optionally, handle error
    });
    
};

const handleSubmitPoints = async (event) => {
  event.preventDefault();
  // const PointData = {
  //   points: pointCoordinates.map(coord => ({ x: coord.x/globalScaleFactor, y: coord.y/globalScaleFactor }))
  // };
  // need to add the labels to PointData
  const PointData = {
    points: pointCoordinates.map((coord, index) => ({ x: coord.x/globalScaleFactor, y: coord.y/globalScaleFactor, label: pointLabels[index] }))
  };

  // console.log('Point data:', PointData);
  axios.post(`${baseURL}uploadPoints/`, PointData, {responseType: 'arraybuffer'})
    .then(response => {
      console.log('Image uploaded successfully:', response.data);
      const base64Image = arrayBufferToBase64(response.data);
      const image = new Image();

        // Set the src of the image to the data received from the backend
      image.src = `data:image/jpeg;base64,${base64Image}`;
      image.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Convert BGR to RGB
          for (let i = 0; i < imageData.data.length; i += 4) {
            const temp = imageData.data[i];
            imageData.data[i] = imageData.data[i + 2];
            imageData.data[i + 2] = temp;
          }
          ctx.putImageData(imageData, 0, 0);
        // imgRef.current = image;
        setImageLoaded(true); // Indicate that the image is now loaded
      }
    })
    .catch(error => {
      console.error('Error uploading image:', error);
      // Optionally, handle error
    });

};

const handleConfirmLesion = async (event) => {
  event.preventDefault();
  axios.post(`${baseURL}confirmLesion/`, {}, {responseType: 'arraybuffer'})
    .then(response => {
      console.log('Confirm lesion successfully:', response.data);
      const base64Image = arrayBufferToBase64(response.data);
      const image = new Image();

        // Set the src of the image to the data received from the backend
      image.src = `data:image/jpeg;base64,${base64Image}`;
      image.onload = () => {
        const canvas = lesionRef.current;
        const ctx = canvas.getContext('2d');
        const scaleFactor = 700 / image.width;
        // setGlobalScaleFactor(scaleFactor);
        const scaledHeight = image.height * scaleFactor;
        // const scaleFactor = 700 / img.width;
        // const scaledHeight = img.height;
        
        // Set canvas size
        canvas.width = 700; 
        canvas.height = scaledHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Convert BGR to RGB
          for (let i = 0; i < imageData.data.length; i += 4) {
            const temp = imageData.data[i];
            imageData.data[i] = imageData.data[i + 2];
            imageData.data[i + 2] = temp;
          }
          ctx.putImageData(imageData, 0, 0);
        lesionImageRef.current = image;

        const canvas2 = canvasRef.current;
        const ctx2 = canvas2.getContext('2d');
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
        ctx2.drawImage(imgRef.current, 0, 0, canvas2.width, canvas2.height);

        setPointCoordinates([]);
        setPointLabels([]);
      }
    })
    .catch(error => {
      console.error('Error uploading image:', error);
      // Optionally, handle error
    });
};

const handleCoinConfirm = async (event) => {
  event.preventDefault();
  axios.post(`${baseURL}confirmCoin/`, {}, {responseType: 'arraybuffer'})
    .then(response => {
      console.log('Confirm coin successfully:', response.data);
      // const base64Image = arrayBufferToBase64(response.data);
      const image = new Image();

        // Set the src of the image to the data received from the backend
      image.src = coinImageRef.current.src;
      // image.onload = () => {
        const canvas = lesionRef.current;
        const ctx = canvas.getContext('2d');
        const scaleFactor = 700 / image.width;
        // setGlobalScaleFactor(scaleFactor);
        const scaledHeight = image.height * scaleFactor;
        // const scaleFactor = 700 / img.width;
        // const scaledHeight = img.height;
        
        // Set canvas size
        canvas.width = 700; 
        canvas.height = scaledHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Convert BGR to RGB
          for (let i = 0; i < imageData.data.length; i += 4) {
            const temp = imageData.data[i];
            imageData.data[i] = imageData.data[i + 2];
            imageData.data[i + 2] = temp;
          }
          ctx.putImageData(imageData, 0, 0);
        // lesionImageRef.current = image;

        const canvas2 = canvasRef.current;
        const ctx2 = canvas2.getContext('2d');
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
        ctx2.drawImage(imgRef.current, 0, 0, canvas2.width, canvas2.height);

        // setPointCoordinates([]);
        // setPointLabels([]);
      // }
    })
    .catch(error => {
      console.error('Error uploading image:', error);
      // Optionally, handle error
    });
};

const handleDownloadPdf = async (event) => {
  event.preventDefault();
  axios.post(`${baseURL}downloadPdf/`, {}, {responseType: 'arraybuffer'})
  .then(response => {
    const blob = new Blob([response.data], { type: 'application/pdf' });
        
    // Create a URL for the Blob object
    const url = URL.createObjectURL(blob);
    
    // Create an anchor element
    const link = document.createElement('a');
    link.href = url;
    link.download = 'keloid_patch.pdf'; // Specify the filename for the downloaded file
    
    // Programmatically trigger a click event on the anchor element
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  })
  .catch(error => {
    console.error('Error downloading PDF:', error);
  });
};

  // const handleRemoveImage = () => {
  //   const canvas = canvasRef.current;
  //   const ctx = canvas.getContext('2d');
  //   ctx.clearRect(0, 0, canvas.width, canvas.height);
    
  //   setImageLoaded(false);
  //   setCoordinates([]);
  //   setRect({});
  //   setDrag(false);
    
  //   if (imageLoaderRef.current) {
  //     imageLoaderRef.current.value = null;
  //   }
  // }

  const initDraw = (event) => {
    if (!imageLoaded) return; 
    // console.log(event);
    // console.log(event.nativeEvent);
    const x = event.nativeEvent.offsetX;
    const y = event.nativeEvent.offsetY;
    const canvas = canvasRef.current;

    const ctx = canvas.getContext('2d');


    if (mode === "draw") {
      setRect({ startX: x, startY: y, w: 0, h: 0 });
      setDrag(true);
    } else if (mode === "pos" || mode === "neg") {
      if (mode === "pos") {
        setPointLabels([...pointLabels, 1]);
        ctx.fillStyle = 'green';
      } else {
        setPointLabels([...pointLabels, 0]);
        ctx.fillStyle = 'red';
      }
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2, true); // Draw a circle
      ctx.fill();
      setPointCoordinates([...pointCoordinates, { x, y }]);
      

      // setCoordinates([...coordinates, { startX: x, startY: y, w: 0, h: 0 }]);
    }
  };

  const draw = (event) => {
    if (!imageLoaded || !drag || mode !== "draw") return;
    const mouseX = event.nativeEvent.offsetX;
    const mouseY = event.nativeEvent.offsetY;
    const width = mouseX - rect.startX;
    const height = mouseY - rect.startY;
    setRect({ ...rect, w: width, h: height });

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'red';
    ctx.strokeRect(rect.startX, rect.startY, width, height);
    redraw(ctx); // Redraw the rectangles after drawing the current rectangle

  };

  const finishDraw = () => {
    if (!imageLoaded || mode === "pos"|| mode === "neg") return; // Skip if in point mode
    setDrag(false);
    setCoordinates([...coordinates, rect]);
  };

  const redraw= (ctx) => {
    coordinates.forEach(coord => {
      if (coord.w === 0 && coord.h === 0) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(coord.startX, coord.startY, 5, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.strokeStyle = 'red';
        ctx.strokeRect(coord.startX, coord.startY, coord.w, coord.h);
      }
  });
};

  const undoLastAction = () => {
    if (mode === "draw") {
    setCoordinates(prevCoordinates => {
      const newCoordinates = prevCoordinates.slice(0, -1);
  
      // Redraw the canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
      
      // Redraw all the elements except the last one
      newCoordinates.forEach(coord => {
        if (coord.w === 0 && coord.h === 0) {
          ctx.fillStyle = 'red';
          ctx.beginPath();
          ctx.arc(coord.startX, coord.startY, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = 'red';
          ctx.strokeRect(coord.startX, coord.startY, coord.w, coord.h);
        }
      });
  
      return newCoordinates;
    }); 
  } else {
    setPointLabels(prevLabels => {
      return prevLabels.slice(0, -1);
    });
    setPointCoordinates(prevCoordinates => {
      const newCoordinates = prevCoordinates.slice(0, -1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
      newCoordinates.forEach((coord, index) => {
        if (pointLabels[index] === 1) {
          ctx.fillStyle = 'green';
        } else {
          ctx.fillStyle = 'red';
        }
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      return newCoordinates;
    });
  }
  };

  const toggleMode = () => {
    setMode(prevMode => {
      switch (prevMode) {
        case "draw":
          return "pos";
        case "pos":
          return "neg";
        case "neg":
          return "draw";
        default:
          return "draw"; // Default to "draw" mode if current mode is unknown
      }
    });
  };
  

  return (
    <div className="keloid-detector-container">
      <h3>Mode: {mode === "draw" ? "Drawing Rectangles" : mode === "pos" ? "Selecting Positive Points" : "Selecting Negative Points"}</h3>

      <input type="file" ref={imageLoaderRef} onChange={handleImage} className="file-input" />
      <canvas ref={canvasRef} onMouseDown={initDraw} onMouseMove={draw} onMouseUp={finishDraw} className="image-canvas"></canvas>
      <div className="button-grid">
      <div className="column">
        <button onClick={handleUploadImage} className="remove-image-btn">Upload Image</button>
        <button onClick={handleCoin} className="remove-image-btn">Establish reference</button>
        <button onClick={handleCoinConfirm} className="remove-image-btn">Confirm reference</button>
        <button className="undo-rectangle-btn" onClick={undoLastAction}>Undo</button>
        {/* <button className="print-coordinates-btn" onClick={() => alert(JSON.stringify(coordinates))}>Print Coord</button> */}
      </div>
      <div className="column">
        
        <button onClick={toggleMode} className="toggle-mode-btn">
        {mode === "draw" ? "Draw Mode" : mode === "pos" ? "Positive Point Mode" : "Negative Point Mode"}
        </button>
        <button onClick={handleSubmitPoints} className="remove-image-btn">Find Lesion</button>
        <button onClick={handleConfirmLesion} className="remove-image-btn">Confirm Lesion</button>
        <button onClick={handleDownloadPdf} className="remove-image-btn">Download Patch</button>
        </div>
        </div>
        <div className="coordinates-display">Reference Object: {pixelPerMetric ? (<p>is defined</p>) 
        : (<p>Not defined yet</p>)}</div>
        <div className="coordinates-display">Box Coordinates: {coordinates.map((coord, index) => (
          <div key={index} className="coordinate-item">
            Start ({coord.startX}, {coord.startY}), End ({coord.startX + coord.w}, {coord.startY + coord.h})
          </div>
      ))}</div>
      <div className="coordinates-display">Point Coordinates: {pointCoordinates.map((coord, index) => (
          <div key={index} className="coordinate-item">
            X: ({coord.x}, Y: {coord.y})
          </div>
      ))}</div>
      <h4>Lesion Area:</h4>
      <canvas ref={lesionRef} className="lesion-canvas"></canvas>
    </div>
  );
}

export default ImageUploader;
