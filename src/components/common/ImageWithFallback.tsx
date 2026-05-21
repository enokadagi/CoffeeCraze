import { useState, type ImgHTMLAttributes } from 'react';

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
}

const FALLBACK_GRADIENT =
  'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#f5f0ea" width="400" height="400"/><text x="200" y="200" text-anchor="middle" dominant-baseline="central" font-family="serif" font-size="64" fill="#c4a882">☕</text></svg>'
  );

export default function ImageWithFallback({ src, alt, fallbackSrc = FALLBACK_GRADIENT, className, ...props }: Props) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  return (
    <img
      src={hasError ? fallbackSrc : imgSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
      {...props}
    />
  );
}
