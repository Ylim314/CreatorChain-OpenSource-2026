USE creatorchain_final;
-- Add image_url column
ALTER TABLE creations
ADD COLUMN image_url VARCHAR(500) DEFAULT '';
-- Add license_duration column  
ALTER TABLE creations
ADD COLUMN license_duration INT DEFAULT 12;
-- Update existing records with placeholder images
UPDATE creations
SET image_url = 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Digital+Painting'
WHERE id = 5;
UPDATE creations
SET image_url = 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=AI+Masterpiece'
WHERE id = 4;
UPDATE creations
SET image_url = 'https://via.placeholder.com/400x300/95E1D3/000000?text=Digital+Art'
WHERE id = 3;
UPDATE creations
SET image_url = 'https://via.placeholder.com/400x300/F38181/FFFFFF?text=Test+Image'
WHERE id = 2;
UPDATE creations
SET image_url = 'https://via.placeholder.com/400x300/AA96DA/FFFFFF?text=Red+Envelope'
WHERE id = 1;
-- Verify updates
SELECT id,
  title,
  image_url
FROM creations
ORDER BY id;