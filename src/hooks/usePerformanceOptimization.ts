import { useMemo, useCallback } from 'react';

interface PerformanceConfig {
  maxRecords?: number;
  enableVirtualization?: boolean;
  debounceMs?: number;
}

export const usePerformanceOptimization = (data: any[], config: PerformanceConfig = {}) => {
  const {
    maxRecords = 1000,
    enableVirtualization = true,
    debounceMs = 300
  } = config;

  // Limit data processing to prevent performance issues
  const limitedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.slice(0, maxRecords);
  }, [data, maxRecords]);

  // Memoized data processing functions
  const processData = useCallback((processor: (data: any[]) => any) => {
    return processor(limitedData);
  }, [limitedData]);

  // Debounced search function
  const debouncedSearch = useCallback((searchTerm: string, data: any[], searchFields: string[]) => {
    if (!searchTerm) return data;
    
    return data.filter(item => 
      searchFields.some(field => 
        String(item[field] || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, []);

  // Optimized filtering
  const applyFilters = useCallback((
    data: any[],
    filters: Record<string, any>
  ) => {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === 'all' || value === null || value === undefined) return true;
        
        if (key === 'amountRange') {
          const [min, max] = value;
          const itemValue = parseFloat(item['Total Amount (₹)']) || 0;
          return (!min || itemValue >= parseFloat(min)) && (!max || itemValue <= parseFloat(max));
        }
        
        if (key === 'Cluster Manager') {
          return (item['Cluster Manager'] || item.Cashier || item['Cashier Name']) === value;
        }
        
        // Handle outlet-specific fields
        if (key === 'Branch') {
          const outlet = item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'];
          return outlet === value;
        }
        
        if (key === 'Outlet') {
          const outlet = item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'];
          return outlet === value;
        }
        
        if (key === 'Outlet Name') {
          const outlet = item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'];
          return outlet === value;
        }
        
        if (key === 'Outlet Manager') {
          const manager = item['Outlet Manager'] || item['Cluster Manager'] || item['Cashier'] || item['Cashier Name'];
          return manager === value;
        }
        
        return item[key] === value;
      });
    });
  }, []);

  // Optimized sorting
  const applySorting = useCallback((
    data: any[],
    sortField: string | null,
    sortDirection: 'asc' | 'desc' | null
  ) => {
    if (!sortField || !sortDirection) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      // Handle numeric fields
      if (['Quantity', 'Unit Price (₹)', 'Total Amount (₹)', 'Discount (%)', 'GST (%)'].includes(sortField)) {
        const aNum = parseFloat(aValue) || 0;
        const bNum = parseFloat(bValue) || 0;
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // Handle string fields
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  }, []);

  return {
    limitedData,
    processData,
    debouncedSearch,
    applyFilters,
    applySorting,
    config: {
      maxRecords,
      enableVirtualization,
      debounceMs
    }
  };
};
