-- Add image support to reviews
-- Run this migration to allow customers to upload images with their reviews

-- Add images column to reviews table
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS images JSONB[] DEFAULT '{}';

-- Add order_id to link reviews to specific orders
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- Create index for faster order lookups
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);

-- Add comments
COMMENT ON COLUMN reviews.images IS 'Array of image objects with url and publicId from Cloudinary';
COMMENT ON COLUMN reviews.order_id IS 'Link to the order this review is for';

SELECT 'Review images support added successfully!' as message;
