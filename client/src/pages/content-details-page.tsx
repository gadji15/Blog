import { useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Content } from '@shared/schema';
import { useTranslation } from '@/lib/i18n';
import { Loader2, Play, Plus, Check, Calendar, Clock, Star, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ContentCarousel from '@/components/content/carousel';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { motion } from 'framer-motion';

export default function ContentDetailsPage() {
  const { t } = useTranslation();
  const [match, params] = useRoute('/content/:id');
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch content details
  const { data: content, isLoading, error } = useQuery<Content>({
    queryKey: [`/api/content/${params?.id}`],
    enabled: !!params?.id,
  });
  
  // Fetch similar content recommendations
  const { data: recommendedContent = [] } = useQuery<Content[]>({
    queryKey: ['/api/recommended'],
    enabled: !!user && !!content,
  });
  
  // Get user favorites if logged in
  const { data: favorites = [] } = useQuery<Content[]>({
    queryKey: ['/api/favorites'],
    enabled: !!user,
  });
  
  // Check if content is in favorites
  const isFavorite = favorites.some(fav => fav.id === content?.id);
  
  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      if (!user || !content) return null;
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
      if (!user || !content) return null;
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
  
  useEffect(() => {
    // Scroll to top when content changes
    window.scrollTo(0, 0);
  }, [params?.id]);
  
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading content...</p>
      </div>
    );
  }
  
  if (error || !content) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <p className="text-destructive text-xl mb-2">Content not found</p>
        <p className="text-muted-foreground">{error ? (error as Error).message : 'The requested content could not be found.'}</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-[calc(100vh-5rem)]">
      {/* Hero Banner */}
      <div className="relative w-full h-[60vh]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background">
          <img 
            src={content.backdropUrl} 
            alt={content.title} 
            className="w-full h-full object-cover object-center opacity-60" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background opacity-80"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
        </div>
      </div>
      
      {/* Content Details */}
      <div className="container mx-auto px-4 relative -mt-40 z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Poster Image */}
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src={content.posterUrl} 
              alt={content.title} 
              className="w-full max-w-xs rounded-lg shadow-lg" 
            />
          </motion.div>
          
          {/* Content Information */}
          <motion.div 
            className="md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex flex-wrap gap-2 mb-4">
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
            
            <h1 className="font-poppins font-bold text-3xl md:text-5xl text-foreground mb-4">{content.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-6 text-muted-foreground">
              {content.rating && (
                <div className="flex items-center">
                  <Star className="text-yellow-500 mr-1 h-5 w-5" />
                  <span className="font-semibold">{content.rating}%</span>
                </div>
              )}
              
              <div className="flex items-center">
                <Calendar className="mr-1 h-5 w-5" />
                <span>{content.releaseYear}</span>
              </div>
              
              {content.type === 'movie' && content.duration && (
                <div className="flex items-center">
                  <Clock className="mr-1 h-5 w-5" />
                  <span>{Math.floor(content.duration / 60)}h {content.duration % 60}m</span>
                </div>
              )}
              
              {content.type === 'series' && content.seasons && (
                <div className="flex items-center">
                  <span>{content.seasons} {t('seasons')}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <Tag className="mr-1 h-5 w-5" />
                <span>{content.type === 'movie' ? 'Movie' : 'Series'}</span>
              </div>
            </div>
            
            <p className="text-foreground text-lg mb-8">{content.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {content.genres.map((genre, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {genre}
                </Badge>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <Button 
                onClick={() => navigate(`/player/${content.id}`)}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-6 rounded-md font-medium transition-colors"
                size="lg"
              >
                <Play className="mr-2 h-5 w-5" />
                <span>{t('play')}</span>
              </Button>
              
              <Button
                onClick={toggleFavorite}
                variant={isFavorite ? "default" : "outline"}
                className={isFavorite ? "bg-accent hover:bg-accent/90" : ""}
                size="lg"
              >
                {isFavorite ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    <span>{t('removeFromList')}</span>
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    <span>{t('addToList')}</span>
                  </>
                )}
              </Button>
            </div>
            
            {/* Additional information like cast, director, etc. could be added here */}
          </motion.div>
        </div>
      </div>
      
      {/* Trailer Section (if available) */}
      {content.trailerUrl && (
        <div className="container mx-auto px-4 py-10">
          <h2 className="text-2xl font-poppins font-bold mb-6">Trailer</h2>
          <div className="aspect-video max-w-4xl mx-auto bg-card rounded-lg overflow-hidden">
            <iframe 
              src={content.trailerUrl.replace('watch?v=', 'embed/')} 
              title={`${content.title} Trailer`}
              className="w-full h-full" 
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
      
      {/* Similar Content Recommendations */}
      {recommendedContent.length > 0 && (
        <ContentCarousel 
          title={t('recommended')} 
          contentList={recommendedContent.filter(item => item.id !== content.id).slice(0, 6)} 
        />
      )}
    </div>
  );
}
