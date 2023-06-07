'use strict';

const imageUpload = document.getElementById('image-upload');
const canvas1 = document.getElementById('canvas1');
const canvas2 = document.getElementById('canvas2');
const sizeSlider = document.getElementById('canvas2BrickSize');
const check4x2 = document.getElementById('check4x2');
const check2x2 = document.getElementById('check2x2');
const check2x1 = document.getElementById('check2x1');
const legofyBtn = document.getElementById('legofy-btn');

const overlayWidthSlider = document.getElementById('overlayWidth');
const overlayHeightSlider = document.getElementById('overlayHeight');
let overlayWidth = overlayWidthSlider.value;
let overlayHeight = overlayHeightSlider.value;

const ctx1 = canvas1.getContext('2d');
const ctx2 = canvas2.getContext('2d', { willReadFrequently: true });
let image = new Image();
let dragging = false;
let scale = 1;
let position = { x: 0, y: 0 };
let overlayPosition = { x: 0, y: 0 };
let overlaySize = 0;
let brickSize = 10;
let lastMousePosition = { x: 0, y: 0 };
let canvas1Size = 500;
let canvas2Size = sizeSlider.value * brickSize;
let overlayLineWidth = 4;
let use4x2 = true;
let use2x2 = true;
let use2x1 = true;



// const ColorsRGB = [
//   { r: 255, g: 255, b: 255 },
//   { r: 0, g: 0, b: 0 },
//   { r: 205, g: 32, b: 47 },
//   { r: 0, g: 103, b: 178 },
//   { r: 253, g: 200, b: 47 },
//   { r: 40, g: 127, b: 71 },
//   { r: 163, g: 162, b: 164 },
//   { r: 99, g: 95, b: 97 },
//   { r: 142, g: 141, b: 141 },
//   { r: 80, g: 80, b: 80 },
//   { r: 215, g: 197, b: 154 },
//   { r: 106, g: 57, b: 9 },
//   { r: 245, g: 130, b: 37 },
//   { r: 166, g: 202, b: 240 },
//   { r: 0, g: 86, b: 63 },
//   { r: 255, g: 128, b: 171 },
// ];
// TODO: Read colors from db
const ColorsRGB = [
  { r: 255, g: 255, b: 255 }, // white
  { r: 0, g: 0, b: 0 }, // black
  { r: 161, g: 165, b: 162 }, // light grey
  { r: 80, g: 85, b: 89 }, // dark grey
  { r: 205, g: 32, b: 44 }, // red
  { r: 13, g: 34, b: 191 }, // blue
  { r: 254, g: 198, b: 1 }, // yellow
  { r: 40, g: 127, b: 71 }, // green
  { r: 124, g: 92, b: 70 }, // brown
  { r: 255, g: 123, b: 0 }, // orange
  { r: 228, g: 205, b: 158 }, // brick yellow (tan)
]
const ColorsCIELAB = ColorsRGB.map((color) => rgb2lab(color.r, color.g, color.b));

let matrixSize = canvas2Size / brickSize;
let colorMatrix = createMatrix(matrixSize, matrixSize, -1);
let brickTypeMatrix = createMatrix(matrixSize, matrixSize, -1);
let brickTypes = ["4x2", "2x2", "2x1", "1x1"];
let brickRequirements = createMatrix(ColorsRGB.length, brickTypes.length, 0);

imageUpload.addEventListener('change', handleImageUpload);

function handleImageUpload(e) {
  const file = e.target.files[0];

  if (!file.type.match(/image.*/)) {
    alert('Please select an image file');
    return;
  }

  const reader = new FileReader();

  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;

    img.onload = () => {
      image = img;
      const aspectRatio = image.width / image.height;
      let canvasWidth, canvasHeight;

      if (image.width > image.height) {
        canvasWidth = canvas1Size;
        canvasHeight = canvas1Size / aspectRatio;
      } else {
        canvasWidth = canvas1Size * aspectRatio;
        canvasHeight = canvas1Size;
      }
      scale = canvasWidth / image.width;
      position = { x: 0, y: 0 };

      drawCanvas1();
      //updateCanvas2();
    };
  };

  reader.readAsDataURL(file);
}

function updateBrickSizeValue(value) {
  document.getElementById('brickSizeValue').innerText = value;
}

