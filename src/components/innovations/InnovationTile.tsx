import { Innovation } from '@/types';
import { Expand, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InnovationTileProps {
  innovation: Innovation;
  onSelect: (innovation: Innovation) => void;
}

const categoryColors: Record<string, string> = {
  ai: 'bg-category-technology',
  healthtech: 'bg-category-healthcare',
  fintech: 'bg-category-finance',
  climatetech: 'bg-category-sustainability',
  edtech: 'bg-category-education',
  saas: 'bg-primary',
  hardware: 'bg-category-infrastructure',
  web3: 'bg-accent',
  other: 'bg-muted',
};

const categoryLabels: Record<string, string> = {
  ai: 'AI',
  healthtech: 'HealthTech',
  fintech: 'FinTech',
  climatetech: 'ClimateTech',
  edtech: 'EdTech',
  saas: 'SaaS',
  hardware: 'Hardware',
  web3: 'Web3',
  other: 'Other',
};

export const InnovationTile = ({ innovation, onSelect }: InnovationTileProps) => {
  return (
    <div
      className="group relative flex-shrink-0 w-[280px] cursor-pointer"
      onClick={() => onSelect(innovation)}
    >
      {/* Card */}
      <div className="relative h-[160px] rounded-lg overflow-hidden transition-all duration-300 ease-out group-hover:scale-105 group-hover:z-10 shadow-card group-hover:shadow-elevated">
        {/* Cover Image */}
        <img
          src={innovation.cover_image_url}
          alt={innovation.title}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
        
        {/* Video indicator */}
        {innovation.video_url && (
          <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-1.5">
            <Play className="h-3 w-3 text-foreground" />
          </div>
        )}
        
        {/* Category badge */}
        <div className={cn(
          'absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-medium',
          categoryColors[innovation.category],
          'text-primary-foreground'
        )}>
          {categoryLabels[innovation.category]}
        </div>
        
        {/* Content - visible on hover */}
        <div className="absolute inset-x-0 bottom-0 p-4 transition-all duration-300">
          <h3 className="text-sm font-semibold text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
            {innovation.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {innovation.tagline}
          </p>
        </div>
        
        {/* Expand Icon */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-primary/90 backdrop-blur-sm rounded-full p-1.5">
            <Expand className="h-3 w-3 text-primary-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
};
