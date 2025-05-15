import React from 'react';
import FacialEditorContainer from './FacialEditorContainer';

const FacialEditor: React.FC = () => {
  // This component now simply renders the FacialEditorContainer
  // This gives us flexibility to refactor the complex logic while keeping the same component name
  return <FacialEditorContainer />;
};

export default FacialEditor;
