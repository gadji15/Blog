import { useQuery } from '@tanstack/react-query';
import { Content } from '@shared/schema';
import HeroFeature from '@/components/content/hero-feature';
import ContentCarousel from '@/components/content/carousel';
import { useTranslation } from '@/lib/i18n';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoPlayer } from '@/components/ui/video-player';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fetch featured content
  const { data: featuredContent, isLoading: isLoadingFeatured } = useQuery<Content>({
    queryKey: ['/api/featured'],
  });

  // Fetch trending content
  const { data: trendingContent, isLoading: isLoadingTrending } = useQuery<Content[]>({
    queryKey: ['/api/trending'],
  });

  // Fetch continue watching (user progress) if user is logged in
  const { data: continuewatchingData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['/api/progress'],
    enabled: !!user,
  });

  // Fetch popular series
  const { data: popularSeriesContent, isLoading: isLoadingPopularSeries } = useQuery<Content[]>({
    queryKey: ['/api/popular-series'],
  });

  // Fetch latest movies
  const { data: latestMoviesContent, isLoading: isLoadingLatestMovies } = useQuery<Content[]>({
    queryKey: ['/api/latest-movies'],
  });

  // Fetch recommended content if user is logged in
  const { data: recommendedContent, isLoading: isLoadingRecommended } = useQuery<Content[]>({
    queryKey: ['/api/recommended'],
    enabled: !!user,
  });

  // Process continue watching data to get content with progress
  const continueWatchingContent = continuewatchingData 
    ? continuewatchingData
        .filter((progress: any) => progress.progress > 0 && progress.progress < 100)
        .map((progress: any) => {
          const content = [...(trendingContent || []), ...(popularSeriesContent || []), ...(latestMoviesContent || [])]
            .find(c => c.id === progress.contentId);
          return content;
        })
        .filter(Boolean)
    : [];

  if (isLoadingFeatured) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[80vh] w-full" />
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Feature */}
      {featuredContent && (
        <HeroFeature content={featuredContent} />
      )}

      {/* Trending Content */}
      {trendingContent && trendingContent.length > 0 && (
        <ContentCarousel 
          title={t('trending')} 
          contentList={trendingContent} 
        />
      )}

      {/* Continue Watching Section - Only if user is logged in and has progress */}
      {user && continueWatchingContent && continueWatchingContent.length > 0 && (
        <ContentCarousel 
          title={t('continueWatching')} 
          contentList={continueWatchingContent} 
        />
      )}

      {/* Popular Series */}
      {popularSeriesContent && popularSeriesContent.length > 0 && (
        <ContentCarousel 
          title={t('popularSeries')} 
          contentList={popularSeriesContent} 
          category="series"
        />
      )}

      {/* Latest Movies Grid */}
      {latestMoviesContent && latestMoviesContent.length > 0 && (
        <ContentCarousel 
          title={t('latestMovies')} 
          contentList={latestMoviesContent} 
          category="movie"
        />
      )}

      {/* Preview Player */}
      {featuredContent && (
        <section className="py-10 px-4 bg-card/50">
          <div className="container mx-auto">
            <h2 className="text-2xl font-poppins font-bold mb-6">{t('featuredPreview')}</h2>
            
            <div className="video-player-container w-full max-w-5xl mx-auto">
              <VideoPlayer 
                content={featuredContent}
              />
              
              {/* Video Information */}
              <div className="mt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-poppins font-semibold text-foreground mb-1">
                      {featuredContent.title}: Official Trailer
                    </h3>
                    <p className="text-muted-foreground">
                      Experience the epic adventure coming soon exclusively to StreamFlow
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recommended Content - Only if user is logged in */}
      {user && recommendedContent && recommendedContent.length > 0 && (
        <ContentCarousel 
          title={t('recommended')} 
          contentList={recommendedContent} 
        />
      )}
    </>
  );
}
