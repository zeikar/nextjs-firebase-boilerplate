import React from 'react';
import Image from 'next/image';

export default function GitHubIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <Image
      src="/github-mark.svg"
      alt="GitHub Icon"
      width={20}
      height={20}
      className={`invert ${className}`}
    />
  );
}
