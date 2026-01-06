import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface CategoryData {
  category: string;
  productsUploaded: number;
  demoPlays: number;
  targetMarketSpread: string;
  momentumChange: number;
}

interface CategoryPerformanceTableProps {
  data: CategoryData[];
}

const getMomentumIcon = (change: number) => {
  if (change > 0) return <TrendingUp className="h-4 w-4 text-emerald-400" />;
  if (change < 0) return <TrendingDown className="h-4 w-4 text-rose-400" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const getMomentumColor = (change: number) => {
  if (change > 0) return 'text-emerald-400';
  if (change < 0) return 'text-rose-400';
  return 'text-muted-foreground';
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'AI & ML': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    'HealthTech': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'EdTech': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Sustainability': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Others': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return colors[category] || colors['Others'];
};

export const CategoryPerformanceTable = ({ data }: CategoryPerformanceTableProps) => {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Category Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-muted-foreground font-semibold">Category</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-center">Products</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-center">Demo Plays</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-center">Market Spread</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">Momentum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow 
                  key={row.category} 
                  className="hover:bg-muted/20 transition-colors border-border/30"
                >
                  <TableCell>
                    <Badge variant="outline" className={getCategoryColor(row.category)}>
                      {row.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">{row.productsUploaded}</TableCell>
                  <TableCell className="text-center font-medium">{row.demoPlays.toLocaleString()}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{row.targetMarketSpread}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {getMomentumIcon(row.momentumChange)}
                      <span className={`font-medium ${getMomentumColor(row.momentumChange)}`}>
                        {row.momentumChange > 0 ? '+' : ''}{row.momentumChange}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
