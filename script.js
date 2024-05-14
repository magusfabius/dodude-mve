const cameraButton = document.getElementById('cameraButton');
const freezeButton = document.getElementById('freezeButton');
const sendButton = document.getElementById('sendButton');
const abortButton = document.getElementById('abortButton');
const newImageButton = document.getElementById('newImageButton');
const downloadButton = document.getElementById('downloadButton');
const toggleCameraButton = document.getElementById('toggleCameraButton')


const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const capturedImage = document.getElementById('capturedImage');


const overlay = document.getElementById('overlay')
const overlayContent = document.getElementById('overlay-content')

let stream = null;
let frozenFrame = null;


// MOBILE DETECTION
function detectMob() {
    return ( ( window.innerWidth <= 800 ) && ( window.innerHeight <= 600 ) );
}

let is_mobile = detectMob()
console.log("is_mobile: " + is_mobile)

let currentFacingMode = 'environment'; // Default to rear camera

// Function to toggle the camera between front and back
function toggleCamera() {
    currentFacingMode = (currentFacingMode === 'environment') ? 'user' : 'environment';
    startCamera(currentFacingMode);
}


// Access the camera and stream the video
async function startCamera(facingMode = 'environment') {
   
    const constraints = {
        video: {
            facingMode
        }
    };


    try {
        if(stream != null){
            stopVideoAndClearCanvas()
        }

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.style.display = 'block';
        toggleCameraButton.style.display = 'block';
        freezeButton.style.display = 'block';
        abortButton.style.display = 'block';
        cameraButton.style.display = 'none';
    } catch (error) {
        console.error('Error accessing camera:', error);
        // Provide user feedback about the error
        alert('Could not access the camera. Please check device settings and permissions.');
    }
}

// Freeze the current frame from the camera stream
function freezeFrame() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to data URL
    const dataURL = canvas.toDataURL('image/jpeg', 0.9);

    // Display the frozen image
    capturedImage.src = dataURL;
    capturedImage.style.display = 'block';

    // Store the frozen frame
    frozenFrame = dataURL;

    // Hide the video and show the send button
    video.style.display = 'none';
    freezeButton.style.display = 'none';
    toggleCameraButton.style.display = 'none';
    sendButton.style.display = 'block';
    abortButton.style.display = 'block'
    newImageButton.style.display = 'block';
    downloadButton.style.display = 'block';
}

function downloadImage() {
    if (capturedImage.src) {
        const link = document.createElement('a');
        link.href = frozenFrame
        link.download = 'captured_image.jpg';
        link.click();
    }
}

function stopVideoAndClearCanvas() {
    if (stream) {
        // Stop the video stream
        overlay.style.display = 'none';
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());

        // Clear the canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Hide the canvas and captured image
        canvas.style.display = 'none';
        capturedImage.style.display = 'none';

        // Show the camera button and hide the other buttons
        cameraButton.style.display = 'block';
        freezeButton.style.display = 'none';
        sendButton.style.display = 'none';
        abortButton.style.display = 'none';
        newImageButton.style.display = 'none'
        video.style.display = 'none';
        downloadButton.style.display = 'none';
        frozenFrame = null;
    }
}

// Send the frozen image to a ntfy server
function sendFrozenFrame() {
    if (frozenFrame) {
        const blob = dataURItoBlob(frozenFrame);

        const url = 'https://ntfy.sh/js-camera-capture';
        const headers = { 'Filename': 'image.jpg' };

        fetch(url, {
            method: 'PUT',
            body: blob,
            headers: headers
        })
            .then(response => {
                if (response.ok) {
                    console.log('Image sent successfully');
                    cameraButton.style.display = 'block';
                    stopVideoAndClearCanvas();

                } else {
                    console.error('Error sending image:', response.statusText);
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });
    }
}

function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

function handleNewImageClick() {
    overlay.style.display = 'block';
    capturedImage.style.display = 'none';
    sendButton.style.display = 'none';
    newImageButton.style.display = 'none';
    downloadButton.style.display = 'none';
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        startCamera();
    } else {
        console.error('getUserMedia is not supported on this browser.');
    }
}

// event listeners
abortButton.addEventListener('click', stopVideoAndClearCanvas);
newImageButton.addEventListener('click', handleNewImageClick);
cameraButton.addEventListener('click', handleNewImageClick);
freezeButton.addEventListener('click', freezeFrame);
downloadButton.addEventListener('click', downloadImage);
sendButton.addEventListener('click', sendFrozenFrame);
toggleCameraButton.addEventListener('click', toggleCamera);