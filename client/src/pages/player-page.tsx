import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Content, Progress } from '@shared/schema';
import { VideoPlayer } from '@/components/ui/video-player';
import { useTranslation } from '@/lib/i18n';
import { Loader2, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import ContentCarousel from '@/components/content/carousel';

export default function PlayerPage() {
  const { t } = useTranslation();
  const [match, params] = useRoute('/player/:id');
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const [initialProgress, setInitialProgress] = useState(0);
  
  // Fetch content details
  const { data: content, isLoading, error } = useQuery<Content>({
    queryKey: [`/api/content/${params?.id}`],
    enabled: !!params?.id,
  });
  
  // Fetch user progress if logged in
  const { data: progressList = [] } = useQuery({
    queryKey: ['/api/progress'],
    enabled: !!user,
  });
  
  // Get recommended content for "up next" section
  const { data: recommendedContent = [] } = useQuery<Content[]>({
    queryKey: ['/api/recommended'],
    enabled: !!user && !!content,
  });
  
  // Find progress for current content
  useEffect(() => {
    if (user && progressList.length > 0 && content) {
      const contentProgress = progressList.find(
        (p: any) => p.contentId === content.id
      );
      
      if (contentProgress) {
        setInitialProgress(contentProgress.progress);
      }
    }
  }, [user, progressList, content]);
  
  // Set up fullscreen mode for better viewing experience
  useEffect(() => {
    document.documentElement.classList.add('overflow-hidden');
    
    return () => {
      document.documentElement.classList.remove('overflow-hidden');
    };
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading content...</p>
      </div>
    );
  }
  
  if (error || !content) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <p className="text-destructive text-xl mb-2">Content not found</p>
        <p className="text-muted-foreground">{error ? (error as Error).message : 'The requested content could not be found.'}</p>
        <Button 
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/')}
        >
          <Home className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black pb-8">
      {/* Video Player */}
      <div className="container mx-auto px-0 md:px-4 max-w-screen-2xl">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => navigate(`/content/${content.id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <VideoPlayer 
            content={content}
            initialProgress={initialProgress}
          />
        </div>
        
        {/* Content Info */}
        <div className="px-4 md:px-0 mt-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{content.title}</h1>
          
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm mb-4">
            <span>{content.releaseYear}</span>
            {content.type === 'movie' && content.duration && (
              <span>{Math.floor(content.duration / 60)}h {content.duration % 60}m</span>
            )}
            {content.type === 'series' && (
              <span>Season 1, Episode 1</span>
            )}
            <span className="text-green-400">{content.rating}% {t('match')}</span>
          </div>
          
          <p className="text-white/80">{content.description}</p>
        </div>
      </div>
      
      {/* Up Next Section */}
      {recommendedContent.length > 0 && (
        <div className="mt-8 container mx-auto">
          <ContentCarousel 
            title="Up Next" 
            contentList={recommendedContent.filter(item => item.id !== content.id).slice(0, 6)} 
          />
        </div>
      )}
    </div>
  );
}
