USE creatorchain_final;
SET @user_address = (
    SELECT address
    FROM users
    LIMIT 1
  );
INSERT INTO creations (
    token_id,
    creator_address,
    title,
    description,
    visibility,
    content_hash,
    metadata_hash,
    ai_model,
    prompt_text,
    contribution_score,
    price_in_points,
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
    'QmTest1Hash',
    'QmTest1Meta',
    'DALL-E 3',
    'Red envelope art',
    85,
    100,
    1,
    NOW(),
    NOW()
  ),
  (
    1002,
    @user_address,
    'Test Image',
    'Test for marketplace',
    'public',
    'QmTest2Hash',
    'QmTest2Meta',
    'Midjourney',
    'Test image',
    90,
    200,
    1,
    NOW(),
    NOW()
  ),
  (
    1003,
    @user_address,
    'Digital Art',
    'Modern artwork',
    'public',
    'QmTest3Hash',
    'QmTest3Meta',
    'Stable Diffusion',
    'Digital art',
    80,
    150,
    1,
    NOW(),
    NOW()
  ),
  (
    1004,
    @user_address,
    'AI Masterpiece',
    'Unique artwork',
    'public',
    'QmTest4Hash',
    'QmTest4Meta',
    'DALL-E 3',
    'Masterpiece',
    95,
    300,
    1,
    NOW(),
    NOW()
  ),
  (
    1005,
    @user_address,
    'Digital Painting',
    'Contemporary art',
    'public',
    'QmTest5Hash',
    'QmTest5Meta',
    'Midjourney',
    'Painting',
    88,
    250,
    1,
    NOW(),
    NOW()
  );
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
SELECT COUNT(*) as total_creations
FROM creations;
SELECT COUNT(*) as total_listings
FROM listings;