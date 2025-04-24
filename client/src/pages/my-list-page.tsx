import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Content } from '@shared/schema';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';
import ContentCard from '@/components/content/content-card';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';

export default function MyListPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  
  // Fetch user favorites
  const { data: favorites = [], isLoading, error } = useQuery<Content[]>({
    queryKey: ['/api/favorites'],
    enabled: !!user,
  });
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);
  
  if (!user) {
    return null; // Will redirect via useEffect
  }
  
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your favorites...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <p className="text-destructive text-xl mb-2">Failed to load favorites</p>
        <p className="text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-[calc(100vh-5rem)] container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-6">{t('myList')}</h1>
        
        {favorites.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {favorites.map(content => (
              <ContentCard 
                key={content.id} 
                content={content} 
                aspectRatio="poster"
                showProgress={true}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-card/50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your list is empty</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add movies and TV shows to your list to keep track of what you want to watch.
            </p>
            <Button onClick={() => navigate('/')}>Browse Content</Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
