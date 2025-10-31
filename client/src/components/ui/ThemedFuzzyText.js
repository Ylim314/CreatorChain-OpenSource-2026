import React, { useEffect, useRef } from "react";
import { useThemeMode } from '../../context/ThemeModeContext';

const ThemedFuzzyText = ({
  children,
  fontSize = "clamp(1.5rem, 6vw, 4rem)",
  fontWeight = 400,
  fontFamily = "Inter, sans-serif",
  enableHover = true,
  baseIntensity = 0.1,
  hoverIntensity = 0.3,
  /** 在深色模式下自动降低基础模糊强度 */
  autoReduceBaseInDark = true,
  /** 在文字上方再叠加一层清晰文本以提升可读性 (0~1) */
  sharpenOverlayAlpha = 0.4,
  /** 在深色模式下使用更高对比度颜色 */
  highContrast = true,
  /** 是否添加轻微发光增强边缘 */
  glow = true,
  glowStrength = 0.5,
}) => {
  // 之前误用了 useThemeMode 返回的结构（并没有 isDark 字段）导致永远走浅色逻辑
  // 正确做法：从 context 取 mode 自行判断
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const canvasRef = useRef(null);

  // 根据主题设置颜色（提升对比度）
  let color;
  if (isDark) {
    color = highContrast ? "#ffffff" : "#f1f5f9"; // 深色模式下用纯白提高对比
  } else {
    color = highContrast ? "#1f2937" : "#374151"; // 浅色模式维持原有
  }

  useEffect(() => {
    let animationFrameId;
    let isCancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const init = async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      if (isCancelled) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const computedFontFamily =
        fontFamily === "inherit"
          ? window.getComputedStyle(canvas).fontFamily || "sans-serif"
          : fontFamily;

      const fontSizeStr =
        typeof fontSize === "number" ? `${fontSize}px` : fontSize;
      let numericFontSize;
      if (typeof fontSize === "number") {
        numericFontSize = fontSize;
      } else {
        const temp = document.createElement("span");
        temp.style.fontSize = fontSize;
        document.body.appendChild(temp);
        const computedSize = window.getComputedStyle(temp).fontSize;
        numericFontSize = parseFloat(computedSize);
        document.body.removeChild(temp);
      }

      const text = React.Children.toArray(children).join("");

      const offscreen = document.createElement("canvas");
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = "alphabetic";
      const metrics = offCtx.measureText(text);

      const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
      const actualRight = metrics.actualBoundingBoxRight ?? metrics.width;
      const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize;
      const actualDescent =
        metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2;

      const textBoundingWidth = Math.ceil(actualLeft + actualRight);
      const tightHeight = Math.ceil(actualAscent + actualDescent);

      const extraWidthBuffer = 10;
      const offscreenWidth = textBoundingWidth + extraWidthBuffer;

      offscreen.width = offscreenWidth;
      offscreen.height = tightHeight;

      const xOffset = extraWidthBuffer / 2;
      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = "alphabetic";
      offCtx.fillStyle = color;
      offCtx.fillText(text, xOffset - actualLeft, actualAscent);

      const horizontalMargin = 50;
      const verticalMargin = 10;
      canvas.width = offscreenWidth + horizontalMargin * 2;
      canvas.height = tightHeight + verticalMargin * 2;
      ctx.translate(horizontalMargin, verticalMargin);

      const interactiveLeft = horizontalMargin + xOffset;
      const interactiveTop = verticalMargin;
      const interactiveRight = interactiveLeft + textBoundingWidth;
      const interactiveBottom = interactiveTop + tightHeight;

      let isHovering = false;
      const fuzzRange = 25;

      const effectiveBase = isDark && autoReduceBaseInDark ? baseIntensity * 0.3 : baseIntensity;
      const effectiveHover = hoverIntensity;

      const run = () => {
        if (isCancelled) return;
        ctx.clearRect(
          -fuzzRange,
          -fuzzRange,
          offscreenWidth + 2 * fuzzRange,
          tightHeight + 2 * fuzzRange
        );
        const intensity = isHovering ? effectiveHover : effectiveBase;
        for (let j = 0; j < tightHeight; j++) {
          const dx = Math.floor(intensity * (Math.random() - 0.5) * fuzzRange);
          ctx.drawImage(
            offscreen,
            0,
            j,
            offscreenWidth,
            1,
            dx,
            j,
            offscreenWidth,
            1
          );
        }
        // 叠加一层稍微透明的清晰文本，提升锐度（不会完全盖掉动效）
        if (sharpenOverlayAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, Math.max(0, sharpenOverlayAlpha));
            ctx.drawImage(offscreen, 0, 0);
            ctx.restore();
        }
        // 发光效果：再次轻微放大+低透明度绘制
        if (glow) {
            ctx.save();
            ctx.globalAlpha = 0.08 * glowStrength;
            const glowPasses = Math.max(2, Math.round(4 * glowStrength));
            for (let g = 0; g < glowPasses; g++) {
              ctx.drawImage(offscreen, 0, 0);
            }
            ctx.restore();
        }
        animationFrameId = window.requestAnimationFrame(run);
      };

      run();

      const isInsideTextArea = (x, y) => {
        return (
          x >= interactiveLeft &&
          x <= interactiveRight &&
          y >= interactiveTop &&
          y <= interactiveBottom
        );
      };

      const handleMouseMove = (e) => {
        if (!enableHover) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      const handleMouseLeave = () => {
        isHovering = false;
      };

      const handleTouchMove = (e) => {
        if (!enableHover) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      const handleTouchEnd = () => {
        isHovering = false;
      };

      if (enableHover) {
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);
        canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
        canvas.addEventListener("touchend", handleTouchEnd);
      }

      const cleanup = () => {
        window.cancelAnimationFrame(animationFrameId);
        if (enableHover) {
          canvas.removeEventListener("mousemove", handleMouseMove);
          canvas.removeEventListener("mouseleave", handleMouseLeave);
          canvas.removeEventListener("touchmove", handleTouchMove);
          canvas.removeEventListener("touchend", handleTouchEnd);
        }
      };

      canvas.cleanupFuzzyText = cleanup;
    };

    init();

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(animationFrameId);
      if (canvas && canvas.cleanupFuzzyText) {
        canvas.cleanupFuzzyText();
      }
    };
  }, [
    children,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    enableHover,
    baseIntensity,
    hoverIntensity,
    isDark,
    autoReduceBaseInDark,
    sharpenOverlayAlpha,
    highContrast,
    glow,
    glowStrength,
  ]);

  return <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />;
};

export default ThemedFuzzyText;
