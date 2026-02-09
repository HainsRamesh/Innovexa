import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Layers } from 'lucide-react';

interface CategoryMomentumData {
  category: string;
  momentum: number;
}

interface CategoryMomentumChartProps {
  data: CategoryMomentumData[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'AI & ML': 'hsl(262, 83%, 58%)',
  'HealthTech': 'hsl(158, 64%, 52%)',
  'EdTech': 'hsl(217, 91%, 60%)',
  'Sustainability': 'hsl(142, 76%, 36%)',
  'Others': 'hsl(215, 14%, 34%)',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-card border border-border rounded-lg px-4 py-3 shadow-xl">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className={`text-sm font-bold ${value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {value >= 0 ? '+' : ''}{value}% momentum
        </p>
      </div>
    );
  }
  return null;
};

export const CategoryMomentumChart = ({ data }: CategoryMomentumChartProps) => {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2 sm:pb-4 px-2 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-sm sm:text-lg font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0" />
          Category Momentum
        </CardTitle>
      </CardHeader>
      <CardContent className="px-1 sm:px-6 pb-3 sm:pb-6">
        <div className="h-[220px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={true} vertical={false} />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <YAxis
                type="category"
                dataKey="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
              <Bar dataKey="momentum" radius={[0, 4, 4, 0]} barSize={24}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.momentum >= 0 ? CATEGORY_COLORS[entry.category] || 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
