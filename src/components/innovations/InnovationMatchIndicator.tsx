import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InnovationMatchIndicatorProps {
  category: string;
  userRole?: string;
  userInterests?: string[];
  className?: string;
}

// This would typically come from user preferences or AI matching
const getMatchScore = (
  category: string,
  userRole?: string,
  userInterests?: string[]
): { score: number; label: string; description: string } | null => {
  // Only show match indicators for investors
  if (userRole !== 'investor') return null;

  // Simple matching logic - in production this would be more sophisticated
  const categoryInterests: Record<string, string[]> = {
    ai: ['technology', 'automation', 'machine-learning'],
    healthtech: ['healthcare', 'biotech', 'wellness'],
    fintech: ['finance', 'payments', 'banking'],
    climatetech: ['sustainability', 'environment', 'clean-energy'],
    edtech: ['education', 'e-learning', 'training'],
    saas: ['software', 'enterprise', 'b2b'],
    hardware: ['iot', 'electronics', 'manufacturing'],
    web3: ['blockchain', 'crypto', 'defi'],
  };

  const relatedInterests = categoryInterests[category] || [];
  
  // Check if user has any matching interests
  if (userInterests && userInterests.length > 0) {
    const matchCount = userInterests.filter((interest) =>
      relatedInterests.some((ri) => ri.includes(interest.toLowerCase()))
    ).length;

    if (matchCount >= 2) {
      return { score: 3, label: 'High Match', description: 'Strongly aligns with your interests' };
    } else if (matchCount === 1) {
      return { score: 2, label: 'Good Match', description: 'Partially aligns with your interests' };
    }
  }

  // Random recommendation for demo purposes
  // In production, this would be based on AI matching
  const shouldRecommend = Math.random() > 0.7;
  if (shouldRecommend) {
    return { score: 1, label: 'Recommended', description: 'Based on similar investors' };
  }

  return null;
};

export const InnovationMatchIndicator = ({
  category,
  userRole,
  userInterests,
  className,
}: InnovationMatchIndicatorProps) => {
  const match = getMatchScore(category, userRole, userInterests);

  if (!match) return null;

  const getIcon = () => {
    switch (match.score) {
      case 3:
        return <Sparkles className="h-3 w-3" />;
      case 2:
        return <Star className="h-3 w-3" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  const getColor = () => {
    switch (match.score) {
      case 3:
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 2:
        return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      default:
        return 'bg-purple-500/20 text-purple-500 border-purple-500/30';
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn('gap-1 font-medium', getColor(), className)}
      title={match.description}
    >
      {getIcon()}
      {match.label}
    </Badge>
  );
};
