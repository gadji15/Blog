import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Content } from '@shared/schema';
import { useTranslation } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContentCard from '@/components/content/content-card';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';

export default function SearchPage() {
  const { t } = useTranslation();
  const [_, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Use debounce to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Fetch search results
  const { data: searchResults = [], isLoading: isSearching } = useQuery<Content[]>({
    queryKey: [`/api/search?q=${debouncedQuery}`],
    enabled: debouncedQuery.trim().length > 0,
  });
  
  // Get all content for trending/recommended
  const { data: allContent = [], isLoading: isLoadingContent } = useQuery<Content[]>({
    queryKey: ['/api/content'],
  });
  
  const shuffleArray = (array: Content[]): Content[] => {
    const arrayCopy = [...array];
    for (let i = arrayCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
    }
    return arrayCopy;
  };
  
  // Filter content by type for tabs
  const filteredResults = searchQuery.length > 0 
    ? searchResults.filter(item => {
        if (activeTab === 'all') return true;
        if (activeTab === 'movies') return item.type === 'movie';
        if (activeTab === 'series') return item.type === 'series';
        return true;
      })
    : [];
  
  // Trending content (random sampling for this demo)
  const trendingContent = shuffleArray(allContent).slice(0, 12);
  
  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };
  
  const isLoading = isSearching && debouncedQuery.length > 0;
  
  return (
    <div className="min-h-[calc(100vh-5rem)] container mx-auto px-4 py-8">
      <motion.div 
        className="max-w-3xl mx-auto mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold mb-6 text-center">{t('search')}</h1>
        
        <div className="relative">
          <Input
            type="text"
            placeholder="Search for movies, series, genres..."
            className="w-full h-14 pl-12 pr-12 text-lg bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={clearSearch}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </motion.div>
      
      {debouncedQuery.length > 0 && (
        <div className="mb-8">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mx-auto w-fit">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="movies">Movies</TabsTrigger>
              <TabsTrigger value="series">Series</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredResults.map(content => (
                    <ContentCard 
                      key={content.id} 
                      content={content} 
                      aspectRatio="poster"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-xl font-medium mb-2">No results found</p>
                  <p className="text-muted-foreground">Try a different search term</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Show trending when no search is active */}
      {debouncedQuery.length === 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Popular on StreamFlow</h2>
          
          {isLoadingContent ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {trendingContent.map(content => (
                <ContentCard 
                  key={content.id} 
                  content={content} 
                  aspectRatio="poster"
                />
              ))}
            </div>
          )}
          
          {/* Browse categories section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Button 
                variant="outline" 
                className="h-20 text-lg font-medium hover:bg-primary/20 hover:text-primary"
                onClick={() => setLocation('/films')}
              >
                Movies
              </Button>
              <Button 
                variant="outline" 
                className="h-20 text-lg font-medium hover:bg-primary/20 hover:text-primary"
                onClick={() => setLocation('/series')}
              >
                Series
              </Button>
              <Button 
                variant="outline" 
                className="h-20 text-lg font-medium hover:bg-primary/20 hover:text-primary"
                onClick={() => setSearchQuery('action')}
              >
                Action
              </Button>
              <Button 
                variant="outline" 
                className="h-20 text-lg font-medium hover:bg-primary/20 hover:text-primary"
                onClick={() => setSearchQuery('sci-fi')}
              >
                Sci-Fi
              </Button>
              <Button 
                variant="outline" 
                className="h-20 text-lg font-medium hover:bg-primary/20 hover:text-primary"
                onClick={() => setSearchQuery('drama')}
              >
                Drama
              </Button>
              <Button 
                variant="outline" 
                className="h-20 text-lg font-medium hover:bg-primary/20 hover:text-primary"
                onClick={() => setSearchQuery('comedy')}
              >
                Comedy
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
