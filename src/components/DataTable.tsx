import React, { useState, useMemo, useCallback, memo } from 'react';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, ArrowUpDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { useStoreContext } from '../contexts/StoreContext';

interface DataTableProps {
  data: any[];
  dataByFile?: Record<string, any[]>;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

// Memoized table row component for better performance
const TableRow = memo(({ row, displayColumns, index }: { row: any; displayColumns: string[]; index: number }) => (
  <tr className="hover:bg-sweet-cream/50 transition-colors border-b border-gold/20">
    {displayColumns.map(column => (
      <td key={column} className="px-4 py-3 text-sm text-foreground" style={{ minWidth: '150px', width: '150px' }}>
        {(column.includes('₹') || ['Gross Amount', 'PBT', 'EBITDA', 'Total Amount (₹)', 'Direct Income', 'TOTAL REVENUE', 'COGS', 'Outlet Expenses', 'EBIDTA', 'Finance Cost', 'WASTAGE'].includes(column)) && row[column] 
          ? <span className="text-sweet-green font-semibold">₹{parseFloat(row[column]).toFixed(2)}</span>
          : column === 'Percentage' && row[column]
            ? <span className="text-sweet-orange font-semibold">{parseFloat(row[column]).toFixed(2)}%</span>
            : column === 'Cluster Manager' 
              ? <span className="text-sweet-brown">{row['Cluster Manager'] || row['Cashier'] || row['Cashier Name'] || '-'}</span>
              : column === 'Outlet'
                ? <span className="text-sweet-purple font-medium">{row['Outlet'] || row['Outlet Name'] || row['Branch'] || row['Store Name'] || '-'}</span>
                : column === 'Outlet Manager'
                  ? <span className="text-amber-600">{row['Outlet Manager'] || row['Cluster Manager'] || row['Cashier'] || '-'}</span>
                  : <span className="text-foreground">{row[column] || '-'}</span>
        }
      </td>
    ))}
  </tr>
));

TableRow.displayName = 'TableRow';

export const DataTable: React.FC<DataTableProps> = memo(({ data, dataByFile = {}, className = '' }) => {
  const { getCategories, getStoresByCategory } = useStoreContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [clusterFilter, setClusterFilter] = useState('all');
  const [metricFilter, setMetricFilter] = useState('all');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Get available files for selection
  const availableFiles = Object.keys(dataByFile);
  const hasMultipleFiles = availableFiles.length > 1;

  // Determine which data to use based on file selection
  const sourceData = useMemo(() => {
    if (selectedFiles.length > 0) {
      // Use data from selected files only
      return selectedFiles.flatMap(filename => dataByFile[filename] || []);
    }
    return data; // Use all data when no files selected
  }, [data, dataByFile, selectedFiles]);

  // Use performance optimization hook
  const { limitedData, applyFilters, applySorting, debouncedSearch } = usePerformanceOptimization(sourceData, {
    maxRecords: 2000,
    enableVirtualization: true
  });

  // File selection helper
  const handleFileSelection = useCallback((filename: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles(prev => [...prev, filename]);
    } else {
      setSelectedFiles(prev => prev.filter(f => f !== filename));
    }
  }, []);

  // Get unique branches, categories, and cashiers for filters - using limited data
  const branches = useMemo(() => {
    const uniqueBranches = [...new Set(limitedData.map(item => 
      item['Outlet'] || item['Outlet Name'] || item.Branch || item['Store Name']
    ).filter(Boolean))];
    console.log('DataTable - Found branches/outlets:', uniqueBranches);
    console.log('DataTable - Sample data item:', limitedData[0]);
    return uniqueBranches;
  }, [limitedData]);
  
  const categories = useMemo(() => {
    // Use store categories from context instead of data categories
    return getCategories();
  }, [getCategories]);

  const clusters = useMemo(() => {
    const uniqueClusters = [...new Set(limitedData.map(item => 
      item['Outlet Manager'] || item['Cluster Manager'] || item.Cashier || item['Cashier Name']
    ).filter(Boolean))];
    return uniqueClusters;
  }, [limitedData]);

  const metrics = useMemo(() => {
    const uniqueMetrics = [...new Set(limitedData.map(item => item['Product Name']).filter(Boolean))];
    return uniqueMetrics;
  }, [limitedData]);

  // Apply filters and sorting - using optimized functions
  const filteredAndSortedData = useMemo(() => {
    try {
      if (!limitedData || limitedData.length === 0) return [];
      
      console.log('DataTable - Current filters:', { branchFilter, categoryFilter, clusterFilter, metricFilter });
      console.log('DataTable - Limited data length:', limitedData.length);
      
      // Apply search filter - include outlet-specific fields
      let filtered = debouncedSearch(searchTerm, limitedData, [
        'Product Name', 'Branch', 'Category', 'Cluster Manager', 'Cashier', 'Cashier Name', 'Customer Type', 'Payment Mode',
        'Outlet', 'Outlet Name', 'Outlet Manager', 'Store Name', 'Month'
      ]);
      
      console.log('DataTable - After search filter:', filtered.length);
      
      // Apply other filters - handle both outlet and transaction data
      const filters = {
        Branch: branchFilter,
        'Cluster Manager': clusterFilter,
        'Product Name': metricFilter,
        amountRange: [amountRange.min, amountRange.max]
      };
      
      console.log('DataTable - Applying filters:', filters);
      filtered = applyFilters(filtered, filters);
      console.log('DataTable - After applyFilters:', filtered.length);
      
      // Apply store category filter - check if the outlet belongs to the selected category
      if (categoryFilter !== 'all') {
        const storesInCategory = getStoresByCategory(categoryFilter);
        filtered = filtered.filter(item => {
          const outlet = item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'];
          const outletInCategory = storesInCategory.some(store => store.Outlet === outlet);
          return outletInCategory;
        });
        console.log('DataTable - After category filter:', filtered.length);
      }
      
      // Apply sorting
      filtered = applySorting(filtered, sortField, sortDirection);

      return filtered;
    } catch (error) {
      console.error('Error processing table data:', error);
      return [];
    }
  }, [limitedData, searchTerm, branchFilter, categoryFilter, clusterFilter, metricFilter, amountRange, sortField, sortDirection, debouncedSearch, applyFilters, applySorting, getStoresByCategory]);

  // Pagination (only for non-virtualized view)
  const itemsPerPage = 50;
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') {
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const exportToCsv = useCallback(() => {
    try {
      if (!filteredAndSortedData || filteredAndSortedData.length === 0) return;
      
      const headers = Object.keys(filteredAndSortedData[0]);
      const csvContent = [
        headers.join(','),
        ...filteredAndSortedData.map(row => 
          headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'restaurant_sales_data.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  }, [filteredAndSortedData]);

  if (!data || data.length === 0) {
    return (
      <Card className={`p-8 text-center bg-gradient-card border-border/50 ${className}`}>
        <h3 className="text-lg font-semibold text-foreground mb-2">Data Table</h3>
        <p className="text-muted-foreground">
          Your detailed sales data will appear here once you upload files
        </p>
      </Card>
    );
  }

  // Determine display columns based on data type
  const displayColumns = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Check if this is outlet-based data (has Outlet column)
    const hasOutletData = data.some(item => item['Outlet']);
    
    if (hasOutletData) {
      // For outlet-based data, show the original Excel structure with all financial metrics as columns
      return [
        'Outlet', 'Outlet Manager', 'Month', 'Direct Income', 'TOTAL REVENUE', 
        'COGS', 'Outlet Expenses', 'EBIDTA', 'Finance Cost', 'PBT', 'WASTAGE'
      ];
    } else {
      // For transaction-based data, show the original columns
      return [
        'Date', 'Product Name', 'Branch', 'Category', 'Cluster Manager', 'Quantity', 
        'Customer Type', 'Payment Mode', 'Gross Amount', 'PBT', 'EBITDA', 'Percentage'
      ];
    }
  }, [data]);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="p-6 bg-gradient-card border-border/50 shadow-soft">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Detailed Sales Data</h2>
            <Button 
              onClick={exportToCsv}
              variant="outline"
              size="sm"
              className="bg-background hover:bg-muted"
              disabled={filteredAndSortedData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          
          {/* File Selection Filter */}
          {hasMultipleFiles && (
            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Label className="text-sm font-medium">Select Files to Display:</Label>
                <span className="text-xs text-muted-foreground">
                  {selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} selected` : 'All files'}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableFiles.map(filename => (
                  <div key={filename} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      id={`file-${filename}`}
                      checked={selectedFiles.includes(filename)}
                      onChange={(e) => handleFileSelection(filename, e.target.checked)}
                      className="rounded border-border"
                    />
                    <label htmlFor={`file-${filename}`} className="flex-1 cursor-pointer text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate" title={filename}>
                          {filename.split('.')[0]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({dataByFile[filename]?.length || 0} records)
                        </span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search all fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-background border-border">
                <SelectValue placeholder={data.some(item => item['Outlet']) ? "Outlet" : "Branch"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{data.some(item => item['Outlet']) ? "All Outlets" : "All Branches"}</SelectItem>
                {branches.map(branch => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-background border-border">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={clusterFilter} onValueChange={setClusterFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-background border-border">
                <SelectValue placeholder={data.some(item => item['Outlet Manager']) ? "Outlet Manager" : "Cluster Manager"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{data.some(item => item['Outlet Manager']) ? "All Managers" : "All Clusters"}</SelectItem>
                {clusters.map(cluster => (
                  <SelectItem key={cluster} value={cluster}>{cluster}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={metricFilter} onValueChange={setMetricFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-background border-border">
                <SelectValue placeholder="Financial Metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Metrics</SelectItem>
                {metrics.map(metric => (
                  <SelectItem key={metric} value={metric}>{metric}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Range Filter */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="min-amount" className="text-sm font-medium">Amount Range:</Label>
              <Input
                id="min-amount"
                type="number"
                placeholder="Min"
                value={amountRange.min}
                onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                className="w-24 bg-background border-border"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={amountRange.max}
                onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                className="w-24 bg-background border-border"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setBranchFilter('all');
                setCategoryFilter('all');
                setClusterFilter('all');
                setMetricFilter('all');
                setAmountRange({ min: '', max: '' });
              }}
              className="bg-background border-border"
            >
              Clear Filters
            </Button>
          </div>
          
          {/* Results info */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {paginatedData.length} of {filteredAndSortedData.length} restaurant sales records
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-border/50 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: `${displayColumns.length * 150}px` }}>
            <thead className="bg-gradient-sweets border-b border-gold/30">
              <tr>
                {displayColumns.map(column => (
                  <th 
                    key={column}
                    className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-gold/20 transition-colors"
                    style={{ minWidth: '150px', width: '150px' }}
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center gap-1">
                      {column}
                      <ArrowUpDown className="h-3 w-3" />
                      {sortField === column && (
                        <span className="text-gold-light">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {paginatedData.map((row, index) => (
                <TableRow 
                  key={`${row.id || index}-${currentPage}`} 
                  row={row} 
                  displayColumns={displayColumns} 
                  index={index} 
                />
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-muted/20 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-background hover:bg-muted"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="bg-background hover:bg-muted"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
});

DataTable.displayName = 'DataTable';