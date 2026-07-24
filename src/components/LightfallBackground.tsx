"use client";

import React from "react";
import Lightfall from "@/components/Lightfall";

export default function LightfallBackground() {
  return (
    <Lightfall
      colors={['#40e0d0', '#1e3a8a', '#ef4444']}
      backgroundColor="#0f172a"
      speed={0.5}
      streakCount={6}
      streakWidth={1}
      streakLength={1}
      glow={0.6}
      density={0.05}
      twinkle={1}
      zoom={1.8}
      backgroundGlow={0.3}
      opacity={0.5}
      mouseInteraction={false}
      mouseStrength={0.6}
      mouseRadius={0.7}
    />
  );
}
