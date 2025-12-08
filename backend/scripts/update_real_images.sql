USE creatorchain_final;
-- Update with real uploaded images
UPDATE creations
SET image_url = '/uploads/images/1765165219_a6b6mhup.jpg'
WHERE id = 1;
UPDATE creations
SET image_url = '/uploads/images/1764581673_677083fw.png'
WHERE id = 2;
UPDATE creations
SET image_url = '/uploads/images/1764576624_zjxtjf6e.png'
WHERE id = 3;
UPDATE creations
SET image_url = '/uploads/images/1764558528_cbe6e82l.jpg'
WHERE id = 4;
UPDATE creations
SET image_url = '/uploads/images/1764557230_nijnqrkx.png'
WHERE id = 5;
-- Verify
SELECT id,
  title,
  image_url
FROM creations
ORDER BY id;