import { Innovation } from '@/types';
import { Expand, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInnovationLike } from '@/hooks/useInnovationLike';
import { InnovationTileMenu } from './InnovationTileMenu';

interface InnovationTileProps {
  innovation: Innovation;
  onSelect: (innovation: Innovation) => void;
  showMenu?: boolean;
  onDelete?: () => void;
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

export const InnovationTile = ({ innovation, onSelect, showMenu = false, onDelete }: InnovationTileProps) => {
  const { isLiked, likeCount, toggleLike, isLoading } = useInnovationLike(
    innovation.id,
    innovation.like_count ?? 0
  );

  return (
    <div
      className="group relative flex-shrink-0 w-[340px] cursor-pointer"
      onClick={() => onSelect(innovation)}
    >
      {/* Card */}
      <div className="relative h-[200px] rounded-xl overflow-hidden transition-all duration-300 ease-out group-hover:scale-110 group-hover:z-20 shadow-card group-hover:shadow-elevated">
        {/* Cover Image */}
        <img
          src={innovation.cover_image_url}
          alt={innovation.title}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient Overlay - stronger on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Top right - Menu or nothing (removed play icon) */}
        {showMenu && (
          <div className="absolute top-3 right-3 z-10">
            <InnovationTileMenu innovationId={innovation.id} onDelete={onDelete} />
          </div>
        )}
        
        {/* Category badge */}
        <div className={cn(
          'absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium',
          categoryColors[innovation.category],
          'text-primary-foreground'
        )}>
          {categoryLabels[innovation.category]}
        </div>
        
        {/* Content - enhanced on hover */}
        <div className="absolute inset-x-0 bottom-0 p-4 transition-all duration-300">
          <h3 className="text-base font-semibold text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
            {innovation.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
            {innovation.tagline}
          </p>
        </div>
        
        {/* Bottom row - Like and Expand */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Like button */}
          <button
            onClick={toggleLike}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full backdrop-blur-sm transition-all duration-200",
              isLiked 
                ? "bg-destructive/90 text-destructive-foreground" 
                : "bg-background/80 text-foreground hover:bg-background/90"
            )}
          >
            <Heart 
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isLiked && "fill-current scale-110"
              )} 
            />
            <span className="text-xs font-medium">{likeCount}</span>
          </button>
          
          {/* Expand Icon */}
          <div className="bg-primary/90 backdrop-blur-sm rounded-full p-1.5">
            <Expand className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
};
