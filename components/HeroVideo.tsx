"use client";

import { useEffect, useRef } from "react";

type HeroVideoProps = {
  reducedMotion: boolean;
  src: string;
};

export default function HeroVideo({ reducedMotion, src }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (reducedMotion) {
      video.pause();
      video.currentTime = Math.min(video.duration || 0.8, 0.8);
      return;
    }

    void video.play().catch(() => {
      // Browser autoplay policies can still block background video in edge cases.
    });
  }, [reducedMotion]);

  return (
    <div aria-hidden className="absolute inset-0 z-0 overflow-hidden bg-[#000106]">
      <video
        ref={videoRef}
        autoPlay={!reducedMotion}
        className="tgvpix-hero-video absolute inset-0 h-full w-full object-cover"
        disablePictureInPicture
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src={src} type="video/mp4" />
      </video>

      <div className="tgvpix-video-scrim absolute inset-0" />
      <div className="tgvpix-video-depth absolute inset-0" />
    </div>
  );
}
