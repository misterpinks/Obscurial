
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { createImageFromCanvas } from '../utils/canvasUtils';

export interface BatchJob {
  id: string;
  originalImage: HTMLImageElement;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
}

export const useBatchProcessing = (
  sliderValues: Record<string, number>,
  processImage: (image: HTMLImageElement) => Promise<string>
) => {
  const { toast } = useToast();
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const addToBatch = useCallback((image: HTMLImageElement, name: string) => {
    const newJob: BatchJob = {
      id: `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      originalImage: image,
      name: name || `Image ${batchJobs.length + 1}`,
      status: 'pending'
    };
    
    setBatchJobs(prev => [...prev, newJob]);
    
    toast({
      title: "Added to Batch",
      description: `"${newJob.name}" added to processing queue`
    });
    
    return newJob;
  }, [batchJobs, toast]);

  const removeFromBatch = useCallback((jobId: string) => {
    setBatchJobs(prev => prev.filter(job => job.id !== jobId));
  }, []);

  const clearBatch = useCallback(() => {
    if (!isBatchProcessing) {
      setBatchJobs([]);
      toast({
        title: "Batch Cleared",
        description: "All pending jobs have been removed"
      });
    } else {
      toast({
        title: "Cannot Clear Batch",
        description: "Batch processing is currently running",
        variant: "destructive"
      });
    }
  }, [isBatchProcessing, toast]);

  const processBatch = useCallback(async () => {
    if (isBatchProcessing || batchJobs.length === 0) {
      return;
    }
    
    setIsBatchProcessing(true);
    toast({
      title: "Batch Processing Started",
      description: `Processing ${batchJobs.length} images with current settings`
    });
    
    // Create a copy of jobs to process
    const jobsToProcess = [...batchJobs];
    
    // Process each job one by one
    for (let i = 0; i < jobsToProcess.length; i++) {
      const job = jobsToProcess[i];
      
      // Skip completed jobs
      if (job.status === 'completed') {
        continue;
      }
      
      // Update job status
      setBatchJobs(prev => 
        prev.map(j => j.id === job.id ? { ...j, status: 'processing' } : j)
      );
      
      try {
        // Process the image
        const resultUrl = await processImage(job.originalImage);
        
        // Update job with result
        setBatchJobs(prev => 
          prev.map(j => j.id === job.id ? { 
            ...j, 
            status: 'completed', 
            resultUrl 
          } : j)
        );
      } catch (error) {
        console.error('Error processing batch job:', error);
        
        // Update job as failed
        setBatchJobs(prev => 
          prev.map(j => j.id === job.id ? { ...j, status: 'failed' } : j)
        );
      }
    }
    
    setIsBatchProcessing(false);
    toast({
      title: "Batch Processing Complete",
      description: `Processed ${batchJobs.length} images`
    });
  }, [batchJobs, isBatchProcessing, processImage, toast]);

  const downloadAll = useCallback(() => {
    const completedJobs = batchJobs.filter(job => job.status === 'completed' && job.resultUrl);
    
    if (completedJobs.length === 0) {
      toast({
        title: "No Completed Jobs",
        description: "Process images first before downloading",
        variant: "destructive"
      });
      return;
    }
    
    // Create zip file if more than one image
    if (completedJobs.length > 1) {
      toast({
        title: "Preparing Download",
        description: "Creating zip file with all processed images"
      });
      
      // In a real implementation, we would use JSZip or similar library
      // For now, just download them one by one
      completedJobs.forEach(job => {
        const link = document.createElement('a');
        link.href = job.resultUrl as string;
        link.download = `processed-${job.name}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    } else if (completedJobs.length === 1) {
      // Just download the single image
      const job = completedJobs[0];
      const link = document.createElement('a');
      link.href = job.resultUrl as string;
      link.download = `processed-${job.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    toast({
      title: "Download Started",
      description: `${completedJobs.length} image(s) being downloaded`
    });
  }, [batchJobs, toast]);

  return {
    batchJobs,
    isBatchProcessing,
    addToBatch,
    removeFromBatch,
    clearBatch,
    processBatch,
    downloadAll
  };
};
