-- 快速修复：将所有已上链的作品设置为公开并上架
USE creatorchain_final;
-- 1. 查看当前状态
SELECT '=== 修复前的状态 ===' as info;
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
      WHEN is_listed = 1 THEN 1
      ELSE 0
    END
  ) as listed_count,
  SUM(
    CASE
      WHEN token_id > 0 THEN 1
      ELSE 0
    END
  ) as minted_count
FROM creations;
-- 2. 显示作品详情
SELECT '=== 作品详情 ===' as info;
SELECT id,
  token_id,
  title,
  visibility,
  is_listed
FROM creations
ORDER BY created_at DESC;
-- 3. 更新所有已上链的作品为公开并上架
SELECT '=== 开始修复 ===' as info;
UPDATE creations
SET visibility = 'public',
  is_listed = 1
WHERE token_id > 0;
-- 4. 如果没有token_id，至少将已发布的设置为公开
UPDATE creations
SET visibility = 'public'
WHERE visibility != 'public';
-- 5. 查看修复后的状态
SELECT '=== 修复后的状态 ===' as info;
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
      WHEN is_listed = 1 THEN 1
      ELSE 0
    END
  ) as listed_count,
  SUM(
    CASE
      WHEN token_id > 0 THEN 1
      ELSE 0
    END
  ) as minted_count
FROM creations;
-- 6. 显示修复后的作品详情
SELECT '=== 修复后的作品详情 ===' as info;
SELECT id,
  token_id,
  title,
  visibility,
  is_listed
FROM creations
ORDER BY created_at DESC;