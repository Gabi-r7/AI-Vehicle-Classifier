// Local model extracted from tm-my-image-model.zip
let model, maxPredictions;

document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('image-input');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const fileInputButton = document.querySelector('.file-input-button');
    
    // Load model when page initializes
    initModel();
    
    // Event listener for when file is selected
    imageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        const resultElement = document.getElementById('classification-result');
        
        if (file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    previewContainer.style.display = 'block';
                    previewContainer.classList.add('fade-in');
                    fileInputButton.innerHTML = `✅ ${file.name}`;
                    
                    // Clear previous results when new image is selected
                    resultElement.innerHTML = 'Image loaded. Click "Classify" to analyze.';
                    resultElement.className = '';
                };
                
                reader.readAsDataURL(file);
            } else {
                alert('Please select only image files.');
                imageInput.value = '';
            }
        } else {
            previewContainer.style.display = 'none';
            fileInputButton.innerHTML = '📁 Choose File';
            
            // Reset result when no file is selected
            if (model) {
                resultElement.innerHTML = 'Select an image to start';
                resultElement.className = '';
            }
        }
    });
});

// Initialize Teachable Machine model
async function initModel() {
    const resultElement = document.getElementById('classification-result');
    
    try {
        // Show loading status
        resultElement.innerHTML = '⏳ Loading AI model...';
        resultElement.className = 'loading';
        
        console.log("Starting model loading...");
        
        // Load model and metadata from local files
        model = await tmImage.load("./model/model.json", "./model/metadata.json");
        maxPredictions = model.getTotalClasses();
        
        console.log("Model loaded successfully!");
        console.log("Available classes:", maxPredictions);
        
        // Show classes in console for debug
        const response = await fetch('./model/metadata.json');
        const metadata = await response.json();
        console.log("Model classes:", metadata.labels);
        
        // Update status to ready
        resultElement.innerHTML = '✅ Model loaded! Select an image to start';
        resultElement.className = 'success';
        
    } catch (error) {
        console.error("Error loading model:", error);
        resultElement.innerHTML = '❌ Error loading model. Check files in model/ folder';
        resultElement.className = 'error';
    }
}

// Function to classify image using real model
async function classifyImage() {
    const imageInput = document.getElementById('image-input');
    const resultElement = document.getElementById('classification-result');
    const imagePreview = document.getElementById('image-preview');
    
    if (!imageInput.files[0]) {
        alert('Please select an image first!');
        return;
    }
    
    if (!model) {
        alert('Model not loaded yet. Please try again in a few seconds.');
        return;
    }
    
    // Show loading state
    resultElement.innerHTML = '🔄 Classifying...';
    resultElement.className = 'loading';
    
    try {
        // Make prediction using preview image
        const prediction = await model.predict(imagePreview);
        
        // Find class with highest confidence
        let maxConfidence = 0;
        let bestPrediction = null;
        let secondBestPrediction = null;
        
        // Sort predictions by probability to get top 2
        const sortedPredictions = prediction.sort((a, b) => b.probability - a.probability);
        bestPrediction = sortedPredictions[0];
        secondBestPrediction = sortedPredictions[1];
        
        // Format result
        const confidence = (bestPrediction.probability * 100).toFixed(1);
        const secondConfidence = (secondBestPrediction.probability * 100).toFixed(1);
        const vehicleType = bestPrediction.className;
        const secondVehicleType = secondBestPrediction.className;
        
        // Mapping to friendly names
        const vehicleNames = {
            'moto': '🏍️ Motorcycle',
            'carro': '🚗 Car',
            'motorcycle': '🏍️ Motorcycle',
            'car': '🚗 Car'
        };
        
        const displayName = vehicleNames[vehicleType.toLowerCase()] || vehicleType;
        const secondDisplayName = vehicleNames[secondVehicleType.toLowerCase()] || secondVehicleType;
        
        if (bestPrediction.probability > 0.3) { // Minimum confidence of 30%
            resultElement.innerHTML = `🎯 Result: <strong>${displayName}</strong><br>Confidence: ${confidence}%<br><span style="color: #999; font-size: 0.9em;">${secondDisplayName}: ${secondConfidence}%</span>`;
            resultElement.className = 'success';
        } else {
            resultElement.innerHTML = `⚠️ Uncertain classification<br>Best guess: ${displayName} (${confidence}%)<br><span style="color: #999; font-size: 0.9em;">${secondDisplayName}: ${secondConfidence}%</span>`;
            resultElement.className = 'error';
        }
        
        // Log for debug (optional)
        console.log('All predictions:', prediction);
        
    } catch (error) {
        console.error('Classification error:', error);
        resultElement.innerHTML = '❌ Error classifying image';
        resultElement.className = 'error';
    }
}