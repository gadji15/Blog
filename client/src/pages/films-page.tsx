import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Content } from '@shared/schema';
import ContentGrid from '@/components/content/content-grid';
import { useTranslation } from '@/lib/i18n';
import { Loader2 } from 'lucide-react';

export default function FilmsPage() {
  const { t } = useTranslation();
  
  // Fetch all movies
  const { data: movies, isLoading, error } = useQuery<Content[]>({
    queryKey: ['/api/movies'],
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading movies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <p className="text-destructive text-xl mb-2">Failed to load movies</p>
        <p className="text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      {movies && movies.length > 0 ? (
        <ContentGrid 
          title={t('films')} 
          contentList={movies} 
          showFilters={true}
          itemsPerPage={18}
        />
      ) : (
        <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
          <p className="text-lg">No movies available</p>
        </div>
      )}
    </div>
  );
}
