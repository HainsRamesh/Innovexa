import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface DashboardFiltersProps {
  onCategoryChange?: (category: string) => void;
  onStatusChange?: (status: string) => void;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onClearFilters?: () => void;
}

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type PickerMode = 'year' | 'month' | 'day';
type SelectingDate = 'from' | 'to';

export const DashboardFilters = ({
  onCategoryChange,
  onStatusChange,
  onDateRangeChange,
  onClearFilters,
}: DashboardFiltersProps) => {
  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(currentYear);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [mode, setMode] = useState<PickerMode>('day');
  const [selectingDate, setSelectingDate] = useState<SelectingDate>('from');

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    onCategoryChange?.(value);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    onStatusChange?.(value);
  };

  const handleClearFilters = () => {
    setCategory('all');
    setStatus('all');
    setDateRange(undefined);
    onClearFilters?.();
  };

  const hasActiveFilters = category !== 'all' || status !== 'all' || dateRange;

  const handleYearSelect = (year: number) => {
    setViewYear(year);
    setMode('month');
  };

  const handleMonthSelect = (month: number) => {
    setViewMonth(month);
    setMode('day');
  };

  const handleDaySelect = (day: number) => {
    const selectedDate = new Date(viewYear, viewMonth, day);
    
    if (selectingDate === 'from') {
      const newRange = { from: selectedDate, to: dateRange?.to };
      setDateRange(newRange);
      onDateRangeChange?.(newRange);
      setSelectingDate('to');
    } else {
      const newRange = { from: dateRange?.from, to: selectedDate };
      setDateRange(newRange);
      onDateRangeChange?.(newRange);
      setOpen(false);
      setSelectingDate('from');
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isDateInRange = (day: number) => {
    if (!dateRange?.from || !dateRange?.to) return false;
    const date = new Date(viewYear, viewMonth, day);
    return date > dateRange.from && date < dateRange.to;
  };

  const isStartDate = (day: number) => {
    if (!dateRange?.from) return false;
    return (
      dateRange.from.getFullYear() === viewYear &&
      dateRange.from.getMonth() === viewMonth &&
      dateRange.from.getDate() === day
    );
  };

  const isEndDate = (day: number) => {
    if (!dateRange?.to) return false;
    return (
      dateRange.to.getFullYear() === viewYear &&
      dateRange.to.getMonth() === viewMonth &&
      dateRange.to.getDate() === day
    );
  };

  const quickRanges: Array<{ label: string; days: number | 'year' }> = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'This year', days: 'year' },
  ];

  const applyQuickRange = (days: number | 'year') => {
    const to = new Date();
    let from: Date;
    if (days === 'year') {
      from = new Date(currentYear, 0, 1);
    } else {
      from = new Date();
      from.setDate(from.getDate() - days);
    }
    const newRange = { from, to };
    setDateRange(newRange);
    onDateRangeChange?.(newRange);
    setOpen(false);
  };

  return (
    <Card className="bg-card/30 border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-[160px] bg-background/50 border-border/50">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="ai">AI & ML</SelectItem>
              <SelectItem value="healthtech">HealthTech</SelectItem>
              <SelectItem value="edtech">EdTech</SelectItem>
              <SelectItem value="sustainability">Sustainability</SelectItem>
              <SelectItem value="others">Others</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[140px] bg-background/50 border-border/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Enhanced Date Range Picker */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal bg-background/50 border-border/50 w-full sm:w-auto sm:min-w-[200px]',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'MMM d, yyyy')} – {format(dateRange.to, 'MMM d, yyyy')}
                    </>
                  ) : (
                    <>
                      {format(dateRange.from, 'MMM d, yyyy')} – Select end
                    </>
                  )
                ) : (
                  'Select Date Range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0 bg-card border-border" align="start">
              <div className="flex flex-col sm:flex-row">
                {/* Quick Range Sidebar */}
                <div className="border-b sm:border-b-0 sm:border-r border-border p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Quick Select</p>
                  {quickRanges.map((range) => (
                    <Button
                      key={range.label}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-8 px-2"
                      onClick={() => applyQuickRange(range.days)}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>

                {/* Calendar */}
                <div className="p-3 min-w-[280px]">
                  {/* Selection indicator */}
                  <div className="flex items-center gap-2 mb-3 text-xs">
                    <span className={cn(
                      "px-2 py-1 rounded",
                      selectingDate === 'from' ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground"
                    )}>
                      From: {dateRange?.from ? format(dateRange.from, 'MMM d') : '—'}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className={cn(
                      "px-2 py-1 rounded",
                      selectingDate === 'to' ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground"
                    )}>
                      To: {dateRange?.to ? format(dateRange.to, 'MMM d') : '—'}
                    </span>
                  </div>

                  {/* Header with navigation */}
                  <div className="flex items-center justify-between mb-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={prevMonth}
                      disabled={mode !== 'day'}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-sm font-medium hover:bg-muted"
                        onClick={() => setMode('month')}
                      >
                        {monthNames[viewMonth]}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-sm font-medium hover:bg-muted"
                        onClick={() => setMode('year')}
                      >
                        {viewYear}
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={nextMonth}
                      disabled={mode !== 'day'}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Year Selector */}
                  {mode === 'year' && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {yearOptions.map((year) => (
                        <Button
                          key={year}
                          variant={year === viewYear ? 'default' : 'ghost'}
                          size="sm"
                          className={cn(
                            "h-8 text-xs",
                            year === viewYear && "bg-primary text-primary-foreground"
                          )}
                          onClick={() => handleYearSelect(year)}
                        >
                          {year}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Month Selector */}
                  {mode === 'month' && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {monthNames.map((month, idx) => (
                        <Button
                          key={month}
                          variant={idx === viewMonth ? 'default' : 'ghost'}
                          size="sm"
                          className={cn(
                            "h-8 text-xs",
                            idx === viewMonth && "bg-primary text-primary-foreground"
                          )}
                          onClick={() => handleMonthSelect(idx)}
                        >
                          {month}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Day Selector */}
                  {mode === 'day' && (
                    <>
                      {/* Day headers */}
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                          <div key={day} className="h-7 flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                            {day}
                          </div>
                        ))}
                      </div>
                      {/* Days grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {/* Empty cells for days before first of month */}
                        {Array.from({ length: firstDay }, (_, i) => (
                          <div key={`empty-${i}`} className="h-7" />
                        ))}
                        {/* Day buttons */}
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const day = i + 1;
                          const isStart = isStartDate(day);
                          const isEnd = isEndDate(day);
                          const inRange = isDateInRange(day);
                          const isToday = 
                            new Date().getFullYear() === viewYear &&
                            new Date().getMonth() === viewMonth &&
                            new Date().getDate() === day;
                          
                          return (
                            <Button
                              key={day}
                              variant={(isStart || isEnd) ? 'default' : 'ghost'}
                              size="sm"
                              className={cn(
                                "h-7 w-full p-0 text-xs font-normal relative",
                                (isStart || isEnd) && "bg-primary text-primary-foreground",
                                inRange && "bg-primary/20 text-primary",
                                isToday && !isStart && !isEnd && "border border-primary/50 text-primary"
                              )}
                              onClick={() => handleDaySelect(day)}
                            >
                              {day}
                            </Button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Clear Range */}
                  {dateRange && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground"
                        onClick={() => {
                          setDateRange(undefined);
                          onDateRangeChange?.(undefined);
                          setSelectingDate('from');
                        }}
                      >
                        Clear Range
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};