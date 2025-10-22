import { useState, useEffect } from "react";
import { removeBackground, loadImageFromUrl } from "@/utils/backgroundRemoval";

// Using the uploaded image URL directly
const originalImageUrl = "/lovable-uploads/65a82be0-f007-4d2d-a970-1a65e2abb64c.png";

const ProcessedIllustration = () => {
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processImage = async () => {
      try {
        setIsProcessing(true);
        setError(null);
        
        // Load the original image
        const imageElement = await loadImageFromUrl(originalImageUrl);
        
        // Remove background and add blue gradient background
        const processedBlob = await removeBackground(imageElement);
        
        // Create URL for the processed image
        const url = URL.createObjectURL(processedBlob);
        setProcessedImageUrl(url);
      } catch (err) {
        console.error('Failed to process image:', err);
        setError('Failed to process image');
        // Fallback to original image
        setProcessedImageUrl(originalImageUrl);
      } finally {
        setIsProcessing(false);
      }
    };

    processImage();

    // Cleanup function
    return () => {
      if (processedImageUrl && processedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(processedImageUrl);
      }
    };
  }, []);

  if (isProcessing) {
    return (
      <div className="w-full max-w-md mx-auto lg:mx-0 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Processing image...</p>
        </div>
      </div>
    );
  }

  if (error && !processedImageUrl) {
    return (
      <div className="w-full max-w-md mx-auto lg:mx-0 flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load image</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <img 
        src={processedImageUrl || originalImageUrl}
        alt="Intern management illustration" 
        className="w-full h-auto object-contain rounded-lg"
      />
      {error && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Using fallback image due to processing error
        </p>
      )}
    </div>
  );
};

export default ProcessedIllustration;