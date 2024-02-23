import React, { useRef, useState } from 'react';

function ImageUploader() {
  const [coordinates, setCoordinates] = useState([]);
  const canvasRef = useRef(null);
  const imageLoaderRef = useRef(null);
  const imgRef = useRef(null); // Ref to store the loaded image element
  const [rect, setRect] = useState({});
  const [drag, setDrag] = useState(false);

  const handleImage = (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Calculate new height to maintain aspect ratio
        const scaleFactor = 700 / img.width;
        const newHeight = img.height * scaleFactor;
        
        // Set canvas size
        canvas.width = 700;
        canvas.height = newHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        imgRef.current = img; // Store the loaded and resized image for later use
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const initDraw = (event) => {
    const startX = event.nativeEvent.offsetX;
    const startY = event.nativeEvent.offsetY;
    setRect({ startX, startY, w: 0, h: 0 });
    setDrag(true);
  };

  const draw = (event) => {
    if (!drag) return;
    const mouseX = event.nativeEvent.offsetX;
    const mouseY = event.nativeEvent.offsetY;
    const width = mouseX - rect.startX;
    const height = mouseY - rect.startY;
    setRect({ ...rect, w: width, h: height });

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Ensure the image is redrawn with the adjusted dimensions
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'red';
    ctx.strokeRect(rect.startX, rect.startY, width, height);
  };

  const finishDraw = () => {
    setDrag(false);
    setCoordinates([...coordinates, rect]);
  };

  return (
    <div>
      <input type="file" ref={imageLoaderRef} onChange={handleImage} />
      <canvas ref={canvasRef} onMouseDown={initDraw} onMouseMove={draw} onMouseUp={finishDraw}></canvas>
      <button onClick={() => alert(JSON.stringify(coordinates))}>Print Coordinates</button>
      <div>Coordinates: {coordinates.map((coord, index) => (
        <div key={index}>
          Start ({coord.startX}, {coord.startY}), End ({coord.startX + coord.w}, {coord.startY + coord.h})
        </div>
      ))}</div>
    </div>
  );
}

export default ImageUploader;
