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
import { getCategoryColor } from '@/lib/categoryColors';

export interface CategoryData {
  category: string;
  productsUploaded: number;
  demoPlays: number;
  targetMarketSpread: string;
}

interface CategoryPerformanceTableProps {
  data: CategoryData[];
}

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow 
                  key={row.category} 
                  className="hover:bg-muted/20 transition-colors border-border/30"
                >
                  <TableCell>
                    <Badge variant="outline" className={getCategoryColor(row.category, 'dashboard')}>
                      {row.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">{row.productsUploaded}</TableCell>
                  <TableCell className="text-center font-medium">{row.demoPlays.toLocaleString()}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{row.targetMarketSpread}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
