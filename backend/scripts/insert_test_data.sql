-- 插入测试作品数据
USE creatorchain_final;
-- 获取第一个用户地址
SET @user_address = (
    SELECT address
    FROM users
    LIMIT 1
  );
-- Insert test creations one by one to avoid syntax errors
INSERT INTO creations (
    token_id,
    creator_address,
    title,
    description,
    visibility,
    content_hash,
    metadata_hash,
    image_url,
    ai_model,
    prompt_text,
    contribution_score,
    price_in_points,
    license_duration,
    is_listed,
    created_at,
    updated_at
  )
VALUES (
    1001,
    @user_address,
    'Red Envelope Art',
    'Beautiful red envelope design',
    'public',
    'QmTest1ContentHash123456789',
    'QmTest1MetadataHash123456789',
    '/uploads/images/sample1.jpg',
    'DALL-E 3',
    'Generate red envelope with fortune',
    85,
    100,
    12,
    1,
    NOW(),
    NOW()
  );
INSERT INTO creations (
    token_id,
    creator_address,
    title,
    description,
    visibility,
    content_hash,
    metadata_hash,
    image_url,
    ai_model,
    prompt_text,
    contribution_score,
    price_in_points,
    license_duration,
    is_listed,
    created_at,
    updated_at
  )
VALUES (
    1002,
    @user_address,
    'Test Image',
    'Test image for marketplace',
    'public',
    'QmTest2ContentHash123456789',
    'QmTest2MetadataHash123456789',
    '/uploads/images/sample2.jpg',
    'Midjourney',
    'Create test image',
    90,
    200,
    12,
    1,
    NOW(),
    NOW()
  );
INSERT INTO creations (
    token_id,
    creator_address,
    title,
    description,
    visibility,
    content_hash,
    metadata_hash,
    image_url,
    ai_model,
    prompt_text,
    contribution_score,
    price_in_points,
    license_duration,
    is_listed,
    created_at,
    updated_at
  )
VALUES (
    1003,
    @user_address,
    'Digital Art',
    'Modern digital artwork',
    'public',
    'QmTest3ContentHash123456789',
    'QmTest3MetadataHash123456789',
    '/uploads/images/sample3.jpg',
    'Stable Diffusion',
    'Generate digital art',
    80,
    150,
    12,
    1,
    NOW(),
    NOW()
  );
INSERT INTO creations (
    token_id,
    creator_address,
    title,
    description,
    visibility,
    content_hash,
    metadata_hash,
    image_url,
    ai_model,
    prompt_text,
    contribution_score,
    price_in_points,
    license_duration,
    is_listed,
    created_at,
    updated_at
  )
VALUES (
    1004,
    @user_address,
    'AI Masterpiece',
    'Unique AI-generated artwork',
    'public',
    'QmTest4ContentHash123456789',
    'QmTest4MetadataHash123456789',
    '/uploads/images/sample4.jpg',
    'DALL-E 3',
    'Create unique masterpiece',
    95,
    300,
    12,
    1,
    NOW(),
    NOW()
  );
INSERT INTO creations (
    token_id,
    creator_address,
    title,
    description,
    visibility,
    content_hash,
    metadata_hash,
    image_url,
    ai_model,
    prompt_text,
    contribution_score,
    price_in_points,
    license_duration,
    is_listed,
    created_at,
    updated_at
  )
VALUES (
    1005,
    @user_address,
    'Digital Painting',
    'Contemporary digital art',
    'public',
    'QmTest5ContentHash123456789',
    'QmTest5MetadataHash123456789',
    '/uploads/images/sample5.jpg',
    'Midjourney',
    'Modern art style painting',
    88,
    250,
    12,
    1,
    NOW(),
    NOW()
  );
INSERT INTO creations (
    token_id,
    creator_address,
    title,
    description,
    visibility,
    content_hash,
    metadata_hash,
    image_url,
    ai_model,
    prompt_text,
    contribution_score,
    price_in_points,
    license_duration,
    is_listed,
    created_at,
    updated_at
  )
VALUES (
    1006,
    @user_address,
    'Unlisted Work',
    'Not listed in marketplace',
    'public',
    'QmTest6ContentHash123456789',
    'QmTest6MetadataHash123456789',
    '/uploads/images/sample6.jpg',
    'DALL-E 3',
    'Test unlisted work',
    75,
    0,
    12,
    0,
    NOW(),
    NOW()
  );
INSERT INTO creations (
    token_id,
    creator_address,
    title,
    description,
    visibility,
    content_hash,
    metadata_hash,
    image_url,
    ai_model,
    prompt_text,
    contribution_score,
    price_in_points,
    license_duration,
    is_listed,
    created_at,
    updated_at
  )
VALUES (
    1007,
    @user_address,
    'Private Work',
    'Private creation',
    'private',
    'QmTest7ContentHash123456789',
    'QmTest7MetadataHash123456789',
    '/uploads/images/sample7.jpg',
    'Stable Diffusion',
    'Test private work',
    70,
    0,
    12,
    0,
    NOW(),
    NOW()
  );
-- Create listing records for listed creations
INSERT INTO listings (
    token_id,
    seller_addr,
    price,
    status,
    created_at,
    updated_at
  )
SELECT token_id,
  creator_address,
  price_in_points,
  'active',
  NOW(),
  NOW()
FROM creations
WHERE is_listed = 1;
-- Display results
SELECT 'Inserted creations:' as info;
SELECT id,
  token_id,
  title,
  visibility,
  is_listed,
  price_in_points
FROM creations
ORDER BY created_at DESC;
SELECT 'Statistics:' as info;
SELECT COUNT(*) as total,
  SUM(
    CASE
      WHEN visibility = 'public' THEN 1
      ELSE 0
    END
  ) as public_count,
  SUM(
    CASE
      WHEN is_listed = 1 THEN 1
      ELSE 0
    END
  ) as listed_count
FROM creations;