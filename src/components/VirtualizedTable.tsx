import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';

interface VirtualizedTableProps {
  data: any[];
  columns: string[];
  height?: number;
  itemHeight?: number;
  className?: string;
}

const TableRow = memo(({ item, columns, index }: { item: any; columns: string[]; index: number }) => {
  return (
    <div className="flex border-b border-border hover:bg-muted/30 transition-colors" style={{ minWidth: `${columns.length * 150}px` }}>
      {columns.map((column, colIndex) => (
        <div
          key={colIndex}
          className="px-4 py-3 text-sm text-foreground"
          style={{ minWidth: '150px', width: '150px' }}
        >
          {(column.includes('₹') || ['Gross Amount', 'PBT', 'EBITDA', 'Total Amount (₹)', 'Direct Income', 'TOTAL REVENUE', 'COGS', 'Outlet Expenses', 'EBIDTA', 'Finance Cost', 'WASTAGE'].includes(column)) && item[column] 
            ? `₹${parseFloat(item[column]).toFixed(2)}`
            : column === 'Percentage' && item[column]
              ? `${parseFloat(item[column]).toFixed(2)}%`
              : column === 'Cluster Manager' 
                ? item['Cluster Manager'] || item['Cashier'] || item['Cashier Name'] || '-'
                : column === 'Outlet'
                  ? item['Outlet'] || item['Outlet Name'] || item['Branch'] || item['Store Name'] || '-'
                  : column === 'Outlet Manager'
                    ? item['Outlet Manager'] || item['Cluster Manager'] || item['Cashier'] || '-'
                    : item[column] || '-'
          }
        </div>
      ))}
    </div>
  );
});

TableRow.displayName = 'TableRow';

export const VirtualizedTable: React.FC<VirtualizedTableProps> = memo(({ 
  data, 
  columns, 
  height = 400, 
  itemHeight = 50,
  className = '' 
}) => {
  const [visibleItems, setVisibleItems] = useState<any[]>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerHeight, setContainerHeight] = useState(height);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  const itemsPerPage = Math.ceil(containerHeight / itemHeight) + 2; // Buffer for smooth scrolling
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + itemsPerPage, data.length);

  useEffect(() => {
    setVisibleItems(data.slice(startIndex, endIndex));
  }, [data, startIndex, endIndex]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
    
    // Sync header scroll with body scroll
    if (headerRef.current) {
      headerRef.current.scrollLeft = target.scrollLeft;
    }
  }, []);

  const handleHeaderScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollLeft(target.scrollLeft);
    
    // Sync body scroll with header scroll
    if (bodyRef.current) {
      bodyRef.current.scrollLeft = target.scrollLeft;
    }
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        No data available
      </div>
    );
  }

  const totalHeight = data.length * itemHeight;

  return (
    <div className={`border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div 
        ref={headerRef}
        className="overflow-x-auto overflow-y-hidden bg-muted/30 border-b border-border"
        onScroll={handleHeaderScroll}
      >
        <div className="flex" style={{ minWidth: `${columns.length * 150}px` }}>
          {columns.map((column, index) => (
            <div
              key={index}
              className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              style={{ minWidth: '150px', width: '150px' }}
            >
              {column}
            </div>
          ))}
        </div>
      </div>
      
      {/* Virtualized Body */}
      <div 
        ref={bodyRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
            {visibleItems.map((item, index) => (
              <TableRow
                key={startIndex + index}
                item={item}
                columns={columns}
                index={startIndex + index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

VirtualizedTable.displayName = 'VirtualizedTable';
