import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnimatedMetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  suffix?: string;
  formatValue?: (value: number) => string;
}

const useCountUp = (end: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    
    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }
      
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * end);
      
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
};

const formatLargeNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
};

export const AnimatedMetricCard = ({
  title,
  value,
  icon,
  trend,
  trendLabel = 'this month',
  suffix = '',
  formatValue,
}: AnimatedMetricCardProps) => {
  const animatedValue = useCountUp(value);
  const displayValue = formatValue ? formatValue(animatedValue) : formatLargeNumber(animatedValue);

  const getTrendText = () => {
    if (trendLabel === 'New account') {
      return 'New account';
    }
    if (trend === undefined || trend === null) {
      return null;
    }
    const arrow = trend >= 0 ? '↑' : '↓';
    const absPercentage = Math.abs(trend);
    
    if (trendLabel === 'Since yesterday') {
      return `${arrow} ${absPercentage}% since yesterday`;
    }
    
    return `${arrow} ${absPercentage}% ${trendLabel}`;
  };

  const trendText = getTrendText();

  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold tracking-tight">
              {displayValue}{suffix}
            </p>
            {trendText && (
              <p className={cn(
                'text-xs font-medium',
                trendLabel === 'New account' ? 'text-muted-foreground' :
                trend !== undefined && trend >= 0 ? 'text-emerald-400' : 'text-rose-400'
              )}>
                {trendText}
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
