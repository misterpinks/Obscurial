
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FilesIcon, Play, Square, Trash2, X, Download, Plus, Loader2 } from "lucide-react";
import { BatchJob } from './hooks/useBatchProcessing';

interface BatchProcessorProps {
  jobs: BatchJob[];
  isProcessing: boolean;
  onAddImages: () => void;
  onRemoveJob: (jobId: string) => void;
  onClearJobs: () => void;
  onProcessJobs: () => void;
  onDownloadAll: () => void;
}

const BatchProcessor: React.FC<BatchProcessorProps> = ({
  jobs,
  isProcessing,
  onAddImages,
  onRemoveJob,
  onClearJobs,
  onProcessJobs,
  onDownloadAll
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const totalJobs = jobs.length;
  const pendingJobs = jobs.filter(job => job.status === 'pending').length;
  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  const failedJobs = jobs.filter(job => job.status === 'failed').length;
  const processingJobs = jobs.filter(job => job.status === 'processing').length;

  // Calculate progress percentage
  const progress = totalJobs > 0 ? ((completedJobs + failedJobs) / totalJobs) * 100 : 0;

  return (
    <>
      <Button 
        variant="outline" 
        className="flex items-center" 
        onClick={() => setIsDialogOpen(true)}
      >
        <FilesIcon className="h-4 w-4 mr-2" />
        Batch Processing
        {totalJobs > 0 && (
          <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {totalJobs}
          </span>
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Batch Processing</span>
              {isProcessing && (
                <span className="text-sm font-normal text-muted-foreground flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing {processingJobs} of {totalJobs}...
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Batch controls */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={onAddImages}
                disabled={isProcessing}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Images
              </Button>
              
              {totalJobs > 0 && (
                <>
                  <Button 
                    variant="default" 
                    onClick={onProcessJobs}
                    disabled={isProcessing || pendingJobs === 0}
                  >
                    {isProcessing ? (
                      <>
                        <Square className="h-4 w-4 mr-1" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Process All
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={onDownloadAll}
                    disabled={isProcessing || completedJobs === 0}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download All
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    onClick={onClearJobs}
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </>
              )}
            </div>

            {/* Progress bar */}
            {totalJobs > 0 && (
              <div className="space-y-1">
                <div className="h-2 bg-secondary rounded-full">
                  <div 
                    className="h-2 bg-primary rounded-full transition-all" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{completedJobs} completed</span>
                  <span>{pendingJobs} pending</span>
                  {failedJobs > 0 && <span>{failedJobs} failed</span>}
                </div>
              </div>
            )}

            {/* Job list */}
            {totalJobs > 0 ? (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {jobs.map((job) => (
                    <Card key={job.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-muted rounded overflow-hidden">
                              {/* Image thumbnail */}
                              {job.originalImage && (
                                <img 
                                  src={job.originalImage.src} 
                                  alt={job.name} 
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{job.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {job.status === 'pending' && 'Pending'}
                                {job.status === 'processing' && 'Processing...'}
                                {job.status === 'completed' && 'Completed'}
                                {job.status === 'failed' && 'Failed'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {job.status === 'processing' && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {job.status === 'completed' && job.resultUrl && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = job.resultUrl as string;
                                  link.download = `processed-${job.name}.png`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => onRemoveJob(job.id)}
                              disabled={isProcessing && job.status === 'processing'}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FilesIcon className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No images in batch</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add images to process them with the same settings
                </p>
                <Button onClick={onAddImages}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Images
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BatchProcessor;
