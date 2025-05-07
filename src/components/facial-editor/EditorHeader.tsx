
import React from 'react';

const EditorHeader = () => {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-4xl font-bold mb-2 text-editor-dark">Obscurial</h1>
      <p className="text-muted-foreground mb-2">
        Subtly modify facial features to help defeat facial recognition while maintaining visual similarity
      </p>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium">Tip:</span> Use slider controls to adjust facial features and apply privacy filters
      </p>
    </div>
  );
};

export default EditorHeader;
