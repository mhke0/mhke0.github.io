// Empty Plates - Photo data
// Original image ratio: 3024x4032 (portrait, 3:4 ratio)
// Display size: 210px width, 280px height to maintain aspect ratio
const photos = [
    { url: 'images/plate01.jpg', width: 210, height: 280, year: '2024', location: 'Lissabon' },
    { url: 'images/plate02.jpg', width: 210, height: 280, year: '2023', location: 'Matera' },
    { url: 'images/plate03.jpg', width: 210, height: 280, year: '2023', location: 'Nürnberg' },
    { url: 'images/plate04.jpg', width: 210, height: 280, year: '2023', location: 'Berlin' },
    { url: 'images/plate05.jpg', width: 210, height: 280, year: '2023', location: 'Berlin' },
    { url: 'images/plate06.jpg', width: 210, height: 280, year: '2023', location: 'Copenhagen' },
    { url: 'images/plate07.jpg', width: 210, height: 280, year: '2022', location: 'New York' },
    { url: 'images/plate08.jpg', width: 210, height: 280, year: '2022', location: 'Berlin' },
    { url: 'images/plate09.jpg', width: 210, height: 280, year: '2022', location: 'Munich' },
    { url: 'images/plate10.jpg', width: 210, height: 280, year: '2022', location: 'Copenhagen' },
    { url: 'images/plate11.jpg', width: 210, height: 280, year: '2022', location: 'Copenhagen' },
    { url: 'images/plate12.jpg', width: 210, height: 280, year: '2023', location: 'Copenhagen' },
    { url: 'images/plate13.jpg', width: 210, height: 280, year: '2023', location: 'Nürnberg' },
    { url: 'images/plate14.jpg', width: 210, height: 280, year: '2024', location: 'Heraklion' },
    { url: 'images/plate15.jpg', width: 210, height: 280, year: '2024', location: 'Baleeira' },
    { url: 'images/plate16.jpg', width: 210, height: 280, year: '2024', location: 'Heidelberg' },
    { url: 'images/plate17.jpg', width: 210, height: 280, year: '2025', location: 'Hamburg' },
    { url: 'images/plate18.jpg', width: 210, height: 280, year: '2025', location: 'Nara' }


];



// State
let isDraggingCanvas = false;
let isDraggingPhoto = false;
let startX, startY;
// Center the view to give impression of being in a field of photos
// Calculate offset to show middle area (approximately row 2, columns 2-4)
let currentX = -window.innerWidth * 0.1;
let currentY = -window.innerHeight * 0.1;
let velocityX = 0;
let velocityY = 0;

// Photo dragging state
let draggedPhoto = null;
let photoOffsetX = 0;
let photoOffsetY = 0;

// Elements
const canvas = document.getElementById('canvas');
const cursor = document.querySelector('.cursor');

// Initialize canvas position
canvas.style.transform = `translate(${currentX}px, ${currentY}px)`;

// Debug: log when photos are created
console.log('Portfolio initialized with', photos.length, 'photos');

