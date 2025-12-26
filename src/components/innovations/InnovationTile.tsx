import { useState } from 'react';
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
  isFirst?: boolean;
  isLast?: boolean;
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

export const InnovationTile = ({ innovation, onSelect, showMenu = false, onDelete, isFirst = false, isLast = false }: InnovationTileProps) => {
  const { isLiked, likeCount, toggleLike, isLoading } = useInnovationLike(
    innovation.id,
    innovation.like_count ?? 0
  );
  const [menuOpen, setMenuOpen] = useState(false);

  // Determine transform origin and hover styles based on position
  const getHoverStyles = () => {
    if (menuOpen) return "";
    if (isFirst) return "hover:scale-[1.15] hover:z-20 origin-left";
    if (isLast) return "hover:scale-[1.15] hover:z-20 origin-right";
    return "hover:scale-[1.15] hover:z-20";
  };

  return (
    <div
      className={cn(
        "group relative flex-shrink-0 w-[260px] cursor-pointer transition-all duration-300 ease-out delay-150",
        getHoverStyles()
      )}
      onClick={() => onSelect(innovation)}
    >
      {/* Card */}
      <div className={cn(
        "relative h-[170px] rounded-xl overflow-hidden transition-all duration-300 ease-out delay-150 shadow-card",
        !menuOpen && "group-hover:shadow-elevated"
      )}>
        {/* Cover Image */}
        <img
          src={innovation.cover_image_url}
          alt={innovation.title}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient Overlay - stronger on hover */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent transition-opacity duration-300",
          menuOpen ? "opacity-80" : "opacity-80 group-hover:opacity-100"
        )} />
        
        {/* Top right - Menu */}
        {showMenu && (
          <div 
            className="absolute top-3 right-3 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <InnovationTileMenu 
              innovationId={innovation.id} 
              onDelete={onDelete}
              onOpenChange={setMenuOpen}
            />
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
          <h3 className={cn(
            "text-base font-semibold text-foreground line-clamp-1 mb-1 transition-colors",
            !menuOpen && "group-hover:text-primary"
          )}>
            {innovation.title}
          </h3>
          <p className={cn(
            "text-sm text-muted-foreground line-clamp-2 transition-all duration-300 transform",
            menuOpen ? "opacity-0 translate-y-2" : "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
          )}>
            {innovation.tagline}
          </p>
        </div>
        
        {/* Bottom row - Like and Expand */}
        <div className={cn(
          "absolute bottom-3 right-3 flex items-center gap-2 transition-opacity duration-300",
          menuOpen ? "opacity-0" : "opacity-0 group-hover:opacity-100"
        )}>
          {/* Like button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(e);
            }}
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
