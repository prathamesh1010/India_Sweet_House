import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, Home, Table, TrendingUp, Settings } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, className = '' }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'table', label: 'Data Table', icon: Table },
    { id: 'admin', label: 'Admin Console', icon: Settings }
  ];

  return (
    <nav className={`bg-gradient-header shadow-medium backdrop-blur-sm border-b border-border/30 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Professional Title */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-display font-semibold text-white">India Sweet House</h1>
              <p className="text-sm text-white/80 font-medium">Analytics Dashboard</p>
            </div>
          </div>

          {/* Professional Navigation Tabs */}
          <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <Button
                  key={tab.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-primary shadow-soft hover:bg-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};