// Create photo elements
function createPhotoElements() {
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;

    photos.forEach((photo, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';

        const img = document.createElement('img');
        img.src = photo.url;
        img.alt = `Photo ${index + 1}`;
        img.draggable = false;

        // Debug: log when image loads or fails
        img.onload = () => console.log(`✓ Photo ${index + 1} loaded:`, photo.url);
        img.onerror = () => console.error(`✗ Photo ${index + 1} failed to load:`, photo.url);

        photoItem.appendChild(img);

        // Add caption with year and location
        if (photo.year && photo.location) {
            const caption = document.createElement('div');
            caption.className = 'photo-caption';
            caption.textContent = `${photo.year} · ${photo.location}`;
            photoItem.appendChild(caption);
        }

        // Custom grid layout with varying rows: 5, 6, 4, 5, 6, etc.
        const padding = 50; // Spacing between photos
        const startPadding = 50; // Initial offset from edges
        // First row has fewer photos to leave space for logo (skip 2 cells)
        const rowPattern = [5, 4, 5, 6, 6]; // Photos per row - varying pattern

        // Skip first 2 cells - shift all photos by 2 to leave more space for logo
        const adjustedIndex = index + 2;

        // Calculate which row and column based on the varying row pattern
        let row = 0;
        let col = adjustedIndex;
        let totalPhotosInPreviousRows = 0;

        // Find which row this photo belongs to
        for (let i = 0; i < rowPattern.length; i++) {
            if (col <= rowPattern[i]) {
                row = i;
                col = col - 1; // Adjust for 0-based column index
                break;
            }
            col -= rowPattern[i];
            totalPhotosInPreviousRows += rowPattern[i];
        }

        // If we've gone past the pattern, continue cycling through it
        if (row >= rowPattern.length) {
            const cycleLength = rowPattern.reduce((sum, val) => sum + val, 0);
            const cycleNum = Math.floor(adjustedIndex / cycleLength);
            const posInCycle = adjustedIndex % cycleLength;

            for (let i = 0; i < rowPattern.length; i++) {
                if (posInCycle <= rowPattern[i]) {
                    row = cycleNum * rowPattern.length + i;
                    col = posInCycle - 1;
                    break;
                }
                col -= rowPattern[i];
            }
        }

        // Use max dimensions for grid consistency
        const maxWidth = 280;
        const maxHeight = 280;

        // Calculate base position
        const baseX = col * (maxWidth + padding) + startPadding;
        const baseY = row * (maxHeight + padding) + startPadding;

        // Add subtle random offset for organic feel with minimal overlap
        const randomOffsetX = (Math.sin(index * 1.234) * 0.5 + 0.5) * 50 - 25; // -25 to +25
        const randomOffsetY = (Math.cos(index * 2.345) * 0.5 + 0.5) * 50 - 25; // -25 to +25

        // Center photos within their grid cell with random variation
        const x = baseX + (maxWidth - photo.width) / 2 + randomOffsetX;
        const y = baseY + (maxHeight - photo.height) / 2 + randomOffsetY;

        photoItem.style.width = `${photo.width}px`;
        photoItem.style.height = `${photo.height}px`;
        photoItem.style.left = `${x}px`;
        photoItem.style.top = `${y}px`;
        // Don't set transform inline - let CSS handle it for hover effects

        console.log(`Photo ${index + 1} positioned at x:${x}, y:${y}`);

        // Add individual photo drag functionality
        photoItem.addEventListener('mousedown', onPhotoMouseDown);

        canvas.appendChild(photoItem);
    });
}

// Individual photo drag handlers
function onPhotoMouseDown(e) {
    e.stopPropagation(); // Prevent canvas drag

    isDraggingPhoto = true;
    draggedPhoto = e.currentTarget;

    // Get current photo position
    const rect = draggedPhoto.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // Calculate offset from mouse to photo's top-left corner
    photoOffsetX = e.clientX - rect.left;
    photoOffsetY = e.clientY - rect.top;

    draggedPhoto.style.transition = 'none'; // Disable transition during drag
    draggedPhoto.style.zIndex = '1000'; // Bring to front
}

// Mouse events for dragging canvas
function onMouseDown(e) {
    // Don't start canvas drag if clicking on a photo
    if (e.target.closest('.photo-item')) return;

    isDraggingCanvas = true;
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
    document.body.classList.add('dragging');
    cursor.classList.add('clicking');
    velocityX = 0;
    velocityY = 0;
}

function onMouseMove(e) {
    // Update cursor position
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;

    // Handle photo dragging
    if (isDraggingPhoto && draggedPhoto) {
        // Calculate new position relative to canvas
        const canvasRect = canvas.getBoundingClientRect();
        const newLeft = e.clientX - canvasRect.left - photoOffsetX;
        const newTop = e.clientY - canvasRect.top - photoOffsetY;

        draggedPhoto.style.left = `${newLeft}px`;
        draggedPhoto.style.top = `${newTop}px`;
        return;
    }

    // Handle canvas dragging
    if (!isDraggingCanvas) return;

    const newX = e.clientX - startX;
    const newY = e.clientY - startY;

    velocityX = newX - currentX;
    velocityY = newY - currentY;

    currentX = newX;
    currentY = newY;

    canvas.style.transform = `translate(${currentX}px, ${currentY}px)`;
}

