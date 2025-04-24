import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, MessageSquareOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "@/lib/i18n";
import { Content } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface VideoPlayerProps {
  content: Content;
  initialProgress?: number;
  onProgressUpdate?: (progress: number) => void;
}

export function VideoPlayer({ content, initialProgress = 0, onProgressUpdate }: VideoPlayerProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [progress, setProgress] = useState<number>(initialProgress);
  const [showControls, setShowControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (progressData: { contentId: number; progress: number }) => {
      if (!user) return null;
      
      const res = await apiRequest("POST", "/api/progress", {
        contentId: progressData.contentId,
        progress: progressData.progress,
        timeRemaining: duration - currentTime
      });
      return await res.json();
    }
  });

  useEffect(() => {
    // Set video source
    if (videoRef.current && content.videoUrl) {
      videoRef.current.src = content.videoUrl;
    }
    
    // Set initial volume
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
    
    // Add event listeners
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', handleMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleVideoEnded);
      
      // Initialize time if there's initial progress
      if (initialProgress > 0 && duration > 0) {
        video.currentTime = (initialProgress / 100) * duration;
      }
    }
    
    return () => {
      if (video) {
        video.removeEventListener('loadedmetadata', handleMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleVideoEnded);
      }
      
      // Clear any timeouts
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [content, initialProgress, duration]);
  
  const handleMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };
  
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      
      // Calculate progress percentage
      const progressPercent = (current / duration) * 100;
      setProgress(progressPercent);
      
      // Report progress to parent component
      if (onProgressUpdate) {
        onProgressUpdate(progressPercent);
      }
      
      // Save progress every 10 seconds
      if (user && current % 10 < 0.5) {
        saveProgressMutation.mutate({
          contentId: content.id,
          progress: progressPercent
        });
      }
    }
  };
  
  const handleVideoEnded = () => {
    setIsPlaying(false);
    setProgress(100);
    
    // Save final progress
    if (user) {
      saveProgressMutation.mutate({
        contentId: content.id,
        progress: 100
      });
    }
  };
  
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
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const handleVolumeChange = (newVolume: number[]) => {
    const volumeValue = newVolume[0];
    if (videoRef.current) {
      videoRef.current.volume = volumeValue;
      videoRef.current.muted = volumeValue === 0;
      setVolume(volumeValue);
      setIsMuted(volumeValue === 0);
    }
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current && duration) {
      const seekTime = (parseFloat(e.target.value) / 100) * duration;
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };
  
  const toggleFullScreen = () => {
    if (playerContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerContainerRef.current.requestFullscreen();
      }
    }
  };
  
  // Helper to format time (seconds -> mm:ss)
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Show/hide controls with delay
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  return (
    <div 
      ref={playerContainerRef}
      className="video-player-container relative w-full aspect-video bg-black rounded-xl overflow-hidden"
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        poster={content.backdropUrl}
      />
      
      {/* Overlay for play button when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <Button 
            onClick={togglePlay} 
            size="lg" 
            className="w-16 h-16 rounded-full bg-primary/80 hover:bg-primary text-white animate-glow"
          >
            <Play className="h-8 w-8" />
          </Button>
        </div>
      )}
      
      {/* Video Controls */}
      <div className={`video-controls absolute bottom-0 left-0 right-0 p-4 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col space-y-2">
          {/* Progress Bar */}
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="w-full cursor-pointer"
          />
          
          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-primary"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:text-primary"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <div className="w-20">
                  <Slider
                    value={[volume]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                    className="cursor-pointer"
                  />
                </div>
              </div>
              
              <span className="text-white text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-primary"
                title={t('subtitles')}
              >
                <MessageSquareOff className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-primary"
                title={t('settings')}
              >
                <Settings className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-primary"
                onClick={toggleFullScreen}
                title={t('fullscreen')}
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
