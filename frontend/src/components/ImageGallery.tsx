import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close, ZoomIn } from '@mui/icons-material';
import ImageCarousel from './ImageCarousel';

interface ImageGalleryProps {
  images: Array<{ id: number; image: string; is_preview?: boolean }>;
  title?: string;
  onImageClick?: (imageId: number) => void;
  showPreview?: boolean;
  maxImages?: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  title,
  onImageClick,
  showPreview = true,
  maxImages = 5,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);

  const displayImages = images.slice(0, maxImages);
  const hasMoreImages = images.length > maxImages;

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setFullScreenOpen(true);
    if (onImageClick) {
      onImageClick(images[index].id);
    }
  };

  const handleCloseFullScreen = () => {
    setFullScreenOpen(false);
    setSelectedImageIndex(null);
  };

  if (images.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No images available
        </Typography>
      </Box>
    );
  }

  if (images.length === 1) {
    return (
      <Box>
        <img
          src={images[0].image}
          alt={title || 'Image'}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: theme.shape.borderRadius,
            cursor: 'pointer',
          }}
          onClick={() => handleImageClick(0)}
        />
      </Box>
    );
  }

  return (
    <>
      <ImageList
        cols={isMobile ? 2 : 3}
        rowHeight={isMobile ? 150 : 200}
        gap={8}
        sx={{ mb: 2 }}
      >
        {displayImages.map((image, index) => (
          <ImageListItem
            key={image.id}
            sx={{
              cursor: 'pointer',
              position: 'relative',
              '&:hover': {
                opacity: 0.9,
              },
            }}
            onClick={() => handleImageClick(index)}
          >
            <img
              src={image.image}
              alt={`${title || 'Image'} ${index + 1}`}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: theme.shape.borderRadius,
              }}
            />
            {image.is_preview && showPreview && (
              <ImageListItemBar
                title="Preview"
                sx={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
                }}
                position="bottom"
              />
            )}
            {index === displayImages.length - 1 && hasMoreImages && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: theme.shape.borderRadius,
                }}
              >
                <Typography variant="h6" color="white">
                  +{images.length - maxImages} more
                </Typography>
              </Box>
            )}
          </ImageListItem>
        ))}
      </ImageList>

      {/* Full-screen carousel dialog */}
      <Dialog
        open={fullScreenOpen}
        onClose={handleCloseFullScreen}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={handleCloseFullScreen}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <Close />
          </IconButton>
          {selectedImageIndex !== null && (
            <ImageCarousel
              images={images.map((img, index) => ({
                id: img.id,
                image: img.image,
                is_preview: img.is_preview || false,
                display_order: index,
              }))}
              startIndex={selectedImageIndex}
              showControls={true}
              showPreview={false}
              onDelete={() => {}}
              onSetPreview={() => {}}
              onReorder={() => {}}
              readOnly={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageGallery;