function onMouseUp() {
    // Reset photo dragging
    if (isDraggingPhoto && draggedPhoto) {
        draggedPhoto.style.transition = ''; // Re-enable transition
        draggedPhoto.style.zIndex = ''; // Reset z-index
        isDraggingPhoto = false;
        draggedPhoto = null;
    }

    // Reset canvas dragging
    if (isDraggingCanvas) {
        isDraggingCanvas = false;
        document.body.classList.remove('dragging');
        cursor.classList.remove('clicking');
        applyMomentum();
    }
}

// Touch events for mobile
function onTouchStart(e) {
    const touch = e.touches[0];

    // Check if touching a photo
    if (e.target.closest('.photo-item')) {
        const photoItem = e.target.closest('.photo-item');
        isDraggingPhoto = true;
        draggedPhoto = photoItem;

        const rect = photoItem.getBoundingClientRect();
        photoOffsetX = touch.clientX - rect.left;
        photoOffsetY = touch.clientY - rect.top;

        photoItem.style.transition = 'none';
        photoItem.style.zIndex = '1000';
        e.preventDefault();
        return;
    }

    // Otherwise, drag canvas
    isDraggingCanvas = true;
    startX = touch.clientX - currentX;
    startY = touch.clientY - currentY;
    velocityX = 0;
    velocityY = 0;
    e.preventDefault();
}

function onTouchMove(e) {
    const touch = e.touches[0];

    // Handle photo dragging
    if (isDraggingPhoto && draggedPhoto) {
        const canvasRect = canvas.getBoundingClientRect();
        const newLeft = touch.clientX - canvasRect.left - photoOffsetX;
        const newTop = touch.clientY - canvasRect.top - photoOffsetY;

        draggedPhoto.style.left = `${newLeft}px`;
        draggedPhoto.style.top = `${newTop}px`;
        e.preventDefault();
        return;
    }

    // Handle canvas dragging
    if (!isDraggingCanvas) return;

    const newX = touch.clientX - startX;
    const newY = touch.clientY - startY;

    velocityX = newX - currentX;
    velocityY = newY - currentY;

    currentX = newX;
    currentY = newY;

    canvas.style.transform = `translate(${currentX}px, ${currentY}px)`;
    e.preventDefault();
}

function onTouchEnd() {
    // Reset photo dragging
    if (isDraggingPhoto && draggedPhoto) {
        draggedPhoto.style.transition = '';
        draggedPhoto.style.zIndex = '';
        isDraggingPhoto = false;
        draggedPhoto = null;
    }

    // Reset canvas dragging
    if (isDraggingCanvas) {
        isDraggingCanvas = false;
        applyMomentum();
    }
}

// Momentum/inertia effect
function applyMomentum() {
    const friction = 0.92;

    function animate() {
        if (Math.abs(velocityX) < 0.5 && Math.abs(velocityY) < 0.5) {
            return;
        }

        velocityX *= friction;
        velocityY *= friction;

        currentX += velocityX;
        currentY += velocityY;

        canvas.style.transform = `translate(${currentX}px, ${currentY}px)`;
        requestAnimationFrame(animate);
    }

    animate();
}

// Prevent context menu on long press (mobile)
window.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.canvas')) {
        e.preventDefault();
    }
});

// Event listeners
document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);
document.addEventListener('mouseleave', onMouseUp);

document.addEventListener('touchstart', onTouchStart, { passive: false });
document.addEventListener('touchmove', onTouchMove, { passive: false });
document.addEventListener('touchend', onTouchEnd);

// Initialize
createPhotoElements();
