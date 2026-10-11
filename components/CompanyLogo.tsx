"use client";

import { useState } from "react";

type Props = {
  domain: string;
  name: string;
  size?: number;
  className?: string;
};

export default function CompanyLogo({ domain, name, size = 40, className = "" }: Props) {
  const [failed, setFailed] = useState(false);

  const initial = name[0]?.toUpperCase() ?? "?";
  const hue = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  if (failed || !domain) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl font-bold text-white flex-shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.42,
          background: `linear-gradient(135deg, hsl(${hue},70%,35%), hsl(${(hue + 60) % 360},70%,45%))`,
        }}
      >
        {initial}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`}
      alt={`${name} logo`}
      width={size}
      height={size}
      className={`rounded-xl object-contain flex-shrink-0 ${className}`}
      style={{ width: size, height: size, background: "white", padding: 3 }}
      onError={() => setFailed(true)}
    />
  );
}
