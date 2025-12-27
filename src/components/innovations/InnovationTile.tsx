import { useState, useRef, useCallback } from "react";
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

  // The tile is "active" (enlarged) when hovered OR when menu is open
  const isActive = isHovered || menuOpen;

  const handleMouseEnter = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 500);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Close menu and reset hover when leaving tile
    setMenuOpen(false);
    setIsHovered(false);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleMenuOpenChange = useCallback((open: boolean) => {
    setMenuOpen(open);
    // When menu closes and not hovering, reset active state
    if (!open) {
      setIsHovered(false);
    }
  }, []);

  // Determine transform origin based on position
  const getTransformOrigin = () => {
    if (isFirst) return "left center";
    if (isLast) return "right center";
    return "center center";
  };

  return (
    <div
      data-innovation-tile-root
      className="relative flex-shrink-0 w-[260px] cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect(innovation)}
      style={{
        zIndex: isActive ? 40 : 1,
        padding: isActive ? "12px 0" : "0",
        margin: isActive ? "-5px 0" : "0",
        transform: isActive ? "scale(1.25)" : "scale(1)",
        transformOrigin: getTransformOrigin(),
        transition:
          "transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), padding 400ms cubic-bezier(0.34, 1.56, 0.64, 1), margin 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      {/* Card - image never scales */}
      <div
        className="relative h-[170px]"
        style={{
          borderRadius: isActive ? "16px" : "12px",
          overflow: "hidden",
          boxShadow: isActive
            ? "0 20px 50px -12px rgba(0,0,0,0.5), 0 8px 20px -8px rgba(0,0,0,0.4)"
            : "0 4px 6px -1px rgba(0,0,0,0.1)",
          transition: "border-radius 400ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 400ms ease-out",
        }}
      >
        {/* Cover Image - static, never transforms */}
        <img
          src={innovation.cover_image_url}
          alt={innovation.title}
          className="w-full h-full object-cover"
          style={{ transform: "none" }}
        />

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent"
          style={{
            opacity: isActive ? 1 : 0.8,
            transition: "opacity 300ms ease-out",
          }}
        />

        {/* Top right - Menu (only visible when this specific tile is active) */}
        {showMenu && (
          <div
            className="absolute top-3 right-3 z-50"
            onClick={(e) => e.stopPropagation()}
            style={{
              opacity: isActive ? 1 : 0,
              pointerEvents: isActive ? "auto" : "none",
              transition: "opacity 200ms ease-out",
            }}
          >
            <InnovationTileMenu innovationId={innovation.id} onDelete={onDelete} onOpenChange={handleMenuOpenChange} />
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
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3
            className="text-base font-semibold text-foreground line-clamp-1 mb-1"
            style={{
              color: isActive ? "hsl(var(--primary))" : undefined,
              transition: "color 300ms ease-out",
            }}
          >
            {innovation.title}
          </h3>
          <p
            className="text-sm text-muted-foreground line-clamp-2"
            style={{
              opacity: isActive && !menuOpen ? 1 : 0,
              transform: isActive && !menuOpen ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 300ms ease-out, transform 300ms ease-out",
            }}
          >
            {innovation.tagline}
          </p>
        </div>

        {/* Bottom row - Like and Expand */}
        <div
          className="absolute bottom-3 right-3 flex items-center gap-2"
          style={{
            opacity: isActive && !menuOpen ? 1 : 0,
            transition: "opacity 300ms ease-out",
          }}
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
