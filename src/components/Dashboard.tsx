import React, { useMemo, memo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { TrendingUp, DollarSign, ShoppingCart, Clock, Users, Crown } from 'lucide-react';

interface DashboardProps {
  data: any[];
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, color = 'text-primary' }) => (
  <Card className="metric-sweets group hover:shadow-gold transition-all duration-300">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-sweet-brown mb-1">{title}</p>
        <p className="text-2xl font-bold text-foreground mb-2 font-display">{value}</p>
        {trend && (
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-sweet-green" />
            <p className="text-xs text-sweet-green font-medium">{trend}</p>
          </div>
        )}
      </div>
      <div className={`p-4 rounded-xl bg-gradient-sweets group-hover:scale-110 transition-transform duration-300 shadow-glow`}>
        <div className="text-white">
          {icon}
        </div>
      </div>
    </div>
  </Card>
);

export const Dashboard: React.FC<DashboardProps> = memo(({ data, className = '' }) => {
  // Filter states
  const [filters, setFilters] = useState({
    outlet: 'all',
    clusterManager: 'all',
    month: 'all'
  });

  // Get unique filter options from data
  const filterOptions = useMemo(() => {
    if (!data || data.length === 0) return { outlets: [], clusterManagers: [], months: [] };

    console.log('Dashboard - Sample data item:', data[0]);
    console.log('Dashboard - All data length:', data.length);

    const outlets = [...new Set(data.map(item => 
      item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name']
    ).filter(Boolean))];
    
    console.log('Dashboard - Found outlets:', outlets);
    
    const clusterManagers = [...new Set(data.map(item => 
      item['Outlet Manager'] || item['Cluster Manager'] || item['Cashier'] || item['Cashier Name']
    ).filter(Boolean))];
    
    const months = [...new Set(data.map(item => 
      item['Month'] || item['Date']?.substring(0, 7) // Extract YYYY-MM from date
    ).filter(Boolean))];

    return {
      outlets: outlets.sort(),
      clusterManagers: clusterManagers.sort(),
      months: months.sort()
    };
  }, [data]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    console.log('Dashboard - Current filters:', filters);
    console.log('Dashboard - Available outlets:', filterOptions.outlets);
    
    const filtered = data.filter(item => {
      if (filters.outlet !== 'all') {
        const outlet = item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'];
        console.log(`Dashboard - Checking outlet: "${outlet}" against filter: "${filters.outlet}"`);
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
      
      return true;
    });
    
    console.log('Dashboard - Filtered data count:', filtered.length);
    return filtered;
  }, [data, filters, filterOptions.outlets]);

  // Limit data processing to prevent performance issues
  const limitedData = useMemo(() => {
    return filteredData.slice(0, 1000); // Process only first 1000 records
  }, [filteredData]);

  const calculateMetrics = useMemo(() => {
    if (!limitedData || limitedData.length === 0) {
    return {
      directIncome: 0,
      totalRevenue: 0,
      cogs: 0,
      outletExpenses: 0,
      ebitda: 0,
      pbt: 0,
      wastage: 0,
      activeClusterManagers: 0,
      topClusterManager: 'N/A',
      averageOutletIncome: 0
    };
    }

    // Check if this is outlet-based data (has Outlet column)
    const hasOutletData = limitedData.some(item => item['Outlet']);

    let directIncome, totalRevenue, cogs, outletExpenses, ebitda, pbt, wastage, clusterData, activeClusterManagers, topClusterManager;

    if (hasOutletData) {
      // For outlet-based data, sum the financial metrics directly from columns
      directIncome = limitedData.reduce((sum, item) => sum + (parseFloat(item['Direct Income']) || 0), 0);
      totalRevenue = limitedData.reduce((sum, item) => sum + (parseFloat(item['TOTAL REVENUE']) || 0), 0);
      cogs = limitedData.reduce((sum, item) => sum + (parseFloat(item['COGS']) || 0), 0);
      outletExpenses = limitedData.reduce((sum, item) => sum + (parseFloat(item['Outlet Expenses']) || 0), 0);
      ebitda = limitedData.reduce((sum, item) => sum + (parseFloat(item['EBIDTA']) || 0), 0);
      pbt = limitedData.reduce((sum, item) => sum + (parseFloat(item['PBT']) || 0), 0);
      wastage = limitedData.reduce((sum, item) => sum + (parseFloat(item['WASTAGE']) || 0), 0);

      // Outlet Manager analytics
      clusterData = limitedData.reduce((acc, item) => {
        const cluster = item['Outlet Manager'] || item['Cluster Manager'] || item['Cashier'] || 'Unknown';
        const amount = parseFloat(item['TOTAL REVENUE']) || 0;
        
        if (!acc[cluster]) {
          acc[cluster] = { revenue: 0 };
        }
        acc[cluster].revenue += amount;
        return acc;
      }, {} as Record<string, { revenue: number }>);
    } else {
      // For transaction-based data, use the original logic
      directIncome = limitedData
        .filter(item => item['Product Name']?.toLowerCase().includes('direct income'))
        .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

      totalRevenue = limitedData
        .filter(item => item['Product Name']?.toLowerCase().includes('total revenue'))
        .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

      cogs = limitedData
        .filter(item => item['Product Name']?.toLowerCase().includes('cogs'))
        .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

      outletExpenses = limitedData
        .filter(item => item['Product Name']?.toLowerCase().includes('outlet expenses'))
        .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

      ebitda = limitedData
        .filter(item => item['Product Name']?.toLowerCase().includes('ebitda') || item['Product Name']?.toLowerCase().includes('ebidta'))
        .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

      pbt = limitedData
        .filter(item => item['Product Name']?.toLowerCase().includes('pbt'))
        .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

      wastage = limitedData
        .filter(item => item['Product Name']?.toLowerCase().includes('wastage'))
        .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

      // Cluster Manager analytics
      clusterData = limitedData.reduce((acc, item) => {
        const cluster = item['Cluster Manager'] || item['Cashier'] || item['Cashier Name'] || 'Unknown';
        const amount = parseFloat(item['Total Amount (₹)']) || 0;
        
        if (!acc[cluster]) {
          acc[cluster] = { revenue: 0 };
        }
        acc[cluster].revenue += amount;
        return acc;
      }, {} as Record<string, { revenue: number }>);
    }


    activeClusterManagers = Object.keys(clusterData).length;
    topClusterManager = Object.entries(clusterData).reduce(
      (max, [cluster, stats]) => (stats as any).revenue > max.revenue ? { cluster, revenue: (stats as any).revenue } : max,
      { cluster: 'N/A', revenue: 0 }
    ).cluster;

    // Calculate average outlet income
    const uniqueOutlets = [...new Set(limitedData.map(item => 
      item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name']
    ).filter(Boolean))];
    
    const averageOutletIncome = uniqueOutlets.length > 0 ? totalRevenue / uniqueOutlets.length : 0;

    return {
      directIncome: Math.round(directIncome),
      totalRevenue: Math.round(totalRevenue),
      cogs: Math.round(cogs),
      outletExpenses: Math.round(outletExpenses),
      ebitda: Math.round(ebitda),
      pbt: Math.round(pbt),
      wastage: Math.round(wastage),
      activeClusterManagers,
      topClusterManager,
      averageOutletIncome: Math.round(averageOutletIncome)
    };
  }, [limitedData]);

  const metrics = calculateMetrics;

  const clearAllFilters = () => {
    setFilters({
      outlet: 'all',
      clusterManager: 'all',
      month: 'all',
      interestType: 'all'
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        </div>
      </Card>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground font-display">Analytics Overview</h2>
            <p className="text-muted-foreground mt-1 text-lg">
              Comprehensive insights into your restaurant's performance
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Direct Income"
          value={`₹${metrics.directIncome.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="text-green-600"
        />
        
        <MetricCard
          title="Total Revenue"
          value={`₹${metrics.totalRevenue.toLocaleString()}`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="text-slate-600"
        />
        
        <MetricCard
          title="COGS"
          value={`₹${metrics.cogs.toLocaleString()}`}
          icon={<ShoppingCart className="h-6 w-6" />}
          color="text-orange-600"
        />
        
        <MetricCard
          title="Outlet Expenses"
          value={`₹${metrics.outletExpenses.toLocaleString()}`}
          icon={<Clock className="h-6 w-6" />}
          color="text-red-600"
        />

        <MetricCard
          title="EBITDA"
          value={`₹${metrics.ebitda.toLocaleString()}`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="text-purple-600"
        />


        <MetricCard
          title="PBT"
          value={`₹${metrics.pbt.toLocaleString()}`}
          icon={<Crown className="h-6 w-6" />}
          color="text-green-600"
        />

        <MetricCard
          title="Wastage"
          value={`₹${metrics.wastage.toLocaleString()}`}
          icon={<ShoppingCart className="h-6 w-6" />}
          color="text-red-600"
        />


        <MetricCard
          title="Active Cluster Managers"
          value={metrics.activeClusterManagers}
          icon={<Users className="h-6 w-6" />}
          color="text-purple-600"
        />

        <MetricCard
          title="Top Cluster Manager"
          value={metrics.topClusterManager}
          icon={<Crown className="h-6 w-6" />}
          color="text-green-600"
        />

        <MetricCard
          title="Average Outlet Income"
          value={`₹${metrics.averageOutletIncome.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="text-indigo-600"
        />
      </div>

      {limitedData.length === 0 && (
        <Card className="card-elevated p-12 text-center">
          <div className="space-y-4">
            <div className="p-4 bg-gradient-primary rounded-2xl inline-block">
              <ShoppingCart className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground font-display">Ready to Get Started</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Upload your POS data files to unlock powerful analytics and insights for your restaurant
            </p>
          </div>
        </Card>
      )}
    </div>
  );
});

Dashboard.displayName = 'Dashboard';