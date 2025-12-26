import { useState, useRef } from "react";
import { Innovation } from "@/types";
import { Expand, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInnovationLike } from "@/hooks/useInnovationLike";
import { InnovationTileMenu } from "./InnovationTileMenu";

interface InnovationTileProps {
  innovation: Innovation;
  onSelect: (innovation: Innovation) => void;
  showMenu?: boolean;
  onDelete?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const categoryColors: Record<string, string> = {
  ai: "bg-category-technology",
  healthtech: "bg-category-healthcare",
  fintech: "bg-category-finance",
  climatetech: "bg-category-sustainability",
  edtech: "bg-category-education",
  saas: "bg-primary",
  hardware: "bg-category-infrastructure",
  web3: "bg-accent",
  other: "bg-muted",
};

const categoryLabels: Record<string, string> = {
  ai: "AI",
  healthtech: "HealthTech",
  fintech: "FinTech",
  climatetech: "ClimateTech",
  edtech: "EdTech",
  saas: "SaaS",
  hardware: "Hardware",
  web3: "Web3",
  other: "Other",
};

export const InnovationTile = ({
  innovation,
  onSelect,
  showMenu = false,
  onDelete,
  isFirst = false,
  isLast = false,
}: InnovationTileProps) => {
  const { isLiked, likeCount, toggleLike, isLoading } = useInnovationLike(innovation.id, innovation.like_count ?? 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Card is "active" (enlarged) when hovered OR menu is open
  const isActive = isHovered || menuOpen;

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 800);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Only reset hover if menu is closed
    if (!menuOpen) {
      setIsHovered(false);
    }
  };

  // When menu closes, also reset hover state
  const handleMenuOpenChange = (open: boolean) => {
    setMenuOpen(open);
    if (!open) {
      // Small delay to allow cursor to remain on card
      setTimeout(() => {
        setIsHovered(false);
      }, 100);
    }
  };

  // Determine transform origin based on position
  const getTransformOrigin = () => {
    if (isFirst) return "left center";
    if (isLast) return "right center";
    return "center center";
  };

  return (
    <div
      className={cn(
        "relative flex-shrink-0 w-[260px] cursor-pointer",
        isActive ? "z-40" : "z-0",
      )}
      style={{
        transform: isActive ? "scale(1.25)" : "scale(1)",
        transformOrigin: getTransformOrigin(),
        transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0s",
      }}
      onClick={() => onSelect(innovation)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Card */}
      <div
        className={cn(
          "relative h-[170px] overflow-hidden transition-all duration-300 ease-out",
          isActive 
            ? "rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4),0_8px_20px_-8px_rgba(0,0,0,0.3)]" 
            : "rounded-xl shadow-card",
        )}
      >
        {/* Cover Image */}
        <img src={innovation.cover_image_url} alt={innovation.title} className="w-full h-full object-cover" />

        {/* Gradient Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent transition-opacity duration-300",
            isActive ? "opacity-100" : "opacity-80",
          )}
        />

        {/* Top right - Menu (only visible on THIS card's active state) */}
        {showMenu && isActive && (
          <div 
            className="absolute top-3 right-3 z-50" 
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => {
              // Keep card hovered when entering menu area
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
              setIsHovered(true);
            }}
          >
            <InnovationTileMenu 
              innovationId={innovation.id} 
              onDelete={onDelete} 
              onOpenChange={handleMenuOpenChange} 
            />
          </div>
        )}

        {/* Category badge */}
        <div
          className={cn(
            "absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium",
            categoryColors[innovation.category],
            "text-primary-foreground",
          )}
        >
          {categoryLabels[innovation.category]}
        </div>

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-4 transition-all duration-300">
          <h3
            className={cn(
              "text-base font-semibold text-foreground line-clamp-1 mb-1 transition-colors",
              isActive && "text-primary",
            )}
          >
            {innovation.title}
          </h3>
          <p
            className={cn(
              "text-sm text-muted-foreground line-clamp-2 transition-all duration-300 transform",
              isActive
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2",
            )}
          >
            {innovation.tagline}
          </p>
        </div>

        {/* Bottom row - Like and Expand */}
        <div
          className={cn(
            "absolute bottom-3 right-3 flex items-center gap-2 transition-opacity duration-300",
            isActive ? "opacity-100" : "opacity-0",
          )}
        >
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
                : "bg-background/80 text-foreground hover:bg-background/90",
            )}
          >
            <Heart className={cn("h-4 w-4 transition-transform duration-200", isLiked && "fill-current scale-110")} />
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
