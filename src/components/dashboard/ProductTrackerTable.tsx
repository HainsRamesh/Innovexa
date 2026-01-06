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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, Play, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { getCategoryColor } from '@/lib/categoryColors';

export interface ProductData {
  id: string;
  name: string;
  category: string;
  demoPlays: number;
  dateUploaded: string;
}

interface ProductTrackerTableProps {
  data: ProductData[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewAll?: () => void;
  showViewAll?: boolean;
  limit?: number;
}

export const ProductTrackerTable = ({ 
  data, 
  onView, 
  onEdit, 
  onDelete, 
  onViewAll,
  showViewAll = false,
  limit
}: ProductTrackerTableProps) => {
  const displayData = limit ? data.slice(0, limit) : data;
  
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Product Tracker
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {data.length} Products
            </Badge>
            {showViewAll && data.length > (limit || 0) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onViewAll}
                className="text-primary hover:text-primary/80"
              >
                View All
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-muted-foreground font-semibold w-12">S.No</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Product Name</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Category</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-center">Demo Plays</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Date Uploaded</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((product, index) => (
                <TableRow 
                  key={product.id} 
                  className="hover:bg-muted/20 transition-colors border-border/30"
                >
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {String(index + 1).padStart(2, '0')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Play className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getCategoryColor(product.category, 'dashboard')}>
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium">{product.demoPlays.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(product.dateUploaded), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onView?.(product.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(product.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete?.(product.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
