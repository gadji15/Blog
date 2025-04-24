import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Play, Info, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Content } from '@shared/schema';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { motion } from 'framer-motion';

interface HeroFeatureProps {
  content: Content;
}

export default function HeroFeature({ content }: HeroFeatureProps) {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
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

  // Check if content is in favorites
  const isFavorite = favorites.some(fav => fav.id === content.id);

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

  const toggleFavorite = () => {
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

  return (
    <section className="relative w-full h-[80vh] min-h-[500px]">
      {/* Background Image with Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background">
        <img 
          src={content.backdropUrl} 
          alt={content.title} 
          className="w-full h-full object-cover object-center opacity-60" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background opacity-80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
      </div>
      
      {/* Content Info */}
      <div className="container mx-auto px-4 relative h-full flex items-end pb-16">
        <motion.div 
          className="max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {content.isNew && (
              <Badge className="bg-accent text-white px-2 py-1 text-xs font-semibold uppercase tracking-wider">
                {t('new')}
              </Badge>
            )}
            {content.isExclusive && (
              <Badge className="bg-primary text-white px-2 py-1 text-xs font-semibold uppercase tracking-wider">
                {t('exclusive')}
              </Badge>
            )}
          </div>
          
          <h1 className="font-poppins font-bold text-4xl md:text-6xl text-white mb-3">{content.title}</h1>
          
          <div className="flex items-center space-x-4 mb-4">
            {content.rating && (
              <span className="text-green-400 font-semibold">{content.rating}% {t('match')}</span>
            )}
            <span className="text-gray-300">{content.releaseYear}</span>
            {content.type === 'movie' && content.duration && (
              <span className="text-gray-300">{Math.floor(content.duration / 60)}h {content.duration % 60}m</span>
            )}
            {content.type === 'series' && (
              <span className="text-gray-300">{content.seasons} {t('seasons')}</span>
            )}
          </div>
          
          <p className="text-gray-200 text-base md:text-lg mb-6 line-clamp-3">
            {content.description}
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => navigate(`/player/${content.id}`)}
              className="bg-white hover:bg-gray-200 text-background px-6 py-6 rounded-md font-medium transition-colors"
            >
              <Play className="mr-2 h-5 w-5" />
              <span>{t('play')}</span>
            </Button>
            
            <Button 
              onClick={() => navigate(`/content/${content.id}`)}
              variant="outline" 
              className="bg-background/80 hover:bg-background text-white px-6 py-6 rounded-md font-medium transition-colors border border-white/20 backdrop-blur-sm"
            >
              <Info className="mr-2 h-5 w-5" />
              <span>{t('moreInfo')}</span>
            </Button>
            
            <Button
              onClick={toggleFavorite}
              variant="outline"
              className="w-12 h-12 rounded-full bg-background/60 hover:bg-background border border-white/20 backdrop-blur-sm transition-colors text-white"
            >
              {isFavorite ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
