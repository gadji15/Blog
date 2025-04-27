import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings, 
  Subtitles, 
  ArrowLeft 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  poster?: string;
  onClose?: () => void;
  onProgress?: (progress: number) => void;
  subtitles?: Array<{
    language: string;
    url: string;
  }>;
  startTime?: number; // Position de départ en secondes
}

export function VideoPlayer({
  videoUrl,
  title,
  poster,
  onClose,
  onProgress,
  subtitles,
  startTime = 0
}: VideoPlayerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [quality, setQuality] = useState<string>('auto');
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Contrôler le masquage automatique des contrôles
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Formater le temps (secondes -> MM:SS)
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Gérer la lecture/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(error => {
        console.error('Playback failed:', error);
        toast({
          title: 'Erreur de lecture',
          description: 'Impossible de lire la vidéo. Veuillez réessayer.',
          variant: 'destructive',
        });
      });
    }
  };

  // Gérer la mise à jour du temps de lecture
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const currentProgress = (video.currentTime / video.duration) * 100;
    setProgress(currentProgress);
    setCurrentTime(video.currentTime);

    // Enregistrer la progression si la fonction callback est fournie
    if (onProgress && video.currentTime > 0) {
      onProgress(currentProgress);
    }
  };

  // Gérer le chargement des métadonnées vidéo
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    setDuration(video.duration);
    setIsLoading(false);

    // Définir la position de départ si spécifiée
    if (startTime > 0 && startTime < video.duration) {
      video.currentTime = startTime;
    }
  };

  // Gérer le changement de position dans la vidéo
  const handleSeek = (newValue: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const seekTime = (newValue[0] / 100) * video.duration;
    video.currentTime = seekTime;
    setProgress(newValue[0]);
    setCurrentTime(seekTime);
  };

  // Gérer le changement de volume
  const handleVolumeChange = (newValue: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = newValue[0] / 100;
    video.volume = newVolume;
    setVolume(newVolume);

    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // Activer/désactiver le son
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  // Activer/désactiver le plein écran
  const toggleFullscreen = () => {
    if (!playerRef.current) return;

    if (!isFullscreen) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Détecter les changements de l'état du plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Contrôler l'affichage automatique des contrôles
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      // Réinitialiser le timeout
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      // Masquer les contrôles après 3 secondes d'inactivité
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const playerElement = playerRef.current;
    if (playerElement) {
      playerElement.addEventListener('mousemove', handleMouseMove);
      playerElement.addEventListener('click', () => {
        if (!showControls) {
          setShowControls(true);
        }
      });
    }

    return () => {
      if (playerElement) {
        playerElement.removeEventListener('mousemove', handleMouseMove);
      }
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Détecter l'état de lecture
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Gérer les sous-titres
  const handleSubtitleChange = (language: string | null) => {
    setSelectedSubtitle(language);
    setShowSettings(false);
  };

  // Gérer la qualité vidéo
  const handleQualityChange = (newQuality: string) => {
    setQuality(newQuality);
    // Dans une implémentation réelle, vous devriez changer la source vidéo ici
    setShowSettings(false);
    
    // Simuler un changement de qualité
    const currentTime = videoRef.current?.currentTime || 0;
    setIsLoading(true);
    
    // Réappliquer la position actuelle après un court délai
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div 
      ref={playerRef}
      className="relative w-full bg-black aspect-video overflow-hidden"
    >
      {/* Bouton retour (visible en mode non-plein écran) */}
      {onClose && !isFullscreen && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-50 bg-black/50 hover:bg-black/70 text-white"
          onClick={onClose}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      
      {/* Vidéo */}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
      >
        <source src={videoUrl} type="video/mp4" />
        
        {/* Sous-titres */}
        {subtitles?.map((subtitle) => (
          <track
            key={subtitle.language}
            kind="subtitles"
            label={subtitle.language}
            src={subtitle.url}
            srcLang={subtitle.language}
            default={selectedSubtitle === subtitle.language}
          />
        ))}
        
        Votre navigateur ne prend pas en charge la lecture vidéo HTML5.
      </video>
      
      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white"></div>
        </div>
      )}
      
      {/* Bouton lecture central (affiché lorsque la vidéo est en pause) */}
      {!isPlaying && !isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
          onClick={togglePlay}
        >
          <div className="h-20 w-20 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="h-12 w-12 text-white" fill="white" />
          </div>
        </div>
      )}
      
      {/* Barre de contrôle */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-2 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex flex-col gap-2">
          {/* Barre de progression */}
          <Slider
            value={[progress]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer h-1"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Bouton lecture/pause */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              
              {/* Temps de lecture */}
              <span className="text-white text-xs">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Contrôle du volume */}
              <div className="flex items-center space-x-2 group">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                
                <div className="hidden group-hover:block w-24">
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    min={0}
                    max={100}
                    onValueChange={handleVolumeChange}
                    className="cursor-pointer h-1"
                  />
                </div>
              </div>
              
              {/* Sous-titres */}
              {subtitles && subtitles.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "h-8 w-8 text-white hover:bg-white/20",
                    selectedSubtitle ? "text-primary" : "text-white"
                  )}
                  onClick={() => setShowSettings(prev => !prev)}
                >
                  <Subtitles className="h-5 w-5" />
                </Button>
              )}
              
              {/* Paramètres */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setShowSettings(prev => !prev)}
              >
                <Settings className="h-5 w-5" />
              </Button>
              
              {/* Plein écran */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Menu des paramètres */}
      {showSettings && (
        <div className="absolute right-4 bottom-16 bg-background/95 border rounded-md shadow-lg p-2 z-50">
          <div className="flex flex-col divide-y divide-border">
            {/* Qualité vidéo */}
            <div className="py-2">
              <h3 className="font-medium mb-1 text-sm">Qualité</h3>
              <div className="space-y-1">
                {['auto', '1080p', '720p', '480p', '360p'].map((q) => (
                  <button
                    key={q}
                    className={cn(
                      "block w-full text-left px-2 py-1 text-sm rounded",
                      quality === q ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    )}
                    onClick={() => handleQualityChange(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Sous-titres */}
            {subtitles && subtitles.length > 0 && (
              <div className="py-2">
                <h3 className="font-medium mb-1 text-sm">Sous-titres</h3>
                <div className="space-y-1">
                  <button
                    className={cn(
                      "block w-full text-left px-2 py-1 text-sm rounded",
                      selectedSubtitle === null ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    )}
                    onClick={() => handleSubtitleChange(null)}
                  >
                    Désactivés
                  </button>
                  
                  {subtitles.map((subtitle) => (
                    <button
                      key={subtitle.language}
                      className={cn(
                        "block w-full text-left px-2 py-1 text-sm rounded",
                        selectedSubtitle === subtitle.language ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      )}
                      onClick={() => handleSubtitleChange(subtitle.language)}
                    >
                      {subtitle.language}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Titre de la vidéo (visible brièvement au début de la lecture) */}
      <div className={cn(
        "absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300",
        (showControls && !isPlaying) ? "opacity-100" : "opacity-0"
      )}>
        <h2 className="text-white text-lg font-semibold">{title}</h2>
      </div>
    </div>
  );
}