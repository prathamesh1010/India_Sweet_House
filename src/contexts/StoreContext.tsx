import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storeFormatData } from '../data/storeFormatData';

export interface StoreFormat {
  id: string;
  Sl_No: number;
  Category: string;
  Cluster: string;
  Outlet: string;
}

interface StoreContextType {
  stores: StoreFormat[];
  updateStore: (id: string, updates: Partial<StoreFormat>) => void;
  addStore: (store: Omit<StoreFormat, 'id'>) => void;
  deleteStore: (id: string) => void;
  getStoresByCategory: (category: string) => StoreFormat[];
  getStoresByCluster: (cluster: string) => StoreFormat[];
  getStoresByOutlet: (outletName: string) => StoreFormat[];
  searchStores: (searchTerm: string) => StoreFormat[];
  getOutletNames: () => string[];
  getCategories: () => string[];
  getClusters: () => string[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreContext must be used within a StoreProvider');
  }
  return context;
};

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [stores, setStores] = useState<StoreFormat[]>([]);

  // Initialize stores from data file
  useEffect(() => {
    const initialStores: StoreFormat[] = storeFormatData.map((item, index) => ({
      id: `store-${index}`,
      Sl_No: item.Sl_No,
      Category: item.Category,
      Cluster: item.Cluster,
      Outlet: item.Outlet
    }));
    setStores(initialStores);
  }, []);

  const updateStore = (id: string, updates: Partial<StoreFormat>) => {
    setStores(prev => prev.map(store => 
      store.id === id ? { ...store, ...updates } : store
    ));
  };

  const addStore = (store: Omit<StoreFormat, 'id'>) => {
    const newStore: StoreFormat = {
      id: `store-${Date.now()}`,
      ...store
    };
    setStores(prev => [...prev, newStore]);
  };

  const deleteStore = (id: string) => {
    setStores(prev => prev.filter(store => store.id !== id));
  };

  const getStoresByCategory = (category: string) => {
    return stores.filter(store => store.Category === category);
  };

  const getStoresByCluster = (cluster: string) => {
    return stores.filter(store => store.Cluster === cluster);
  };

  const getOutletNames = () => {
    return stores.map(store => store.Outlet);
  };

  const getCategories = () => {
    return Array.from(new Set(stores.map(store => store.Category))).sort();
  };

  const getClusters = () => {
    return Array.from(new Set(stores.map(store => store.Cluster))).sort();
  };

  const getStoresByOutlet = (outletName: string) => {
    return stores.filter(store => 
      store.Outlet.toLowerCase().includes(outletName.toLowerCase())
    );
  };

  const searchStores = (searchTerm: string) => {
    if (!searchTerm.trim()) return stores;
    
    const term = searchTerm.toLowerCase();
    return stores.filter(store => 
      store.Outlet.toLowerCase().includes(term) ||
      store.Category.toLowerCase().includes(term) ||
      store.Cluster.toLowerCase().includes(term) ||
      store.Sl_No.toString().includes(term)
    );
  };

  const value: StoreContextType = {
    stores,
    updateStore,
    addStore,
    deleteStore,
    getStoresByCategory,
    getStoresByCluster,
    getStoresByOutlet,
    searchStores,
    getOutletNames,
    getCategories,
    getClusters
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
