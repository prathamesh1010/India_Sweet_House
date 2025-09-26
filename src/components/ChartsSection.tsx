import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useStoreContext } from '../contexts/StoreContext';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartsSectionProps {
  data: any[];
  className?: string;
}

// Vibrant Sweets-Inspired Color Palette
const COLORS = [
  'hsl(15, 85%, 55%)',     // Sweet Red (Jalebi)
  'hsl(25, 60%, 40%)',     // Brown (Chocolate)
  'hsl(220, 50%, 40%)',    // Navy Blue (Replaced Light Blue)
  'hsl(120, 40%, 50%)',    // Sweet Green (Pistachio)
  'hsl(280, 60%, 55%)',    // Sweet Purple (Kulfi)
  'hsl(220, 70%, 30%)',    // Navy Blue (Replaced Vibrant Blue)
  'hsl(30, 40%, 40%)',     // Sweet Brown (Chocolate)
  'hsl(120, 30%, 45%)',    // Earth Green (Mint)
  'hsl(20, 50%, 55%)',     // Earth Terracotta
  'hsl(340, 70%, 55%)'      // Raspberry (New)
];

// Gradient color variations for enhanced visuals
const GRADIENT_COLORS = [
  'linear-gradient(135deg, hsl(15, 85%, 55%), hsl(25, 85%, 60%))',
  'linear-gradient(135deg, hsl(25, 60%, 40%), hsl(30, 50%, 50%))',
  'linear-gradient(135deg, hsl(220, 50%, 40%), hsl(230, 40%, 35%))', // Adjusted from light blue
  'linear-gradient(135deg, hsl(120, 40%, 50%), hsl(140, 50%, 60%))',
  'linear-gradient(135deg, hsl(280, 60%, 55%), hsl(260, 70%, 65%))',
  'linear-gradient(135deg, hsl(220, 70%, 30%), hsl(230, 60%, 25%))', // Adjusted from vibrant blue
  'linear-gradient(135deg, hsl(30, 40%, 40%), hsl(20, 50%, 50%))',
  'linear-gradient(135deg, hsl(120, 30%, 45%), hsl(100, 40%, 55%))',
  'linear-gradient(135deg, hsl(20, 50%, 55%), hsl(10, 60%, 65%))',
  'linear-gradient(135deg, hsl(45, 85%, 60%), hsl(35, 80%, 50%))'
];

