import React, { useMemo, useState, memo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Filter, X, FileText, GitCompare, Users } from 'lucide-react';
import { useStoreContext } from '../contexts/StoreContext';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';

interface SimpleChartsSectionProps {
  data: any[];
  dataByFile?: Record<string, any[]>;
  className?: string;
}

// Vibrant Sweets-Inspired Color Palette
const COLORS = [
  'hsl(15, 85%, 55%)',     // Sweet Red (Jalebi)
  'hsl(220, 50%, 40%)',    // Navy Blue (Replaced Light Blue)
  'hsl(160, 60%, 45%)',    // Sea Green (Replaced Sweet Yellow)
  'hsl(120, 40%, 50%)',    // Sweet Green (Pistachio)
  'hsl(280, 60%, 55%)',    // Sweet Purple (Kulfi)
  'hsl(25, 85%, 60%)',     // Sweet Orange (Carrot Halwa)
  'hsl(30, 40%, 40%)',     // Sweet Brown (Chocolate)
  'hsl(300, 60%, 50%)'      // Magenta
];

// Enhanced gradient colors for better visual appeal
const GRADIENT_COLORS = [
  'linear-gradient(135deg, hsl(15, 85%, 55%), hsl(25, 85%, 60%))',
  'linear-gradient(135deg, hsl(220, 50%, 40%), hsl(230, 40%, 35%))', // Adjusted from light blue
  'linear-gradient(135deg, hsl(160, 60%, 45%), hsl(140, 50%, 40%))', // Adjusted from yellow to sea green
  'linear-gradient(135deg, hsl(120, 40%, 50%), hsl(140, 50%, 60%))',
  'linear-gradient(135deg, hsl(280, 60%, 55%), hsl(260, 70%, 65%))',
  'linear-gradient(135deg, hsl(25, 85%, 60%), hsl(35, 75%, 50%))',
  'linear-gradient(135deg, hsl(30, 40%, 40%), hsl(20, 50%, 50%))',
  'linear-gradient(135deg, hsl(300, 60%, 50%), hsl(280, 70%, 55%))' // Adjusted from gold to magenta
];

