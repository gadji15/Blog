import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ContentCard from './content-card';
import { Content } from '@shared/schema';
import { useTranslation } from '@/lib/i18n';

interface ContentCarouselProps {
  title: string;
  contentList: Content[];
  category?: string;
}

export default function ContentCarousel({ title, contentList, category }: ContentCarouselProps) {
  const { t } = useTranslation();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    return () => window.removeEventListener('resize', checkScrollable);
  }, [contentList]);

  const checkScrollable = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      
      // Update button states after scroll
      setTimeout(checkScrollable, 300);
    }
  };

  const handleScroll = () => {
    checkScrollable();
  };

  if (contentList.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <h2 className="text-2xl font-poppins font-bold mb-6">{title}</h2>
        
        <div className="relative">
          {/* Gradient Overlays and Navigation Buttons */}
          <div className="gradient-left"></div>
          <div className="gradient-right"></div>
          
          {canScrollLeft && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-background/30 backdrop-blur-sm text-foreground hover:bg-background/50"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          
          {canScrollRight && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-background/30 backdrop-blur-sm text-foreground hover:bg-background/50"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
          
          {/* Carousel Content */}
          <div 
            ref={carouselRef} 
            className="carousel-container flex space-x-4 pb-4"
            onScroll={handleScroll}
          >
            {contentList.map((content) => (
              <div key={content.id} className="flex-shrink-0 w-64">
                <ContentCard content={content} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