export const ChartsSection: React.FC<ChartsSectionProps> = ({ data, className = '' }) => {
  const { getCategories, getStoresByCategory } = useStoreContext();
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  
  // Filter states
  const [filters, setFilters] = useState({
    outlet: 'all',
    clusterManager: 'all',
    month: 'all',
    interestType: 'all',
    category: 'all'
  });

  // Get unique filter options from data
  const filterOptions = useMemo(() => {
    if (!data || data.length === 0) return { outlets: [], clusterManagers: [], months: [], interestTypes: [], categories: [] };

    console.log('ChartsSection - Sample data item:', data[0]);
    console.log('ChartsSection - All data length:', data.length);

    const outlets = [...new Set(data.map(item => 
      item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name']
    ).filter(Boolean))];
    
    console.log('ChartsSection - Found outlets:', outlets);
    
    const clusterManagers = [...new Set(data.map(item => 
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

    // Use store categories from context
    const categories = getCategories();

    return {
      outlets: outlets.sort(),
      clusterManagers: clusterManagers.sort(),
      months: months.sort(),
      interestTypes: interestTypes.sort(),
      categories: categories.sort()
    };
  }, [data, getCategories]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    console.log('ChartsSection - Current filters:', filters);
    console.log('ChartsSection - Available outlets:', filterOptions.outlets);
    
    const filtered = data.filter(item => {
      if (filters.outlet !== 'all') {
        const outlet = item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'];
        console.log(`ChartsSection - Checking outlet: "${outlet}" against filter: "${filters.outlet}"`);
        if (outlet !== filters.outlet) return false;
      }
      
      if (filters.clusterManager !== 'all') {
        const manager = item['Outlet Manager'] || item['Cluster Manager'] || item['Cashier'] || item['Cashier Name'];
        if (manager !== filters.clusterManager) return false;
      }
      
      if (filters.month !== 'all') {
        const month = item['Month'] || item['Date']?.substring(0, 7);
        if (month !== filters.month) return false;
      }
      
      // Filter by store category - check if the outlet belongs to the selected category
      if (filters.category !== 'all') {
        const outlet = item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'];
        const storesInCategory = getStoresByCategory(filters.category);
        const outletInCategory = storesInCategory.some(store => store.Outlet === outlet);
        if (!outletInCategory) return false;
      }
      
      if (filters.interestType !== 'all') {
        // Filter by interest type - only include items that have this interest type with a value > 0
        const interestValue = parseFloat(item[filters.interestType]) || 0;
        if (interestValue <= 0) return false;
      }
      
      return true;
    });
    
    console.log('ChartsSection - Filtered data count:', filtered.length);
    return filtered;
  }, [data, filters, filterOptions.outlets, getStoresByCategory]);

  const chartData = useMemo(() => {
    try {
      if (!filteredData || filteredData.length === 0) return { 
        financialMetrics: [], 
        cashierPerformance: [], 
        metricComparison: [], 
        cashierComparison: [],
        topPerformers: [],
        financialSummary: [],
        allCashiers: []
      };

      // Limit data processing to prevent hanging
      const limitedData = filteredData.slice(0, 100); // Process only first 100 records

      // Check if this is outlet-based data (has Outlet column)
      const hasOutletData = limitedData.some(item => item['Outlet']);

      let financialMetricsData, cashierPerformance, metricComparison, allCashiers, topPerformers, financialSummary;

      if (hasOutletData) {
        // For outlet-based data, create financial metrics from outlet columns
        const outletMetrics = [
          { name: 'TOTAL REVENUE', key: 'TOTAL REVENUE' },
          { name: 'Direct Income', key: 'Direct Income' },
          { name: 'COGS', key: 'COGS' },
          { name: 'Outlet Expenses', key: 'Outlet Expenses' },
          { name: 'EBIDTA', key: 'EBIDTA' },
          { name: 'Finance Cost', key: 'Finance Cost' },
          { name: 'PBT', key: 'PBT' },
          { name: 'WASTAGE', key: 'WASTAGE' }
        ];

        financialMetricsData = outletMetrics.map(metric => {
          const totalAmount = limitedData.reduce((sum, item) => sum + (parseFloat(item[metric.key]) || 0), 0);
          return {
            metric: metric.name,
            totalAmount: totalAmount,
            count: limitedData.length,
            avgAmount: totalAmount / limitedData.length,
            cashierCount: new Set(limitedData.map(item => item['Outlet Manager'])).size
          };
        });

        // Outlet Manager Performance Analysis
        const managerAnalysis = limitedData.reduce((acc, item) => {
          const manager = item['Outlet Manager'] || 'Unknown';
          const revenue = parseFloat(item['TOTAL REVENUE']) || 0;
          
          if (!acc[manager]) {
            acc[manager] = { 
              cashier: manager, 
              totalRevenue: 0, 
              metricCount: 0
            };
          }
          
          acc[manager].totalRevenue += revenue;
          acc[manager].metricCount += 1;
          
          return acc;
        }, {} as Record<string, any>);

        cashierPerformance = Object.values(managerAnalysis)
          .map((item: any) => ({
            cashier: item.cashier,
            totalRevenue: item.totalRevenue,
            metricCount: item.metricCount,
            avgRevenue: item.totalRevenue / item.metricCount
          }))
          .sort((a, b) => b.totalRevenue - a.totalRevenue);

        // Metric comparison
        metricComparison = financialMetricsData.slice(0, 10).map(item => ({
          metric: item.metric,
          totalAmount: item.totalAmount
        }));

        // Get all unique managers
        allCashiers = Array.from(new Set(
          limitedData.map(item => item['Outlet Manager']).filter(Boolean)
        )).sort();

        // Top Performers
        topPerformers = cashierPerformance.slice(0, 5).map((item: any) => ({
          cashier: item.cashier,
          totalRevenue: item.totalRevenue,
          avgRevenue: item.avgRevenue
        }));

        // Financial Summary
        const totalRevenue = financialMetricsData.find(m => m.metric === 'TOTAL REVENUE')?.totalAmount || 0;
        const totalMetrics = financialMetricsData.length;
        const avgMetricValue = totalRevenue / totalMetrics;
        const topMetric = financialMetricsData[0]?.metric || 'N/A';
        const topMetricValue = financialMetricsData[0]?.totalAmount || 0;

        financialSummary = [
          { label: 'Total Revenue', value: totalRevenue, format: 'currency' },
          { label: 'Total Outlets', value: limitedData.length, format: 'number' },
          { label: 'Avg Revenue per Outlet', value: totalRevenue / limitedData.length, format: 'currency' },
          { label: 'Top Metric', value: topMetric, format: 'text' },
          { label: 'Top Metric Value', value: topMetricValue, format: 'currency' }
        ];
      } else {
        // Original logic for transaction-based data
        // 1. Financial Metrics Analysis (Direct Income, COGS, Expenses, etc.)
        const financialMetrics = limitedData.reduce((acc, item) => {
          if (!item) return acc;
          
          const metric = item['Product Name'] || 'Unknown';
          const amount = parseFloat(item['Total Amount (₹)']) || 0;
          const cashier = item.Cashier || 'Unknown';
          
          if (!acc[metric]) {
            acc[metric] = { 
              metric, 
              totalAmount: 0, 
              cashiers: {},
              count: 0
            };
          }
          
          acc[metric].totalAmount += amount;
          acc[metric].count += 1;
          
          if (!acc[metric].cashiers[cashier]) {
            acc[metric].cashiers[cashier] = 0;
          }
          acc[metric].cashiers[cashier] += amount;
          
          return acc;
        }, {} as Record<string, any>);

        // Transform for financial metrics chart
        financialMetricsData = Object.values(financialMetrics)
          .map((item: any) => ({
            metric: item.metric,
            totalAmount: item.totalAmount,
            count: item.count,
            avgAmount: item.totalAmount / item.count,
            cashierCount: Object.keys(item.cashiers).length
          }))
          .sort((a, b) => b.totalAmount - a.totalAmount);

        // 2. Cashier Performance Analysis
        const cashierAnalysis = limitedData.reduce((acc, item) => {
          if (!item) return acc;
          
          const cashier = item.Cashier || 'Unknown';
          const amount = parseFloat(item['Total Amount (₹)']) || 0;
          const metric = item['Product Name'] || 'Unknown';
          
          if (!acc[cashier]) {
            acc[cashier] = { 
              cashier, 
              totalRevenue: 0, 
              metricCount: 0
            };
          }
          
          acc[cashier].totalRevenue += amount;
          acc[cashier].metricCount += 1;
          
          return acc;
        }, {} as Record<string, any>);

        cashierPerformance = Object.values(cashierAnalysis)
          .map((item: any) => ({
            cashier: item.cashier,
            totalRevenue: item.totalRevenue,
            metricCount: item.metricCount,
            avgRevenue: item.totalRevenue / item.metricCount
          }))
          .sort((a, b) => b.totalRevenue - a.totalRevenue);

        // 3. Metric Comparison by Cashier (Simplified)
        metricComparison = Object.entries(financialMetrics).slice(0, 10).map(([metric, data]: [string, any]) => {
          return { metric, totalAmount: data.totalAmount };
        });

        // Get all unique cashiers for the chart
        allCashiers = Array.from(new Set(
          limitedData.map(item => item.Cashier).filter(Boolean)
        )).sort();

        // 4. Top Performers Analysis
        topPerformers = cashierPerformance.slice(0, 5).map((item: any) => ({
          cashier: item.cashier,
          totalRevenue: item.totalRevenue,
          avgRevenue: item.avgRevenue
        }));

        // 5. Financial Summary (Key Metrics)
        const totalRevenue = financialMetricsData.reduce((sum, item) => sum + item.totalAmount, 0);
        const totalMetrics = financialMetricsData.length;
        const avgMetricValue = totalRevenue / totalMetrics;
        const topMetric = financialMetricsData[0]?.metric || 'N/A';
        const topMetricValue = financialMetricsData[0]?.totalAmount || 0;

        financialSummary = [
          { label: 'Total Revenue', value: totalRevenue, format: 'currency' },
          { label: 'Total Metrics', value: totalMetrics, format: 'number' },
          { label: 'Avg Metric Value', value: avgMetricValue, format: 'currency' },
          { label: 'Top Metric', value: topMetric, format: 'text' },
          { label: 'Top Metric Value', value: topMetricValue, format: 'currency' }
        ];
      }

      return { 
        financialMetrics: financialMetricsData, 
        cashierPerformance, 
        metricComparison, 
        cashierComparison: cashierPerformance,
        topPerformers,
        financialSummary,
        allCashiers
      };
    } catch (error) {
      console.error('Error processing chart data:', error);
      return { 
        financialMetrics: [], 
        cashierPerformance: [], 
        metricComparison: [], 
        cashierComparison: [],
        topPerformers: [],
        financialSummary: [],
        allCashiers: []
      };
    }
  }, [filteredData]);

  const { 
    financialMetrics, 
    cashierPerformance, 
    metricComparison, 
    topPerformers, 
    financialSummary, 
    allCashiers 
  } = chartData;

  if (!data || data.length === 0) {
    return (
      <div className={`space-y-8 ${className}`}>
        <Card className="card-elevated p-12 text-center">
          <div className="space-y-4">
            <div className="p-4 bg-gradient-primary rounded-2xl inline-block">
              <BarChart3 className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground font-display">Analytics Awaiting Data</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Upload your sales data to unlock powerful visualizations and business insights
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className={`space-y-8 ${className}`}>
        <Card className="card-elevated p-12 text-center">
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h3 className="text-xl font-semibold text-foreground font-display">Processing Data...</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Please wait while we process your financial data
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const clearAllFilters = () => {
    setFilters({
      outlet: 'all',
      clusterManager: 'all',
      month: 'all',
      interestType: 'all',
      category: 'all'
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all').length;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Filter Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Chart Filters</h3>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <label className="text-sm font-medium text-foreground mb-2 block">Cluster Manager</label>
            <Select value={filters.clusterManager} onValueChange={(value) => setFilters(prev => ({ ...prev, clusterManager: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Managers</SelectItem>
                {filterOptions.clusterManagers.map(manager => (
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

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filterOptions.categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground font-display">Sales Analytics</h2>
            <p className="text-muted-foreground mt-1 text-lg">
              Interactive visualizations and trends analysis
            </p>
          </div>
        </div>
      </div>
      
      {/* Financial Metrics Bar Chart */}
      <Card className="card-elevated p-8">
        <h3 className="text-xl font-semibold text-foreground mb-6 font-display">Financial Metrics Overview</h3>
        <div className="h-80">
          {financialMetrics && financialMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialMetrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(15, 85%, 55%)" />
                    <stop offset="100%" stopColor="hsl(25, 85%, 60%)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="metric" 
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
                    backgroundColor: 'hsl(var(--card))',
                    border: '2px solid hsl(var(--gold))',
                    borderRadius: '16px',
                    color: 'hsl(var(--card-foreground))',
                    boxShadow: 'var(--shadow-gold)',
                    backdropFilter: 'blur(10px)'
                  }}
                  formatter={(value: any, name: string) => [
                    `₹${Math.round(value).toLocaleString()}`,
                    'Amount'
                  ]}
                  labelStyle={{
                    color: 'hsl(var(--gold))',
                    fontWeight: 'bold'
                  }}
                />
                <Bar 
                  dataKey="totalAmount" 
                  fill="url(#gradientBar)" 
                  radius={[8, 8, 0, 0]}
                  style={{
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No financial metrics data available
            </div>
          )}
        </div>
      </Card>

      {/* Cashier Performance Comparison */}
      <Card className="card-elevated p-8">
        <h3 className="text-xl font-semibold text-foreground mb-6 font-display">Cashier Performance Comparison</h3>
        <div className="h-80">
          {cashierPerformance && cashierPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashierPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="cashier" 
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
                  formatter={(value: any, name: string) => [
                    `₹${Math.round(value).toLocaleString()}`,
                    'Revenue'
                  ]}
                />
                <Bar dataKey="totalRevenue" fill="hsl(160, 65%, 35%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No cashier performance data available
            </div>
          )}
        </div>
      </Card>

      {/* Top Performers Analysis */}
      <Card className="card-elevated p-8">
        <h3 className="text-xl font-semibold text-foreground mb-6 font-display">Top 5 Performers</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topPerformers} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="cashier" 
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
                formatter={(value: any, name: string) => [
                  `₹${Math.round(value).toLocaleString()}`,
                  'Revenue'
                ]}
              />
              <Bar dataKey="totalRevenue" fill="hsl(40, 80%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Financial Summary Cards */}
        <Card className="card-elevated p-8">
          <h3 className="text-xl font-semibold text-foreground mb-6 font-display">Financial Summary</h3>
          <div className="space-y-4">
            {financialSummary.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="font-medium text-foreground">{item.label}:</span>
                <span className="font-bold text-primary">
                  {item.format === 'currency' 
                    ? `₹${Math.round(item.value).toLocaleString()}`
                    : item.format === 'number'
                    ? item.value.toLocaleString()
                    : item.value
                  }
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Metric Distribution Pie Chart */}
        <Card className="card-elevated p-8">
          <h3 className="text-xl font-semibold text-foreground mb-6 font-display">Revenue Distribution by Metric</h3>
          <div className="h-64">
            {financialMetrics && financialMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financialMetrics.slice(0, 8)} // Top 8 metrics
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ metric, percent }) => `${metric}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={activeIndex !== null ? 85 : 80}
                    innerRadius={30}
                    paddingAngle={2}
                    dataKey="totalAmount"
                    animationBegin={0}
                    animationDuration={800}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {financialMetrics.slice(0, 8).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        stroke={activeIndex === index ? 'hsl(var(--foreground))' : 'none'}
                        strokeWidth={activeIndex === index ? 3 : 0}
                        style={{
                          filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: any, name: string) => [
                      `₹${Math.round(value).toLocaleString()}`,
                      'Amount'
                    ]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color, fontWeight: 'medium' }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No metric distribution data available
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Metric Comparison by Cashier (Stacked Bar Chart) */}
      <Card className="card-elevated p-8">
        <h3 className="text-xl font-semibold text-foreground mb-6 font-display">Financial Metrics by Cashier</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metricComparison.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="metric" 
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
                formatter={(value: any, name: string) => [
                  `₹${Math.round(value).toLocaleString()}`,
                  name
                ]}
              />
              <Legend />
              {allCashiers?.slice(0, 5).map((cashier, index) => (
                <Bar 
                  key={cashier}
                  dataKey={cashier} 
                  stackId="amount"
                  fill={COLORS[index % COLORS.length]} 
                  radius={index === 4 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Professional Insight Card */}
      <Card className="bg-gradient-primary text-white p-8 border-0 shadow-glow">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3 font-display">Financial Performance Insights</h3>
            <p className="text-white/90 text-base leading-relaxed">
              {cashierPerformance.length > 0 
                ? `${(cashierPerformance[0] as any)?.cashier || 'Top performer'} leads with ₹${Math.round((cashierPerformance[0] as any)?.totalRevenue || 0).toLocaleString()} in total revenue. The top financial metric is ${financialSummary[3]?.value || 'Direct Income'} contributing ₹${Math.round(financialSummary[4]?.value || 0).toLocaleString()}. Focus on optimizing underperforming metrics and supporting top cashiers for maximum profitability.`
                : 'Upload your financial data to discover actionable insights about cashier performance, financial metrics, and revenue patterns to optimize your restaurant operations!'
              }
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};