document.getElementById('canvas2BrickSize').addEventListener('input', function () {
  updateBrickSizeValue(this.value);
});

document.addEventListener('DOMContentLoaded', function() {
  updateBrickSizeValue(document.getElementById('canvas2BrickSize').value);
});

check4x2.addEventListener("change", (event) => {
  if (event.target.checked) {
    use4x2 = true;
  }
  else {
    use4x2 = false;
  }
});
check2x2.addEventListener("change", (event) => {
  if (event.target.checked) {
    use2x2 = true;
  }
  else {
    use2x2 = false;
  }
});
check2x1.addEventListener("change", (event) => {
  if (event.target.checked) {
    use2x1 = true;
  }
  else {
    use2x1 = false;
  }
});
sizeSlider.addEventListener('input', () => {
  canvas2Size = sizeSlider.value * brickSize;
  matrixSize = canvas2Size / brickSize;
  colorMatrix = createMatrix(matrixSize);
  brickTypeMatrix = createMatrix(matrixSize);
});

canvas1.addEventListener('mousedown', (e) => {
  dragging = true;
  lastMousePosition = getMousePosition(canvas1, e);
});
canvas1.addEventListener('mousemove', (e) => {
  if (dragging) {
    const mousePosition = getMousePosition(canvas1, e);
    position.x += mousePosition.x - lastMousePosition.x;
    position.y += mousePosition.y - lastMousePosition.y;
    lastMousePosition = mousePosition;
    drawCanvas1();
  }
});
canvas1.addEventListener('mouseup', () => {
  dragging = false;
});
canvas1.addEventListener('mouseleave', () => {
  dragging = false;
});
canvas1.addEventListener('wheel', (e) => {
  e.preventDefault();
  scale += e.deltaY * -0.001;
  scale = Math.min(Math.max(scale, 0.1), 3);
  drawCanvas1();
});
legofyBtn.addEventListener('click', () => {
  updateCanvas2();
});

// function drawCanvas1() {
//   ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
//   ctx1.save();
//   ctx1.translate(position.x, position.y);
//   ctx1.scale(scale, scale);
//   ctx1.drawImage(image, 0, 0);
//   ctx1.restore();

//   // Draw overlay
//   overlaySize = 6 * canvas1Size / 8;
//   overlayPosition.x = (canvas1Size / 8) - 2 * overlayLineWidth;
//   overlayPosition.y = (canvas1Size / 8) - 2 * overlayLineWidth;
//   ctx1.strokeStyle = 'rgba(0, 0, 255, 0.8)';
//   ctx1.overlayLineWidth = overlayLineWidth;
//   ctx1.strokeRect(overlayPosition.x, overlayPosition.y, overlaySize + 2 * overlayLineWidth, overlaySize + 2 * overlayLineWidth);
// }
function drawCanvas1() {  
  ctx1.clearRect(0, 0, canvas1.width, canvas1.height);  
  ctx1.save();  
  ctx1.translate(position.x, position.y);  
  ctx1.scale(scale, scale);  
  ctx1.drawImage(image, 0, 0);  
  ctx1.restore();  

  // Draw overlay  
  overlayWidth = overlayWidthSlider.value;
  overlayHeight = overlayHeightSlider.value;
  overlayPosition.x = (canvas1Size / 8) - 2 * overlayLineWidth;  
  overlayPosition.y = (canvas1Size / 8) - 2 * overlayLineWidth;  
  ctx1.strokeStyle = 'rgba(0, 0, 255, 0.8)';  
  ctx1.overlayLineWidth = overlayLineWidth;  
  ctx1.strokeRect(overlayPosition.x, overlayPosition.y, overlayWidth + 2 * overlayLineWidth, overlayHeight + 2 * overlayLineWidth);
}

function updateChosenImageProperties() {
  brickRequirements = createMatrix(ColorsRGB.length, brickTypes.length, 0);
  colorMatrix = createMatrix(matrixSize, matrixSize, -1);
  brickTypeMatrix = createMatrix(matrixSize, matrixSize, -1);
}
// Call functions to draw lego version here
function updateCanvas2() {
  updateChosenImageProperties();
  canvas2.width = canvas2Size;
  canvas2.height = canvas2Size;
  ctx2.drawImage(canvas1, overlayPosition.x + 2, overlayPosition.y + 2, overlaySize, overlaySize, 0, 0, canvas2Size, canvas2Size);
  processCanvas2();
  for (let i = 0; i < brickTypes.length; i++) {
    displayBlockRequirements(brickTypes[i], nBricksOfType(i));
  }
}

