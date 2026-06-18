"use client";

import { motion, useReducedMotion } from "motion/react";
import HeroVideo from "@/components/HeroVideo";
import ScanOverlay from "@/components/ScanOverlay";

const instagramUrl = "https://www.instagram.com/tgvpix/";
const heroVideoSrc = "/media/grok-video.mp4";

export default function Hero() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  const titleInitial = shouldReduceMotion
    ? false
    : { opacity: 0, y: 18, filter: "blur(10px)" };
  const titleAnimate = { opacity: 1, y: 0, filter: "blur(0px)" };
  const copyInitial = shouldReduceMotion ? false : { opacity: 0, y: 12 };
  const copyAnimate = { opacity: 1, y: 0 };

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#01030a] text-white">
      <HeroVideo reducedMotion={shouldReduceMotion} src={heroVideoSrc} />

      <div aria-hidden className="tgvpix-vignette pointer-events-none absolute inset-0 z-10" />
      <ScanOverlay />

      <section className="relative z-20 flex min-h-[100svh] items-end px-6 pb-9 pt-24 sm:px-10 sm:pb-12 md:px-14 lg:px-16">
        <div className="w-full max-w-xl">
          <motion.h1
            animate={titleAnimate}
            className="tgvpix-title-glow text-4xl font-black leading-none text-white sm:text-5xl md:text-6xl"
            initial={titleInitial}
            transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1], delay: shouldReduceMotion ? 0 : 0.85 }}
          >
            TGVPIX
          </motion.h1>

          <motion.div
            animate={copyAnimate}
            className="tgvpix-copy-glow mt-4 max-w-lg"
            initial={copyInitial}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: shouldReduceMotion ? 0 : 1.18 }}
          >
            <p className="text-base font-semibold text-cyan-100 sm:text-lg">
              European Railway Photography
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-200/78 sm:text-[15px] sm:leading-7">
              High-speed trains, rare liveries and railway moments captured
              across Europe.
            </p>
          </motion.div>

          <motion.a
            animate={copyAnimate}
            aria-label="Open TGVPIX on Instagram in a new tab"
            className="tgvpix-cta relative mt-7 inline-flex min-h-11 items-center justify-center overflow-hidden rounded-full border border-cyan-100/30 bg-cyan-200/[0.035] px-6 text-sm font-semibold text-cyan-50 backdrop-blur-md transition-colors duration-300 hover:border-cyan-100/70 hover:bg-cyan-200/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#01030a]"
            href={instagramUrl}
            initial={copyInitial}
            rel="noopener noreferrer"
            target="_blank"
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: shouldReduceMotion ? 0 : 1.45 }}
            whileHover={
              shouldReduceMotion
                ? undefined
                : { scale: 1.025, boxShadow: "0 0 36px rgba(56, 189, 248, 0.34)" }
            }
            whileTap={shouldReduceMotion ? undefined : { scale: 0.988 }}
          >
            <span className="relative z-10">Enter Instagram</span>
          </motion.a>
        </div>
      </section>
    </main>
  );
}
