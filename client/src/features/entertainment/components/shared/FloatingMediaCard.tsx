import { useLayoutEffect, useState } from "react";
import type { TmdbContentDto } from "@/features/entertainment/types";
import MediaCard from "@/features/entertainment/components/shared/MediaCard";
import { motion } from "framer-motion";

interface Props {
  anchorEl: HTMLDivElement;
  content: TmdbContentDto;
  type: "movie" | "tv";
}

export default function FloatingMediaCard({ anchorEl, content, type }: Props) {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
    initialY: number;
  } | null>(null);

  useLayoutEffect(() => {
    const rect = anchorEl.getBoundingClientRect();
    const scale = 1.4;
    const width = rect.width * scale;
    const height = rect.height * scale;

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let top = rect.top + scrollY - 40;
    let left = rect.left + scrollX - (width - rect.width) / 2;
    let initialY = 40;

    // Smart Positioning (Collision Detection)
    const padding = 20;
    const viewportHeight = window.innerHeight;
    // We use rect.top (viewport-relative) for collision check
    const bottomEdgeInViewport = rect.top - 40 + height;

    if (bottomEdgeInViewport > viewportHeight - padding) {
      const overflow = bottomEdgeInViewport - (viewportHeight - padding);
      top -= overflow;
      initialY += overflow;
    }

    setPosition({
      top,
      left,
      width,
      initialY,
    });
  }, [anchorEl]);

  if (!position) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1 / 1.4, y: position.initialY }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1 / 1.4, y: position.initialY }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 9999,
        pointerEvents: "none",
        transformOrigin: "center center",
      }}
      className="drop-shadow-2xl"
    >
      <MediaCard content={content} type={type} />
    </motion.div>
  );
}
