import { useState } from 'react';
import { Content } from '@shared/schema';
import ContentCard from './content-card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { genres } from '@shared/schema';
import { useTranslation } from '@/lib/i18n';

interface ContentGridProps {
  title: string;
  contentList: Content[];
  showFilters?: boolean;
  itemsPerPage?: number;
}

export default function ContentGrid({ title, contentList, showFilters = true, itemsPerPage = 12 }: ContentGridProps) {
  const { t } = useTranslation();
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('trending');
  const [page, setPage] = useState(1);

  // Filter content by genre
  const filteredContent = selectedGenre === 'all' 
    ? contentList 
    : contentList.filter(item => item.genres.includes(selectedGenre));

  // Sort content
  const sortedContent = [...filteredContent].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.releaseYear - a.releaseYear;
      case 'highest-rated':
        return (b.rating || 0) - (a.rating || 0);
      case 'a-z':
        return a.title.localeCompare(b.title);
      default: // 'trending'
        return (b.rating || 0) - (a.rating || 0);
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedContent.length / itemsPerPage);
  const currentPageContent = sortedContent.slice(
    (page - 1) * itemsPerPage, 
    page * itemsPerPage
  );

  const loadMore = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handleGenreChange = (value: string) => {
    setSelectedGenre(value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1); // Reset to first page when sort changes
  };

  return (
    <section className="py-10 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-poppins font-bold">{title}</h2>
          
          {showFilters && (
            <div className="flex flex-wrap gap-2">
              <Select value={selectedGenre} onValueChange={handleGenreChange}>
                <SelectTrigger className="w-[180px] bg-card border-border">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] bg-card border-border">
                  <SelectValue placeholder="Sort By: Trending" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trending">Sort By: Trending</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="highest-rated">Highest Rated</SelectItem>
                  <SelectItem value="a-z">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {/* Grid Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {currentPageContent.map(content => (
            <ContentCard 
              key={content.id} 
              content={content} 
              aspectRatio="poster"
              showProgress={true}
            />
          ))}
        </div>
        
        {/* Load More Button */}
        {page < totalPages && (
          <div className="flex justify-center mt-8">
            <Button 
              onClick={loadMore} 
              variant="outline"
              className="border-primary hover:bg-primary/20"
            >
              {t('loadMore')}
            </Button>
          </div>
        )}
        
        {/* No Results */}
        {filteredContent.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground text-lg">No content found matching your filters.</p>
          </div>
        )}
      </div>
    </section>
  );
}
