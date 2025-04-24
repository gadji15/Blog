import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Content } from '@shared/schema';
import ContentGrid from '@/components/content/content-grid';
import { useTranslation } from '@/lib/i18n';
import { Loader2 } from 'lucide-react';

export default function SeriesPage() {
  const { t } = useTranslation();
  
  // Fetch all series
  const { data: series, isLoading, error } = useQuery<Content[]>({
    queryKey: ['/api/series'],
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading series...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <p className="text-destructive text-xl mb-2">Failed to load series</p>
        <p className="text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      {series && series.length > 0 ? (
        <ContentGrid 
          title={t('series')} 
          contentList={series} 
          showFilters={true}
          itemsPerPage={18}
        />
      ) : (
        <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
          <p className="text-lg">No series available</p>
        </div>
      )}
    </div>
  );
}
