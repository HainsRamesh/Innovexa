import { useRef } from 'react';
import { Innovation, InnovationCategory } from '@/types';
import { InnovationTile } from './InnovationTile';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface InnovationCategoryRowProps {
  category: InnovationCategory;
  innovations: Innovation[];
  onSelectInnovation: (innovation: Innovation) => void;
}

const categoryLabels: Record<InnovationCategory, string> = {
  ai: 'Artificial Intelligence',
  healthtech: 'Health Technology',
  fintech: 'Financial Technology',
  climatetech: 'Climate Technology',
  edtech: 'Education Technology',
  saas: 'Software as a Service',
  hardware: 'Hardware & IoT',
  web3: 'Web3 & Blockchain',
  other: 'Other Innovations',
};

export const InnovationCategoryRow = ({
  category,
  innovations,
  onSelectInnovation,
}: InnovationCategoryRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (innovations.length === 0) return null;

  return (
    <div className="relative group/row">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg font-semibold text-foreground">
          {categoryLabels[category]}
        </h2>
        <span className="text-sm text-muted-foreground">
          {innovations.length} {innovations.length === 1 ? 'innovation' : 'innovations'}
        </span>
      </div>

      {/* Scroll Container */}
      <div className="relative">
        {/* Left Arrow */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/row:opacity-100 transition-opacity shadow-lg"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Tiles */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
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
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/row:opacity-100 transition-opacity shadow-lg"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
