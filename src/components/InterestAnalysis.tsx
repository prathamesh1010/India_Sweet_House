import React, { useMemo, useState, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filter, X, TrendingUp, DollarSign, PieChart, BarChart3, Calculator, Percent } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';

interface InterestAnalysisProps {
  data: any[];
  className?: string;
}

const COLORS = [
  'hsl(220, 70%, 30%)',    // Navy Blue
  'hsl(25, 60%, 40%)',     // Brown
  'hsl(160, 65%, 45%)',    // Teal
  'hsl(280, 70%, 50%)',    // Purple
  'hsl(40, 80%, 55%)',     // Orange
  'hsl(190, 75%, 45%)',    // Cyan
  'hsl(120, 60%, 45%)',    // Green
  'hsl(300, 65%, 50%)',    // Magenta
  'hsl(220, 50%, 25%)',    // Darker Navy Blue (Replaced Light Blue)
  'hsl(340, 70%, 55%)'       // Raspberry (Replaced Crimson)
];

export const InterestAnalysis: React.FC<InterestAnalysisProps> = memo(({ data, className = '' }) => {
  // Filter states
  const [filters, setFilters] = useState({
    outlet: 'all',
    manager: 'all',
    month: 'all',
    interestType: 'all'
  });

  // Get unique filter options from data
  const filterOptions = useMemo(() => {
    if (!data || data.length === 0) return { outlets: [], managers: [], months: [], interestTypes: [] };

    const outlets = [...new Set(data.map(item => 
      item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name']
    ).filter(Boolean))];
    
    const managers = [...new Set(data.map(item => 
      item['Outlet Manager'] || item['Cluster Manager'] || item['Cashier'] || item['Cashier Name']
    ).filter(Boolean))];
    
    const months = [...new Set(data.map(item => 
      item['Month'] || item['Date']?.substring(0, 7)
    ).filter(Boolean))];

    // Interest types from the data
    const interestTypes = [
      '01-Bank Charges',
      '02-Interest on Borrowings', 
      '03-Interest on Vehicle Loan',
      '04-MG',
      'Finance Cost'
    ].filter(interestType => 
      data.some(item => item[interestType] !== undefined && item[interestType] !== null)
    );

    return {
      outlets: outlets.sort(),
      managers: managers.sort(),
      months: months.sort(),
      interestTypes: interestTypes.sort()
    };
  }, [data]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    console.log('InterestAnalysis - Current filters:', filters);
    console.log('InterestAnalysis - Available interest types:', filterOptions.interestTypes);
    
    const filtered = data.filter(item => {
      if (filters.outlet !== 'all') {
        const outlet = item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'];
        if (outlet !== filters.outlet) return false;
      }
      
      if (filters.manager !== 'all') {
        const manager = item['Outlet Manager'] || item['Cluster Manager'] || item['Cashier'] || item['Cashier Name'];
        if (manager !== filters.manager) return false;
      }
      
      if (filters.month !== 'all') {
        const month = item['Month'] || item['Date']?.substring(0, 7);
        if (month !== filters.month) return false;
      }
      
      if (filters.interestType !== 'all') {
        // Filter by interest type - only include items that have this interest type with a value > 0
        const interestValue = parseFloat(item[filters.interestType]) || 0;
        console.log(`InterestAnalysis - Checking ${filters.interestType}: ${interestValue} for item:`, item['Outlet']);
        if (interestValue <= 0) return false;
      }
      
      return true;
    });
    
    console.log('InterestAnalysis - Filtered data count:', filtered.length);
    return filtered;
  }, [data, filters, filterOptions.interestTypes]);

  // Interest analysis data
  const interestData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return {
      interestBreakdown: [],
      outletInterestComparison: [],
      monthlyInterestTrends: [],
      interestEfficiency: [],
      totalInterestCosts: 0,
      averageInterestRate: 0,
      topInterestOutlets: [],
      interestDistribution: []
    };

    // Calculate interest breakdown by type
    // If a specific interest type is selected, only show that type
    const interestTypesToAnalyze = filters.interestType !== 'all' 
      ? [filters.interestType] 
      : filterOptions.interestTypes;
      
    console.log('InterestAnalysis - Interest types to analyze:', interestTypesToAnalyze);
    console.log('InterestAnalysis - Filtered data sample:', filteredData.slice(0, 2));
      
    const interestBreakdown = interestTypesToAnalyze.map(interestType => {
      const totalAmount = filteredData.reduce((sum, item) => 
        sum + (parseFloat(item[interestType]) || 0), 0
      );
      const outletCount = filteredData.filter(item => 
        item[interestType] && parseFloat(item[interestType]) > 0
      ).length;
      
      console.log(`InterestAnalysis - ${interestType}: total=${totalAmount}, outlets=${outletCount}`);
      
      return {
        interestType,
        totalAmount,
        outletCount,
        averageAmount: outletCount > 0 ? totalAmount / outletCount : 0,
        percentage: 0 // Will be calculated after we have total
      };
    }).filter(item => item.totalAmount > 0);

    // Calculate total interest costs
    const totalInterestCosts = interestBreakdown.reduce((sum, item) => sum + item.totalAmount, 0);
    
    // Calculate percentages
    interestBreakdown.forEach(item => {
      item.percentage = totalInterestCosts > 0 ? (item.totalAmount / totalInterestCosts) * 100 : 0;
    });

    // Outlet interest comparison
    const outletInterestComparison = filteredData.map(item => {
      const outlet = item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'] || 'Unknown';
      const manager = item['Outlet Manager'] || item['Cluster Manager'] || item['Cashier'] || item['Cashier Name'] || 'Unknown';
      const month = item['Month'] || 'Unknown';
      
      // Calculate total interest based on filtered interest types
      const totalInterest = interestTypesToAnalyze.reduce((sum, interestType) => 
        sum + (parseFloat(item[interestType]) || 0), 0
      );
      
      const revenue = parseFloat(item['TOTAL REVENUE']) || 0;
      const interestRate = revenue > 0 ? (totalInterest / revenue) * 100 : 0;
      
      return {
        outlet,
        manager,
        month,
        totalInterest,
        revenue,
        interestRate,
        bankCharges: parseFloat(item['01-Bank Charges']) || 0,
        borrowings: parseFloat(item['02-Interest on Borrowings']) || 0,
        vehicleLoan: parseFloat(item['03-Interest on Vehicle Loan']) || 0,
        mg: parseFloat(item['04-MG']) || 0,
        financeCost: parseFloat(item['Finance Cost']) || 0
      };
    }).filter(item => item.totalInterest > 0);

    // Monthly interest trends
    const monthlyData = filteredData.reduce((acc, item) => {
      const month = item['Month'] || 'Unknown';
      if (!acc[month]) {
        acc[month] = {
          month,
          totalInterest: 0,
          totalRevenue: 0,
          outletCount: 0,
          interestBreakdown: {}
        };
      }
      
      // Calculate total interest based on filtered interest types
      const totalInterest = interestTypesToAnalyze.reduce((sum, interestType) => 
        sum + (parseFloat(item[interestType]) || 0), 0
      );
      
      acc[month].totalInterest += totalInterest;
      acc[month].totalRevenue += parseFloat(item['TOTAL REVENUE']) || 0;
      acc[month].outletCount += 1;
      
      // Only include filtered interest types in breakdown
      interestTypesToAnalyze.forEach(interestType => {
        if (!acc[month].interestBreakdown[interestType]) {
          acc[month].interestBreakdown[interestType] = 0;
        }
        acc[month].interestBreakdown[interestType] += parseFloat(item[interestType]) || 0;
      });
      
      return acc;
    }, {} as Record<string, any>);

    const monthlyInterestTrends = Object.values(monthlyData).map((monthData: any) => ({
      month: monthData.month,
      totalInterest: monthData.totalInterest,
      totalRevenue: monthData.totalRevenue,
      outletCount: monthData.outletCount,
      interestRate: monthData.totalRevenue > 0 ? (monthData.totalInterest / monthData.totalRevenue) * 100 : 0,
      ...monthData.interestBreakdown
    }));

    // Interest efficiency analysis
    const interestEfficiency = outletInterestComparison.map(item => ({
      outlet: item.outlet,
      manager: item.manager,
      totalInterest: item.totalInterest,
      revenue: item.revenue,
      interestRate: item.interestRate,
      efficiency: item.interestRate < 5 ? 'Excellent' : item.interestRate < 10 ? 'Good' : item.interestRate < 15 ? 'Average' : 'Poor'
    })).sort((a, b) => a.interestRate - b.interestRate);

    // Top interest outlets (highest interest costs)
    const topInterestOutlets = outletInterestComparison
      .sort((a, b) => b.totalInterest - a.totalInterest)
      .slice(0, 10);

    // Interest distribution for pie chart
    const interestDistribution = interestBreakdown.map((item, index) => ({
      name: item.interestType.replace(/^\d+-/, ''), // Remove number prefix
      value: item.totalAmount,
      fill: COLORS[index % COLORS.length],
      percentage: item.percentage
    }));

    // Calculate average interest rate
    const averageInterestRate = outletInterestComparison.length > 0 
      ? outletInterestComparison.reduce((sum, item) => sum + item.interestRate, 0) / outletInterestComparison.length
      : 0;

    return {
      interestBreakdown,
      outletInterestComparison,
      monthlyInterestTrends,
      interestEfficiency,
      totalInterestCosts,
      averageInterestRate,
      topInterestOutlets,
      interestDistribution
    };
  }, [filteredData, filterOptions.interestTypes]);

  const clearAllFilters = () => {
    setFilters({
      outlet: 'all',
      manager: 'all',
      month: 'all',
      interestType: 'all'
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all').length;

  if (!data || data.length === 0) {
    return (
      <div className={`space-y-8 ${className}`}>
        <Card className="card-elevated p-12 text-center">
          <div className="space-y-4">
            <div className="p-4 bg-gradient-primary rounded-2xl inline-block">
              <Calculator className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground font-display">Interest Analysis Awaiting Data</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Upload your financial data to analyze interest costs and optimize financial performance
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Filter Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Interest Analysis Filters</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button onClick={clearAllFilters} variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Outlet</label>
            <Select value={filters.outlet} onValueChange={(value) => setFilters(prev => ({ ...prev, outlet: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Outlet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outlets</SelectItem>
                {filterOptions.outlets.map(outlet => (
                  <SelectItem key={outlet} value={outlet}>{outlet}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Manager</label>
            <Select value={filters.manager} onValueChange={(value) => setFilters(prev => ({ ...prev, manager: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Managers</SelectItem>
                {filterOptions.managers.map(manager => (
                  <SelectItem key={manager} value={manager}>{manager}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Month</label>
            <Select value={filters.month} onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {filterOptions.months.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Interest Type</label>
            <Select value={filters.interestType} onValueChange={(value) => setFilters(prev => ({ ...prev, interestType: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Interest Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Interest Types</SelectItem>
                {filterOptions.interestTypes.map(interestType => (
                  <SelectItem key={interestType} value={interestType}>
                    {interestType.replace(/^\d+-/, '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground font-display">Interest Cost Analysis</h2>
            <p className="text-muted-foreground mt-1 text-lg">
              Comprehensive analysis of interest costs and financial efficiency
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Interest Costs</p>
              <p className="text-2xl font-bold text-foreground font-display">
                ₹{Math.round(interestData.totalInterestCosts).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Average Interest Rate</p>
              <p className="text-2xl font-bold text-foreground font-display">
                {interestData.averageInterestRate.toFixed(2)}%
              </p>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <Percent className="h-6 w-6 text-slate-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Interest Types</p>
              <p className="text-2xl font-bold text-foreground font-display">
                {interestData.interestBreakdown.length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <PieChart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Outlets Analyzed</p>
              <p className="text-2xl font-bold text-foreground font-display">
                {filteredData.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {interestData.outletInterestComparison.length} with interest costs
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Interest Analysis Tabs */}
      <Tabs defaultValue="breakdown" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="breakdown">Interest Breakdown</TabsTrigger>
          <TabsTrigger value="outlets">Outlet Comparison</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Interest Distribution Pie Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Interest Cost Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={interestData.interestDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                      outerRadius={100}
                      innerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {interestData.interestDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: any) => [`₹${Math.round(value).toLocaleString()}`, 'Amount']}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Interest Breakdown Bar Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Interest Types Comparison</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={interestData.interestBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="interestType" 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      stroke="hsl(var(--border))"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      stroke="hsl(var(--border))"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: any) => [`₹${Math.round(value).toLocaleString()}`, 'Amount']}
                    />
                    <Bar dataKey="totalAmount" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Interest Breakdown Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Detailed Interest Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Interest Type</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Total Amount</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Average per Outlet</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Outlets Affected</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {interestData.interestBreakdown.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">
                        {item.interestType.replace(/^\d+-/, '')}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">
                        ₹{Math.round(item.totalAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        ₹{Math.round(item.averageAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {item.outletCount}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {item.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="outlets" className="space-y-6">
          {/* Top Interest Outlets */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top 10 Outlets by Interest Costs</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={interestData.topInterestOutlets} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="outlet" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: any, name: string) => [
                      `₹${Math.round(value).toLocaleString()}`,
                      'Finance Cost'
                    ]}
                    labelFormatter={(label, payload) => {
                      const data = payload?.[0]?.payload;
                      return data ? `${data.outlet} (${data.manager})` : label;
                    }}
                  />
                  <Bar dataKey="totalInterest" fill="hsl(25, 60%, 40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Interest Rate vs Revenue Scatter Plot */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Interest Rate vs Revenue Analysis</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={interestData.outletInterestComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="revenue" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: any, name: string) => [
                      name.includes('Interest Rate') ? `${value.toFixed(2)}%` : `₹${Math.round(value).toLocaleString()}`,
                      name.includes('Interest Rate') ? 'Interest Rate' : 'Finance Cost'
                    ]}
                    labelFormatter={(label, payload) => {
                      const data = payload?.[0]?.payload;
                      return data ? `${data.outlet} (${data.manager})` : label;
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalInterest" fill="hsl(25, 60%, 40%)" name="Finance Cost" />
                  <Line yAxisId="right" type="monotone" dataKey="interestRate" stroke="hsl(220, 70%, 30%)" strokeWidth={2} name="Interest Rate %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Interest Rate Formula */}
          <Card className="p-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Percent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Interest Rate Calculation</h4>
                <p className="text-sm text-muted-foreground">
                  <span className="font-mono bg-muted/50 px-2 py-1 rounded text-xs">
                    Interest Rate % = (Total Interest / Total Revenue) × 100
                  </span>
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Monthly Interest Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Interest Cost Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={interestData.monthlyInterestTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: any, name: string) => [
                      `₹${Math.round(value).toLocaleString()}`,
                      name
                    ]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="totalInterest" stroke="hsl(25, 60%, 40%)" strokeWidth={3} name="Total Interest" />
                  <Line type="monotone" dataKey="totalRevenue" stroke="hsl(220, 70%, 30%)" strokeWidth={2} name="Total Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Interest Rate Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Interest Rate Trends by Month</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={interestData.monthlyInterestTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: any, name: string) => [
                      `${value.toFixed(2)}%`,
                      'Interest Rate'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="interestRate" 
                    stroke="hsl(280, 70%, 50%)" 
                    fill="hsl(280, 70%, 50%)" 
                    fillOpacity={0.3}
                    name="Interest Rate %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-6">
          {/* Interest Efficiency Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Interest Efficiency Rankings</h3>
            <div className="space-y-4">
              {interestData.interestEfficiency.slice(0, 10).map((outlet, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{outlet.outlet}</h4>
                      <p className="text-sm text-muted-foreground">Manager: {outlet.manager}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">
                      {outlet.interestRate.toFixed(2)}%
                    </div>
                    <div className={`text-sm px-2 py-1 rounded-full ${
                      outlet.efficiency === 'Excellent' ? 'bg-green-100 text-green-800' :
                      outlet.efficiency === 'Good' ? 'bg-slate-100 text-slate-800' :
                      outlet.efficiency === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {outlet.efficiency}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Efficiency Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Efficiency Distribution</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The efficiency distribution shows the percentage of outlets falling into each category (Excellent, Good, Average, Poor)
              based on their interest rates. The formula used is:
              <br />
              **Percentage in Category = (Number of Outlets in Category / Total Number of Outlets) * 100**
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Excellent', 'Good', 'Average', 'Poor'].map(efficiency => {
                const count = interestData.interestEfficiency.filter(item => item.efficiency === efficiency).length;
                const percentage = interestData.interestEfficiency.length > 0 
                  ? (count / interestData.interestEfficiency.length) * 100 
                  : 0;
                
                return (
                  <div key={efficiency} className="text-center p-4 border rounded-lg">
                    <div className={`text-2xl font-bold ${
                      efficiency === 'Excellent' ? 'text-green-600' :
                      efficiency === 'Good' ? 'text-slate-600' :
                      efficiency === 'Average' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {count}
                    </div>
                    <div className="text-sm text-muted-foreground">{efficiency}</div>
                    <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Professional Insight Card */}
      <Card className="bg-gradient-primary text-white p-8 border-0 shadow-glow">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3 font-display">Interest Cost Optimization Insights</h3>
            <p className="text-white/90 text-base leading-relaxed">
              {interestData.totalInterestCosts > 0 
                ? `Your total interest costs are ₹${Math.round(interestData.totalInterestCosts).toLocaleString()} with an average rate of ${interestData.averageInterestRate.toFixed(2)}%. Focus on optimizing outlets with high interest rates and consider refinancing options for better financial efficiency.`
                : 'Upload your financial data to analyze interest costs and identify optimization opportunities for better financial performance.'
              }
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
});

InterestAnalysis.displayName = 'InterestAnalysis';
