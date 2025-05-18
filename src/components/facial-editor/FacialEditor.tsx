
import React from 'react';
import { FacialEditorContainer } from './FacialEditorContainer';

interface FacialEditorProps {
  isFaceApiLoaded: boolean;
  modelsLoadingStatus: 'loading' | 'success' | 'error';
}

const FacialEditor: React.FC<FacialEditorProps> = ({ 
  isFaceApiLoaded,
  modelsLoadingStatus
}) => {
  return (
    <FacialEditorContainer
      isFaceApiLoaded={isFaceApiLoaded}
      modelsLoadingStatus={modelsLoadingStatus}
    />
  );
};

export default FacialEditor;
