import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Plus, Save, X, MapPin, Trash2, Users, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStoreContext } from '../contexts/StoreContext';

interface Outlet {
  id: string;
  name: string;
  category?: string;
  month?: string;
  year?: string;
  clusterManager?: string;
}

interface ClusterManager {
  id: string;
  name: string;
}

export const AdminConsole: React.FC = () => {
  const { toast } = useToast();
  const { stores, updateStore, addStore, deleteStore, searchStores } = useStoreContext();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [clusterManagers, setClusterManagers] = useState<ClusterManager[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingOutlet, setEditingOutlet] = useState<string | null>(null);
  const [newOutletName, setNewOutletName] = useState('');
  const [newOutletCategory, setNewOutletCategory] = useState('');
  const [newOutletMonth, setNewOutletMonth] = useState('');
  const [newOutletYear, setNewOutletYear] = useState('');
  const [newOutletManager, setNewOutletManager] = useState('');
  const [isAddingOutlet, setIsAddingOutlet] = useState(false);
  const [isAddingManager, setIsAddingManager] = useState(false);
  const [newManagerName, setNewManagerName] = useState('');

  // Store format editing states
  const [editingStore, setEditingStore] = useState<string | null>(null);
  const [newStoreSlNo, setNewStoreSlNo] = useState<number>(0);
  const [newStoreCategory, setNewStoreCategory] = useState('');
  const [newStoreCluster, setNewStoreCluster] = useState('');
  const [newStoreOutlet, setNewStoreOutlet] = useState('');
  const [isAddingStore, setIsAddingStore] = useState(false);
  
  // Search state
  const [storeSearchTerm, setStoreSearchTerm] = useState('');

  // Initialize empty data
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    setLoading(true);
    
    // Start with empty data for outlets and managers
    setOutlets([]);
    setClusterManagers([]);
    setLoading(false);
  };

  const handleEditOutlet = (outlet: Outlet) => {
    setEditingOutlet(outlet.id);
    setNewOutletName(outlet.name);
    setNewOutletCategory(outlet.category || '');
    setNewOutletMonth(outlet.month || '');
    setNewOutletYear(outlet.year || '');
    setNewOutletManager(outlet.clusterManager || '');
  };

  const handleSaveOutlet = (id: string) => {
      setOutlets(prev => prev.map(outlet => 
        outlet.id === id 
        ? { ...outlet, name: newOutletName, category: newOutletCategory, month: newOutletMonth, year: newOutletYear, clusterManager: newOutletManager }
          : outlet
      ));
      setEditingOutlet(null);
      setNewOutletName('');
      setNewOutletCategory('');
      setNewOutletMonth('');
      setNewOutletYear('');
      setNewOutletManager('');
      
      toast({
        title: "Success",
        description: "Outlet updated successfully",
      });
  };

  const handleDeleteOutlet = (id: string) => {
      // Remove outlet from local state
      setOutlets(prev => prev.filter(outlet => outlet.id !== id));
      
      toast({
        title: "Success",
        description: "Outlet deleted successfully",
      });
  };


  const handleAddOutlet = () => {
    if (newOutletName.trim()) {
      const newOutlet: Outlet = {
        id: Date.now().toString(), // Simple ID generation
        name: newOutletName,
        category: newOutletCategory || 'General',
        month: newOutletMonth || 'January',
        year: newOutletYear || '2024',
        clusterManager: newOutletManager || undefined
      };

      setOutlets(prev => [...prev, newOutlet]);
      setNewOutletName('');
      setNewOutletCategory('');
      setNewOutletMonth('');
      setNewOutletYear('');
      setNewOutletManager('');
      setIsAddingOutlet(false);
      
      toast({
        title: "Success",
        description: "Outlet created successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Please enter an outlet name",
        variant: "destructive",
      });
    }
  };

  const handleAddManager = () => {
    if (newManagerName.trim()) {
      const newManager: ClusterManager = {
        id: Date.now().toString(),
        name: newManagerName
      };

      setClusterManagers(prev => [...prev, newManager]);
        setNewManagerName('');
        setIsAddingManager(false);
        
        toast({
          title: "Success",
          description: "Cluster manager created successfully",
      });
    }
  };

  // Store format CRUD operations
  const handleEditStore = (store: any) => {
    setEditingStore(store.id);
    setNewStoreSlNo(store.Sl_No);
    setNewStoreCategory(store.Category);
    setNewStoreCluster(store.Cluster);
    setNewStoreOutlet(store.Outlet);
  };

  const handleSaveStore = (id: string) => {
    if (newStoreSlNo && newStoreCategory.trim() && newStoreCluster.trim() && newStoreOutlet.trim()) {
      updateStore(id, {
        Sl_No: newStoreSlNo,
        Category: newStoreCategory,
        Cluster: newStoreCluster,
        Outlet: newStoreOutlet
      });
      setEditingStore(null);
      setNewStoreSlNo(0);
      setNewStoreCategory('');
      setNewStoreCluster('');
      setNewStoreOutlet('');
      
      toast({
        title: "Success",
        description: "Store updated successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStore = (id: string) => {
    deleteStore(id);
    
    toast({
      title: "Success",
      description: "Store deleted successfully",
    });
  };

  const handleAddStore = () => {
    if (newStoreSlNo && newStoreCategory.trim() && newStoreCluster.trim() && newStoreOutlet.trim()) {
      addStore({
        Sl_No: newStoreSlNo,
        Category: newStoreCategory,
        Cluster: newStoreCluster,
        Outlet: newStoreOutlet
      });
      setNewStoreSlNo(0);
      setNewStoreCategory('');
      setNewStoreCluster('');
      setNewStoreOutlet('');
      setIsAddingStore(false);
      
      toast({
        title: "Success",
        description: "Store created successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
    }
  };

  // Filter stores based on search term
  const filteredStores = searchStores(storeSearchTerm);



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent">
          Admin Console
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage your outlets and cluster managers
        </p>
      </div>

      {/* Unified Management Console */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MapPin className="h-6 w-6 text-primary" />
            Outlets Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Section */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Add New Outlet
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingOutlet(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Outlet
                </Button>
              </div>
              
              {isAddingOutlet && (
                <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Outlet Name"
                    value={newOutletName}
                    onChange={(e) => setNewOutletName(e.target.value)}
                  />
                  <Input
                      placeholder="Category"
                      value={newOutletCategory}
                      onChange={(e) => setNewOutletCategory(e.target.value)}
                    />
                    <Input
                      placeholder="Month"
                      value={newOutletMonth}
                      onChange={(e) => setNewOutletMonth(e.target.value)}
                    />
                    <Input
                      placeholder="Year"
                      value={newOutletYear}
                      onChange={(e) => setNewOutletYear(e.target.value)}
                    />
                    <select
                      value={newOutletManager}
                      onChange={(e) => setNewOutletManager(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select Cluster Manager</option>
                      {clusterManagers.map((manager) => (
                        <option key={manager.id} value={manager.name}>
                          {manager.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddOutlet}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setIsAddingOutlet(false);
                        setNewOutletName('');
                        setNewOutletCategory('');
                        setNewOutletMonth('');
                        setNewOutletYear('');
                        setNewOutletManager('');
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Add Cluster Manager
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingManager(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Manager
                </Button>
              </div>
              
              {isAddingManager && (
                <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-3">
                  <Input
                    placeholder="Manager Name"
                    value={newManagerName}
                    onChange={(e) => setNewManagerName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddManager}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setIsAddingManager(false);
                        setNewManagerName('');
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Outlets & Managers Management Table */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground border-b border-border pb-2">All Outlets</h4>
            <div className="max-h-96 overflow-y-auto">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-medium text-sm text-foreground">Outlet Name</th>
                      <th className="text-left p-3 font-medium text-sm text-foreground">Cluster Manager</th>
                      <th className="text-left p-3 font-medium text-sm text-foreground">Outlet Category</th>
                      <th className="text-left p-3 font-medium text-sm text-foreground">Month</th>
                      <th className="text-left p-3 font-medium text-sm text-foreground">Year</th>
                      <th className="text-left p-3 font-medium text-sm text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outlets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <MapPin className="h-8 w-8 text-muted-foreground/50" />
                            <p>No outlets found. Add your first outlet using the form above.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      outlets.map((outlet) => (
                        <tr key={outlet.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                    {editingOutlet === outlet.id ? (
                        <Input
                          value={newOutletName}
                          onChange={(e) => setNewOutletName(e.target.value)}
                          placeholder="Outlet Name"
                                className="h-8"
                              />
                            ) : (
                              <div 
                                className="font-medium text-foreground cursor-pointer hover:text-primary"
                                onClick={() => handleEditOutlet(outlet)}
                              >
                                {outlet.name}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {editingOutlet === outlet.id ? (
                              <select
                                value={newOutletManager}
                                onChange={(e) => setNewOutletManager(e.target.value)}
                                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              >
                                <option value="">Select Manager</option>
                                {clusterManagers.map((manager) => (
                                  <option key={manager.id} value={manager.name}>
                                    {manager.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div 
                                className="text-sm text-foreground cursor-pointer hover:text-primary"
                                onClick={() => handleEditOutlet(outlet)}
                              >
                                {outlet.clusterManager || '-'}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {editingOutlet === outlet.id ? (
                              <Input
                                value={newOutletCategory}
                                onChange={(e) => setNewOutletCategory(e.target.value)}
                                placeholder="Category"
                                className="h-8"
                              />
                            ) : (
                              <div 
                                className="text-sm text-foreground cursor-pointer hover:text-primary"
                                onClick={() => handleEditOutlet(outlet)}
                              >
                                {outlet.category || '-'}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {editingOutlet === outlet.id ? (
                              <Input
                                value={newOutletMonth}
                                onChange={(e) => setNewOutletMonth(e.target.value)}
                                placeholder="Month"
                                className="h-8"
                              />
                            ) : (
                              <div 
                                className="text-sm text-foreground cursor-pointer hover:text-primary"
                                onClick={() => handleEditOutlet(outlet)}
                              >
                                {outlet.month || '-'}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {editingOutlet === outlet.id ? (
                              <Input
                                value={newOutletYear}
                                onChange={(e) => setNewOutletYear(e.target.value)}
                                placeholder="Year"
                                className="h-8"
                              />
                            ) : (
                              <div 
                                className="text-sm text-foreground cursor-pointer hover:text-primary"
                                onClick={() => handleEditOutlet(outlet)}
                              >
                                {outlet.year || '-'}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {editingOutlet === outlet.id ? (
                              <div className="flex gap-1">
                                <Button size="sm" onClick={() => handleSaveOutlet(outlet.id)} className="h-8 px-2">
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    setEditingOutlet(null);
                                    setNewOutletName('');
                                    setNewOutletCategory('');
                                    setNewOutletMonth('');
                                    setNewOutletYear('');
                                    setNewOutletManager('');
                                  }}
                                  className="h-8 px-2"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditOutlet(outlet)}
                                  className="text-primary hover:text-primary-dark h-8 px-2"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteOutlet(outlet.id)}
                                  className="text-destructive hover:text-destructive h-8 px-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Store Format Management */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MapPin className="h-6 w-6 text-primary" />
            Store Format Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Store Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Add New Store
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingStore(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Store
              </Button>
            </div>
            
            {isAddingStore && (
              <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Serial Number"
                    value={newStoreSlNo || ''}
                    onChange={(e) => setNewStoreSlNo(parseInt(e.target.value) || 0)}
                  />
                  <Input
                    placeholder="Category"
                    value={newStoreCategory}
                    onChange={(e) => setNewStoreCategory(e.target.value)}
                  />
                  <Input
                    placeholder="Cluster"
                    value={newStoreCluster}
                    onChange={(e) => setNewStoreCluster(e.target.value)}
                  />
                  <Input
                    placeholder="Outlet Name"
                    value={newStoreOutlet}
                    onChange={(e) => setNewStoreOutlet(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddStore}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setIsAddingStore(false);
                      setNewStoreSlNo(0);
                      setNewStoreCategory('');
                      setNewStoreCluster('');
                      setNewStoreOutlet('');
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Search Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Search Stores
              </h3>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by outlet name, category, cluster, or serial number..."
                value={storeSearchTerm}
                onChange={(e) => setStoreSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Store Format Data Table */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground border-b border-border pb-2">
              Store Format Data ({filteredStores.length} of {stores.length} stores)
            </h4>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10 bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium text-sm text-foreground bg-muted/50">Sl No.</th>
                      <th className="text-left p-3 font-medium text-sm text-foreground bg-muted/50">Category</th>
                      <th className="text-left p-3 font-medium text-sm text-foreground bg-muted/50">Cluster</th>
                      <th className="text-left p-3 font-medium text-sm text-foreground bg-muted/50">Outlet</th>
                      <th className="text-left p-3 font-medium text-sm text-foreground bg-muted/50">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <MapPin className="h-8 w-8 text-muted-foreground/50" />
                            <p>{storeSearchTerm ? 'No stores found matching your search.' : 'No store data found.'}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStores.map((store) => (
                        <tr key={store.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            {editingStore === store.id ? (
                              <Input
                                type="number"
                                value={newStoreSlNo || ''}
                                onChange={(e) => setNewStoreSlNo(parseInt(e.target.value) || 0)}
                                placeholder="Serial Number"
                                className="h-8"
                              />
                            ) : (
                              <div 
                                className="font-medium text-foreground cursor-pointer hover:text-primary"
                                onClick={() => handleEditStore(store)}
                              >
                                {store.Sl_No}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {editingStore === store.id ? (
                              <Input
                                value={newStoreCategory}
                                onChange={(e) => setNewStoreCategory(e.target.value)}
                                placeholder="Category"
                                className="h-8"
                              />
                            ) : (
                              <div 
                                className="text-sm text-foreground cursor-pointer hover:text-primary"
                                onClick={() => handleEditStore(store)}
                              >
                                {store.Category}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {editingStore === store.id ? (
                              <Input
                                value={newStoreCluster}
                                onChange={(e) => setNewStoreCluster(e.target.value)}
                                placeholder="Cluster"
                                className="h-8"
                              />
                            ) : (
                              <div 
                                className="text-sm text-foreground cursor-pointer hover:text-primary"
                                onClick={() => handleEditStore(store)}
                              >
                                {store.Cluster}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {editingStore === store.id ? (
                              <Input
                                value={newStoreOutlet}
                                onChange={(e) => setNewStoreOutlet(e.target.value)}
                                placeholder="Outlet Name"
                                className="h-8"
                              />
                            ) : (
                              <div 
                                className="text-sm text-foreground cursor-pointer hover:text-primary"
                                onClick={() => handleEditStore(store)}
                              >
                                {store.Outlet}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {editingStore === store.id ? (
                              <div className="flex gap-1">
                                <Button size="sm" onClick={() => handleSaveStore(store.id)} className="h-8 px-2">
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    setEditingStore(null);
                                    setNewStoreSlNo(0);
                                    setNewStoreCategory('');
                                    setNewStoreCluster('');
                                    setNewStoreOutlet('');
                                  }}
                                  className="h-8 px-2"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditStore(store)}
                                  className="text-primary hover:text-primary-dark h-8 px-2"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteStore(store.id)}
                                  className="text-destructive hover:text-destructive h-8 px-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
