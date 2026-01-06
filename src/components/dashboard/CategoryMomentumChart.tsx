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
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" />
          Category Momentum
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={true} vertical={false} />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <YAxis
                type="category"
                dataKey="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={75}
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
