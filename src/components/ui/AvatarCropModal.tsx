import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw, Loader2 } from 'lucide-react';

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AvatarCropModalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  isUploading?: boolean;
}

// Utility function to create cropped image
const createCroppedImage = async (
  imageSrc: string,
  croppedAreaPixels: CroppedAreaPixels,
  outputSize: number = 512
): Promise<Blob> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Set output size to fixed square
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Draw cropped image
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
};

export const AvatarCropModal = ({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  isUploading = false,
}: AvatarCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: any, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    // Validate minimum resolution (at least 64x64 crop area)
    if (croppedAreaPixels.width < 64 || croppedAreaPixels.height < 64) {
      return;
    }

    setIsProcessing(true);
    try {
      const croppedBlob = await createCroppedImage(imageSrc, croppedAreaPixels, 512);
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const isValid = croppedAreaPixels && croppedAreaPixels.width >= 64 && croppedAreaPixels.height >= 64;
  const isBusy = isProcessing || isUploading;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isBusy && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-background border-border">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Crop Profile Picture</DialogTitle>
        </DialogHeader>

        {/* Crop Area */}
        <div className="relative w-full h-[300px] sm:h-[350px] bg-muted/50">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            classes={{
              containerClassName: 'rounded-none',
              cropAreaClassName: 'border-2 border-primary',
            }}
          />
        </div>

        {/* Zoom Controls */}
        <div className="px-6 py-4 space-y-4 border-t border-border">
          <div className="flex items-center gap-4">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={([value]) => setZoom(value)}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Preview */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted border-2 border-border mx-auto">
                {imageSrc && (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${imageSrc})`,
                      backgroundSize: `${zoom * 100}%`,
                      backgroundPosition: `${50 - (crop.x / 2)}% ${50 - (crop.y / 2)}%`,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-2 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isBusy}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isValid || isBusy}
          >
            {isBusy ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isUploading ? 'Uploading...' : 'Processing...'}
              </>
            ) : (
              'Apply'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
