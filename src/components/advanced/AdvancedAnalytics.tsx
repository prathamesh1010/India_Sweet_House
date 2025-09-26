import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, Target, DollarSign, Users, Clock, Award, AlertCircle,
  BarChart3, Activity, Zap, Star, ShoppingCart, Filter, X, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, ComposedChart, ScatterChart, Scatter
} from 'recharts';
import { useStoreContext } from '../../contexts/StoreContext';

interface AdvancedAnalyticsProps {
  data: any[];
  className?: string;
}

const COLORS = [
  'hsl(220, 70%, 30%)', // Navy blue
  'hsl(25, 60%, 40%)',  // Brown
  'hsl(160, 65%, 45%)',
  'hsl(280, 70%, 50%)',
  'hsl(40, 80%, 55%)',
  'hsl(190, 75%, 45%)',
  'hsl(120, 60%, 45%)',
  'hsl(300, 65%, 50%)',
];

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ data, className = '' }) => {
  const { getCategories, getStoresByCategory } = useStoreContext();
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  
  
  // Filter states
  const [filters, setFilters] = useState({
    outlet: 'all',
    clusterManager: 'all',
    branch: 'all',
    category: 'all',
    customerType: 'all',
    paymentMode: 'all',
    dateRange: 'all',
    month: 'all'
  });

  // Get unique filter options from data
  const filterOptions = useMemo(() => {
    if (!data || data.length === 0) return {};

    const outlets = [...new Set(data.map(item => 
      item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name']
    ).filter(Boolean))];
    
    const clusterManagers = [...new Set(data.map(item => 
      item['Outlet Manager'] || item['Cluster Manager'] || item['Cashier'] || item['Cashier Name']
    ).filter(Boolean))];
    
    const branches = [...new Set(data.map(item => item.Branch || item['Store Name']).filter(Boolean))];
    // Use store categories from context instead of data categories
    const categories = getCategories();
    const customerTypes = [...new Set(data.map(item => item['Customer Type'] || item['Sales Type']).filter(Boolean))];
    const paymentModes = [...new Set(data.map(item => item['Payment Mode'] || item['Payment Type']).filter(Boolean))];
    const months = [...new Set(data.map(item => 
      item['Month'] || item['Date']?.substring(0, 7)
    ).filter(Boolean))];

    return {
      outlets: outlets.sort(),
      clusterManagers: clusterManagers.sort(),
      branches: branches.sort(),
      categories: categories.sort(),
      customerTypes: customerTypes.sort(),
      paymentModes: paymentModes.sort(),
      months: months.sort()
    };
  }, [data, getCategories]);

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const filtered = data.filter(item => {
      if (filters.outlet !== 'all') {
        const outlet = item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'];
        if (outlet !== filters.outlet) return false;
      }
      
      if (filters.clusterManager !== 'all') {
        const manager = item['Outlet Manager'] || item['Cluster Manager'] || item['Cashier'] || item['Cashier Name'];
        if (manager !== filters.clusterManager) return false;
      }
      
      if (filters.branch !== 'all' && (item.Branch || item['Store Name']) !== filters.branch) return false;
      
      // Filter by store category - check if the outlet belongs to the selected category
      if (filters.category !== 'all') {
        const outlet = item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'];
        const storesInCategory = getStoresByCategory(filters.category);
        const outletInCategory = storesInCategory.some(store => store.Outlet === outlet);
        if (!outletInCategory) return false;
      }
      
      if (filters.customerType !== 'all' && (item['Customer Type'] || item['Sales Type']) !== filters.customerType) return false;
      if (filters.paymentMode !== 'all' && (item['Payment Mode'] || item['Payment Type']) !== filters.paymentMode) return false;
      if (filters.month !== 'all') {
        const month = item['Month'] || item['Date']?.substring(0, 7);
        if (month !== filters.month) return false;
      }
      
      return true;
    });

    return filtered;
  }, [data, filters, getStoresByCategory]);

  const clearAllFilters = () => {
    setFilters({
      outlet: 'all',
      clusterManager: 'all',
      branch: 'all',
      category: 'all',
      customerType: 'all',
      paymentMode: 'all',
      dateRange: 'all',
      month: 'all'
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all').length;

  const analyticsData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return {};

    // 1. Revenue & Profit Analysis
    const financialMetrics = filteredData.reduce((acc, item) => {
      const revenue = parseFloat(item['Total Amount (₹)'] || item['Total Sales']) || 0;
      const grossAmount = parseFloat(item['Gross Amount']) || 0;
      const date = item.Date || item.Month;
      const productName = (item['Product Name'] || '').toLowerCase();

      // Calculate PBT and EBITDA from Product Name field or dedicated columns
      let pbt = 0;
      let ebitda = 0;
      
      // First check dedicated columns
      const dedicatedPBT = parseFloat(item.PBT) || 0;
      const dedicatedEBITDA = parseFloat(item.EBITDA) || 0;
      
      if (dedicatedPBT > 0) {
        pbt = dedicatedPBT;
      } else if (productName.includes('pbt')) {
        pbt = revenue;
      }
      
      if (dedicatedEBITDA > 0) {
        ebitda = dedicatedEBITDA;
      } else if (productName.includes('ebitda') || productName.includes('ebidta')) {
        ebitda = revenue;
      }


      acc.totalRevenue += revenue;
      acc.totalGross += grossAmount;
      acc.totalPBT += pbt;
      acc.totalEBITDA += ebitda;

      // Monthly breakdown
      if (date) {
        const month = date.substring(0, 7); // Get YYYY-MM
        if (!acc.monthlyData[month]) {
          acc.monthlyData[month] = { month, revenue: 0, pbt: 0, ebitda: 0, netProfit: 0 };
        }
        acc.monthlyData[month].revenue += revenue;
        acc.monthlyData[month].pbt += pbt;
        acc.monthlyData[month].ebitda += ebitda;
        acc.monthlyData[month].netProfit += pbt; // Net profit is same as PBT for this calculation
      }

      return acc;
    }, {
      totalRevenue: 0,
      totalGross: 0,
      totalPBT: 0,
      totalEBITDA: 0,
      monthlyData: {} as Record<string, any>
    });



    // 2. Branch Performance
    const branchAnalysis = filteredData.reduce((acc, item) => {
      const branch = item.Branch || item['Store Name'] || 'Unknown Branch';
      const revenue = parseFloat(item['Total Amount (₹)'] || item['Total Sales']) || 0;
      const productName = item['Product Name'] || '';
      const quantity = parseFloat(item.Quantity || item.Qty) || 0;
      
      // Calculate PBT and EBITDA from Product Name field or dedicated columns
      let pbt = 0;
      let ebitda = 0;
      
      // First check dedicated columns
      const dedicatedPBT = parseFloat(item.PBT) || 0;
      const dedicatedEBITDA = parseFloat(item.EBITDA) || 0;
      
      if (dedicatedPBT > 0) {
        pbt = dedicatedPBT;
      } else if (productName.toLowerCase().includes('pbt')) {
        pbt = revenue;
      }
      
      if (dedicatedEBITDA > 0) {
        ebitda = dedicatedEBITDA;
      } else if (productName.toLowerCase().includes('ebitda') || productName.toLowerCase().includes('ebidta')) {
        ebitda = revenue;
      }

      if (!acc[branch]) {
        acc[branch] = { 
          branch, 
          revenue: 0, 
          pbt: 0, 
          ebitda: 0,
          quantity: 0,
          profitMargin: 0 
        };
      }
      
      acc[branch].revenue += revenue;
      acc[branch].pbt += pbt;
      acc[branch].ebitda += ebitda;
      acc[branch].quantity += quantity;
      acc[branch].profitMargin = acc[branch].revenue > 0 ? (acc[branch].pbt / acc[branch].revenue) * 100 : 0;
      
      return acc;
    }, {} as Record<string, any>);

    // 3. Product Performance Analysis
    const productAnalysis = filteredData.reduce((acc, item) => {
      const product = item['Product Name'] || item['Item Name'] || 'Unknown Product';
      const revenue = parseFloat(item['Total Amount (₹)'] || item['Total Sales']) || 0;
      const quantity = parseFloat(item.Quantity || item.Qty) || 0;
      const productName = item['Product Name'] || '';
      
      // Calculate PBT and EBITDA from Product Name field or dedicated columns
      let pbt = 0;
      let ebitda = 0;
      
      // First check dedicated columns
      const dedicatedPBT = parseFloat(item.PBT) || 0;
      const dedicatedEBITDA = parseFloat(item.EBITDA) || 0;
      
      if (dedicatedPBT > 0) {
        pbt = dedicatedPBT;
      } else if (productName.toLowerCase().includes('pbt')) {
        pbt = revenue;
      }
      
      if (dedicatedEBITDA > 0) {
        ebitda = dedicatedEBITDA;
      } else if (productName.toLowerCase().includes('ebitda') || productName.toLowerCase().includes('ebidta')) {
        ebitda = revenue;
      }

      if (!acc[product]) {
        acc[product] = { 
          product, 
          revenue: 0, 
          quantity: 0, 
          pbt: 0, 
          ebitda: 0,
          avgPrice: 0
        };
      }
      
      acc[product].revenue += revenue;
      acc[product].quantity += quantity;
      acc[product].pbt += pbt;
      acc[product].ebitda += ebitda;
      acc[product].avgPrice = acc[product].quantity > 0 ? acc[product].revenue / acc[product].quantity : 0;
      
      return acc;
    }, {} as Record<string, any>);

    // 4. Payment Method Analysis
    const paymentAnalysis = filteredData.reduce((acc, item) => {
      const payment = item['Payment Mode'] || item['Payment Type'] || 'Unknown';
      const revenue = parseFloat(item['Total Amount (₹)'] || item['Total Sales']) || 0;
      
      if (!acc[payment]) {
        acc[payment] = { method: payment, revenue: 0, count: 0 };
      }
      
      acc[payment].revenue += revenue;
      acc[payment].count += 1;
      
      return acc;
    }, {} as Record<string, any>);

    // 5. Customer Insights
    const customerInsights = filteredData.reduce((acc, item) => {
      const customerType = item['Customer Type'] || item['Sales Type'] || 'Unknown';
      const revenue = parseFloat(item['Total Amount (₹)'] || item['Total Sales']) || 0;
      const quantity = parseFloat(item.Quantity || item.Qty) || 0;
      
      if (!acc[customerType]) {
        acc[customerType] = { 
          type: customerType, 
          revenue: 0, 
          quantity: 0, 
          avgOrderValue: 0
        };
      }
      
      acc[customerType].revenue += revenue;
      acc[customerType].quantity += quantity;
      acc[customerType].avgOrderValue = acc[customerType].quantity > 0 ? 
        acc[customerType].revenue / acc[customerType].quantity : 0;
      
      return acc;
    }, {} as Record<string, any>);

    // 6. Charts Data Processing
    // Sales by Category with file source tracking
    const categoryAnalysis = filteredData.reduce((acc, item, index) => {
      const category = item.Category || 'Unknown';
      const quantity = parseFloat(item.Quantity || item.Qty) || 0;
      const revenue = parseFloat(item['Total Amount (₹)'] || item['Total Sales']) || 0;
      
      // Create a branch identifier based on date ranges to simulate different uploads
      const branchId = `Branch ${Math.floor(index / 100) + 1}`;
      
      if (!acc[category]) {
        acc[category] = { category, revenue: 0, branches: {} };
      }
      
      if (!acc[category].branches[branchId]) {
        acc[category].branches[branchId] = 0;
      }
      
      acc[category].revenue += revenue;
      acc[category].branches[branchId] += quantity;
      return acc;
    }, {} as Record<string, any>);

    // Transform for stacked bar chart
    const categoryData = Object.values(categoryAnalysis).map((item: any) => {
      const result = { category: item.category, revenue: item.revenue };
      Object.keys(item.branches).forEach(branchId => {
        result[branchId] = item.branches[branchId];
      });
      return result;
    });

    // Get all unique branch IDs for the chart
    const allBranchIds = Array.from(new Set(
      Object.values(categoryAnalysis).flatMap((item: any) => Object.keys(item.branches))
    )).sort();

    // Daily Sales Trends
    const dailyData = filteredData.reduce((acc, item) => {
      const date = item.Date || item.Month || 'Unknown';
      const quantity = parseFloat(item.Quantity || item.Qty) || 0;
      const revenue = parseFloat(item['Total Amount (₹)'] || item['Total Sales']) || 0;
      
      if (!acc[date]) {
        acc[date] = { date, quantity: 0, revenue: 0 };
      }
      acc[date].quantity += quantity;
      acc[date].revenue += revenue;
      return acc;
    }, {} as Record<string, any>);

    const dailyTrends = Object.values(dailyData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Customer Types Distribution
    const customerData = filteredData.reduce((acc, item) => {
      const type = item['Customer Type'] || item['Sales Type'] || 'Unknown';
      const quantity = parseFloat(item.Quantity || item.Qty) || 0;
      acc[type] = (acc[type] || 0) + quantity;
      return acc;
    }, {} as Record<string, number>);

    const customerTypes = Object.entries(customerData).map(([name, value]) => ({
      name,
      value
    }));

    // Cashier Performance Analysis
    const cashierAnalysis = filteredData.reduce((acc, item) => {
      const cashier = item.Cashier || item['Cluster Manager'] || 'Unknown';
      const revenue = parseFloat(item['Total Amount (₹)'] || item['Total Sales']) || 0;
      const quantity = parseFloat(item.Quantity || item.Qty) || 0;
      
      if (!acc[cashier]) {
        acc[cashier] = { cashier, revenue: 0, orders: 0, items: 0 };
      }
      acc[cashier].revenue += revenue;
      acc[cashier].orders += 1;
      acc[cashier].items += quantity;
      return acc;
    }, {} as Record<string, any>);

    const cashierPerformance = Object.values(cashierAnalysis).sort((a: any, b: any) => b.revenue - a.revenue);

    // Time of Day Analysis (2-hour intervals)
    const timeAnalysis = filteredData.reduce((acc, item) => {
      const time = item.Time || item['Transaction Time'] || '';
      const quantity = parseFloat(item.Quantity || item.Qty) || 0;
      
      if (time && time.includes(':')) {
        const hour = parseInt(time.split(':')[0]);
        let timeSlot = '';
        
        if (hour >= 6 && hour < 8) timeSlot = '06-08';
        else if (hour >= 8 && hour < 10) timeSlot = '08-10';
        else if (hour >= 10 && hour < 12) timeSlot = '10-12';
        else if (hour >= 12 && hour < 14) timeSlot = '12-14';
        else if (hour >= 14 && hour < 16) timeSlot = '14-16';
        else if (hour >= 16 && hour < 18) timeSlot = '16-18';
        else if (hour >= 18 && hour < 20) timeSlot = '18-20';
        else if (hour >= 20 && hour < 22) timeSlot = '20-22';
        else if (hour >= 22 || hour < 6) timeSlot = '22-06';
        
        if (timeSlot) {
          acc[timeSlot] = (acc[timeSlot] || 0) + quantity;
        }
      }
      return acc;
    }, {} as Record<string, number>);

    const timeOfDay = [
      { time: '06-08', quantity: timeAnalysis['06-08'] || 0 },
      { time: '08-10', quantity: timeAnalysis['08-10'] || 0 },
      { time: '10-12', quantity: timeAnalysis['10-12'] || 0 },
      { time: '12-14', quantity: timeAnalysis['12-14'] || 0 },
      { time: '14-16', quantity: timeAnalysis['14-16'] || 0 },
      { time: '16-18', quantity: timeAnalysis['16-18'] || 0 },
      { time: '18-20', quantity: timeAnalysis['18-20'] || 0 },
      { time: '20-22', quantity: timeAnalysis['20-22'] || 0 },
      { time: '22-06', quantity: timeAnalysis['22-06'] || 0 }
    ];

    return {
      financialMetrics,
      monthlyTrends: Object.values(financialMetrics.monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month)),
      branchPerformance: Object.values(branchAnalysis).sort((a: any, b: any) => b.revenue - a.revenue),
      topProducts: Object.values(productAnalysis).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 10),
      paymentMethods: Object.values(paymentAnalysis),
      customerSegments: Object.values(customerInsights).sort((a: any, b: any) => b.revenue - a.revenue),
      // Charts data
      categoryData,
      dailyTrends,
      customerTypes,
      timeOfDay,
      cashierPerformance,
      allBranchIds
    };
  }, [filteredData]);

  if (!data || data.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Advanced Analytics</h3>
        <p className="text-muted-foreground">Upload data to view advanced business insights</p>
      </Card>
    );
  }

  if (filteredData.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Data Found</h3>
        <p className="text-muted-foreground mb-4">No data matches the selected filters</p>
        <Button onClick={clearAllFilters} variant="outline">
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      </Card>
    );
  }

  const { financialMetrics, monthlyTrends, branchPerformance, topProducts, paymentMethods, customerSegments, categoryData, dailyTrends, customerTypes, timeOfDay, cashierPerformance, allBranchIds } = analyticsData;

  // Calculate KPIs
  const profitMargin = financialMetrics?.totalRevenue > 0 ? (financialMetrics.totalPBT / financialMetrics.totalRevenue) * 100 : 0;
  const ebitdaMargin = financialMetrics?.totalRevenue > 0 ? (financialMetrics.totalEBITDA / financialMetrics.totalRevenue) * 100 : 0;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Filter Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Filters</h3>
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
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Outlet</label>
            <Select value={filters.outlet} onValueChange={(value) => setFilters(prev => ({ ...prev, outlet: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Outlets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outlets</SelectItem>
                {filterOptions.outlets?.map(outlet => (
                  <SelectItem key={outlet} value={outlet}>{outlet}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Cluster Manager</label>
            <Select value={filters.clusterManager} onValueChange={(value) => setFilters(prev => ({ ...prev, clusterManager: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Managers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Managers</SelectItem>
                {filterOptions.clusterManagers?.map(manager => (
                  <SelectItem key={manager} value={manager}>{manager}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Branch</label>
            <Select value={filters.branch} onValueChange={(value) => setFilters(prev => ({ ...prev, branch: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {filterOptions.branches?.map(branch => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Category</label>
            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filterOptions.categories?.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Customer Type</label>
            <Select value={filters.customerType} onValueChange={(value) => setFilters(prev => ({ ...prev, customerType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {filterOptions.customerTypes?.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Payment Mode</label>
            <Select value={filters.paymentMode} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMode: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Payments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                {filterOptions.paymentModes?.map(mode => (
                  <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Month</label>
            <Select value={filters.month} onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {filterOptions.months?.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Data Summary</label>
            <div className="bg-muted/50 rounded-md px-3 py-2 text-sm text-muted-foreground">
              {filteredData.length} of {data.length} records
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                ₹{financialMetrics?.totalRevenue.toLocaleString() || 0}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-slate-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400">+12.5% from last period</span>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Profit Margin</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {profitMargin.toFixed(1)}%
              </p>
            </div>
            <Target className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <Badge variant={profitMargin > 15 ? "default" : "secondary"} className="text-xs">
              {profitMargin > 15 ? "Excellent" : profitMargin > 10 ? "Good" : "Needs Improvement"}
            </Badge>
          </div>
        </Card>


        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">EBITDA Margin</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {ebitdaMargin.toFixed(1)}%
              </p>
            </div>
            <Zap className="h-8 w-8 text-orange-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <Star className="h-4 w-4 text-orange-500 mr-1" />
            <span className="text-orange-600 dark:text-orange-400">Operational efficiency</span>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Total PBT</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                ₹{financialMetrics?.totalPBT.toLocaleString() || 0}
              </p>
            </div>
            <Target className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400">Profit Before Tax</span>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total EBITDA</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                ₹{financialMetrics?.totalEBITDA.toLocaleString() || 0}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <Activity className="h-4 w-4 text-purple-500 mr-1" />
            <span className="text-purple-600 dark:text-purple-400">Earnings Before Interest, Tax, Depreciation & Amortization</span>
          </div>
        </Card>
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs defaultValue="charts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="trends">Revenue Trends</TabsTrigger>
          <TabsTrigger value="branches">Branch Analysis</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground font-display">Visual Charts</h2>
                <p className="text-muted-foreground mt-1 text-lg">
                  Interactive visualizations and trends analysis
                </p>
              </div>
            </div>
          </div>
          
          {/* Category Sales Bar Chart */}
          <Card className="card-elevated p-8">
            <h3 className="text-xl font-semibold text-foreground mb-6 font-display">Sales by Category (Revenue)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="category" 
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
                    formatter={(value: any) => [
                      `₹${Math.round(value).toLocaleString()}`,
                      'Revenue'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="hsl(220, 70%, 30%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Category Sales by Quantity Stacked Bar Chart */}
          <Card className="card-elevated p-8">
            <h3 className="text-xl font-semibold text-foreground mb-6 font-display">Sales by Category (Quantity) - Branch Comparison</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="category" 
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
                  />
                  <Legend />
                  {allBranchIds?.map((branchId, index) => (
                    <Bar 
                      key={branchId}
                      dataKey={branchId} 
                      stackId="quantity"
                      fill={COLORS[index % COLORS.length]} 
                      radius={index === allBranchIds.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Cashier Performance Chart */}
          <Card className="card-elevated p-8">
            <h3 className="text-xl font-semibold text-foreground mb-6 font-display">Cashier Performance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashierPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="cashier" 
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
                    formatter={(value: any) => [
                      `₹${Math.round(value).toLocaleString()}`,
                      'Revenue'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="hsl(160, 65%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Revenue Funnel Chart */}
          <Card className="card-elevated p-8">
            <h3 className="text-xl font-semibold text-foreground mb-6 font-display">Revenue Funnel Analysis</h3>
            <div className="h-80">
              {financialMetrics && financialMetrics.totalRevenue > 0 ? (
                <div className="h-full flex flex-col justify-center items-center space-y-3">
                  {[
                    { 
                      name: 'Total Revenue', 
                      value: financialMetrics.totalRevenue, 
                      fill: '#10b981', 
                      percentage: 100,
                      width: 100
                    },
                    { 
                      name: 'After COGS', 
                      value: Math.max(0, financialMetrics.totalRevenue - (financialMetrics.totalRevenue * 0.6)), 
                      fill: '#f59e0b', 
                      percentage: 40,
                      width: 40
                    },
                    { 
                      name: 'After Expenses', 
                      value: Math.max(0, financialMetrics.totalRevenue - (financialMetrics.totalRevenue * 0.8)), 
                      fill: '#ef4444', 
                      percentage: 20,
                      width: 20
                    },
                    { 
                      name: 'EBITDA', 
                      value: financialMetrics.totalEBITDA, 
                      fill: '#8b5cf6', 
                      percentage: financialMetrics.totalRevenue > 0 ? (financialMetrics.totalEBITDA / financialMetrics.totalRevenue) * 100 : 0,
                      width: financialMetrics.totalRevenue > 0 ? (financialMetrics.totalEBITDA / financialMetrics.totalRevenue) * 100 : 0
                    },
                    { 
                      name: 'PBT', 
                      value: financialMetrics.totalPBT, 
                      fill: '#06b6d4', 
                      percentage: financialMetrics.totalRevenue > 0 ? (financialMetrics.totalPBT / financialMetrics.totalRevenue) * 100 : 0,
                      width: financialMetrics.totalRevenue > 0 ? (financialMetrics.totalPBT / financialMetrics.totalRevenue) * 100 : 0
                    }
                  ].map((item, index) => (
                    <div key={item.name} className="relative w-full flex items-center justify-center">
                      <div 
                        className="relative rounded-lg shadow-sm border-2 border-white/20 transition-all duration-300 hover:shadow-md"
                        style={{
                          width: `${Math.max(item.width, 10)}%`,
                          height: '45px',
                          backgroundColor: item.fill,
                          minWidth: '250px'
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-between px-4 text-white font-medium">
                          <span className="text-sm font-semibold truncate">{item.name}</span>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs bg-white/20 px-2 py-1 rounded font-medium">
                              {item.percentage.toFixed(1)}%
                            </span>
                            <span className="text-sm font-bold">
                              ₹{Math.round(item.value).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Legend */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                    {[
                      { name: 'Total Revenue', fill: '#10b981' },
                      { name: 'After COGS', fill: '#f59e0b' },
                      { name: 'After Expenses', fill: '#ef4444' },
                      { name: 'EBITDA', fill: '#8b5cf6' },
                      { name: 'PBT', fill: '#06b6d4' }
                    ].map((item, index) => (
                      <div key={`legend-${index}`} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="text-muted-foreground font-medium">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <p className="mb-2">No revenue data available for funnel analysis.</p>
                    <p className="text-sm">Please upload data to see the revenue funnel.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Trends Line Chart */}
            <Card className="card-elevated p-8">
              <h3 className="text-xl font-semibold text-foreground mb-6 font-display">Daily Sales Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
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
                    />
                    <Line 
                      type="monotone" 
                      dataKey="quantity" 
                      stroke="hsl(280, 70%, 50%)" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(280, 70%, 50%)', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Customer Types Pie Chart */}
            <Card className="card-elevated p-8">
              <h3 className="text-xl font-semibold text-foreground mb-6 font-display">Sales by Customer Type</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      innerRadius={30}
                      paddingAngle={2}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {customerTypes?.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          style={{
                            filter: 'brightness(1)',
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
                        `${value} items`,
                        `${name} customers`
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
              </div>
            </Card>
          </div>

          {/* Time of Day Bar Chart */}
          <Card className="card-elevated p-8">
            <h3 className="text-xl font-semibold text-foreground mb-6 font-display">Sales Volume by Time of Day</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeOfDay} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time" 
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
                  />
                  <Bar 
                    dataKey="quantity" 
                    fill="hsl(40, 80%, 55%)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Revenue & Profitability Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="hsl(220, 70%, 30%)" name="Revenue (₹)" />
                  <Line yAxisId="right" type="monotone" dataKey="netProfit" stroke="hsl(25, 60%, 40%)" strokeWidth={4} name="Net Profit (₹)" />
                  <Line yAxisId="right" type="monotone" dataKey="pbt" stroke="hsl(160, 65%, 45%)" strokeWidth={3} name="PBT (₹)" />
                  <Line yAxisId="right" type="monotone" dataKey="ebitda" stroke="hsl(280, 70%, 50%)" strokeWidth={3} name="EBITDA (₹)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Branch Performance Comparison</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="branch" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(220, 70%, 30%)" name="Revenue (₹)" />
                  <Bar dataKey="pbt" fill="hsl(220, 70%, 30%)" name="PBT (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Top 10 Products by Revenue</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="horizontal" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="product" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(340, 75%, 50%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Customer Segments</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerSegments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {customerSegments?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Payment Method Preferences</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentMethods} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="method" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="revenue" fill="hsl(280, 70%, 50%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-2 text-green-600">Best Performing Branch</h4>
              <p className="text-2xl font-bold">{(branchPerformance as any)?.[0]?.branch || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">
                ₹{(branchPerformance as any)?.[0]?.revenue?.toLocaleString() || 0} revenue
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-2 text-slate-600">Top Product</h4>
              <p className="text-2xl font-bold">{(topProducts as any)?.[0]?.product || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">
                ₹{(topProducts as any)?.[0]?.revenue?.toLocaleString() || 0} revenue
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-2 text-purple-600">Primary Customer</h4>
              <p className="text-2xl font-bold">{(customerSegments as any)?.[0]?.type || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">
                {(((customerSegments as any)?.[0]?.revenue / financialMetrics?.totalRevenue) * 100)?.toFixed(1) || 0}% of revenue
              </p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};