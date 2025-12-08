-- 修复现有作品的 visibility 字段
-- 将所有 visibility 为空或 private 的作品更新为 public
-- 1. 查看当前状态
SELECT id,
  token_id,
  title,
  visibility,
  is_listed,
  creator_address
FROM creations
WHERE visibility IS NULL
  OR visibility = ''
  OR visibility = 'private'
ORDER BY created_at DESC;
-- 2. 更新所有已上链作品的可见性为 public
-- 如果作品已经上链（token_id > 0），应该是公开的
UPDATE creations
SET visibility = 'public'
WHERE token_id > 0
  AND (
    visibility IS NULL
    OR visibility = ''
    OR visibility = 'private'
  );
-- 3. 更新所有已上架作品的可见性为 public
-- 如果作品已经上架（is_listed = true），应该是公开的
UPDATE creations
SET visibility = 'public'
WHERE is_listed = true
  AND (
    visibility IS NULL
    OR visibility = ''
    OR visibility = 'private'
  );
-- 4. 验证更新结果
SELECT COUNT(*) as total_creations,
  SUM(
    CASE
      WHEN visibility = 'public' THEN 1
      ELSE 0
    END
  ) as public_count,
  SUM(
    CASE
      WHEN visibility = 'private' THEN 1
      ELSE 0
    END
  ) as private_count,
  SUM(
    CASE
      WHEN visibility IS NULL
      OR visibility = '' THEN 1
      ELSE 0
    END
  ) as null_count
FROM creations;
-- 5. 查看更新后的作品列表
SELECT id,
  token_id,
  title,
  visibility,
  is_listed,
  creator_address,
  created_at
FROM creations
ORDER BY created_at DESC
LIMIT 20;