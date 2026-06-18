"use client";

import { motion } from "motion/react";

type LoadingIndicatorProps = {
  reducedMotion: boolean;
};

export default function LoadingIndicator({ reducedMotion }: LoadingIndicatorProps) {
  return (
    <motion.div
      aria-hidden
      animate={reducedMotion ? { opacity: 0.72 } : { opacity: 0.86, rotate: 360 }}
      className="pointer-events-none absolute right-5 top-5 z-40 h-8 w-8 rounded-full border border-cyan-100/20 shadow-[0_0_20px_rgba(34,211,238,0.18)] sm:right-7 sm:top-7"
      initial={{ opacity: 0 }}
      transition={
        reducedMotion
          ? { delay: 0.2, duration: 0.5 }
          : { delay: 2.45, duration: 5.4, ease: "linear", repeat: Infinity }
      }
    >
      <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-100 shadow-[0_0_16px_rgba(165,243,252,0.82)]" />
      <span className="absolute inset-2 rounded-full border border-cyan-300/14" />
      <span className="absolute inset-[13px] rounded-full bg-cyan-200/65 shadow-[0_0_14px_rgba(103,232,249,0.65)]" />
    </motion.div>
  );
}