function getMousePosition(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

// x,y is top left corner of brick. width, height is size of brick
function drawBrick(x, y, brickwidth, brickheight, colorIndex) {
  // Draw the main brick
  const rgbColor = getRGBString(ColorsRGB[colorIndex]);
  const cielabColor = ColorsCIELAB[colorIndex];
  ctx2.fillStyle = rgbColor;
  ctx2.fillRect(x, y, brickwidth, brickheight);

  // Draw the shadow
  ctx2.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx2.shadowBlur = 2;
  ctx2.shadowOffsetX = -1;
  ctx2.shadowOffsetY = 1;

  const studRadius = brickwidth * 0.25;
  const studX = x + brickwidth * 0.5;
  const studY = y + brickheight * 0.5;

  ctx2.beginPath();
  ctx2.arc(studX, studY, studRadius, 0, 2 * Math.PI);
  ctx2.closePath();
  ctx2.fill();

  // Reset shadow properties
  ctx2.shadowColor = 'transparent';
  ctx2.shadowBlur = 0;
  ctx2.shadowOffsetX = 0;
  ctx2.shadowOffsetY = 0;

  // Calculate brightness and adjust light opacity
  const lightOpacity = cielabColor.L < 128 ? 0.3 : 0.7;

  // Draw the light using a radial gradient
  const light = ctx2.createRadialGradient(studX, studY, 0, studX, studY, studRadius);
  light.addColorStop(0, `rgba(255, 255, 255, ${lightOpacity})`);
  light.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx2.fillStyle = light;
  ctx2.beginPath();
  ctx2.arc(studX, studY, studRadius, 0, 2 * Math.PI);
  ctx2.closePath();
  ctx2.fill();
}

function getRGBString(color) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function processCanvas2() {
  for (let x = 0; x < canvas2.width; x += brickSize) {
    for (let y = 0; y < canvas2.height; y += brickSize) {
      const averageCIELAB = getAverageCIELAB(x, y, brickSize, brickSize);
      const colorIndex = findNearestColor(averageCIELAB);
      colorMatrix[x / brickSize][y / brickSize] = colorIndex; // store colorIndex in small grid
      brickTypeMatrix[x / brickSize][y / brickSize] = 0; // unset type == 0
      drawBrick(x, y, brickSize, brickSize, colorIndex);
    }
  }
  if (use4x2) {
    shade4x2blocks(); // bricktype = 9
    shade2x4blocks(); // bricktype = 8
  }
  if (use2x2) {
    shade2x2blocks(); // bricktype = 7
  }
  if (use2x1) {
    shade2x1blocks(); // bricktype = 6
    shade1x2blocks(); // bricktype = 5
  }
  shade1x1blocks(); // bricktype = 1
}

function shade4x2blocks() {
  let y = 0;
  while (y < matrixSize - 1) {
    let x = 0;
    while (x < matrixSize - 3) {
      const colorIndex1 = colorMatrix[x][y];
      const colorIndex2 = colorMatrix[x + 1][y];
      const colorIndex3 = colorMatrix[x + 2][y];
      const colorIndex4 = colorMatrix[x + 3][y];
      const colorIndex5 = colorMatrix[x][y + 1];
      const colorIndex6 = colorMatrix[x + 1][y + 1];
      const colorIndex7 = colorMatrix[x + 2][y + 1];
      const colorIndex8 = colorMatrix[x + 3][y + 1];
      const typeIndex1 = brickTypeMatrix[x][y];
      const typeIndex2 = brickTypeMatrix[x + 1][y];
      const typeIndex3 = brickTypeMatrix[x + 2][y];
      const typeIndex4 = brickTypeMatrix[x + 3][y];
      const typeIndex5 = brickTypeMatrix[x][y + 1];
      const typeIndex6 = brickTypeMatrix[x + 1][y + 1];
      const typeIndex7 = brickTypeMatrix[x + 2][y + 1];
      const typeIndex8 = brickTypeMatrix[x + 3][y + 1];
      const colormatch = (colorIndex1 == colorIndex2) && (colorIndex2 == colorIndex3) && (colorIndex3 == colorIndex4) && (colorIndex4 == colorIndex5) && (colorIndex5 == colorIndex6) && (colorIndex6 == colorIndex7) && (colorIndex7 == colorIndex8);
      const typematch = (typeIndex1 == 0) && (typeIndex1 == typeIndex2) && (typeIndex2 == typeIndex3) && (typeIndex3 == typeIndex4) && (typeIndex4 == typeIndex5) && (typeIndex5 == typeIndex6) && (typeIndex6 == typeIndex7) && (typeIndex7 == typeIndex8);

      if (colormatch && typematch) {
        shadeBlock(x * brickSize, y * brickSize, brickSize * 4, brickSize * 2, colorIndex1);
        const typeValue = 9;
        brickTypeMatrix[x][y] = typeValue;
        brickTypeMatrix[x + 1][y] = typeValue;
        brickTypeMatrix[x + 2][y] = typeValue;
        brickTypeMatrix[x + 3][y] = typeValue;
        brickTypeMatrix[x][y + 1] = typeValue;
        brickTypeMatrix[x + 1][y + 1] = typeValue;
        brickTypeMatrix[x + 2][y + 1] = typeValue;
        brickTypeMatrix[x + 3][y + 1] = typeValue;
        x += 3;
        // Add block to requirements
        brickRequirements[colorIndex1][brickTypes.indexOf("4x2")] += 1;
      }
      x += 1;
    }
    y += 1;
  }
}

function shade2x4blocks() {
  let y = 0;
  while (y < matrixSize - 3) {
    let x = 0;
    while (x < matrixSize - 1) {
      const colorIndex1 = colorMatrix[x][y];
      const colorIndex2 = colorMatrix[x][y + 1];
      const colorIndex3 = colorMatrix[x][y + 2];
      const colorIndex4 = colorMatrix[x][y + 3];
      const colorIndex5 = colorMatrix[x + 1][y];
      const colorIndex6 = colorMatrix[x + 1][y + 1];
      const colorIndex7 = colorMatrix[x + 1][y + 2];
      const colorIndex8 = colorMatrix[x + 1][y + 3];
      const typeIndex1 = brickTypeMatrix[x][y];
      const typeIndex2 = brickTypeMatrix[x][y + 1];
      const typeIndex3 = brickTypeMatrix[x][y + 2];
      const typeIndex4 = brickTypeMatrix[x][y + 3];
      const typeIndex5 = brickTypeMatrix[x + 1][y];
      const typeIndex6 = brickTypeMatrix[x + 1][y + 1];
      const typeIndex7 = brickTypeMatrix[x + 1][y + 2];
      const typeIndex8 = brickTypeMatrix[x + 1][y + 3];
      const colormatch = (colorIndex1 == colorIndex2) && (colorIndex2 == colorIndex3) && (colorIndex3 == colorIndex4) && (colorIndex4 == colorIndex5) && (colorIndex5 == colorIndex6) && (colorIndex6 == colorIndex7) && (colorIndex7 == colorIndex8);
      const typematch = (typeIndex1 == 0) && (typeIndex1 == typeIndex2) && (typeIndex2 == typeIndex3) && (typeIndex3 == typeIndex4) && (typeIndex4 == typeIndex5) && (typeIndex5 == typeIndex6) && (typeIndex6 == typeIndex7) && (typeIndex7 == typeIndex8);

      if (colormatch && typematch) {
        shadeBlock(x * brickSize, y * brickSize, brickSize * 2, brickSize * 4, colorIndex1);
        const typeValue = 8;
        brickTypeMatrix[x][y] = typeValue;
        brickTypeMatrix[x][y + 1] = typeValue;
        brickTypeMatrix[x][y + 2] = typeValue;
        brickTypeMatrix[x][y + 3] = typeValue;
        brickTypeMatrix[x + 1][y] = typeValue;
        brickTypeMatrix[x + 1][y + 1] = typeValue;
        brickTypeMatrix[x + 1][y + 2] = typeValue;
        brickTypeMatrix[x + 1][y + 3] = typeValue;
        x += 1;
        // Add block to requirements
        brickRequirements[colorIndex1][brickTypes.indexOf("4x2")] += 1;
      }
      x += 1;
    }
    y += 1;
  }
}

function shade2x2blocks() {
  let y = 0;
  while (y < matrixSize - 1) {
    let x = 0;
    while (x < matrixSize - 1) {
      const colorIndex1 = colorMatrix[x][y];
      const colorIndex2 = colorMatrix[x + 1][y];
      const colorIndex3 = colorMatrix[x + 1][y + 1];
      const colorIndex4 = colorMatrix[x][y + 1];
      const typeIndex1 = brickTypeMatrix[x][y];
      const typeIndex2 = brickTypeMatrix[x + 1][y];
      const typeIndex3 = brickTypeMatrix[x + 1][y + 1];
      const typeIndex4 = brickTypeMatrix[x][y + 1];
      const colormatch = (colorIndex1 == colorIndex2) && (colorIndex2 == colorIndex3) && (colorIndex3 == colorIndex4);
      const typematch = (typeIndex1 == 0) && (typeIndex1 == typeIndex2) && (typeIndex2 == typeIndex3) && (typeIndex3 == typeIndex4);

      if (colormatch && typematch) {
        shadeBlock(x * brickSize, y * brickSize, brickSize * 2, brickSize * 2, colorIndex1);
        const typeValue = 7;
        brickTypeMatrix[x][y] = typeValue;
        brickTypeMatrix[x + 1][y] = typeValue;
        brickTypeMatrix[x + 1][y + 1] = typeValue;
        brickTypeMatrix[x][y + 1] = typeValue;
        x += 1;
        // Add block to requirements
        brickRequirements[colorIndex1][brickTypes.indexOf("2x2")] += 1;
      }
      x += 1;
    }
    y += 1;
  }
}

function shade2x1blocks() {
  let y = 0;
  while (y < matrixSize) {
    let x = 0;
    while (x < matrixSize - 1) {
      const colorIndex1 = colorMatrix[x][y];
      const colorIndex2 = colorMatrix[x + 1][y];
      const typeIndex1 = brickTypeMatrix[x][y];
      const typeIndex2 = brickTypeMatrix[x + 1][y];
      const colormatch = (colorIndex1 == colorIndex2);
      const typematch = (typeIndex1 == 0) && (typeIndex1 == typeIndex2);

      if (colormatch && typematch) {
        shadeBlock(x * brickSize, y * brickSize, brickSize * 2, brickSize, colorIndex1);
        const typeValue = 6;
        brickTypeMatrix[x][y] = typeValue;
        brickTypeMatrix[x + 1][y] = typeValue;
        x += 1;
        // Add block to requirements
        brickRequirements[colorIndex1][brickTypes.indexOf("2x1")] += 1;
      }
      x += 1;
    }
    y += 1;
  }
}

function shade1x2blocks() {
  let y = 0;
  while (y < matrixSize - 1) {
    let x = 0;
    while (x < matrixSize) {
      const colorIndex1 = colorMatrix[x][y];
      const colorIndex2 = colorMatrix[x][y + 1];
      const typeIndex1 = brickTypeMatrix[x][y];
      const typeIndex2 = brickTypeMatrix[x][y + 1];
      const colormatch = (colorIndex1 == colorIndex2);
      const typematch = (typeIndex1 == 0) && (typeIndex1 == typeIndex2);

      if (colormatch && typematch) {
        shadeBlock(x * brickSize, y * brickSize, brickSize, brickSize * 2, colorIndex1);
        const typeValue = 5;
        brickTypeMatrix[x][y] = typeValue;
        brickTypeMatrix[x][y + 1] = typeValue;
        // Add block to requirements
        brickRequirements[colorIndex1][brickTypes.indexOf("2x1")] += 1;
      }
      x += 1;
    }
    y += 1;
  }
}

function shade1x1blocks() {
  let y = 0;
  while (y < matrixSize) {
    let x = 0;
    while (x < matrixSize) {
      const colorIndex1 = colorMatrix[x][y];
      const typeIndex1 = brickTypeMatrix[x][y];

      const typematch = (typeIndex1 == 0);

      if (typematch) {
        shadeBlock(x * brickSize, y * brickSize, brickSize, brickSize, colorIndex1);
        brickTypeMatrix[x][y] = 1;
        // Add block to requirements
        brickRequirements[colorIndex1][brickTypes.indexOf("1x1")] += 1;
      }
      x += 1;
    }
    y += 1;
  }
}

function shadeBlock(x, y, brickwidth, brickheight, colorIndex) {
  ctx2.lineWidth = 0.4;
  ctx2.beginPath();
  ctx2.strokeStyle = `rgba(200, 200, 200, 0.5)`;
  ctx2.moveTo(x, y);
  ctx2.lineTo(x + brickwidth, y);
  ctx2.lineTo(x + brickwidth, y + brickheight);
  ctx2.stroke();

  ctx2.beginPath();
  ctx2.strokeStyle = `rgba(50, 50, 50, 0.5)`;
  ctx2.moveTo(x, y);
  ctx2.lineTo(x, y + brickheight);
  ctx2.lineTo(x + brickwidth, y + brickheight);
  ctx2.stroke();
}

function rgb2xyz(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;

  return { x, y, z };
}

function xyz2lab(x, y, z) {
  x /= 95.047;
  y /= 100;
  z /= 108.883;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  const L = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);

  return { L, a, b };
}