export const SimpleChartsSection: React.FC<SimpleChartsSectionProps> = memo(({ data, dataByFile = {}, className = '' }) => {
  const { getCategories, getStoresByCategory } = useStoreContext();
  
  // Comparison state
  const [comparisonType, setComparisonType] = useState<'overview' | 'detailed'>('overview');
  
  // Filter states
  const [filters, setFilters] = useState({
    outlet: 'all',
    clusterManager: 'all',
    month: 'all',
    file: 'all',
    category: 'all'
  });
  

  // Get available sheets for comparison
  const availableSheets = Object.keys(dataByFile);
  const hasMultipleSheets = availableSheets.length > 1;

  // Get unique filter options from all data
  const filterOptions = useMemo(() => {
    const allData = Object.values(dataByFile).flat();
    if (!allData || allData.length === 0) return { outlets: [], clusterManagers: [], months: [], files: [], categories: [] };

    console.log('SimpleChartsSection - Sample data item:', allData[0]);
    console.log('SimpleChartsSection - All data length:', allData.length);

    const outlets = [...new Set(allData.map(item => 
      item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name']
    ).filter(Boolean))];
    
    console.log('SimpleChartsSection - Found outlets:', outlets);
    
    const clusterManagers = [...new Set(allData.map(item => 
      item['Outlet Manager'] || item['Cluster Manager'] || item['Cashier'] || item['Cashier Name']
    ).filter(Boolean))];
    
    const months = [...new Set(allData.map(item => 
      item['Month'] || item['Date']?.substring(0, 7)
    ).filter(Boolean))];

    // Use store categories from context
    const categories = getCategories();


    // Sort months in chronological order
    const sortedMonths = months.sort((a, b) => {
      // Convert month strings to sortable format
      const getSortableDate = (monthStr: string) => {
        if (monthStr.includes('-')) {
          // Format: YYYY-MM -> YYYYMM
          return monthStr.replace('-', '');
        } else if (monthStr.includes('/')) {
          // Format: MM/YYYY -> YYYYMM
          const parts = monthStr.split('/');
          if (parts.length === 2) {
            return parts[1] + parts[0].padStart(2, '0');
          }
        } else if (monthStr.length === 6) {
          // Format: YYYYMM -> already correct
          return monthStr;
        } else if (monthStr.length === 4) {
          // Format: YYYY -> YYYY01 (treat as January)
          return monthStr + '01';
        }
        return monthStr;
      };

      const dateA = getSortableDate(a);
      const dateB = getSortableDate(b);
      
      // Simple string comparison for YYYYMM format
      return dateA.localeCompare(dateB);
    });

    return {
      outlets: outlets.sort(),
      clusterManagers: clusterManagers.sort(),
      months: sortedMonths,
      files: availableSheets.sort(),
      categories: categories.sort()
    };
  }, [dataByFile, availableSheets, getCategories]);

  // Apply filters to data
  const filteredDataByFile = useMemo(() => {
    const filtered: Record<string, any[]> = {};
    
    console.log('SimpleChartsSection - Current filters:', filters);
    console.log('SimpleChartsSection - Available outlets:', filterOptions.outlets);
    
    Object.entries(dataByFile).forEach(([filename, fileData]) => {
      if (filters.file !== 'all' && filename !== filters.file) return;
      
      const fileFilteredData = fileData.filter(item => {
        if (filters.outlet !== 'all') {
          const outlet = item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'];
          console.log(`SimpleChartsSection - Checking outlet: "${outlet}" against filter: "${filters.outlet}"`);
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
        
        return true;
      });
      
      if (fileFilteredData.length > 0) {
        filtered[filename] = fileFilteredData;
        console.log(`SimpleChartsSection - File ${filename}: ${fileFilteredData.length} items after filtering`);
      }
    });
    
    console.log('SimpleChartsSection - Filtered data by file:', Object.keys(filtered));
    return filtered;
  }, [dataByFile, filters, filterOptions.outlets, getStoresByCategory]);

  // Use filtered data for comparison
  const limitedData = useMemo(() => {
    // Combine all filtered data from different files
    const allFilteredData = Object.values(filteredDataByFile).flat();
    return allFilteredData.length > 0 ? allFilteredData : data;
  }, [filteredDataByFile, data]);

  // Debug logging
  console.log('SimpleChartsSection - data length:', data?.length);
  console.log('SimpleChartsSection - dataByFile keys:', Object.keys(dataByFile));
  console.log('SimpleChartsSection - availableSheets:', availableSheets);

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



  // Comparison data processing - focused on overview metrics
  const comparisonData = useMemo(() => {
    console.log('Processing comparison data - filteredDataByFile keys:', Object.keys(filteredDataByFile));
    console.log('Current filters:', filters);
    if (Object.keys(filteredDataByFile).length === 0) {
      console.log('No filtered data available, returning null');
      return null;
    }

    const processedSheets = Object.keys(filteredDataByFile).map(filename => {
      const sheetData = filteredDataByFile[filename] || [];
      console.log(`Processing sheet ${filename} with ${sheetData.length} records`);
      
      // Check if this is outlet-based data
      const hasOutletData = sheetData.some(item => item['Outlet']);
      console.log(`Sheet ${filename} has outlet data:`, hasOutletData);
      
      let directIncome, totalRevenue, cogs, outletExpenses, ebitda, pbt, wastage;
      
      if (hasOutletData) {
        // For outlet data, sum the financial metrics directly from columns
        directIncome = sheetData.reduce((sum, item) => sum + (parseFloat(item['Direct Income']) || 0), 0);
        totalRevenue = sheetData.reduce((sum, item) => sum + (parseFloat(item['TOTAL REVENUE']) || 0), 0);
        cogs = sheetData.reduce((sum, item) => sum + (parseFloat(item['COGS']) || 0), 0);
        outletExpenses = sheetData.reduce((sum, item) => sum + (parseFloat(item['Outlet Expenses']) || 0), 0);
        ebitda = sheetData.reduce((sum, item) => sum + (parseFloat(item['EBIDTA']) || 0), 0);
        pbt = sheetData.reduce((sum, item) => sum + (parseFloat(item['PBT']) || 0), 0);
        wastage = sheetData.reduce((sum, item) => sum + (parseFloat(item['WASTAGE']) || 0), 0);
      } else {
        // For transaction data, use the original logic
        directIncome = sheetData
          .filter(item => {
            const productName = (item['Product Name'] || '').toLowerCase();
            return productName.includes('direct income') || productName.includes('direct');
          })
          .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

        totalRevenue = sheetData
          .filter(item => {
            const productName = (item['Product Name'] || '').toLowerCase();
            return productName.includes('total revenue') || productName.includes('revenue');
          })
          .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

        cogs = sheetData
          .filter(item => {
            const productName = (item['Product Name'] || '').toLowerCase();
            return productName.includes('cogs') || productName.includes('cost of goods');
          })
          .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

        outletExpenses = sheetData
          .filter(item => {
            const productName = (item['Product Name'] || '').toLowerCase();
            return productName.includes('outlet expenses') || productName.includes('expenses');
          })
          .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

        ebitda = sheetData
          .filter(item => {
            const productName = (item['Product Name'] || '').toLowerCase();
            return productName.includes('ebitda') || productName.includes('ebidta');
          })
          .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

        pbt = sheetData
          .filter(item => {
            const productName = (item['Product Name'] || '').toLowerCase();
            return productName.includes('pbt') || productName.includes('profit before tax');
          })
          .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

        wastage = sheetData
          .filter(item => {
            const productName = (item['Product Name'] || '').toLowerCase();
            return productName.includes('wastage') || productName.includes('waste');
          })
          .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);
      }


      // Cluster Manager analysis for overview
      let clusterData, activeClusterManagers, topClusterManager;
      
      if (hasOutletData) {
        // For outlet data, use outlet managers
        clusterData = sheetData.reduce((acc, item) => {
          const cluster = item['Outlet Manager'] || item['Cluster Manager'] || item['Cashier'] || 'Unknown';
          const amount = parseFloat(item['TOTAL REVENUE']) || 0;
          
          if (!acc[cluster]) {
            acc[cluster] = { revenue: 0, transactions: 0 };
          }
          acc[cluster].revenue += amount;
          acc[cluster].transactions += 1;
          return acc;
        }, {} as Record<string, { revenue: number; transactions: number }>);
      } else {
        // For transaction data, use cluster managers
        clusterData = sheetData.reduce((acc, item) => {
          const cluster = item['Cluster Manager'] || item['Cashier'] || item['Cashier Name'] || 'Unknown';
          const amount = parseFloat(item['Total Amount (₹)']) || 0;
          
          if (!acc[cluster]) {
            acc[cluster] = { revenue: 0, transactions: 0 };
          }
          acc[cluster].revenue += amount;
          acc[cluster].transactions += 1;
          return acc;
        }, {} as Record<string, { revenue: number; transactions: number }>);
      }

      activeClusterManagers = Object.keys(clusterData).length;
      topClusterManager = Object.entries(clusterData).reduce(
        (max, [cluster, stats]) => (stats as any).revenue > max.revenue ? { cluster, revenue: (stats as any).revenue } : max,
        { cluster: 'N/A', revenue: 0 }
      ).cluster;

      // Calculate average outlet income
      const uniqueOutlets = [...new Set(sheetData.map(item => 
        item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name']
      ).filter(Boolean))];
      
      const averageOutletIncome = uniqueOutlets.length > 0 ? totalRevenue / uniqueOutlets.length : 0;

      return {
        filename,
        directIncome,
        totalRevenue,
        cogs,
        outletExpenses,
        ebitda,
        pbt,
        wastage,
        activeClusterManagers,
        topClusterManager,
        averageOutletIncome,
        outletCount: uniqueOutlets.length
      };
    });

    // Sort the processed sheets by filename for consistent ordering
    const sortedSheets = processedSheets.sort((a, b) => a.filename.localeCompare(b.filename));
    console.log('SimpleChartsSection - Sorted comparison data:', sortedSheets.map(s => s.filename));
    return sortedSheets;
  }, [filteredDataByFile]);

  // Top/Bottom performers data
  const performersData = useMemo(() => {
    if (!filteredDataByFile || Object.keys(filteredDataByFile).length === 0) {
      return { clusterManagers: [], outlets: [] };
    }

    // Collect all data for analysis
    const allData = Object.values(filteredDataByFile).flat();
    const hasOutletData = allData.some(item => item['Outlet']);

    // Cluster Manager Performance Analysis
    const clusterManagerData: Record<string, { revenue: number; transactions: number; outletCount: number }> = {};
    
    allData.forEach(item => {
      const manager = item['Outlet Manager'] || item['Cluster Manager'] || item['Cashier'] || item['Cashier Name'] || 'Unknown';
      const outlet = item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'] || 'Unknown';
      const amount = hasOutletData ? 
        (parseFloat(item['TOTAL REVENUE']) || 0) : 
        (parseFloat(item['Total Amount (₹)']) || 0);
      
      if (!clusterManagerData[manager]) {
        clusterManagerData[manager] = { revenue: 0, transactions: 0, outletCount: 0 };
      }
      
      clusterManagerData[manager].revenue += amount;
      clusterManagerData[manager].transactions += 1;
      
      // Count unique outlets per manager
      if (!clusterManagerData[manager].outletCount) {
        clusterManagerData[manager].outletCount = 0;
      }
    });

    // Count unique outlets per manager
    const managerOutlets: Record<string, Set<string>> = {};
    allData.forEach(item => {
      const manager = item['Outlet Manager'] || item['Cluster Manager'] || item['Cashier'] || item['Cashier Name'] || 'Unknown';
      const outlet = item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'] || 'Unknown';
      
      if (!managerOutlets[manager]) {
        managerOutlets[manager] = new Set();
      }
      managerOutlets[manager].add(outlet);
    });

    // Update outlet counts
    Object.keys(clusterManagerData).forEach(manager => {
      clusterManagerData[manager].outletCount = managerOutlets[manager]?.size || 0;
    });

    // Sort cluster managers by revenue
    const sortedManagers = Object.entries(clusterManagerData)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // Outlet Performance Analysis
    const outletData: Record<string, { revenue: number; transactions: number; manager: string }> = {};
    
    allData.forEach(item => {
      const outlet = item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'] || 'Unknown';
      const manager = item['Outlet Manager'] || item['Cluster Manager'] || item['Cashier'] || item['Cashier Name'] || 'Unknown';
      const amount = hasOutletData ? 
        (parseFloat(item['TOTAL REVENUE']) || 0) : 
        (parseFloat(item['Total Amount (₹)']) || 0);
      
      if (!outletData[outlet]) {
        outletData[outlet] = { revenue: 0, transactions: 0, manager: manager };
      }
      
      outletData[outlet].revenue += amount;
      outletData[outlet].transactions += 1;
    });

    // Sort outlets by revenue
    const sortedOutlets = Object.entries(outletData)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      clusterManagers: sortedManagers,
      outlets: sortedOutlets
    };
  }, [filteredDataByFile]);

  // Revenue funnel data for funnel chart
  const funnelData = useMemo(() => {
    if (!comparisonData || comparisonData.length === 0) {
      console.log('SimpleChartsSection: No comparison data available for funnel chart');
      // Return sample data for testing if no real data is available
      return [
        { name: 'Total Revenue', value: 0, fill: '#10b981', percentage: 100 },
        { name: 'After COGS', value: 0, fill: '#f59e0b', percentage: 0 },
        { name: 'After Expenses', value: 0, fill: '#ef4444', percentage: 0 },
        { name: 'EBITDA', value: 0, fill: '#8b5cf6', percentage: 0 },
        { name: 'PBT', value: 0, fill: 'hsl(220, 70%, 30%)', percentage: 0 }
      ];
    }

    const totalData = comparisonData.reduce((acc, sheet) => ({
      directIncome: acc.directIncome + (sheet.directIncome || 0),
      totalRevenue: acc.totalRevenue + (sheet.totalRevenue || 0),
      cogs: acc.cogs + (sheet.cogs || 0),
      outletExpenses: acc.outletExpenses + (sheet.outletExpenses || 0),
      ebitda: acc.ebitda + (sheet.ebitda || 0),
      pbt: acc.pbt + (sheet.pbt || 0)
    }), { directIncome: 0, totalRevenue: 0, cogs: 0, outletExpenses: 0, ebitda: 0, pbt: 0 });

    const totalRevenue = Math.max(0, totalData.totalRevenue);
    const afterCOGS = Math.max(0, totalRevenue - totalData.cogs);
    const afterExpenses = Math.max(0, afterCOGS - totalData.outletExpenses);
    const ebitda = Math.max(0, totalData.ebitda);
    const pbt = Math.max(0, totalData.pbt);

    const result = [
      { 
        name: 'Total Revenue', 
        value: totalRevenue, 
        fill: '#10b981', 
        percentage: 100,
        width: 100
      },
      { 
        name: 'After COGS', 
        value: afterCOGS, 
        fill: '#f59e0b', 
        percentage: totalRevenue > 0 ? (afterCOGS / totalRevenue) * 100 : 0,
        width: totalRevenue > 0 ? (afterCOGS / totalRevenue) * 100 : 0
      },
      { 
        name: 'After Expenses', 
        value: afterExpenses, 
        fill: '#ef4444', 
        percentage: totalRevenue > 0 ? (afterExpenses / totalRevenue) * 100 : 0,
        width: totalRevenue > 0 ? (afterExpenses / totalRevenue) * 100 : 0
      },
      { 
        name: 'EBITDA', 
        value: ebitda, 
        fill: '#8b5cf6', 
        percentage: totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0,
        width: totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0
      },
      { 
        name: 'PBT', 
        value: pbt, 
        fill: 'hsl(220, 70%, 30%)', 
        percentage: totalRevenue > 0 ? (pbt / totalRevenue) * 100 : 0,
        width: totalRevenue > 0 ? (pbt / totalRevenue) * 100 : 0
      }
    ];

    console.log('SimpleChartsSection: Funnel data:', result);
    console.log('SimpleChartsSection: Total data:', totalData);
    return result;
  }, [comparisonData]);

  // Cost Structure data - grouped by file
  const monthlyCostStructureData = useMemo(() => {
    if (!filteredDataByFile || Object.keys(filteredDataByFile).length === 0) return [];
    
    console.log('Calculating cost structure data by file');
    
    // Calculate cost structure for each file
    const fileCosts = Object.entries(filteredDataByFile).map(([filename, fileData]) => {
      const hasOutletData = fileData.some(item => item['Outlet']);
      
      let cogs = 0, outletExpenses = 0, wastage = 0, pbt = 0;
      
      if (hasOutletData) {
        // For outlet data, sum the financial metrics directly from columns
        cogs = fileData.reduce((sum, item) => sum + (parseFloat(item['COGS']) || 0), 0);
        outletExpenses = fileData.reduce((sum, item) => sum + (parseFloat(item['Outlet Expenses']) || 0), 0);
        wastage = fileData.reduce((sum, item) => sum + (parseFloat(item['WASTAGE']) || 0), 0);
        pbt = fileData.reduce((sum, item) => sum + (parseFloat(item['PBT']) || 0), 0);
      } else {
        // For transaction data, use the original logic
        cogs = fileData
          .filter(item => {
            const productName = (item['Product Name'] || '').toLowerCase();
            return productName.includes('cogs') || productName.includes('cost of goods');
          })
          .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

        outletExpenses = fileData
          .filter(item => {
            const productName = (item['Product Name'] || '').toLowerCase();
            return productName.includes('outlet expenses') || productName.includes('expenses');
          })
          .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

        pbt = fileData
          .filter(item => {
            const productName = (item['Product Name'] || '').toLowerCase();
            return productName.includes('pbt') || productName.includes('profit before tax');
          })
          .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);

        wastage = fileData
          .filter(item => {
            const productName = (item['Product Name'] || '').toLowerCase();
            return productName.includes('wastage') || productName.includes('waste');
          })
          .reduce((sum, item) => sum + (parseFloat(item['Total Amount (₹)']) || 0), 0);
      }
      
      return {
        filename,
        data: [
          { 
            name: 'COGS', 
            value: cogs,
            fill: 'hsl(25, 95%, 53%)'  // Orange
          },
          { 
            name: 'Outlet Expenses', 
            value: outletExpenses,
            fill: 'hsl(220, 70%, 30%)'  // Navy Blue
          },
          { 
            name: 'Wastage', 
            value: wastage,
            fill: 'hsl(0, 84%, 60%)'    // Red
          },
          { 
            name: 'Net Profit', 
            value: pbt,
            fill: 'hsl(142, 76%, 36%)'  // Green
          }
        ],
        totals: { cogs, outletExpenses, wastage, pbt }
      };
    }).sort((a, b) => a.filename.localeCompare(b.filename));
    
    console.log('File cost structure data:', fileCosts);
    return fileCosts;
  }, [filteredDataByFile]);

  // Line chart data for outlet performance trends
  const lineChartData = useMemo(() => {
    if (!comparisonData || comparisonData.length === 0) {
      console.log('SimpleChartsSection: No comparison data available for line chart');
      return [];
    }

    // Create performance metrics for each outlet
    const outletPerformance = [];
    
    comparisonData.forEach(sheet => {
      const sheetData = filteredDataByFile[sheet.filename] || [];
      const hasOutletData = sheetData.some(item => item['Outlet']);
      
      console.log('SimpleChartsSection: Processing sheet:', sheet.filename, 'hasOutletData:', hasOutletData);
      
      if (hasOutletData) {
        // Group by outlet and calculate metrics
        const outletMetrics = sheetData.reduce((acc, item) => {
          const outlet = item['Outlet'];
          if (!acc[outlet]) {
            acc[outlet] = {
              outlet: outlet,
              manager: item['Outlet Manager'],
              revenue: 0,
              cogs: 0,
              expenses: 0,
              ebitda: 0,
              pbt: 0
            };
          }
          acc[outlet].revenue += parseFloat(item['TOTAL REVENUE']) || 0;
          acc[outlet].cogs += parseFloat(item['COGS']) || 0;
          acc[outlet].expenses += parseFloat(item['Outlet Expenses']) || 0;
          acc[outlet].ebitda += parseFloat(item['EBIDTA']) || 0;
          acc[outlet].pbt += parseFloat(item['PBT']) || 0;
          return acc;
        }, {});

        // Convert to array and sort by revenue
        outletPerformance.push(...Object.values(outletMetrics));
      }
    });

    // Sort by revenue and take top 10 outlets
    const result = outletPerformance
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((outlet, index) => ({
        outlet: outlet.outlet,
        manager: outlet.manager,
        revenue: outlet.revenue,
        cogs: outlet.cogs,
        expenses: outlet.expenses,
        ebitda: outlet.ebitda,
        pbt: outlet.pbt,
        margin: outlet.revenue > 0 ? ((outlet.revenue - outlet.cogs) / outlet.revenue * 100) : 0,
        rank: index + 1
      }));

    console.log('SimpleChartsSection: Line chart data:', result);
    return result;
  }, [comparisonData, dataByFile]);




  const clearAllFilters = () => {
    setFilters({
      outlet: 'all',
      clusterManager: 'all',
      month: 'all',
      file: 'all',
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
            <h3 className="text-lg font-semibold text-foreground">Analytics Filters</h3>
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
            <label className="text-sm font-medium text-foreground mb-2 block">File</label>
            <Select value={filters.file} onValueChange={(value) => setFilters(prev => ({ ...prev, file: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select File" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Files</SelectItem>
                {filterOptions.files.map(file => (
                  <SelectItem key={file} value={file}>{file.split('.')[0]}</SelectItem>
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
          <h2 className="text-2xl font-bold text-foreground font-display">Financial Analytics</h2>
        </div>
        <p className="text-muted-foreground text-lg">
          Comprehensive insights into your restaurant's financial performance
        </p>
      </div>





      {/* Comparison Charts Section */}
      {comparisonData && (
        <Card className="card-elevated p-8 mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-6 font-display">
            {hasMultipleSheets ? 'Sheet Comparison Analysis' : 'Sheet Analysis'}
          </h3>
          
          {/* Key Metrics Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {comparisonData.map((sheet, index) => {
              const otherSheet = hasMultipleSheets ? comparisonData.find((_, i) => i !== index) : null;
              
              return (
                <Card key={sheet.filename} className="p-6 border-2 border-primary/20">
                  <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-foreground truncate">{sheet.filename}</h4>
        </div>
        
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Direct Income</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">₹{Math.round(sheet.directIncome).toLocaleString()}</span>
                        </div>
          </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Revenue</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">₹{Math.round(sheet.totalRevenue).toLocaleString()}</span>
                        </div>
          </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">COGS</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">₹{Math.round(sheet.cogs).toLocaleString()}</span>
                        </div>
          </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Outlet Expenses</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">₹{Math.round(sheet.outletExpenses).toLocaleString()}</span>
          </div>
        </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">EBITDA</span>
          <div className="flex items-center gap-2">
                          <span className="font-semibold">₹{Math.round(sheet.ebitda).toLocaleString()}</span>
                        </div>
          </div>
          
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">PBT</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">₹{Math.round(sheet.pbt).toLocaleString()}</span>
        </div>
            </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Wastage</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">₹{Math.round(sheet.wastage).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Average Outlet Income</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">₹{Math.round(sheet.averageOutletIncome).toLocaleString()}</span>
                        </div>
                      </div>



                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Number of Outlets</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{sheet.outletCount}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Active Cluster Managers</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{sheet.activeClusterManagers}</span>
            </div>
          </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Top Cluster Manager</span>
                        <span className="font-semibold text-right text-sm truncate max-w-32" title={sheet.topClusterManager}>
                          {sheet.topClusterManager}
                        </span>
            </div>
            </div>
          </div>
        </Card>
              );
            })}
      </div>

          {/* Overview Metrics Charts */}
          <div className="space-y-8">
            {comparisonType === 'overview' && (
              <>
                {/* Revenue Funnel Chart */}
                <div className="h-80">
                  <h4 className="text-lg font-semibold text-foreground mb-4">Revenue Funnel Analysis</h4>
                  {funnelData.length > 0 ? (
                    <div className="h-full flex flex-col justify-center items-center space-y-2">
                      {funnelData.map((item, index) => (
                        <div key={item.name} className="relative w-full flex items-center justify-center">
                          <div 
                            className="relative rounded-lg shadow-sm border-2 border-white/20 transition-all duration-300 hover:shadow-md"
                            style={{
                              width: `${Math.max(item.width, 10)}%`,
                              height: '40px',
                              backgroundColor: item.fill,
                              minWidth: '200px'
                            }}
                          >
                            <div className="absolute inset-0 flex items-center justify-between px-4 text-white font-medium">
                              <span className="text-sm truncate">{item.name}</span>
                              <span className="text-sm font-bold">₹{Math.round(item.value).toLocaleString()}</span>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs text-white/80 font-medium">{item.percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>No funnel data available</p>
                    </div>
                  )}
                </div>

                {/* Financial Metrics Comparison */}
          <div className="h-80">
                  <h4 className="text-lg font-semibold text-foreground mb-4">Financial Metrics Comparison</h4>
              <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.map((sheet, index) => {
                      const chartData = {
                        order: index, // Add explicit order
                        sheet: `${sheet.filename.split('.')[0]} (${sheet.outletCount} outlets)`,
                        // Reorder data to match logical business flow
                        totalRevenue: sheet.totalRevenue,
                        directIncome: sheet.directIncome,
                        cogs: sheet.cogs,
                        outletExpenses: sheet.outletExpenses,
                        ebitda: sheet.ebitda,
                        pbt: sheet.pbt,
                        wastage: sheet.wastage
                      };
                      console.log(`Financial Metrics Chart Data ${index}:`, chartData.sheet);
                      return chartData;
                    })} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                        dataKey="sheet" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    tickFormatter={(value, index) => {
                      console.log(`X-Axis tick ${index}:`, value);
                      return value;
                    }}
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
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        // Define the order to match the bar order
                        const orderedMetrics = [
                          { key: 'totalRevenue', name: 'Total Revenue' },
                          { key: 'directIncome', name: 'Direct Income' },
                          { key: 'cogs', name: 'COGS' },
                          { key: 'outletExpenses', name: 'Outlet Expenses' },
                          { key: 'ebitda', name: 'EBITDA' },
                          { key: 'pbt', name: 'PBT' },
                          { key: 'wastage', name: 'Wastage' }
                        ];
                        
                        return (
                          <div className="p-3">
                            <p className="font-semibold text-sm mb-2">{label}</p>
                            {orderedMetrics.map((metric, index) => {
                              const data = payload.find(p => p.dataKey === metric.key);
                              if (data && data.value !== undefined) {
                                return (
                                  <p key={metric.key} className="text-xs mb-1">
                                    <span className="inline-block w-3 h-3 rounded mr-2" style={{ backgroundColor: data.color }}></span>
                                    {metric.name}: <span className="font-medium">₹{Math.round(data.value).toLocaleString()}</span>
                                  </p>
                                );
                              }
                              return null;
                            })}
                          </div>
                        );
                      }
                      return null;
                    }}
                      />
                      <Bar dataKey="totalRevenue" fill="hsl(220, 70%, 30%)" radius={[4, 4, 0, 0]} name="Total Revenue" />
                      <Bar dataKey="directIncome" fill="hsl(34, 100%, 50%)" radius={[4, 4, 0, 0]} name="Direct Income" />
                      <Bar dataKey="cogs" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} name="COGS" />
                      <Bar dataKey="outletExpenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} name="Outlet Expenses" />
                      <Bar dataKey="ebitda" fill="hsl(280, 70%, 50%)" radius={[4, 4, 0, 0]} name="EBITDA" />
                      <Bar dataKey="pbt" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="PBT" />
                      <Bar dataKey="wastage" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} name="Wastage" />
                      <Legend 
                        content={({ payload }) => {
                          // Define the order to match the bar order
                          const orderedMetrics = [
                            { key: 'totalRevenue', name: 'Total Revenue', color: 'hsl(220, 70%, 30%)' },
                            { key: 'directIncome', name: 'Direct Income', color: 'hsl(34, 100%, 50%)' },
                            { key: 'cogs', name: 'COGS', color: 'hsl(25, 95%, 53%)' },
                            { key: 'outletExpenses', name: 'Outlet Expenses', color: 'hsl(0, 84%, 60%)' },
                            { key: 'ebitda', name: 'EBITDA', color: 'hsl(280, 70%, 50%)' },
                            { key: 'pbt', name: 'PBT', color: 'hsl(142, 76%, 36%)' },
                            { key: 'wastage', name: 'Wastage', color: 'hsl(0, 84%, 60%)' }
                          ];
                          
                          return (
                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                              {orderedMetrics.map((metric, index) => (
                                <div key={metric.key} className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded" 
                                    style={{ backgroundColor: metric.color }}
                                  ></div>
                                  <span className="text-sm text-muted-foreground">{metric.name}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }}
                      />
                    </BarChart>
              </ResponsiveContainer>
                </div>

                {/* Revenue Distribution Pie Chart */}
          <div className="h-80">
                  <h4 className="text-lg font-semibold text-foreground mb-4">Revenue Distribution by Sheet</h4>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                        data={comparisonData.map(sheet => ({
                          name: `${sheet.filename.split('.')[0]} (${sheet.outletCount})`,
                          value: sheet.totalRevenue
                        }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={100}
                    innerRadius={40}
                    paddingAngle={2}
                        dataKey="value"
                      >
                        {comparisonData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value: any) => [`₹${Math.round(value).toLocaleString()}`, 'Revenue']}
                      />
                      <Legend />
                </PieChart>
              </ResponsiveContainer>
              </div>


              {/* Top Outlets Performance Line Chart */}
              <div className="h-80">
                <h4 className="text-lg font-semibold text-foreground mb-4">Top 10 Outlets Performance</h4>
                {lineChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                          name
                        ]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(220, 70%, 30%)" 
                        strokeWidth={3}
                        name="Revenue"
                        dot={{ fill: 'hsl(220, 70%, 30%)', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="ebitda" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="EBITDA"
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pbt" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="PBT"
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No outlet performance data available. Please upload outlet data to see this chart.</p>
                  </div>
                )}
              </div>

              {/* Outlet Performance Comparison */}
              <div className="h-80">
                <h4 className="text-lg font-semibold text-foreground mb-4">Outlet Performance Comparison</h4>
                {lineChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                          name
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cogs" fill="#ef4444" name="COGS" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#f59e0b" name="Expenses" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No outlet comparison data available. Please upload outlet data to see this chart.</p>
                  </div>
                )}
              </div>
              </>
            )}

            {comparisonType === 'detailed' && (
        <div className="h-80">
                <h4 className="text-lg font-semibold text-foreground mb-4">Detailed Performance Analysis</h4>
            <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData.map(sheet => ({
                    sheet: `${sheet.filename.split('.')[0]} (${sheet.outletCount} outlets)`,
                    activeClusterManagers: sheet.activeClusterManagers,
                    outletCount: sheet.outletCount
                  }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                      dataKey="sheet" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
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
                        value,
                        'Active Cluster Managers'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="right" dataKey="activeClusterManagers" fill="hsl(280, 70%, 50%)" radius={[4, 4, 0, 0]} name="Active Cluster Managers" />
                    <Bar yAxisId="left" dataKey="outletCount" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="Number of Outlets" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>
      )}






      {/* Additional Visualizations */}
      {comparisonData && (
        <div className="space-y-8">





        </div>
      )}

      {/* Profitability Analysis */}
      {comparisonData && (
        <Card className="card-elevated p-8">
          <h3 className="text-xl font-semibold text-foreground mb-6 font-display">Profitability Analysis</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={comparisonData.map(sheet => ({
                sheet: `${sheet.filename.split('.')[0]} (${sheet.outletCount} outlets)`,
                revenue: sheet.totalRevenue,
                cogs: sheet.cogs,
                expenses: sheet.outletExpenses,
                ebitda: sheet.ebitda,
                pbt: sheet.pbt,
                margin: sheet.totalRevenue > 0 ? ((sheet.pbt / sheet.totalRevenue) * 100) : 0
              }))} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                  dataKey="sheet" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
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
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        // Define the order to match the bar order
                        const orderedMetrics = [
                          { key: 'revenue', name: 'Total Revenue', type: 'bar' },
                          { key: 'cogs', name: 'COGS', type: 'bar' },
                          { key: 'expenses', name: 'Outlet Expenses', type: 'bar' },
                          { key: 'ebitda', name: 'EBITDA', type: 'bar' },
                          { key: 'pbt', name: 'PBT', type: 'bar' },
                          { key: 'margin', name: 'Profit Margin %', type: 'line' }
                        ];
                        
                        return (
                          <div className="p-3">
                            <p className="font-semibold text-sm mb-2">{label}</p>
                            {orderedMetrics.map((metric, index) => {
                              const data = payload.find(p => p.dataKey === metric.key);
                              if (data && data.value !== undefined) {
                                const formattedValue = metric.key === 'margin' 
                                  ? `${data.value.toFixed(2)}%` 
                                  : `₹${Math.round(data.value).toLocaleString()}`;
                                
                                return (
                                  <p key={metric.key} className="text-xs mb-1">
                                    <span className="inline-block w-3 h-3 rounded mr-2" style={{ 
                                      backgroundColor: data.color,
                                      borderRadius: metric.type === 'line' ? '50%' : '2px'
                                    }}></span>
                                    {metric.name}: <span className="font-medium">{formattedValue}</span>
                                  </p>
                                );
                              }
                              return null;
                            })}
                          </div>
                        );
                      }
                      return null;
                    }}
                />
                <Legend 
                  content={({ payload }) => {
                    // Define the order to match the bar order
                    const orderedMetrics = [
                      { key: 'revenue', name: 'Total Revenue', color: 'hsl(220, 70%, 30%)', type: 'bar' },
                      { key: 'cogs', name: 'COGS', color: 'hsl(25, 95%, 53%)', type: 'bar' },
                      { key: 'expenses', name: 'Outlet Expenses', color: 'hsl(0, 84%, 60%)', type: 'bar' },
                      { key: 'ebitda', name: 'EBITDA', color: 'hsl(280, 70%, 50%)', type: 'bar' },
                      { key: 'pbt', name: 'PBT', color: 'hsl(142, 76%, 36%)', type: 'bar' },
                      { key: 'margin', name: 'Profit Margin %', color: 'hsl(45, 93%, 47%)', type: 'line' }
                    ];
                    
                    return (
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {orderedMetrics.map((metric, index) => (
                          <div key={metric.key} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3" 
                              style={{ 
                                backgroundColor: metric.color,
                                borderRadius: metric.type === 'line' ? '50%' : '2px'
                              }}
                            ></div>
                            <span className="text-sm text-muted-foreground">{metric.name}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Bar yAxisId="left" dataKey="revenue" fill="hsl(220, 70%, 30%)" name="Total Revenue" />
                <Bar yAxisId="left" dataKey="cogs" fill="hsl(25, 95%, 53%)" name="COGS" />
                <Bar yAxisId="left" dataKey="expenses" fill="hsl(0, 84%, 60%)" name="Outlet Expenses" />
                <Bar yAxisId="left" dataKey="ebitda" fill="hsl(280, 70%, 50%)" name="EBITDA" />
                <Bar yAxisId="left" dataKey="pbt" fill="hsl(142, 76%, 36%)" name="PBT" />
                <Line yAxisId="right" type="monotone" dataKey="margin" stroke="hsl(45, 93%, 47%)" strokeWidth={3} name="Profit Margin %" />
                </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Cost Structure Analysis - Monthly Breakdown */}
      {monthlyCostStructureData.length > 0 && (
        <Card className="card-elevated p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground font-display">Cost Structure Breakdown by File</h3>
            <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
              <span className="font-medium">{monthlyCostStructureData.length} files</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {monthlyCostStructureData.map((fileData, index) => (
              <div key={fileData.filename} className="space-y-4">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    {fileData.filename.split('.')[0]}
                  </h4>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fileData.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                        outerRadius={100}
                        innerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {fileData.data.map((entry, cellIndex) => (
                          <Cell 
                            key={`cell-${index}-${cellIndex}`} 
                            fill={entry.fill || COLORS[cellIndex % COLORS.length]}
                            stroke="hsl(var(--background))"
                            strokeWidth={2}
                            style={{
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                            }}
                          />
                        ))}
                      </Pie>
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
                          name
                        ]}
                        labelStyle={{
                          color: 'hsl(var(--gold))',
                          fontWeight: 'bold'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value, entry) => (
                          <span style={{ color: entry.color, fontWeight: 'medium', fontSize: '12px' }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* File Summary */}
                <div className="space-y-2">
                  {fileData.data.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.fill }}
                        ></div>
                        <span className="font-medium text-foreground text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">
                          ₹{Math.round(item.value).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {((item.value / fileData.data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Efficiency Metrics Dashboard */}
      {comparisonData && (
        <Card className="card-elevated p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground font-display">Efficiency Metrics Dashboard</h3>
            <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
              <div className="space-y-1">
                <div><span className="font-medium">Efficiency Score:</span> (PBT ÷ Total Revenue) × 100</div>
                <div><span className="font-medium">Wastage Rate:</span> (Wastage ÷ Total Revenue) × 100</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {comparisonData.map((sheet, index) => {
              const efficiencyScore = sheet.totalRevenue > 0 ? 
                ((sheet.pbt / sheet.totalRevenue) * 100) : 0;
              const wastageRate = sheet.totalRevenue > 0 ? 
                ((sheet.wastage / sheet.totalRevenue) * 100) : 0;
              
              return (
                <div key={sheet.filename} className="p-6 border rounded-lg bg-muted/20">
                  <h4 className="text-lg font-semibold text-foreground mb-4">{sheet.filename.split('.')[0]}</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Efficiency Score</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${efficiencyScore > 15 ? 'text-green-600' : efficiencyScore > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {efficiencyScore.toFixed(1)}%
                        </span>
                        <div className={`w-3 h-3 rounded-full ${efficiencyScore > 15 ? 'bg-green-500' : efficiencyScore > 10 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Wastage Rate</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${wastageRate < 5 ? 'text-green-600' : wastageRate < 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {wastageRate.toFixed(1)}%
                        </span>
                        <div className={`w-3 h-3 rounded-full ${wastageRate < 5 ? 'bg-green-500' : wastageRate < 10 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Number of Outlets</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-600">
                          {sheet.outletCount}
                        </span>
                        <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                      </div>
                    </div>
                    
                  </div>
                </div>
              );
            })}
        </div>
      </Card>
      )}

      {/* Top/Bottom Performers Analysis */}
      {performersData.clusterManagers.length > 0 && (
        <Card className="card-elevated p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground font-display">Performance Rankings</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top 3 Cluster Managers */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4 text-green-600">🏆 Top 3 Cluster Managers</h4>
              <div className="space-y-3">
                {performersData.clusterManagers.slice(0, 3).map((manager, index) => (
                  <Card key={manager.name} className="p-4 border-2 border-green-200 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h5 className="font-semibold text-foreground">{manager.name}</h5>
                          <p className="text-sm text-muted-foreground">{manager.outletCount} outlets</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">₹{Math.round(manager.revenue).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{manager.transactions} transactions</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Bottom 3 Cluster Managers */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4 text-red-600">📉 Bottom 3 Cluster Managers</h4>
              <div className="space-y-3">
                {performersData.clusterManagers.slice(-3).reverse().map((manager, index) => (
                  <Card key={manager.name} className="p-4 border-2 border-red-200 bg-red-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm">
                          {performersData.clusterManagers.length - 2 + index}
                        </div>
                        <div>
                          <h5 className="font-semibold text-foreground">{manager.name}</h5>
                          <p className="text-sm text-muted-foreground">{manager.outletCount} outlets</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">₹{Math.round(manager.revenue).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{manager.transactions} transactions</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Top 10 vs Bottom 10 Outlets Chart */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-foreground mb-4">Top 10 vs Bottom 10 Outlets Performance</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={[
                    ...performersData.outlets.slice(0, 10).map((outlet, index) => ({
                      name: `Top ${index + 1}`,
                      outlet: outlet.name,
                      revenue: outlet.revenue,
                      manager: outlet.manager,
                      type: 'Top'
                    })),
                    ...performersData.outlets.slice(-10).reverse().map((outlet, index) => ({
                      name: `Bottom ${index + 1}`,
                      outlet: outlet.name,
                      revenue: outlet.revenue,
                      manager: outlet.manager,
                      type: 'Bottom'
                    }))
                  ]} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
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
                    labelFormatter={(label, payload) => {
                      const data = payload?.[0]?.payload;
                      return data ? `${data.outlet} (${data.manager})` : label;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    fill={(entry: any) => entry.type === 'Top' ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'}
                    radius={[4, 4, 0, 0]}
                    name="Outlet Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 10 Outlets List */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-foreground mb-4 text-green-600">🏆 Top 10 Outlets</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performersData.outlets.slice(0, 10).map((outlet, index) => (
                <Card key={outlet.name} className="p-4 border-2 border-green-200 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground">{outlet.name}</h5>
                        <p className="text-sm text-muted-foreground">Manager: {outlet.manager}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">₹{Math.round(outlet.revenue).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{outlet.transactions} transactions</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Bottom 10 Outlets List */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-foreground mb-4 text-red-600">📉 Bottom 10 Outlets</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performersData.outlets.slice(-10).reverse().map((outlet, index) => (
                <Card key={outlet.name} className="p-4 border-2 border-red-200 bg-red-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm">
                        {performersData.outlets.length - 9 + index}
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground">{outlet.name}</h5>
                        <p className="text-sm text-muted-foreground">Manager: {outlet.manager}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">₹{Math.round(outlet.revenue).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{outlet.transactions} transactions</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Professional Insight Card */}
      <Card className="bg-gradient-primary text-white p-8 border-0 shadow-glow">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <GitCompare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3 font-display">
              {hasMultipleSheets ? 'Sheet Comparison Insights' : 'Sheet Analysis Insights'}
            </h3>
            <p className="text-white/90 text-base leading-relaxed">
              {hasMultipleSheets ? (
                `You have uploaded ${availableSheets.length} files for comparison analysis. Currently comparing all uploaded sheets to identify performance differences, trends, and optimization opportunities across your restaurant data.`
              ) : (
                'Upload multiple files to enable powerful comparison analysis. Compare financial metrics, operational performance, and identify trends across different time periods or data sources.'
              )}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
});

SimpleChartsSection.displayName = 'SimpleChartsSection';
