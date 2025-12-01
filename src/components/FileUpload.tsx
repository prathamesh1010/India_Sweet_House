import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
// Database integration removed - using client-side only processing

interface FileUploadProps {
  onFileUpload: (data: any[], filename: string) => void;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, className = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  // Backend API configuration
  const BACKEND_URL = 'http://localhost:5000';

  const processWithBackend = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}/process-file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Backend processing error:', error);
      throw error;
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const isValidType = validTypes.includes(file.type) || file.name.endsWith('.csv');
    const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
    
    if (!isValidType) {
      setError('Please upload a CSV or Excel file');
      return false;
    }
    if (!isValidSize) {
      setError('File size must be less than 10MB');
      return false;
    }
    return true;
  };

  const processFile = useCallback((file: File) => {
    if (!validateFile(file)) return;
    
    setIsProcessing(true);
    setError('');

    // Check if it's an Excel file and handle it differently
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      processExcelFile(file);
    } else {
      processCsvFile(file);
    }
  }, [onFileUpload]);

  const processExcelFile = useCallback(async (file: File) => {
    try {
      // Try backend processing first for Excel files
      const backendResult = await processWithBackend(file);
      if (backendResult.success) {
        setUploadedFiles(prev => [...prev, file.name]);
        onFileUpload(backendResult.data, file.name);
        setIsProcessing(false);
        
        // Show special message for multi-worksheet files
        if (backendResult.message && backendResult.message.includes('Outlet wise')) {
          console.log('Multi-worksheet file processed successfully:', backendResult.message);
        }
        return;
      } else {
        console.warn('Backend processing failed, falling back to frontend:', backendResult.error);
      }
    } catch (backendError) {
      console.warn('Backend not available, using frontend processing:', backendError);
    }

    // Fallback to original frontend processing
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            throw new Error('No data received from file');
          }
          
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
          
          const processedData = await processFinancialReport(rawData, file.name);
          
          if (processedData.length > 0) {
            setUploadedFiles(prev => [...prev, file.name]);
            onFileUpload(processedData, file.name);
            setIsProcessing(false);
          } else {
            setError('Could not extract meaningful data from the financial report. Please check the file format.');
            setIsProcessing(false);
          }
        } catch (err) {
          setError(`Error processing financial report: ${err.message}`);
          setIsProcessing(false);
        }
      };
      
      reader.onerror = () => {
        setError('Error reading Excel file.');
        setIsProcessing(false);
      };
      
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError(`Error processing Excel file: ${err.message}`);
      setIsProcessing(false);
    }
  }, [onFileUpload]);

  const processCsvFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().replace(/['"]/g, ''),
      transform: (value) => value.trim().replace(/['"]/g, ''),
      complete: async (results) => {
        try {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          
          // Validate required columns - check for both old and new formats
          const headers = Object.keys(results.data[0] || {});
          const requiredFields = [
            { name: 'Date/Month', options: ['Date', 'Month'] },
            { name: 'Product Name', options: ['Product Name', 'Item Name'] },
            { name: 'Category', options: ['Category'] },
            { name: 'Quantity', options: ['Quantity', 'Qty'] },
            { name: 'Total Amount', options: ['Total Amount (₹)', 'Total Sales'] }
          ];
          
          const missingFields = requiredFields.filter(field => 
            !field.options.some(option => headers.includes(option))
          );
          
          if (missingFields.length > 0) {
            setError(`Missing required columns: ${missingFields.map(f => f.name).join(', ')}`);
            setIsProcessing(false);
            return;
          }

          // Data processed locally - no database operations

          setUploadedFiles(prev => [...prev, file.name]);
          onFileUpload(results.data, file.name);
          setIsProcessing(false);
        } catch (err) {
          setError('Error processing file. Please check the format.');
          setIsProcessing(false);
        }
      },
      error: (error) => {
        setError(`Error parsing file: ${error.message}`);
        setIsProcessing(false);
      }
    });
  }, [onFileUpload]);

  const processFinancialReport = async (rawData: any[][], filename: string) => {
    try {
      // Check if this is an outlet-based financial report (like data5.xlsx)
      const firstRow = rawData[0];
      if (firstRow && firstRow.length > 5) {
        const hasOutletColumn = firstRow[0]?.toString().toLowerCase().includes('outlet');
        const hasOutletManagerColumn = firstRow[1]?.toString().toLowerCase().includes('outlet manager') || 
                                      firstRow[1]?.toString().toLowerCase().includes('manager');
        const hasFinancialMetrics = firstRow.some(cell => 
          cell?.toString().toLowerCase().includes('direct income') ||
          cell?.toString().toLowerCase().includes('total revenue') ||
          cell?.toString().toLowerCase().includes('cogs') ||
          cell?.toString().toLowerCase().includes('ebitda') ||
          cell?.toString().toLowerCase().includes('pbt')
        );

        if (hasOutletColumn && hasOutletManagerColumn && hasFinancialMetrics) {
          return processOutletBasedReport(rawData, filename);
        }
      }

      // Fallback to original cashier-based processing
      return processCashierBasedReport(rawData, filename);
    } catch (error) {
      throw error;
    }
  };

  const processOutletBasedReport = async (rawData: any[][], filename: string) => {
    try {
      const processedData: any[] = [];
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Skip header row and process data rows
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length < 5) continue;
        
        const outletName = row[0]?.toString().trim();
        const outletManager = row[1]?.toString().trim();
        const month = row[2]?.toString().trim();
        
        if (!outletName || outletName === '' || outletName === 'NaN') continue;
        
        // Create a single record per outlet with all financial metrics as columns
        const outletRecord = {
          // Core outlet information
          'Outlet': outletName,
          'Outlet Manager': outletManager,
          'Month': month || currentDate,
          
          // Financial metrics as separate columns
          'Direct Income': parseFloat(row[3]) || 0,
          'TOTAL REVENUE': parseFloat(row[4]) || 0,
          'COGS': parseFloat(row[5]) || 0,
          'Outlet Expenses': parseFloat(row[6]) || 0,
          'EBIDTA': parseFloat(row[7]) || 0,
          'Finance Cost': parseFloat(row[8]) || 0,
          'PBT': parseFloat(row[9]) || 0,
          'WASTAGE': parseFloat(row[10]) || 0,
          
          // Additional fields for compatibility with existing analytics
          Date: currentDate,
          'Product Name': 'Outlet Summary',
          Category: 'Financial Summary',
          Branch: outletName,
          Cashier: outletManager,
          'Customer Type': 'Summary Data',
          'Payment Mode': 'N/A',
          'Total Amount (₹)': parseFloat(row[4]) || 0, // Use TOTAL REVENUE as main amount
          Quantity: 1,
          'Unit Price (₹)': parseFloat(row[4]) || 0,
          'Discount (%)': 0,
          'GST (%)': 0,
          'Gross Amount': parseFloat(row[4]) || 0,
          PBT: parseFloat(row[9]) || 0,
          EBITDA: parseFloat(row[7]) || 0,
          'Upload Filename': filename,
          'Metric Type': 'Outlet Summary',
          'Percentage': 0,
          Month: month || currentDate,
          'Item Name': 'Outlet Summary',
          'Store Name': outletName,
          'Cluster Manager': outletManager,
          'Sales Type': 'Summary Data',
          'Payment Type': 'N/A',
          'Total Sales': parseFloat(row[4]) || 0,
          Qty: 1,
          // Additional outlet-specific data
          'Outlet Name': outletName,
          'Outlet Manager': outletManager
        };
        
        processedData.push(outletRecord);
      }

      return processedData;
    } catch (error) {
      throw error;
    }
  };

  const processCashierBasedReport = async (rawData: any[][], filename: string) => {
    try {
      // Find the header row (contains cashier names)
      let headerRowIndex = -1;
      let cashierNames: string[] = [];
      
      // Look for the row with cashier names (usually row 0 or 1)
      for (let i = 0; i < Math.min(3, rawData.length); i++) {
        const row = rawData[i];
        if (row && row.length > 5) {
          // Look for cashier names in the row
          const potentialCashiers = row.filter((cell, index) => 
            index > 2 && // Skip first few columns
            cell && 
            typeof cell === 'string' && 
            cell.trim() !== '' && 
            !cell.includes('Unnamed') &&
            !cell.includes('Consolidated') &&
            !cell.includes('Particulars') &&
            !cell.includes('Rs.') &&
            !cell.includes('%') &&
            !cell.includes('July') &&
            !cell.includes('NaN') &&
            !cell.includes('nan') &&
            !cell.includes('0.1') &&
            cell.trim().length > 2
          );
          
          if (potentialCashiers.length >= 3) { // At least 3 cashiers
            headerRowIndex = i;
            cashierNames = potentialCashiers;
            break;
          }
        }
      }

      if (headerRowIndex === -1 || cashierNames.length === 0) {
        // Fallback: try to extract from the first row
        const firstRow = rawData[0];
        if (firstRow && firstRow.length > 5) {
          cashierNames = firstRow.filter((cell, index) => 
            index > 2 && // Skip first few columns
            cell && 
            typeof cell === 'string' && 
            cell.trim() !== '' && 
            !cell.includes('Unnamed') &&
            !cell.includes('Consolidated') &&
            !cell.includes('Particulars') &&
            !cell.includes('Rs.') &&
            !cell.includes('%') &&
            !cell.includes('July') &&
            !cell.includes('NaN') &&
            !cell.includes('nan') &&
            !cell.includes('0.1') &&
            cell.trim().length > 2
          );
          headerRowIndex = 0;
        }
      }

      if (cashierNames.length === 0) {
        throw new Error('Could not identify cashier names in the financial report');
      }

      // Find the data rows (financial metrics)
      const processedData: any[] = [];
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Start from row 2 or 3 to skip headers
      const startRow = Math.max(2, headerRowIndex + 1);
      
      for (let i = startRow; i < Math.min(rawData.length, 50); i++) { // Limit to first 50 rows for testing
        const row = rawData[i];
        if (!row || row.length < 3) continue;
        
        const metricName = row[0];
        if (!metricName || typeof metricName !== 'string' || metricName.trim() === '') continue;
        
        // Skip empty rows and section headers
        if (metricName.includes('NaN') || metricName.includes('nan') || metricName.trim() === '' || metricName === null) continue;
        
        // Process each cashier's data
        // Cashier names are at positions 4, 7, 10, 13, 16, etc. (every 3rd position starting from index 4)
        let cashierIndex = 0;
        for (let colIndex = 4; colIndex < row.length && cashierIndex < cashierNames.length; colIndex += 3) {
          const cashierName = cashierNames[cashierIndex];
          const amount = parseFloat(row[colIndex]) || 0;
          const percentage = parseFloat(row[colIndex + 1]) || 0;
          
          if (amount > 0) { // Only include rows with actual data
            processedData.push({
              Date: currentDate,
              'Product Name': metricName.trim(),
              Category: 'Financial Metric',
              Branch: 'All Outlets',
              Cashier: cashierName,
              'Customer Type': 'Summary Data',
              'Payment Mode': 'N/A',
              'Total Amount (₹)': amount,
              Quantity: 1,
              'Unit Price (₹)': amount,
              'Discount (%)': 0,
              'GST (%)': 0,
              'Gross Amount': amount,
              PBT: amount * 0.1, // Estimate 10% PBT
              EBITDA: amount * 0.15, // Estimate 15% EBITDA
              'Upload Filename': filename,
              'Metric Type': 'Financial Summary',
              'Percentage': percentage,
              // Add the expected column names for compatibility
              Month: currentDate,
              'Item Name': metricName.trim(),
              'Store Name': 'All Outlets',
              'Cluster Manager': cashierName,
              'Sales Type': 'Summary Data',
              'Payment Type': 'N/A',
              'Total Sales': amount,
              Qty: 1
            });
          }
          cashierIndex++;
        }
      }

      return processedData;
    } catch (error) {
      throw error;
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(processFile);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(processFile);
  }, [processFile]);

  const removeFile = (filename: string) => {
    setUploadedFiles(prev => prev.filter(f => f !== filename));
  };

  return (
    <Card className={`card-professional ${className}`}>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-primary rounded-lg">
            <Upload className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground font-display">Upload Data</h3>
            <p className="text-xs text-muted-foreground">
              CSV or Excel files
            </p>
          </div>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300 ${
            isDragOver 
              ? 'border-primary bg-primary/5 shadow-glow' 
              : 'border-border hover:border-primary/50 hover:bg-primary/5'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className={`p-2 rounded-lg transition-colors ${
                isDragOver ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
              }`}>
                <Upload className="h-5 w-5" />
              </div>
            </div>
            
            <div>
              <p className="text-xs font-medium text-foreground">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                CSV/Excel files up to 10MB
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            Processing file...
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-foreground">Uploaded:</h4>
              <span className="text-xs text-muted-foreground">
                {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
              </span>
            </div>
            {uploadedFiles.map((filename, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-success/10 border border-success/20 rounded-md">
                <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-foreground font-medium block truncate">{filename}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(filename)}
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {uploadedFiles.length >= 2 && (
              <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Multiple files uploaded!</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use the analytics tabs to analyze your uploaded data
                </p>
              </div>
            )}
            
            {uploadedFiles.some(filename => filename.includes('Outlet PL')) && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Multi-worksheet file processed!</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Successfully processed "Outlet wise" worksheet with outlet data
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};