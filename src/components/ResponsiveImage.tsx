import { generateImageSrcSet, getImageSrc } from '@/lib/responsiveImages';

interface ResponsiveImageProps {
  baseName: string;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  style?: React.CSSProperties;
}

export function ResponsiveImage({
  baseName,
  alt,
  className,
  sizes = '100vw',
  loading = 'lazy',
  style,
}: ResponsiveImageProps) {
  const src = getImageSrc(baseName);
  const srcSet = generateImageSrcSet(baseName);

  if (!src) {
    console.warn(`ResponsiveImage: No images found for "${baseName}"`);
    return null;
  }

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={loading}
      style={style}
    />
  );
}
