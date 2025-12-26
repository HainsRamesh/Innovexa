import { useRef } from 'react';
import { Innovation } from '@/types';
import { InnovationTile } from './InnovationTile';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

interface MyInnovationsSectionProps {
  innovations: Innovation[];
  onSelectInnovation: (innovation: Innovation) => void;
}

export const MyInnovationsSection = ({
  innovations,
  onSelectInnovation,
}: MyInnovationsSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (innovations.length === 0) return null;

  return (
    <div className="relative group/row mb-10">
      {/* Section Header with distinct styling */}
      <div className="flex items-center justify-between mb-4 px-1">
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

      {/* Scroll Container with subtle background */}
      <div className="relative bg-primary/5 rounded-xl p-4 -mx-4">
        {/* Left Arrow */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/row:opacity-100 transition-opacity shadow-lg"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Tiles */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {innovations.map((innovation) => (
            <InnovationTile
              key={innovation.id}
              innovation={innovation}
              onSelect={onSelectInnovation}
            />
          ))}
        </div>

        {/* Right Arrow */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/row:opacity-100 transition-opacity shadow-lg"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
