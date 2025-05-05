
import * as faceapi from 'face-api.js';

// Polyfill TextEncoder if it doesn't exist (needed for face-api.js in Electron)
if (typeof window !== 'undefined' && !window.TextEncoder) {
  console.log('Polyfilling TextEncoder for face-api.js');
  window.TextEncoder = function TextEncoder() {};
  window.TextEncoder.prototype.encode = function encode(str) {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 0xff;
    }
    return bytes;
  };
}

/**
 * Load models directly from GitHub instead of relying on local files
 */
export const loadModelsFromGitHub = async () => {
  try {
    const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
    
    console.log('Loading face-api.js models directly from GitHub...');
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    
    console.log('Models loaded successfully!');
    return true;
  } catch (error) {
    console.error('Failed to load face-api.js models:', error);
    return false;
  }
};

/**
 * This function helps download the necessary model files for face-api.js
 * for users who want to save them locally (no longer primary method)
 */
export const downloadFaceApiModels = async () => {
  // URLs for the models on the face-api.js GitHub repository
  const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
  
  // List of models we need
  const modelsList = [
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
  ];
  
  console.log('Starting model downloads...');
  
  // Download each model file
  for (const model of modelsList) {
    const response = await fetch(`${MODEL_URL}/${model}`);
    const blob = await response.blob();
    
    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = model;
    link.textContent = `Download ${model}`;
    
    console.log(`Downloaded ${model}`);
    
    // Append to document for manual download
    document.body.appendChild(link);
    document.body.appendChild(document.createElement('br'));
  }
  
  console.log('All models prepared for download.');
  console.log('Please save these files to your "public/models/" directory');
};

/**
 * Helper function to check if the models are loaded correctly
 * This is no longer used as the primary check but kept for compatibility
 */
export const checkModelsExist = async () => {
  try {
    // Quick check if TinyFaceDetector is usable
    return faceapi.nets.tinyFaceDetector.isLoaded;
  } catch (error) {
    console.error('Face-api.js models check failed:', error);
    return false;
  }
};
