"use client";

import Image from 'next/image';
import { useState } from 'react';

export default function BrandLogo({ size = 32 }) {
  const [errored, setErrored] = useState(false);
  const dim = size;
  if (errored) {
    return (
      <div
        className="brand-gradient-text flex h-8 items-center justify-center rounded-full border border-white/10 bg-black/50 px-2 text-base font-bold"
        style={{ width: dim, height: dim }}
        aria-label="JEY Power Gym"
        title="JEY Power Gym"
      >
        J
      </div>
    );
  }
  return (
    <Image
      src="/logo.jpg"
      alt="JEY Power Gym"
      width={dim}
      height={dim}
      className="rounded-full object-cover"
      onError={() => setErrored(true)}
      priority
    />
  );
}
