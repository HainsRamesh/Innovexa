import { useRef } from 'react';
import { Innovation } from '@/types';
import { InnovationTile } from './InnovationTile';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

interface MyInnovationsSectionProps {
  innovations: Innovation[];
  onSelectInnovation: (innovation: Innovation) => void;
  onRefresh?: () => void;
}

export const MyInnovationsSection = ({
  innovations,
  onSelectInnovation,
  onRefresh,
}: MyInnovationsSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -500 : 500;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (innovations.length === 0) return null;

  return (
    <div className="relative group/row mb-8 py-2">
      {/* Section Header with distinct styling */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            My Innovations
          </h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {innovations.length} {innovations.length === 1 ? 'innovation' : 'innovations'}
        </span>
      </div>

      {/* Scroll Container - no background */}
      <div className="relative">
        {/* Left gradient overlay - visible on hover */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background via-background/60 to-transparent z-10 pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-300" />
        
        {/* Right gradient overlay - visible on hover */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background via-background/60 to-transparent z-10 pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-300" />

        {/* Left Arrow - no background, larger icon, high z-index */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover/row:opacity-100 transition-all duration-300 text-foreground hover:text-primary hover:scale-110"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-8 w-8 drop-shadow-lg" />
        </button>

        {/* Tiles */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth py-4 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {innovations.map((innovation) => (
            <InnovationTile
              key={innovation.id}
              innovation={innovation}
              onSelect={onSelectInnovation}
              showMenu={true}
              onDelete={onRefresh}
            />
          ))}
        </div>

        {/* Right Arrow - no background, larger icon, high z-index */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover/row:opacity-100 transition-all duration-300 text-foreground hover:text-primary hover:scale-110"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-8 w-8 drop-shadow-lg" />
        </button>
      </div>
    </div>
  );
};
