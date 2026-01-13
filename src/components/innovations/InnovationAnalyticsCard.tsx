import { Eye, Heart, MessageSquare, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InnovationAnalyticsCardProps {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  messageClickCount: number;
  isOwner?: boolean;
}

export const InnovationAnalyticsCard = ({
  viewCount,
  likeCount,
  commentCount,
  messageClickCount,
  isOwner = false,
}: InnovationAnalyticsCardProps) => {
  const stats = [
    { icon: Eye, label: 'Views', value: viewCount, color: 'text-blue-500' },
    { icon: Heart, label: 'Likes', value: likeCount, color: 'text-red-500' },
    { icon: MessageSquare, label: 'Comments', value: commentCount, color: 'text-green-500' },
  ];

  // Only show message clicks to the owner
  if (isOwner) {
    stats.push({
      icon: MessageCircle,
      label: 'Message Clicks',
      value: messageClickCount,
      color: 'text-purple-500',
    });
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {isOwner ? 'Analytics' : 'Engagement'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 ${isOwner ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
