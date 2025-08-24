import { useState, useEffect, useCallback, useMemo } from "react";
import type { Config } from "config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BrandLogoProps {
  brand: Config.Brand;
  className?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  updateFavicon?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  brand,
  className,
  alt,
  size = "md",
  updateFavicon = true,
}) => {
  const [currentImageSrc, setCurrentImageSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoadAttempts, setImageLoadAttempts] = useState(0);

  const getFaviconUrl = useCallback((website: string, sizePx: number = 64) => {
    try {
      const url = new URL(website);
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=${sizePx}`;
    } catch {
      return "/favicon.ico";
    }
  }, []);

  const imageSources = useMemo(() => {
    const sources: string[] = [];
    if (brand.logo) sources.push(brand.logo);
    if (brand.website) sources.push(getFaviconUrl(brand.website));
    sources.push("/favicon.ico");
    return sources.filter(Boolean);
  }, [brand.logo, brand.website, getFaviconUrl]);

  const updatePageFavicon = useCallback((imageUrl: string) => {
    if (!updateFavicon || typeof document === "undefined") return;
    
    const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']") || 
                 document.createElement("link");
    link.type = "image/x-icon";
    link.rel = "shortcut icon";
    link.href = imageUrl;
    
    if (!document.querySelector("link[rel*='icon']")) {
      document.head.appendChild(link);
    }
  }, [updateFavicon]);

  const preloadImage = useCallback((src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!src) {
        resolve(false);
        return;
      }

      const img = new Image();
      
      const timeout = setTimeout(() => {
        img.src = "";
        resolve(false);
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      img.src = src;
    });
  }, []);

  const loadNextImage = useCallback(async () => {
    if (imageLoadAttempts >= imageSources.length) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const currentSource = imageSources[imageLoadAttempts];
    
    const loaded = await preloadImage(currentSource);
    
    if (loaded) {
      setCurrentImageSrc(currentSource);
      setIsLoading(false);
      
      if (imageLoadAttempts === 0 && brand.logo) {
        updatePageFavicon(brand.logo);
      }
    } else {
      setImageLoadAttempts(prev => prev + 1);
    }
  }, [imageLoadAttempts, imageSources, preloadImage, updatePageFavicon, brand.logo]);

  useEffect(() => {
    loadNextImage();
  }, [imageLoadAttempts]);

  useEffect(() => {
    setImageLoadAttempts(0);
    setCurrentImageSrc("");
  }, [brand.logo, brand.website]);

  const handleImageError = useCallback(() => {
    if (imageLoadAttempts < imageSources.length - 1) {
      setImageLoadAttempts(prev => prev + 1);
    }
  }, [imageLoadAttempts, imageSources.length]);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const brandInitials = useMemo(() => {
    return brand.name
      .split(" ")
      .map((word: string) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [brand.name]);

  return (
    <Avatar className={`${sizeClasses[size]} ${className || ""} ${isLoading ? "animate-pulse" : ""}`}>
      {currentImageSrc && (
        <AvatarImage
          src={currentImageSrc}
          alt={alt || brand.name}
          onError={handleImageError}
        />
      )}
      <AvatarFallback>{brandInitials}</AvatarFallback>
    </Avatar>
  );
};
