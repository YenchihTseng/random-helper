/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  ClipboardList,
  Users,
  Dices,
  Trash2,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  LayoutGrid,
  History
} from 'lucide-react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'input' | 'selection' | 'grouping';

interface Host {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  members: string[];
}

const MOCK_HOSTS_A = [
  '84920', '10293', '48201', '59382',
  '71829', '30291', '94820', '28193',
  '65829', '19283', '47281', '83920'
];

const MOCK_HOSTS_B = [
  'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets', 'Chicago Bulls',
  'Cleveland Cavaliers', 'Dallas Mavericks', 'Denver Nuggets', 'Detroit Pistons', 'Golden State Warriors',
  'Houston Rockets', 'Indiana Pacers', 'LA Clippers', 'Los Angeles Lakers', 'Memphis Grizzlies',
  'Miami Heat', 'Milwaukee Bucks', 'Minnesota Timberwolves', 'New Orleans Pelicans', 'New York Knicks',
  'Oklahoma City Thunder', 'Orlando Magic', 'Philadelphia 76ers', 'Phoenix Suns', 'Portland Trail Blazers',
  'Sacramento Kings', 'San Antonio Spurs', 'Toronto Raptors', 'Utah Jazz', 'Washington Wizards'
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('input');
  const [hosts, setHosts] = useState<Host[]>([]);
  const [inputText, setInputText] = useState('');
  const [isDuplicateAllowed, setIsDuplicateAllowed] = useState(false);
  const [selectedHosts, setSelectedHosts] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentRollingHost, setCurrentRollingHost] = useState<string | null>(null);
  const [groupSize, setGroupSize] = useState(2);
  const [groups, setGroups] = useState<Group[]>([]);
  const [history, setHistory] = useState<{ name: string, time: string }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Duplicate detection logic
  const duplicateNames = hosts
    .map(h => h.name)
    .filter((name, index, self) => self.indexOf(name) !== index);

  const hasDuplicates = duplicateNames.length > 0;

  const removeDuplicates = () => {
    const seen = new Set();
    const uniqueHosts = hosts.filter(h => {
      if (seen.has(h.name)) return false;
      seen.add(h.name);
      return true;
    });
    setHosts(uniqueHosts);
  };

  const loadMockData = (type: 'A' | 'B') => {
    const dataSource = type === 'A' ? MOCK_HOSTS_A : MOCK_HOSTS_B;
    const mockData = dataSource.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name,
    }));
    setHosts(prev => [...prev, ...mockData]);
  };

  // Handle CSV Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const parsedHosts: Host[] = results.data
          .flat()
          .filter((item: any) => typeof item === 'string' && item.trim() !== '')
          .map((name: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: name.trim(),
          }));

        setHosts(prev => [...prev, ...parsedHosts]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      header: false,
    });
  };

  // Handle Manual Input
  const handleAddFromText = () => {
    const lines = inputText.split('\n').filter(line => line.trim() !== '');
    const newHosts = lines.map(line => ({
      id: Math.random().toString(36).substr(2, 9),
      name: line.trim(),
    }));
    setHosts(prev => [...prev, ...newHosts]);
    setInputText('');
  };

  const removeHost = (id: string) => {
    setHosts(hosts.filter(h => h.id !== id));
  };

  const clearAllHosts = () => {
    setHosts([]);
    setSelectedHosts([]);
    setHistory([]);
    setGroups([]);
  };

  // Selection Logic
  const startSelection = () => {
    if (hosts.length === 0) return;

    const availableHosts = isDuplicateAllowed
      ? hosts
      : hosts.filter(h => !selectedHosts.includes(h.name));

    if (availableHosts.length === 0) {
      alert('所有名單都已抽選完畢！');
      return;
    }

    setIsSelecting(true);
    let counter = 0;
    const maxTicks = 20;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * availableHosts.length);
      setCurrentRollingHost(availableHosts[randomIndex].name);
      counter++;

      if (counter >= maxTicks) {
        clearInterval(interval);
        const finalHost = availableHosts[Math.floor(Math.random() * availableHosts.length)].name;
        setCurrentRollingHost(finalHost);
        setSelectedHosts(prev => [...prev, finalHost]);
        setHistory(prev => [{ name: finalHost, time: new Date().toLocaleTimeString() }, ...prev]);
        setIsSelecting(false);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }, 100);
  };

  // Grouping Logic
  const performGrouping = () => {
    if (hosts.length === 0) return;

    const shuffled = [...hosts].sort(() => Math.random() - 0.5);
    const newGroups: Group[] = [];

    for (let i = 0; i < shuffled.length; i += groupSize) {
      newGroups.push({
        id: Math.random().toString(36).substr(2, 9),
        name: `第 ${newGroups.length + 1} 組`,
        members: shuffled.slice(i, i + groupSize).map(h => h.name),
      });
    }

    setGroups(newGroups);
  };

  const downloadGroupsAsCSV = () => {
    if (groups.length === 0) return;

    const csvRows = [['組別', '成員']];
    groups.forEach(group => {
      group.members.forEach(member => {
        csvRows.push([group.name, member]);
      });
    });

    const csvContent = Papa.unparse(csvRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `grouping_result_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      {/* Header */}
      <header className="border-b border-[#E2E8F0] bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-[#4F46E5] p-2 rounded-lg">
            <LayoutGrid className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Random Picker</h1>
            <p className="text-xs text-[#64748B] font-medium uppercase tracking-widest">Universal Random Selection Tool</p>
          </div>
        </div>

        <nav className="flex bg-[#F1F5F9] p-1 rounded-xl">
          {[
            { id: 'input', label: '名單匯入', icon: Upload },
            { id: 'selection', label: '幸運抽選', icon: Dices },
            { id: 'grouping', label: '自動分組', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-white text-[#4F46E5] shadow-sm"
                  : "text-[#64748B] hover:text-[#4F46E5]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <AnimatePresence mode="wait">
          {/* Input Tab */}
          {activeTab === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="space-y-6">
                <section className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Upload className="w-5 h-5 text-[#4F46E5]" /> 匯入名單
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadMockData('A')}
                        className="text-xs font-bold text-[#4F46E5] hover:bg-[#EEF2FF] px-3 py-1.5 rounded-lg border border-[#C7D2FE] transition-all flex items-center gap-1"
                      >
                        <History className="w-3.5 h-3.5" /> 載入名單 A
                      </button>
                      <button
                        onClick={() => loadMockData('B')}
                        className="text-xs font-bold text-[#F59E0B] hover:bg-[#FFFBEB] px-3 py-1.5 rounded-lg border border-[#FDE68A] transition-all flex items-center gap-1"
                      >
                        <History className="w-3.5 h-3.5" /> 載入名單 B
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#CBD5E1] rounded-xl p-8 text-center cursor-pointer hover:border-[#4F46E5] transition-colors group"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".csv"
                        className="hidden"
                      />
                      <Upload className="w-10 h-10 mx-auto mb-3 text-[#94A3B8] group-hover:text-[#4F46E5] transition-colors" />
                      <p className="text-sm font-medium">點擊或拖曳 CSV 檔案至此</p>
                      <p className="text-xs text-[#64748B] mt-1">僅支援單欄 CSV 格式</p>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-[#E2E8F0]"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-[#94A3B8] font-semibold">或</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#334155]">手動貼上名單</label>
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="每行一個項目..."
                        className="w-full h-32 p-3 rounded-xl border border-[#CBD5E1] focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none text-sm font-mono"
                      />
                      <button
                        onClick={handleAddFromText}
                        disabled={!inputText.trim()}
                        className="w-full bg-[#4F46E5] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
                      >
                        <Plus className="w-4 h-4" /> 新增至名單
                      </button>
                    </div>
                  </div>
                </section>

                <section className="bg-[#4F46E5] p-6 rounded-2xl text-white shadow-lg shadow-indigo-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">統計資訊</h2>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Live</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                      <p className="text-indigo-100 text-xs font-bold uppercase mb-1">總數</p>
                      <p className="text-3xl font-mono font-bold">{hosts.length}</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                      <p className="text-indigo-100 text-xs font-bold uppercase mb-1">已抽選</p>
                      <p className="text-3xl font-mono font-bold">{selectedHosts.length}</p>
                    </div>
                  </div>
                </section>
              </div>

              <section className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col overflow-hidden">
                <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-[#4F46E5]" /> 目前名單
                  </h2>
                  <div className="flex items-center gap-2">
                    {hasDuplicates && (
                      <button
                        onClick={removeDuplicates}
                        className="text-xs font-bold text-[#F59E0B] hover:bg-[#FFFBEB] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-[#F59E0B]/20"
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> 移除重複項
                      </button>
                    )}
                    <button
                      onClick={clearAllHosts}
                      className="text-xs font-bold text-[#EF4444] hover:bg-[#FEF2F2] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 清空全部
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 max-h-[600px]">
                  {hosts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[#94A3B8] py-20">
                      <AlertCircle className="w-12 h-12 mb-2 opacity-20" />
                      <p className="text-sm font-medium">尚未匯入任何名單</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {hosts.map((host, index) => {
                        const isDuplicate = hosts.slice(0, index).some(h => h.name === host.name);
                        return (
                          <div
                            key={host.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-xl group transition-colors",
                              isDuplicate ? "bg-[#FFFBEB] border border-[#F59E0B]/30" : "bg-[#F1F5F9] hover:bg-[#E2E8F0]"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-medium">{host.name}</span>
                              {isDuplicate && (
                                <span className="text-[10px] font-bold text-[#F59E0B] uppercase bg-white px-1.5 py-0.5 rounded border border-[#F59E0B]/20">重複</span>
                              )}
                            </div>
                            <button
                              onClick={() => removeHost(host.id)}
                              className="text-[#94A3B8] hover:text-[#EF4444] transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {/* Selection Tab */}
          {activeTab === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-12 rounded-[2rem] border border-[#E2E8F0] shadow-xl text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#4F46E5] to-transparent opacity-20"></div>

                  <h2 className="text-sm font-bold text-[#64748B] uppercase tracking-[0.3em] mb-8">Random Selection Engine</h2>

                  <div className="h-48 flex items-center justify-center mb-12">
                    <AnimatePresence mode="wait">
                      {currentRollingHost ? (
                        <motion.div
                          key={currentRollingHost}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          className={cn(
                            "text-5xl md:text-7xl font-mono font-black tracking-tighter",
                            isSelecting ? "text-[#CBD5E1]" : "text-[#4F46E5]"
                          )}
                        >
                          {currentRollingHost}
                        </motion.div>
                      ) : (
                        <div className="text-[#CBD5E1] text-xl font-medium italic">等待開始...</div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-8">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => setIsDuplicateAllowed(!isDuplicateAllowed)}
                          className={cn(
                            "w-12 h-6 rounded-full relative transition-colors duration-300",
                            isDuplicateAllowed ? "bg-[#4F46E5]" : "bg-[#CBD5E1]"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                            isDuplicateAllowed ? "left-7" : "left-1"
                          )} />
                        </div>
                        <span className="text-sm font-bold text-[#334155]">允許重複抽選</span>
                      </label>
                    </div>

                    <button
                      onClick={startSelection}
                      disabled={isSelecting || hosts.length === 0}
                      className="bg-[#4F46E5] text-white px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                    >
                      {isSelecting ? "抽選中..." : "開始抽選"}
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#F1F5F9] p-6 rounded-2xl">
                    <p className="text-[#64748B] text-xs font-bold uppercase mb-2">剩餘可選</p>
                    <p className="text-4xl font-mono font-bold text-[#4F46E5]">
                      {isDuplicateAllowed ? hosts.length : hosts.length - selectedHosts.length}
                    </p>
                  </div>
                  <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl">
                    <p className="text-[#64748B] text-xs font-bold uppercase mb-2">抽選模式</p>
                    <p className="text-lg font-bold flex items-center gap-2">
                      {isDuplicateAllowed ? (
                        <><History className="w-5 h-5 text-[#F59E0B]" /> 取後放回</>
                      ) : (
                        <><CheckCircle2 className="w-5 h-5 text-[#10B981]" /> 不重複抽選</>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col overflow-hidden h-[600px]">
                <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <History className="w-5 h-5 text-[#4F46E5]" /> 抽選紀錄
                  </h2>
                  <span className="bg-[#4F46E5] text-white text-[10px] px-2 py-0.5 rounded font-bold">{history.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[#94A3B8] opacity-50">
                      <p className="text-sm font-medium">尚無紀錄</p>
                    </div>
                  ) : (
                    history.map((item, idx) => (
                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        key={`${item.name}-${idx}`}
                        className="flex items-center justify-between p-4 bg-[#F1F5F9] rounded-xl border-l-4 border-[#4F46E5]"
                      >
                        <div>
                          <p className="text-sm font-mono font-bold">{item.name}</p>
                          <p className="text-[10px] text-[#94A3B8] font-bold uppercase">{item.time}</p>
                        </div>
                        <div className="bg-white p-1.5 rounded-lg shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Grouping Tab */}
          {activeTab === 'grouping' && (
            <motion.div
              key="grouping"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">每組人數</label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setGroupSize(Math.max(1, groupSize - 1))}
                        className="w-10 h-10 rounded-xl border border-[#CBD5E1] flex items-center justify-center hover:bg-[#F1F5F9] transition-colors"
                      >
                        -
                      </button>
                      <span className="text-2xl font-mono font-bold w-12 text-center">{groupSize}</span>
                      <button
                        onClick={() => setGroupSize(groupSize + 1)}
                        className="w-10 h-10 rounded-xl border border-[#CBD5E1] flex items-center justify-center hover:bg-[#F1F5F9] transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="h-12 w-px bg-[#E2E8F0] hidden md:block"></div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">預計分組數</p>
                    <p className="text-xl font-bold">{Math.ceil(hosts.length / groupSize)} 組</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                  <button
                    onClick={performGrouping}
                    disabled={hosts.length === 0}
                    className="bg-[#4F46E5] text-white px-10 py-4 rounded-xl font-bold hover:bg-[#4338CA] transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
                  >
                    <Users className="w-5 h-5" /> 執行自動分組
                  </button>
                  {groups.length > 0 && (
                    <button
                      onClick={downloadGroupsAsCSV}
                      className="bg-white text-[#4F46E5] border border-[#C7D2FE] px-6 py-4 rounded-xl font-bold hover:bg-[#EEF2FF] transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Download className="w-5 h-5" /> 下載 CSV
                    </button>
                  )}
                </div>
              </div>

              {groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group, idx) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      key={group.id}
                      className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="bg-[#4F46E5] p-4 flex items-center justify-between">
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest">{group.name}</h3>
                        <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                          {group.members.length} 人
                        </span>
                      </div>
                      <div className="p-4 space-y-2">
                        {group.members.map((member, mIdx) => (
                          <div key={mIdx} className="flex items-center gap-3 p-2 bg-[#F1F5F9] rounded-lg">
                            <span className="text-[10px] font-bold text-[#94A3B8] w-4">{mIdx + 1}</span>
                            <span className="text-sm font-mono font-medium">{member}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-20 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-[#CBD5E1]" />
                  <p className="text-[#64748B] font-medium">設定分組人數並點擊按鈕開始分組</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto p-12 text-center">
        <p className="text-xs font-bold text-[#64748B] uppercase tracking-[0.2em]">
          2026 - Designed for efficiency
        </p>
      </footer>
    </div>
  );
}