function rgb2lab(r, g, b) {
  const xyz = rgb2xyz(r, g, b);
  return xyz2lab(xyz.x, xyz.y, xyz.z);
}

function getAverageCIELAB(x, y, width, height) {
  const imageData = ctx2.getImageData(x, y, width, height).data;
  let totalL = 0;
  let totalA = 0;
  let totalB = 0;
  let pixelCount = 0;

  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const lab = rgb2lab(r, g, b);
    totalL += lab.L;
    totalA += lab.a;
    totalB += lab.b;
    pixelCount++;
  }

  const averageL = totalL / pixelCount;
  const averageA = totalA / pixelCount
  const averageB = totalB / pixelCount;

  return { L: averageL, a: averageA, b: averageB };
}

function squaredDistance(cielab1, cielab2) {
  const deltaL = cielab1.L - cielab2.L;
  const deltaA = cielab1.a - cielab2.a;
  const deltaB = cielab1.b - cielab2.b;

  // Squared distance
  const distance = (deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
  return distance;
}

function findNearestColor(cielab) {
  let minDistance = Infinity;
  let bestMatchIndex = -1;
  ColorsCIELAB.forEach((Color, index) => {
    const distance = squaredDistance(cielab, Color);
    if (distance < minDistance) {
      minDistance = distance;
      bestMatchIndex = index;
    }
  });

  return bestMatchIndex;
}

function createMatrix(m, n, defaultValue) {
  const matrix = [];
  for (let i = 0; i < m; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      matrix[i][j] = defaultValue;
    }
  }
  return matrix;
}

