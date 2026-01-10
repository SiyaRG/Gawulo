import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Paper,
  Button,
  Chip,
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  ArrowBackIos as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';

export interface ImageItem {
  id: number;
  image: string;
  is_preview: boolean;
  display_order: number;
}

interface ImageCarouselProps {
  images: ImageItem[];
  onSetPreview: (imageId: number) => void;
  onDelete: (imageId: number) => void;
  onReorder?: (imageId: number, direction: 'up' | 'down') => void;
  editable?: boolean;
  maxImages?: number;
  startIndex?: number;
  showControls?: boolean;
  showPreview?: boolean;
  readOnly?: boolean;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  onSetPreview,
  onDelete,
  onReorder,
  editable = true,
  maxImages = 5,
  startIndex = 0,
  showControls = true,
  showPreview = true,
  readOnly = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  if (!images || images.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="textSecondary">
          No images uploaded
        </Typography>
      </Box>
    );
  }

  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);
  const currentImage = sortedImages[currentIndex];
  const imageUrl = currentImage.image.startsWith('http') 
    ? currentImage.image 
    : `${process.env.REACT_APP_API_URL || 'http://localhost:9033'}${currentImage.image}`;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0));
  };

  const handleSetPreview = () => {
    if (editable && !readOnly) {
      onSetPreview(currentImage.id);
    }
  };

  const handleDelete = () => {
    if (editable && !readOnly && window.confirm('Are you sure you want to delete this image?')) {
      onDelete(currentImage.id);
      if (currentIndex >= sortedImages.length - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  const handleReorder = (direction: 'up' | 'down') => {
    if (editable && !readOnly && onReorder) {
      onReorder(currentImage.id, direction);
    }
  };

  return (
    <Box>
      <Paper
        elevation={3}
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 600,
          margin: '0 auto',
          overflow: 'hidden',
        }}
      >
        {/* Main Image Display */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.100',
          }}
        >
          <Box
            component="img"
            src={imageUrl}
            alt={`Image ${currentIndex + 1}`}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />

          {/* Preview Badge */}
          {currentImage.is_preview && showPreview && (
            <Chip
              label="Preview"
              color="primary"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
              }}
            />
          )}

          {/* Navigation Arrows */}
          {sortedImages.length > 1 && showControls && (
            <>
              <IconButton
                onClick={handlePrevious}
                sx={{
                  position: 'absolute',
                  left: 8,
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: 8,
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                }}
              >
                <ArrowForwardIcon />
              </IconButton>
            </>
          )}

          {/* Action Buttons */}
          {editable && !readOnly && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                display: 'flex',
                gap: 1,
              }}
            >
              <IconButton
                onClick={handleSetPreview}
                color={currentImage.is_preview ? 'warning' : 'default'}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                }}
                title={currentImage.is_preview ? 'Preview image' : 'Set as preview'}
              >
                {currentImage.is_preview ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
              <IconButton
                onClick={handleDelete}
                color="error"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                }}
                title="Delete image"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Thumbnail Strip */}
        {sortedImages.length > 1 && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              p: 1,
              overflowX: 'auto',
              bgcolor: 'grey.50',
            }}
          >
            {sortedImages.map((image, index) => {
              const thumbUrl = image.image.startsWith('http')
                ? image.image
                : `${process.env.REACT_APP_API_URL || 'http://localhost:9033'}${image.image}`;
              return (
                <Box
                  key={image.id}
                  onClick={() => setCurrentIndex(index)}
                  sx={{
                    position: 'relative',
                    minWidth: 80,
                    height: 80,
                    cursor: 'pointer',
                    border: currentIndex === index ? 2 : 1,
                    borderColor: currentIndex === index ? 'primary.main' : 'grey.300',
                    borderRadius: 1,
                    overflow: 'hidden',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={thumbUrl}
                    alt={`Thumbnail ${index + 1}`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  {image.is_preview && (
                    <StarIcon
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        color: 'warning.main',
                        fontSize: 16,
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        {/* Reorder Controls */}
        {editable && onReorder && sortedImages.length > 1 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 1,
              p: 1,
              bgcolor: 'grey.50',
            }}
          >
            <Button
              size="small"
              startIcon={<ArrowUpIcon />}
              onClick={() => handleReorder('up')}
              disabled={currentIndex === 0}
            >
              Move Up
            </Button>
            <Button
              size="small"
              startIcon={<ArrowDownIcon />}
              onClick={() => handleReorder('down')}
              disabled={currentIndex === sortedImages.length - 1}
            >
              Move Down
            </Button>
          </Box>
        )}

        {/* Image Counter */}
        <Box
          sx={{
            textAlign: 'center',
            py: 1,
            bgcolor: 'grey.50',
          }}
        >
          <Typography variant="caption" color="textSecondary">
            {sortedImages.length} / {maxImages} images
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ImageCarousel;


