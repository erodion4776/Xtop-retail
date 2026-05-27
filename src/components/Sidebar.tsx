import { LayoutDashboard, Users, Send, Settings, Mail, X } from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subscribers' as ActiveTab, label: 'Subscribers', icon: Users },
    { id: 'campaigns' as ActiveTab, label: 'Campaigns', icon: Send },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          id="mobile-sidebar-overlay"
          className="fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-xs lg:hidden transition-opacity duration-250 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        id="sidebar-panel"
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white border-r border-zinc-200 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-semibold shadow-xs shadow-indigo-600/30">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-zinc-900 text-base tracking-tight leading-none block">XTOPFlow</span>
              <span className="text-[10px] text-indigo-600 font-semibold tracking-wider uppercase block mt-0.5">SaaS</span>
            </div>
          </div>
          <button
            id="close-sidebar-button"
            className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600 pl-3 rounded-l-none'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <IconComponent className={`w-4.5 h-4.5 transition-colors ${isActive ? 'text-indigo-600' : 'text-zinc-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-medium text-xs border border-zinc-300">
              EE
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-700 truncate leading-tight">eroeliza1234@gmail.com</p>
              <p className="text-[10px] text-zinc-400 truncate mt-0.5">Admin Developer</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
