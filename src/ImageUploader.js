import React, { useRef, useState } from 'react';
import './ImageUploader.css';

function ImageUploader() {
  const [imageLoaded, setImageLoaded] = useState(false); // New state to track if image is loaded
  const [coordinates, setCoordinates] = useState([]);
  const canvasRef = useRef(null);
  const imageLoaderRef = useRef(null);
  const imgRef = useRef(null); // Ref to store the loaded image element
  const [rect, setRect] = useState({});
  const [drag, setDrag] = useState(false);
  const [mode, setMode] = useState("draw"); // Default mode is "draw"

  const handleImage = (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Use a fixed width for the canvas
        const scaleFactor = 700 / img.width;
        const scaledHeight = img.height * scaleFactor;
        
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

  const handleRemoveImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    setImageLoaded(false);
    setCoordinates([]);
    setRect({});
    setDrag(false);
    
    if (imageLoaderRef.current) {
      imageLoaderRef.current.value = null;
    }
  }

  const initDraw = (event) => {
    if (!imageLoaded) return; 
    const x = event.nativeEvent.offsetX;
    const y = event.nativeEvent.offsetY;
    const canvas = canvasRef.current;

    const ctx = canvas.getContext('2d');


    if (mode === "draw") {
      setRect({ startX: x, startY: y, w: 0, h: 0 });
      setDrag(true);
    } else if (mode === "point") {
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2, true); // Draw a circle
      ctx.fill();

      setCoordinates([...coordinates, { startX: x, startY: y, w: 0, h: 0 }]);
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
    if (!imageLoaded || mode === "point") return; // Skip if in point mode
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
    
  };

  const toggleMode = () => {
    setMode(prevMode => prevMode === "draw" ? "point" : "draw");
  };
  

  return (
    <div className="keloid-detector-container">
      <h3>Mode: {mode === "draw" ? "Drawing Rectangles" : "Selecting Points"}</h3>

      <input type="file" ref={imageLoaderRef} onChange={handleImage} className="file-input" />
      <canvas ref={canvasRef} onMouseDown={initDraw} onMouseMove={draw} onMouseUp={finishDraw} className="image-canvas"></canvas>
      <button onClick={handleRemoveImage} className="remove-image-btn">Remove Image</button>
      <button className="print-coordinates-btn" onClick={() => alert(JSON.stringify(coordinates))}>Print Coordinates</button>
      <button className="undo-rectangle-btn" onClick={undoLastAction}>Undo</button>
      <button onClick={toggleMode} className="toggle-mode-btn">
  {mode === "draw" ? "Switch to Point Mode" : "Switch to Draw Mode"}
</button>
      <div className="coordinates-display">Coordinates: {coordinates.map((coord, index) => (
        <div key={index} className="coordinate-item">
          Start ({coord.startX}, {coord.startY}), End ({coord.startX + coord.w}, {coord.startY + coord.h})
        </div>
      ))}</div>
    </div>
  );
}

export default ImageUploader;
