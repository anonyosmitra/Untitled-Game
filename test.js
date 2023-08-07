const map = document.getElementById('map');
let isDragging = false;
let startX, startY;
let translateX = 0;
let translateY = 0;
let scale = 2;
let moved=false;
updateTransform();

map.addEventListener('mousedown', handleMouseDown);
map.addEventListener('mouseup', handleMouseUp);
map.addEventListener('mouseleave', handleMouseUp);
map.addEventListener('mousemove', handleMouseMove);
map.addEventListener('wheel', handleMouseWheel);

function handleMouseDown(event) {
    console.log("isDragging=true")
    isDragging = true;
    moved=false;
    startX = event.clientX;
    startY = event.clientY;
    console.log("startX="+startX);
    console.log("startY="+startY);
    map.classList.add('grabbing');
}

function handleMouseUp() {
    console.log("isDragging=false")
    isDragging = false;
    map.classList.remove('grabbing');
}

function handleMouseMove(event) {
    if (!isDragging) return;
    moved=true;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    console.log("clientX="+event.clientX);
    console.log("clientY="+event.clientY);
    startX = event.clientX;
    startY = event.clientY;

    translateX += deltaX;
    translateY += deltaY;

    updateTransform();
}

function handleMouseWheel(event) {
    event.preventDefault();

    const delta = Math.sign(event.deltaY);
    const zoomSpeed = 0.5;

    const prevScale = scale;

    if (delta > 0) {
        // Zoom out
        scale -= zoomSpeed;
    } else {
        // Zoom in
        scale += zoomSpeed;
    }

    scale = Math.max(1, scale); // Limit minimum scale
    scale = Math.min(8, scale);   // Limit maximum scale

    // Adjust translation to maintain the center of the map
    const rect = map.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    //translateX += (mouseX / prevScale - mouseX / scale);
    //translateY += (mouseY / prevScale - mouseY / scale);

    updateTransform();
}

function updateTransform() {
    map.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}