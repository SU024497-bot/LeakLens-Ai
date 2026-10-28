import React from 'react';
import { 
  LayoutDashboard, UploadCloud, BarChart3, ShieldAlert, 
  CheckSquare, FileDown, Settings, HelpCircle, 
  ChevronLeft, ChevronRight, Home, Database, AlertCircle
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { AuditResponse } from '../types/audit';

export type DashboardTab = 
  | 'dashboard' 
  | 'upload' 
  | 'analysis' 
  | 'leakage' 
  | 'results' 
  | 'reports' 
  | 'settings' 
  | 'help';

interface SidebarProps {
  currentTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onExitToLanding: () => void;
  activeAudit: AuditResponse | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onExitToLanding,
  activeAudit,
  collapsed,
  onToggleCollapse,
}) => {
  const menuItems = [
    { id: 'dashboard' as DashboardTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload' as DashboardTab, label: 'Upload Dataset', icon: UploadCloud },
    { id: 'analysis' as DashboardTab, label: 'Data Analysis', icon: BarChart3, badge: activeAudit ? `${activeAudit.summary.column_count} cols` : undefined },
    { id: 'leakage' as DashboardTab, label: 'Leakage Detection', icon: ShieldAlert, badge: activeAudit && activeAudit.risk_summary.overall_risk_score > 0 ? `${Math.round(activeAudit.risk_summary.overall_risk_score)}%` : undefined },
    { id: 'results' as DashboardTab, label: 'Results & Findings', icon: CheckSquare, badge: activeAudit ? `${activeAudit.findings.length}` : undefined },
    { id: 'reports' as DashboardTab, label: 'Reports', icon: FileDown },
    { id: 'settings' as DashboardTab, label: 'Settings', icon: Settings },
    { id: 'help' as DashboardTab, label: 'Help & Docs', icon: HelpCircle },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#282B4A] text-[#EEEBDA] border-r border-[#EEEBDA]/10 transition-all duration-300 flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header / Logo */}
      <div>
        <div className="p-4 flex items-center justify-between border-b border-[#EEEBDA]/10 h-18">
          {!collapsed ? (
            <BrandLogo size="sm" variant="light" />
          ) : (
            <div className="mx-auto">
              <BrandLogo size="sm" showText={false} variant="light" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg text-[#EEEBDA]/60 hover:text-[#EEEBDA] hover:bg-white/10 transition-colors ${
              collapsed ? 'hidden' : 'block'
            }`}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Active Dataset Pill */}
        {activeAudit && !collapsed && (
          <div className="m-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-3.5 h-3.5 text-vanilla-brand/70" />
              <span className="text-[11px] font-bold text-vanilla-brand truncate">
                {activeAudit.summary.filename}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-vanilla-brand/60 font-mono">
              <span>{activeAudit.summary.row_count.toLocaleString()} rows</span>
              <span className={`font-bold px-1.5 py-0.2 rounded ${
                activeAudit.risk_summary.overall_risk_level === 'CRITICAL' ? 'bg-rose-500/30 text-rose-300' :
                activeAudit.risk_summary.overall_risk_level === 'ELEVATED' ? 'bg-orange-500/30 text-orange-300' :
                activeAudit.risk_summary.overall_risk_level === 'MODERATE' ? 'bg-amber-500/30 text-amber-300' : 'bg-emerald-500/30 text-emerald-300'
              }`}>
                {activeAudit.risk_summary.overall_risk_level}
              </span>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#EEEBDA] text-[#282B4A] shadow-subtle'
                    : 'text-[#EEEBDA]/80 hover:text-[#EEEBDA] hover:bg-white/5'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#282B4A]' : 'text-[#EEEBDA]/70'}`} />
                
                {!collapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isActive ? 'bg-[#282B4A]/10 text-[#282B4A]' : 'bg-white/10 text-[#EEEBDA]/80'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer / Exit to Landing */}
      <div className="p-3 border-t border-[#EEEBDA]/10 space-y-2">
        <button
          onClick={onExitToLanding}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#EEEBDA]/70 hover:text-[#EEEBDA] hover:bg-white/5 transition-colors"
          title="Return to Public Landing Page"
        >
          <Home className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Back to Home</span>}
        </button>

        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex justify-center py-2 text-[#EEEBDA]/60 hover:text-[#EEEBDA]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
