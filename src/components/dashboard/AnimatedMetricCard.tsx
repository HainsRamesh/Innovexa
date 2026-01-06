import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnimatedMetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  suffix?: string;
  formatValue?: (value: number) => string;
}

const useCountUp = (end: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    countRef.current = 0;
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
  suffix = '',
  formatValue,
}: AnimatedMetricCardProps) => {
  const animatedValue = useCountUp(value);
  const displayValue = formatValue ? formatValue(animatedValue) : formatLargeNumber(animatedValue);

  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold tracking-tight">
              {displayValue}{suffix}
            </p>
            {trend !== undefined && (
              <p className={cn(
                'text-xs font-medium',
                trend >= 0 ? 'text-emerald-400' : 'text-rose-400'
              )}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% this month
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
