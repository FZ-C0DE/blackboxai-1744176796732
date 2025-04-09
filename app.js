document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const photoContainer = document.getElementById('photo-container');
    const captureBtn = document.getElementById('capture-btn');
    const downloadBtn = document.getElementById('download-btn');
    const frameOptions = document.querySelectorAll('.frame-option');
    const stickers = document.querySelectorAll('.sticker');
    const frameColorInput = document.getElementById('frame-color');
    const frameWidthInput = document.getElementById('frame-width');

    // State
    let currentFrame = '1x1';
    let frameColor = '#ec4899';
    let frameWidth = 5;
    let capturedPhoto = null;
    let activeStickers = [];

    // Initialize camera
    async function initCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Could not access camera. Please ensure you have granted permissions.');
        }
    }

    // Frame selection
    frameOptions.forEach(option => {
        option.addEventListener('click', () => {
            currentFrame = option.dataset.frame;
            updateFrameDisplay();
        });
    });

    // Frame customization
    frameColorInput.addEventListener('input', (e) => {
        frameColor = e.target.value;
        updateFrameDisplay();
    });

    frameWidthInput.addEventListener('input', (e) => {
        frameWidth = parseInt(e.target.value);
        updateFrameDisplay();
    });

    // Update frame display
    function updateFrameDisplay() {
        photoContainer.innerHTML = '';
        photoContainer.style.border = `${frameWidth}px solid ${frameColor}`;
        
        switch(currentFrame) {
            case '1x1':
                photoContainer.style.aspectRatio = '1/1';
                break;
            case '1x2':
                photoContainer.style.aspectRatio = '1/2';
                break;
            case '1x4':
                photoContainer.style.aspectRatio = '1/4';
                break;
            case '2x2':
                photoContainer.style.aspectRatio = '1/1';
                // Add grid lines for 2x2
                photoContainer.style.backgroundImage = `
                    linear-gradient(${frameColor} ${frameWidth}px, transparent ${frameWidth}px),
                    linear-gradient(90deg, ${frameColor} ${frameWidth}px, transparent ${frameWidth}px)
                `;
                photoContainer.style.backgroundSize = `50% 50%`;
                break;
        }
    }

    // Sticker functionality
    stickers.forEach(sticker => {
        sticker.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', sticker.src);
        });
    });

    photoContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    photoContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const stickerSrc = e.dataTransfer.getData('text/plain');
        if (stickerSrc) {
            const sticker = document.createElement('img');
            sticker.src = stickerSrc;
            sticker.className = 'sticker absolute w-16 h-16 cursor-move';
            sticker.style.left = `${e.clientX - photoContainer.getBoundingClientRect().left - 32}px`;
            sticker.style.top = `${e.clientY - photoContainer.getBoundingClientRect().top - 32}px`;
            
            // Make stickers draggable after placement
            sticker.draggable = true;
            sticker.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', 'move');
                e.dataTransfer.setData('sticker-id', sticker.dataset.id);
            });
            
            sticker.addEventListener('dragend', (e) => {
                sticker.style.left = `${e.clientX - photoContainer.getBoundingClientRect().left - 32}px`;
                sticker.style.top = `${e.clientY - photoContainer.getBoundingClientRect().top - 32}px`;
            });

            const stickerId = Date.now();
            sticker.dataset.id = stickerId;
            activeStickers.push({id: stickerId, element: sticker});
            photoContainer.appendChild(sticker);
        }
    });

    // Capture photo
    captureBtn.addEventListener('click', () => {
        canvas.width = photoContainer.offsetWidth;
        canvas.height = photoContainer.offsetHeight;
        
        const ctx = canvas.getContext('2d');
        
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Apply frame
        ctx.strokeStyle = frameColor;
        ctx.lineWidth = frameWidth;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        // Apply grid for 2x2 frame
        if (currentFrame === '2x2') {
            ctx.strokeStyle = frameColor;
            ctx.lineWidth = frameWidth;
            // Vertical line
            ctx.beginPath();
            ctx.moveTo(canvas.width/2, 0);
            ctx.lineTo(canvas.width/2, canvas.height);
            ctx.stroke();
            // Horizontal line
            ctx.beginPath();
            ctx.moveTo(0, canvas.height/2);
            ctx.lineTo(canvas.width, canvas.height/2);
            ctx.stroke();
        }
        
        // Draw stickers
        activeStickers.forEach(sticker => {
            const img = new Image();
            img.src = sticker.element.src;
            const rect = sticker.element.getBoundingClientRect();
            const containerRect = photoContainer.getBoundingClientRect();
            const x = rect.left - containerRect.left;
            const y = rect.top - containerRect.top;
            ctx.drawImage(img, x, y, rect.width, rect.height);
        });
        
        capturedPhoto = canvas.toDataURL('image/png');
        downloadBtn.disabled = false;
        
        // Show captured photo
        const img = document.createElement('img');
        img.src = capturedPhoto;
        img.className = 'w-full h-full object-cover';
        photoContainer.innerHTML = '';
        photoContainer.appendChild(img);
        
        // Re-add stickers
        activeStickers.forEach(sticker => {
            photoContainer.appendChild(sticker.element);
        });
    });

    // Download photo
    downloadBtn.addEventListener('click', () => {
        if (!capturedPhoto) return;
        
        const link = document.createElement('a');
        link.download = `fatzcam-${Date.now()}.png`;
        link.href = capturedPhoto;
        link.click();
    });

    // Initialize
    initCamera();
    updateFrameDisplay();
});
