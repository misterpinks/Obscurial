
import * as faceapi from 'face-api.js';

/**
 * This function helps download the necessary model files for face-api.js
 * It should be run once to set up the application
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
 */
export const checkModelsExist = async () => {
  try {
    const response = await fetch('/models/tiny_face_detector_model-weights_manifest.json');
    const data = await response.json();
    console.log('Face-api.js models found!', data);
    return true;
  } catch (error) {
    console.error('Face-api.js models not found!', error);
    return false;
  }
};
