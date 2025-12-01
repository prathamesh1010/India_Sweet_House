import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onFileUpload: (data: any[], filename: string) => void;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, className = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Helper to normalize strings (remove NBSP, zero-width chars, collapse whitespace)
  const normStr = (x: any): string => {
    if (x === null || x === undefined || x === '') return '';
    let s = String(x);
    s = s.replace(/\xa0/g, ' ').replace(/\u200b/g, '').replace(/\u200c/g, '').replace(/\u200d/g, '');
    s = s.replace(/\s+/g, ' ');
    return s.trim();
  };

  const normUpper = (x: any): string => normStr(x).toUpperCase();

  const cleanNumber = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    let str = val.toString().trim();
    if (str.startsWith('(') && str.endsWith(')')) {
      str = '-' + str.slice(1, -1);
    }
    str = str.replace(/[^0-9.-]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const processWithBackend = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('[Backend] Attempting to connect to:', BACKEND_URL);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${BACKEND_URL}/process-file`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const result = await response.json();
      console.log('[Backend] Success, records:', result.data?.length || 0);
      return result;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[Backend] Timeout - falling back to frontend');
      } else {
        console.log('[Backend] Error:', error.message, '- using frontend fallback');
      }
      throw error;
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const isValidType = validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isValidSize = file.size <= 10 * 1024 * 1024;
    
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
    console.log('[FileUpload] Processing file:', file.name);
    if (!validateFile(file)) return;
    
    setIsProcessing(true);
    setError('');

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      processExcelFile(file);
    } else {
      processCsvFile(file);
    }
  }, [onFileUpload]);

  const processExcelFile = useCallback(async (file: File) => {
    console.log('[Excel] ========== STARTING EXCEL FILE PROCESSING ==========');
    console.log('[Excel] File name:', file.name);
    console.log('[Excel] File size:', file.size, 'bytes');
    
    try {
      // Try backend first
      try {
        const backendResult = await processWithBackend(file);
        if (backendResult.success) {
          console.log('[Excel] ✓ Backend processed successfully');
          setUploadedFiles(prev => [...prev, file.name]);
          onFileUpload(backendResult.data, file.name);
          setIsProcessing(false);
          return;
        }
      } catch (backendError) {
        console.log('[Excel] Backend unavailable, using frontend processing');
      }

      console.log('[Excel] Starting frontend fallback processing...');
      
      // Frontend fallback with complete implementation
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          console.log('[Excel] FileReader.onload triggered');
          const data = e.target?.result;
          if (!data) {
            console.error('[Excel] No data received from FileReader');
            throw new Error('No data received');
          }
          
          console.log('[Excel] Data received, size:', (data as ArrayBuffer).byteLength, 'bytes');
          console.log('[Excel] Reading workbook with XLSX.read...');
          const workbook = XLSX.read(data, { type: 'array' });
          console.log('[Excel] ✓ Workbook parsed successfully');
          console.log('[Excel] Sheets found:', workbook.SheetNames.join(', '));
          
          // Check for "Outlet wise" sheet
          let sheetName = workbook.SheetNames.find(name => 
            normUpper(name).includes('OUTLET') && normUpper(name).includes('WISE')
          );
          
          if (!sheetName) {
            sheetName = workbook.SheetNames[0];
            console.log('[Excel] Using first sheet:', sheetName);
          } else {
            console.log('[Excel] Found "Outlet wise" sheet:', sheetName);
          }
          
          const worksheet = workbook.Sheets[sheetName];
          
          console.log('[Excel] Converting sheet to JSON with header:1, raw:false...');
          const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: null,
            raw: false
          });
          
          console.log('[Excel] Extracted', rawData.length, 'rows');
          console.log('[Excel] First row sample:', rawData[0]?.slice(0, 10));
          console.log('[Excel] Second row sample:', rawData[1]?.slice(0, 10));
          console.log('[Excel] Third row sample:', rawData[2]?.slice(0, 10));
          
          console.log('[Excel] Calling processOutletWiseData...');
          const processedData = await processOutletWiseData(rawData, file.name);
          console.log('[Excel] processOutletWiseData returned:', processedData.length, 'records');
          
          if (processedData.length > 0) {
            console.log('[Excel] ✓✓✓ SUCCESS! Processed', processedData.length, 'records');
            console.log('[Excel] Sample record:', processedData[0]);
            setUploadedFiles(prev => [...prev, file.name]);
            onFileUpload(processedData, file.name);
            setIsProcessing(false);
            alert(`✓ Successfully processed ${processedData.length} records from ${file.name}`);
          } else {
            const errorMsg = 'Could not extract data from Excel file. Check console (F12) for details. File might not be in the expected "Outlet wise" format with PARTICULARS column and Month-% pairs.';
            console.error('[Excel] ✗✗✗ FAILED: Processing returned no data');
            setError(errorMsg);
            setIsProcessing(false);
            alert('✗ Failed to process file. Check browser console (F12) for details.');
          }
        } catch (err: any) {
          console.error('[Excel] Processing error:', err);
          setError(`Error processing Excel: ${err.message}`);
          setIsProcessing(false);
        }
      };
      
      reader.onerror = () => {
        setError('Error reading Excel file');
        setIsProcessing(false);
      };
      
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      setIsProcessing(false);
    }
  }, [onFileUpload]);

  // Complete frontend implementation matching Python backend
  const processOutletWiseData = async (rawData: any[][], filename: string): Promise<any[]> => {
    console.log('[Process] Starting outlet-wise processing');
    console.log('[Process] Raw data rows:', rawData.length);
    console.log('[Process] First 3 rows:', rawData.slice(0, 3));
    
    // Step 1: Detect header row (where "PARTICULARS" is located)
    const { hdrRow, partCol } = detectHeader(rawData);
    console.log(`[Process] Header at row=${hdrRow}, particulars_col=${partCol}`);
    
    if (hdrRow === -1) {
      console.error('[Process] Could not detect header row');
      console.error('[Process] Dumping first 10 rows for debugging:');
      rawData.slice(0, 10).forEach((row, i) => {
        console.log(`Row ${i}:`, row?.slice(0, 10));
      });
      return [];
    }
    
    const outletRow = Math.max(hdrRow - 1, 0);
    const managerRow = Math.max(hdrRow - 3, 0);
    
    // Step 2: Build column-indexed data starting from header row
    const headerRowData = rawData[hdrRow] || [];
    const dataRows = rawData.slice(hdrRow + 1);
    
    // Required metrics to extract
    const requiredMetrics = [
      "Direct Income", "TOTAL REVENUE", "COGS", "Outlet Expenses",
      "EBIDTA", "Finance Cost", "PBT", "WASTAGE",
      "01-Bank Charges", "02-Interest on Borrowings", 
      "03-Interest on Vehicle Loan", "04-MG"
    ];
    
    // Step 3: Filter rows to only required metrics - use flexible matching
    const metricsData: Array<{particular: string, values: any[]}> = [];
    for (const row of dataRows) {
      const particular = normStr(row[partCol]);
      const particularUpper = normUpper(particular);
      
      // Check if this row contains any required metric (flexible matching)
      const matchesMetric = requiredMetrics.some(m => {
        const metricUpper = normUpper(m);
        return particularUpper.includes(metricUpper) || 
               metricUpper.includes(particularUpper) ||
               particularUpper === metricUpper;
      });
      
      if (matchesMetric && particular.length > 0) {
        console.log('[Process] Matched metric:', particular);
        metricsData.push({ particular, values: row });
      }
    }
    
    console.log('[Process] Total metrics matched:', metricsData.length);
    
    if (metricsData.length === 0) {
      console.error('[Process] No required metrics found in data');
      console.error('[Process] Available particulars (first 30):');
      const availableParticulars = dataRows.slice(0, 30).map(r => normStr(r[partCol])).filter(p => p);
      console.error(availableParticulars);
      console.error('[Process] Required metrics are:', requiredMetrics);
      return [];
    }
    
    console.log('[Process] Found', metricsData.length, 'metric rows');
    
    // Step 4: Detect Month-% column pairs
    console.log('[Process] Step 4: Detecting Month-% column pairs...');
    console.log('[Process] Header row length:', headerRowData.length);
    console.log('[Process] Scanning from column', partCol + 1, 'to', headerRowData.length - 1);
    
    const monthPattern = /^[A-Za-z]+-\d{2}(?:\.\d+)?$/;
    const pctPattern = /^%(?:\.\d+)?$/;
    const outletBlocks: Array<{valIdx: number, monthCol: string, pctCol: string}> = [];
    
    for (let i = partCol + 1; i < headerRowData.length - 1; i++) {
      const colName = normStr(headerRowData[i]);
      const nextName = normStr(headerRowData[i + 1]);
      
      console.log(`[Process] Col ${i}: "${colName}" | Col ${i+1}: "${nextName}"`);
      
      if (monthPattern.test(colName) && (nextName === '%' || pctPattern.test(nextName))) {
        console.log(`[Process] ✓ MATCHED Month-% pair at column ${i}: "${colName}" + "${nextName}"`);
        outletBlocks.push({
          valIdx: i,
          monthCol: colName,
          pctCol: nextName
        });
      }
    }
    
    if (outletBlocks.length === 0) {
      console.error('[Process] No Month-% pairs detected');
      console.error('[Process] Header row content:', headerRowData);
      console.error('[Process] Columns after particulars (first 20):', headerRowData.slice(partCol, partCol + 20));
      console.error('[Process] Looking for patterns like: "June-25" followed by "%"');
      return [];
    }
    
    console.log('[Process] Detected', outletBlocks.length, 'outlet blocks');
    
    // Step 5: Extract outlet/manager names and build final data
    const finalRows: any[] = [];
    const currentDate = new Date().toISOString().split('T')[0];
    
    for (const block of outletBlocks) {
      const outletName = getName(rawData, outletRow, block.valIdx);
      const managerName = getName(rawData, managerRow, block.valIdx);
      
      // Skip consolidated summary columns
      if (normUpper(outletName).includes('CONSOLIDATED') || normUpper(outletName).includes('SUMMARY')) {
        continue;
      }
      
      const monthLabel = block.monthCol;
      const month = monthLabel.includes('-') ? monthLabel.split('-')[0] : monthLabel;
      
      const row: any = {
        'Outlet': outletName || `Outlet ${block.valIdx}`,
        'Outlet Manager': managerName || `Manager ${block.valIdx}`,
        'Month': month,
        'Date': currentDate,
        'Upload Filename': filename
      };
      
      // Extract all metric values
      for (const metric of metricsData) {
        const value = metric.values[block.valIdx];
        row[metric.particular] = cleanNumber(value);
      }
      
      // Add standard fields for compatibility
      row['Product Name'] = `Financial Data - ${month}`;
      row['Category'] = 'Financial Report';
      row['Branch'] = row['Outlet'];
      row['Cashier'] = row['Outlet Manager'];
      row['Total Amount (₹)'] = row['TOTAL REVENUE'] || 0;
      row['Quantity'] = 1;
      
      finalRows.push(row);
    }
    
    console.log('[Process] Final output:', finalRows.length, 'records');
    return finalRows;
  };

  const detectHeader = (rawData: any[][]): {hdrRow: number, partCol: number} => {
    // A) Look for exact "PARTICULARS"
    for (let i = 0; i < Math.min(50, rawData.length); i++) {
      const row = rawData[i] || [];
      for (let j = 0; j < Math.min(20, row.length); j++) {
        if (normUpper(row[j]) === 'PARTICULARS') {
          return { hdrRow: i, partCol: j };
        }
      }
    }
    
    // B) Look for substring "PARTICULARS"
    for (let i = 0; i < Math.min(50, rawData.length); i++) {
      const row = rawData[i] || [];
      for (let j = 0; j < Math.min(20, row.length); j++) {
        const val = normUpper(row[j]);
        if (val.includes('PARTICULAR')) {
          return { hdrRow: i, partCol: j };
        }
      }
    }
    
    // C) Fallback: row with most Month-YY tokens
    const monthPattern = /^[A-Z]+-\d{2}(?:\.\d+)?$/;
    let maxCount = 0;
    let bestRow = 0;
    
    for (let i = 0; i < Math.min(50, rawData.length); i++) {
      const row = rawData[i] || [];
      const count = row.filter(cell => monthPattern.test(normUpper(cell))).length;
      if (count > maxCount) {
        maxCount = count;
        bestRow = i;
      }
    }
    
    if (maxCount > 0) {
      const row = rawData[bestRow] || [];
      let partCol = 0;
      for (let j = 0; j < row.length; j++) {
        if (normStr(row[j])) {
          partCol = j;
          break;
        }
      }
      return { hdrRow: bestRow, partCol };
    }
    
    return { hdrRow: -1, partCol: 0 };
  };

  const getName = (rawData: any[][], baseRow: number, baseCol: number, maxUp: number = 8, maxDx: number = 2): string => {
    // Scan up to maxUp rows upward and +/- maxDx columns laterally
    for (let up = 0; up <= maxUp; up++) {
      const r = baseRow - up;
      if (r < 0) break;
      
      const offsets = [0, -1, 1, -2, 2];
      for (const dx of offsets) {
        const c = baseCol + dx;
        if (c >= 0 && c < (rawData[r] || []).length) {
          const val = normStr(rawData[r][c]);
          if (val) return val;
        }
      }
    }
    return '';
  };

  const processCsvFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().replace(/['"]/g, ''),
      transform: (value) => value.trim().replace(/['"]/g, ''),
      complete: async (results) => {
        try {
          if (results.errors.length > 0) {
            console.warn('[CSV] Parsing warnings:', results.errors);
          }
          
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
            setError(`Missing columns: ${missingFields.map(f => f.name).join(', ')}`);
            setIsProcessing(false);
            return;
          }

          setUploadedFiles(prev => [...prev, file.name]);
          onFileUpload(results.data, file.name);
          setIsProcessing(false);
        } catch (err: any) {
          setError('Error processing CSV file');
          setIsProcessing(false);
        }
      },
      error: (error) => {
        setError(`CSV parse error: ${error.message}`);
        setIsProcessing(false);
      }
    });
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    console.log('[FileUpload] ========== FILE DROP EVENT ==========');
    const files = Array.from(e.dataTransfer.files);
    console.log('[FileUpload] Files dropped:', files.length, 'files');
    files.forEach((f, i) => console.log(`  [${i}] ${f.name} (${f.size} bytes, ${f.type})`));
    files.forEach(processFile);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[FileUpload] ========== FILE SELECT EVENT ==========');
    const files = Array.from(e.target.files || []);
    console.log('[FileUpload] Files selected:', files.length, 'files');
    files.forEach((f, i) => console.log(`  [${i}] ${f.name} (${f.size} bytes, ${f.type})`));
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
            <p className="text-xs text-muted-foreground">CSV or Excel files</p>
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
          </div>
        )}
      </div>
    </Card>
  );
};
