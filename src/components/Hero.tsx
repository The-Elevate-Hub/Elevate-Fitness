'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-50"
      >
        <source src="/videos/hero_video-1.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />

      <div className="relative h-full flex items-center justify-center px-4">
        <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-up">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white tracking-tight">
              ELEVATE
            </h1>
            <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-accent to-transparent" />
            <p className="text-xl md:text-2xl text-accent font-light tracking-widest">
              YOUR FITNESS JOURNEY
            </p>
          </div>

          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Transform your body and mind with premium fitness courses, expert-crafted workout plans, and comprehensive wellness guides designed for excellence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/products">
              <Button variant="luxury" size="xl" className="group">
                Explore Products
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="xl" className="border-white/20 hover:bg-white/10">
                Learn More
              </Button>
            </Link>
          </div>

          <div className="pt-8">
            <button
              onClick={togglePlay}
              className="group flex items-center gap-2 mx-auto text-sm text-gray-400 hover:text-white transition-colors"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              <div className="w-8 h-8 rounded-full border border-gray-400 group-hover:border-white flex items-center justify-center transition-colors">
                <Play className={`h-3 w-3 ${isPlaying ? 'opacity-50' : 'opacity-100'}`} />
              </div>
              <span className="tracking-wide">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}