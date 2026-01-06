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
import { MoreHorizontal, Eye, TrendingUp, TrendingDown, Minus, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { Investment, InvestmentStatus } from '@/types';

interface InvestorPortfolioTableProps {
  investments: Investment[];
  onView: (id: string) => void;
}

const getStatusBadge = (status: InvestmentStatus) => {
  const styles: Record<InvestmentStatus, string> = {
    proposed: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    under_review: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    accepted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    withdrawn: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return styles[status] || styles.proposed;
};

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return '$' + (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return '$' + (value / 1000).toFixed(1) + 'K';
  }
  return '$' + value.toLocaleString();
};

const getROIIcon = (roi: number | null) => {
  if (!roi) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (roi > 0) return <TrendingUp className="h-4 w-4 text-emerald-400" />;
  return <TrendingDown className="h-4 w-4 text-rose-400" />;
};

export const InvestorPortfolioTable = ({
  investments,
  onView,
}: InvestorPortfolioTableProps) => {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Investment Portfolio
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {investments.length} Investments
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-muted-foreground font-semibold w-12">S.No</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Investment</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-center">Amount</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-center">Expected ROI</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-center">Status</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Date</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No investments yet
                  </TableCell>
                </TableRow>
              ) : (
                investments.map((investment, index) => (
                  <TableRow
                    key={investment.id}
                    className="hover:bg-muted/20 transition-colors border-border/30"
                  >
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {String(index + 1).padStart(2, '0')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Wallet className="h-4 w-4 text-accent" />
                        </div>
                        <span className="font-medium truncate max-w-[200px]">
                          {investment.problems?.title || 'Investment'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {formatCurrency(Number(investment.funding_amount))}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getROIIcon(investment.expected_roi)}
                        <span className={investment.expected_roi && investment.expected_roi > 0 ? 'text-emerald-400' : 'text-muted-foreground'}>
                          {investment.expected_roi ? `${investment.expected_roi}%` : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={getStatusBadge(investment.status as InvestmentStatus)}>
                        {investment.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(investment.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => onView(investment.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
