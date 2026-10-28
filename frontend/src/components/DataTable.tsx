import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Filter, AlertCircle } from 'lucide-react';
import { ColumnProfile } from '../types/audit';

interface DataTableProps {
  columns: ColumnProfile[];
}

export const DataTable: React.FC<DataTableProps> = ({ columns }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'name' | 'null_percentage' | 'unique_count'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const distinctTypes = useMemo(() => {
    return Array.from(new Set(columns.map((c) => c.inferred_type)));
  }, [columns]);

  const filteredColumns = useMemo(() => {
    return columns
      .filter((col) => {
        const matchesSearch = col.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'ALL' || col.inferred_type === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];
        if (sortField === 'name') {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        }
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [columns, searchTerm, typeFilter, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredColumns.length / pageSize) || 1;
  const pagedColumns = filteredColumns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: 'name' | 'null_percentage' | 'unique_count') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-vanilla-card border border-vanilla-border rounded-xl shadow-subtle overflow-hidden">
      {/* Search and Filters Bar */}
      <div className="p-4 border-b border-vanilla-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/40">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-brand/50" />
          <input
            type="text"
            placeholder="Search column names..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-vanilla-border rounded-lg text-indigo-brand focus:outline-none focus:ring-1 focus:ring-indigo-brand placeholder:text-indigo-brand/40"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-indigo-brand/60" />
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-vanilla-border rounded-lg px-2.5 py-1.5 text-indigo-brand focus:outline-none focus:ring-1 focus:ring-indigo-brand font-medium"
          >
            <option value="ALL">All Inferred Types ({columns.length})</option>
            {distinctTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-indigo-brand">
          <thead className="bg-vanilla-subtle/50 border-b border-vanilla-border font-bold uppercase tracking-wider text-[11px] text-indigo-brand/80">
            <tr>
              <th 
                onClick={() => handleSort('name')} 
                className="py-3 px-4 cursor-pointer hover:bg-vanilla-subtle select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Column Name</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Inferred Type</th>
              <th 
                onClick={() => handleSort('null_percentage')} 
                className="py-3 px-4 cursor-pointer hover:bg-vanilla-subtle select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Missingness</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('unique_count')} 
                className="py-3 px-4 cursor-pointer hover:bg-vanilla-subtle select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Unique Values</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Sample Values</th>
              <th className="py-3 px-4">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vanilla-border/50">
            {pagedColumns.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-indigo-brand/60">
                  No columns match your current filters.
                </td>
              </tr>
            ) : (
              pagedColumns.map((col) => (
                <tr key={col.name} className="hover:bg-white/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-indigo-brand">
                    {col.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-brand/10 text-indigo-brand">
                      {col.inferred_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className={col.null_percentage > 25 ? 'font-bold text-status-critical' : ''}>
                      {col.null_count.toLocaleString()} ({col.null_percentage}%)
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {col.unique_count.toLocaleString()} ({col.unique_percentage}%)
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-indigo-brand/70 max-w-[200px] truncate">
                    {col.sample_values.slice(0, 3).map(String).join(', ') || '-'}
                  </td>
                  <td className="py-3 px-4">
                    {col.suspicious_flags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {col.suspicious_flags.map((flag) => (
                          <span
                            key={flag}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-indigo-brand/30">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-vanilla-border flex items-center justify-between text-xs text-indigo-brand/70 bg-white/30">
        <div>
          Showing {Math.min(filteredColumns.length, (currentPage - 1) * pageSize + 1)} to{' '}
          {Math.min(filteredColumns.length, currentPage * pageSize)} of {filteredColumns.length} columns
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 rounded border border-vanilla-border bg-white text-indigo-brand font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-vanilla-card"
          >
            Prev
          </button>
          <span className="px-2 font-mono font-bold text-indigo-brand">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 rounded border border-vanilla-border bg-white text-indigo-brand font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-vanilla-card"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