function nBricksOfType(index) {
  let n = 0;
  brickRequirements.forEach(color => {
    n += color[index];
  });
  return n;
}

function displaySingleBlockRequirements(name, number) {
  const outputContainer = document.getElementById("brick-requirements");
  const nameNumberElement = document.createElement("p");
  nameNumberElement.innerHTML = `${name}: <span>${number}</span>`;
  outputContainer.appendChild(nameNumberElement);
}

function displayBlockRequirements() {
  const outputContainer = document.getElementById("brick-requirements");
  outputContainer.innerHTML = '';
  let nBricks = 0;
  for (let i = 0; i < brickTypes.length; i++) {
    nBricks += nBricksOfType(i);
    displaySingleBlockRequirements(brickTypes[i], nBricksOfType(i));
  }
  checkInventory(brickRequirements);
  displaySingleBlockRequirements("Total", nBricks);
}

function checkInventory(brickRequirements) {
  // Iterate over each entry in the matrix
  for (let i = 0; i < brickRequirements.length; i++) {
      for (let j = 0; j < brickRequirements[i].length; j++) {
          const requiredQuantity = brickRequirements[i][j];

          if (requiredQuantity > 0) {
              const color = ColorsRGB[i];
              const brickType = brickTypes[j];

              // Query the database for the current color and brick type
              const row = db.prepare('SELECT * FROM lego_inventory WHERE color = ? AND brick_type = ?').get(color, brickType);

              // If the row does not exist, or the quantity is less than required, return false
              if (!row || row.quantity < requiredQuantity) {
                console.log('false');
                  return false;
              }
          }
      }
  }

  // If we've made it through the entire matrix without returning, we have enough of each brick
  console.log('true');
  return true;
}