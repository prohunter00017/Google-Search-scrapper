import { Search, TrendingUp, FileText, History } from "lucide-react";

interface SidebarProps {
  currentView: 'analysis' | 'history' | 'keyword' | 'content';
  onViewChange: (view: 'analysis' | 'history' | 'keyword' | 'content') => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const navItems = [
    { id: 'analysis' as const, label: 'Competitor Analysis', icon: TrendingUp },
    { id: 'keyword' as const, label: 'Keyword Research', icon: Search },
    { id: 'content' as const, label: 'Content Analysis', icon: FileText },
    { id: 'history' as const, label: 'Analysis History', icon: History },
  ];

  return (
    <div className="w-64 bg-white border-r border-neutral-200 flex flex-col">
      <div className="p-6 border-b border-neutral-200">
        <h1 className="text-xl font-bold text-neutral-800 flex items-center">
          <Search className="text-primary mr-2" size={24} />
          SEO Analyzer Pro
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'text-white bg-primary'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Icon className="mr-3" size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-200">
        <div className="bg-neutral-50 rounded-lg p-3">
          <div className="text-xs text-neutral-500 mb-1">API Usage Today</div>
          <div className="text-sm font-semibold text-neutral-700">847 / 10,000</div>
          <div className="w-full bg-neutral-200 rounded-full h-1.5 mt-2">
            <div className="bg-primary h-1.5 rounded-full" style={{width: "8.47%"}}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
