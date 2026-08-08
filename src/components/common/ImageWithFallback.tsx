import { useState, useEffect, useCallback, useRef, type ImgHTMLAttributes } from 'react';

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  loadingSkeleton?: boolean;
  blurPlaceholder?: string;
}

const FALLBACK_GRADIENT =
  'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#f5f0ea" width="400" height="400"/><text x="200" y="200" text-anchor="middle" dominant-baseline="central" font-family="serif" font-size="64" fill="#c4a882">☕</text></svg>'
  );

const BLUR_PLACEHOLDER =
  'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect fill="#f5f0ea" width="40" height="40"/></svg>'
  );

export default function ImageWithFallback({
  src,
  alt,
  fallbackSrc = FALLBACK_GRADIENT,
  blurPlaceholder = BLUR_PLACEHOLDER,
  loadingSkeleton = true,
  className,
  ...props
}: Props) {
  const [currentSrc, setCurrentSrc] = useState<string>(blurPlaceholder);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const retryCountRef = useRef(0);
  const maxRetries = 2;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when src changes
  useEffect(() => {
    setCurrentSrc(blurPlaceholder);
    setHasError(false);
    setIsLoading(true);
    retryCountRef.current = 0;
  }, [src, blurPlaceholder]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setCurrentSrc(src);
  }, [src]);

  const handleError = useCallback(() => {
    if (retryCountRef.current < maxRetries) {
      // Retry with exponential backoff
      retryCountRef.current += 1;
      const delay = Math.pow(2, retryCountRef.current) * 500;
      timerRef.current = setTimeout(() => {
        setCurrentSrc(''); // Force re-render
        // Use a cache-busting parameter for retry
        const retrySrc = src.includes('?')
          ? `${src}&_retry=${retryCountRef.current}`
          : `${src}?_retry=${retryCountRef.current}`;
        setCurrentSrc(retrySrc);
      }, delay);
    } else {
      setHasError(true);
      setIsLoading(false);
      setCurrentSrc(fallbackSrc);
    }
  }, [src, fallbackSrc]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (loadingSkeleton && isLoading && !hasError) {
    // Show skeleton placeholder while loading
    return (
      <div className={`relative overflow-hidden ${className || ''}`} style={{ minHeight: '40px' }}>
        <img
          src={blurPlaceholder}
          alt={alt}
          className={`w-full h-full object-cover blur-sm scale-110 ${className || ''}`}
          aria-hidden="true"
          {...props}
        />
        <img
          src={hasError ? fallbackSrc : currentSrc || src}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${className || ''}`}
          style={{ opacity: 0 }}
          onLoad={() => {
            setIsLoading(false);
            setCurrentSrc(src);
          }}
          onError={handleError}
          loading="lazy"
          {...props}
        />
        {/* Skeleton shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
      </div>
    );
  }

  return (
    <img
      src={hasError ? fallbackSrc : currentSrc || src}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
}

