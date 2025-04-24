import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Play, Plus, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Content } from '@shared/schema';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ContentCardProps {
  content: Content;
  showDetails?: boolean; // If true, shows more details like duration, year, etc.
  aspectRatio?: 'video' | 'poster'; // video = 16:9, poster = 2:3
  showProgress?: boolean;
}

export default function ContentCard({ 
  content, 
  showDetails = false, 
  aspectRatio = 'video',
  showProgress = false 
}: ContentCardProps) {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = useState(false);

  // Get user favorites if logged in
  const { data: favorites = [] } = useQuery<Content[]>({
    queryKey: ['/api/favorites'],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch('/api/favorites', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  // Get user progress if logged in and showProgress is true
  const { data: progressList = [] } = useQuery({
    queryKey: ['/api/progress'],
    enabled: !!user && showProgress,
  });

  // Check if content is in favorites
  const isFavorite = favorites.some(fav => fav.id === content.id);

  // Get progress for this content
  const contentProgress = showProgress 
    ? progressList.find((p: any) => p.contentId === content.id)?.progress || 0
    : 0;

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      if (!user) return null;
      await apiRequest('POST', '/api/favorites', { contentId: content.id });
      return content.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    }
  });

  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async () => {
      if (!user) return null;
      await apiRequest('DELETE', `/api/favorites/${content.id}`);
      return content.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    }
  });

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (isFavorite) {
      removeFromFavoritesMutation.mutate();
    } else {
      addToFavoritesMutation.mutate();
    }
  };

  const goToPlayer = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/player/${content.id}`);
  };

  const heightClass = aspectRatio === 'video' ? 'h-36' : 'h-[380px]';

  return (
    <Link href={`/content/${content.id}`}>
      <div 
        className="content-card cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <img 
            src={content.posterUrl} 
            alt={content.title} 
            className={`w-full ${heightClass} object-cover rounded-lg`}
          />
          
          {/* Play Button Overlay */}
          <div className={`play-icon-overlay absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <Button
              onClick={goToPlayer}
              className="bg-primary/80 hover:bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center"
            >
              <Play className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {content.isNew && (
              <Badge className="bg-accent text-white text-xs font-bold">
                {t('new')}
              </Badge>
            )}
            {content.isExclusive && (
              <Badge className="bg-primary text-white text-xs font-bold">
                {t('exclusive')}
              </Badge>
            )}
          </div>
          
          {/* Content Title and Info */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent rounded-b-lg">
            <h3 className="text-white font-medium truncate">{content.title}</h3>
            <div className="flex items-center text-sm text-gray-300">
              {content.rating && (
                <>
                  <span className="text-green-400 font-semibold">{content.rating}% {t('match')}</span>
                  <span className="mx-1">•</span>
                </>
              )}
              {content.type === 'series' ? (
                <span>{content.seasons} {t('seasons')}</span>
              ) : (
                <span>{content.releaseYear}</span>
              )}
            </div>
          </div>
          
          {/* Progress Bar if needed */}
          {showProgress && contentProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b-lg">
              <div className="h-full bg-primary rounded-bl-lg" style={{ width: `${contentProgress}%` }}></div>
            </div>
          )}
          
          {/* Action buttons on hover */}
          {isHovered && (
            <div className="absolute bottom-16 right-2 flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/30 backdrop-blur-sm hover:bg-background/50 text-white rounded-full w-8 h-8"
                onClick={toggleFavorite}
                title={isFavorite ? t('removeFromList') : t('addToList')}
              >
                {isFavorite ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/30 backdrop-blur-sm hover:bg-background/50 text-white rounded-full w-8 h-8"
                title={t('moreInfo')}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Additional details if needed */}
        {showDetails && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-1 mt-1">
              {content.genres.slice(0, 3).map((genre, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </div>
            
            <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
              {content.description}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
