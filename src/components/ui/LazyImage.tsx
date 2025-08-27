'use client'

import React, { useState, useEffect, useRef } from 'react'
import { PhotoIcon } from '@heroicons/react/24/outline'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  width?: number | string
  height?: number | string
  placeholder?: React.ReactNode
  onLoad?: () => void
  onError?: () => void
  fallbackSrc?: string
}

export default function LazyImage({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder,
  onLoad,
  onError,
  fallbackSrc
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState<string>('')
  const imgRef = useRef<HTMLImageElement>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    if (placeholderRef.current) {
      observer.observe(placeholderRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isInView && src && !isLoaded && !hasError) {
      setCurrentSrc(src)
    }
  }, [isInView, src, isLoaded, hasError])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setHasError(false)
    } else {
      onError?.()
    }
  }

  const defaultPlaceholder = (
    <div 
      className={`flex items-center justify-center bg-gray-100 ${className}`}
      style={{ width, height }}
    >
      <PhotoIcon className="w-12 h-12 text-gray-400" />
    </div>
  )

  // Show placeholder while not in view or loading
  if (!isInView || (!isLoaded && currentSrc)) {
    return (
      <div ref={placeholderRef} className={className} style={{ width, height }}>
        {placeholder || defaultPlaceholder}
      </div>
    )
  }

  // Show error state
  if (hasError && !fallbackSrc) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 text-gray-500 ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <span className="text-sm">Failed to load image</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Show placeholder while image is loading */}
      {!isLoaded && (
        <div className={className} style={{ width, height }}>
          {placeholder || defaultPlaceholder}
        </div>
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0 absolute'} transition-opacity duration-300`}
        style={{ width, height }}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </>
  )
}