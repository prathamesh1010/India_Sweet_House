import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { Dashboard } from '@/components/Dashboard';
import { DataTable } from '@/components/DataTable';
import { SimpleChartsSection } from '@/components/SimpleChartsSection';
import { InterestAnalysis } from '@/components/InterestAnalysis';
import { AdminConsole } from '@/components/AdminConsole';
import { useToast } from '@/hooks/use-toast';
// Database integration removed - using client-side only processing

const Index = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [dataByFile, setDataByFile] = useState<Record<string, any[]>>({});
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileUpload = async (data: any[], filename: string) => {
    try {
      if (!data || data.length === 0) {
        toast({
          title: "Error",
          description: "No data found in the uploaded file.",
          variant: "destructive",
        });
        return;
      }
      
      // Clean and validate the data - handle both outlet and transaction data
      const cleanedData = data.filter(row => {
        if (!row) return false;
        
        // Check if this is outlet data (from backend processing)
        const isOutletData = row['Outlet'] && row['Outlet Manager'];
        if (isOutletData) {
          return true; // Accept outlet data as-is from backend
        }
        
        // For transaction data, check for required fields
        return (row['Item Name'] || row['Product Name']) && row.Category && (row.Month || row.Date);
      });
      
      if (cleanedData.length === 0) {
        toast({
          title: "Error",
          description: "No valid data found in the uploaded file. Please check the file format.",
          variant: "destructive",
        });
        return;
      }
      
      const processedData = cleanedData.map(row => {
        // Check if this is outlet data
        const isOutletData = row['Outlet'] && row['Outlet Manager'];
        
        if (isOutletData) {
          // For outlet data, return as-is with minimal processing
          return {
            ...row,
            // Add some compatibility fields for analytics
            'Product Name': 'Outlet Summary',
            Category: 'Financial Summary',
            Branch: row['Outlet'],
            Cashier: row['Outlet Manager'],
            'Total Amount (₹)': row['TOTAL REVENUE'] || 0,
            'Cluster Manager': row['Outlet Manager'],
            'Store Name': row['Outlet'],
            'Total Sales': row['TOTAL REVENUE'] || 0,
            PBT: row['PBT'] || 0,
            EBITDA: row['EBIDTA'] || 0,
            'Upload Filename': filename
          };
        } else {
          // For transaction data, use the original processing
          const processedRow = {
            date: row.Month || row.Date || '',
            product_name: row['Item Name'] || row['Product Name'] || '',
            category: row.Category || '',
            branch: row['Store Name'] || row.Branch || '',
            cashier: row['Cluster Manager'] || row.Cashier || '',
            customer_type: row['Sales Type'] || row['Customer Type'] || '',
            payment_mode: row['Payment Type'] || row['Payment Mode'] || '',
            total_amount_inr: parseFloat(row['Total Sales'] || row['Total Amount (₹)']) || 0,
            quantity: parseFloat(row['Qty'] || row.Quantity) || 0,
            gross_amount: parseFloat(row['Gross Amount']) || 0,
            pbt: parseFloat(row.PBT) || 0,
            ebitda: parseFloat(row.EBITDA) || 0,
            unit_price_inr: parseFloat(row['Unit Price (₹)']) || 0,
            discount_percent: parseFloat(row['Discount (%)']) || 0,
            gst_percent: parseFloat(row['GST (%)']) || 0,
            upload_filename: filename
          };

          // Create display format for analytics
          return {
            ...row,
            'Product Name': processedRow.product_name,
            'Date': processedRow.date,
            'Branch': processedRow.branch,
            'Cashier': processedRow.cashier,
            'Customer Type': processedRow.customer_type,
            'Payment Mode': processedRow.payment_mode,
            'Total Amount (₹)': processedRow.total_amount_inr,
            'Quantity': processedRow.quantity,
            'Unit Price (₹)': processedRow.unit_price_inr,
            'Discount (%)': processedRow.discount_percent,
            'GST (%)': processedRow.gst_percent,
            'Gross Amount': processedRow.gross_amount,
            'PBT': processedRow.pbt,
            'EBITDA': processedRow.ebitda,
            'Upload Filename': processedRow.upload_filename
          };
        }
      });

      // Data processed locally - no database operations

      // Update local state for immediate UI feedback
      setSalesData(prevData => [...prevData, ...processedData]);
      setDataByFile(prevData => ({
        ...prevData,
        [filename]: processedData
      }));
      setUploadedFiles(prev => [...prev, filename]);
      
      toast({
        title: "File uploaded successfully!",
        description: `${cleanedData.length} records processed and ready for analytics from ${filename}`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error processing your file. Please check the format.",
        variant: "destructive"
      });
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <Dashboard data={salesData} />;
      case 'analytics':
        console.log('Index: Rendering analytics with data:', salesData.length, 'files:', Object.keys(dataByFile));
        return <SimpleChartsSection data={salesData} dataByFile={dataByFile} />;
      case 'interest':
        return <InterestAnalysis data={salesData} />;
      case 'table':
        return <DataTable data={salesData} dataByFile={dataByFile} />;
      case 'admin':
        return <AdminConsole />;
      default:
        return <Dashboard data={salesData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Hero Header with Navigation */}
      <header className="bg-gradient-header shadow-medium backdrop-blur-sm border-b border-border/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Title */}
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
                  INDIA SWEET HOUSE
                </h1>
                <p className="text-sm lg:text-base text-white/90 font-medium">
                  Financial Analytics Dashboard
                </p>
              </div>
            </div>
            
            {/* Right side - Navigation Tabs */}
            <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
              {[
                { id: 'overview', label: 'Overview', icon: 'Home' },
                { id: 'analytics', label: 'Analytics', icon: 'TrendingUp' },
                { id: 'interest', label: 'Interest Analysis', icon: 'Calculator' },
                { id: 'table', label: 'Data Table', icon: 'Table' },
                { id: 'admin', label: 'Admin Console', icon: 'Settings' }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-hickory-800 shadow-soft hover:bg-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="font-medium text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="space-y-8 animate-fadeIn">
          {/* File Upload Section - Only show on Overview tab */}
          {activeTab === 'overview' && (
            <div className="max-w-lg mx-auto">
              <FileUpload 
                onFileUpload={handleFileUpload}
                className="animate-slideIn"
              />
            </div>
          )}
          
          {/* Main Content */}
          <div className="animate-fadeIn">
            {renderActiveTab()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
