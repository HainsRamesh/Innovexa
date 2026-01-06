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
import { MoreHorizontal, Eye, Edit, Trash2, Play } from 'lucide-react';
import { format } from 'date-fns';

export interface ProductData {
  id: string;
  name: string;
  category: string;
  demoPlays: number;
  status: 'active' | 'pending' | 'draft' | 'archived' | 'featured' | 'published';
  dateUploaded: string;
}

interface ProductTrackerTableProps {
  data: ProductData[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const getStatusBadge = (status: ProductData['status']) => {
  const styles: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    archived: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };
  return styles[status] || styles.draft;
};

const getCategoryBadge = (category: string) => {
  const colors: Record<string, string> = {
    'AI & ML': 'bg-violet-500/10 text-violet-400',
    'HealthTech': 'bg-emerald-500/10 text-emerald-400',
    'EdTech': 'bg-blue-500/10 text-blue-400',
    'Sustainability': 'bg-green-500/10 text-green-400',
    'Others': 'bg-slate-500/10 text-slate-400',
  };
  return colors[category] || colors['Others'];
};

export const ProductTrackerTable = ({ data, onView, onEdit, onDelete }: ProductTrackerTableProps) => {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Product Tracker
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {data.length} Products
          </Badge>
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
                <TableHead className="text-muted-foreground font-semibold text-center">Status</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Date Uploaded</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((product, index) => (
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
                    <Badge variant="secondary" className={getCategoryBadge(product.category)}>
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium">{product.demoPlays.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={getStatusBadge(product.status)}>
                      {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                    </Badge>
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
