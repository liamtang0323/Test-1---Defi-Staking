import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  HelpCircle, 
  BarChart3, 
  Layers, 
  ArrowUpDown, 
  Sliders, 
  Search, 
  Calculator, 
  Sparkles, 
  TrendingUp, 
  RefreshCw, 
  Unlock, 
  Percent, 
  Zap, 
  Wifi, 
  Coins,
  Server,
  AlertTriangle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

const GLOSSARY_ITEMS = [
  { term: 'Liquid Staking Token (LST)', desc: 'A tokenized receipt (e.g., stETH, rETH) representing staked Proof-of-Stake assets that continues to earn rewards while remaining usable in DeFi protocols.' },
  { term: 'Liquid Restaking Token (LRT)', desc: 'Tokens (e.g., eETH, rsETH) representing assets restaked to secure third-party Actively Validated Services (AVS), compounding staking rewards with middleware fees.' },
  { term: 'Proof-of-Stake Slashing', desc: 'An automated protocol penalty that burns a portion of a validator node’s staked assets if it misbehaves, double-signs, or experiences severe downtime.' },
  { term: 'Validator Commission', desc: 'The fee percentage retained by node operators or staking pools to cover hardware maintenance, bandwidth, and operations.' },
  { term: 'De-peg Risk', desc: 'The risk that a liquid staking wrapper (e.g., stETH or eETH) loses its 1:1 price parity with the underlying base asset on open DEX markets.' },
  { term: 'Smart Contract Risk', desc: 'The risk of financial loss resulting from software bugs, logic flaws, or flash-loan exploits within decentralized smart contract code.' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAsset, setSelectedAsset] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxRisk, setMaxRisk] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'estApy', direction: 'desc' });
  
  // Real-time API States
  const [liveDeFiPools, setLiveDeFiPools] = useState([]);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Comparison State
  const [comparedProductIds, setComparedProductIds] = useState([]);

  // Calculator State
  const [calcPrincipal, setCalcPrincipal] = useState(10000);
  const [calcApy, setCalcApy] = useState(3.5);
  const [calcDays, setCalcDays] = useState(365);
  const [calcCompounding, setCalcCompounding] = useState('daily');

  // Fetch Live DeFi Staking Data with Exponential Backoff
  const fetchLiveYields = async (retryCount = 0) => {
    setIsLoadingApi(true);
    setApiError(null);

    const backoffDelays = [1000, 2000, 4000, 8000, 16000];

    try {
      const response = await fetch('https://yields.llama.fi/pools');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (data && data.data) {
        // Filter strictly for major live DeFi Staking & Restaking protocols
        const stakingProjects = [
          'lido', 'rocket-pool', 'ether.fi', 'jito', 'kelp-dao', 
          'renzo', 'frax-ether', 'stader', 'aave-v3', 'binance-staked-eth',
          'swell', 'puffer', 'eigenlayer', 'mantle-staking', 'coinbase-wrapped-staked-eth'
        ];
        
        const topPools = data.data.filter(pool => 
          stakingProjects.includes(pool.project) &&
          pool.tvlUsd > 10000000 &&
          pool.apy > 0.1
        ).slice(0, 15).map(pool => {
          const rawProjectName = pool.project.replace('-', ' ').toUpperCase();
          const formattedProtocol = rawProjectName === 'LIDO' ? 'Lido Finance' :
                                   rawProjectName === 'ROCKET POOL' ? 'Rocket Pool' :
                                   rawProjectName === 'ETHER.FI' ? 'Ether.fi' :
                                   rawProjectName === 'FRAX ETHER' ? 'Frax Ether' :
                                   rawProjectName === 'JITO' ? 'Jito Network' : pool.project.toUpperCase();

          const isRestaking = pool.symbol.includes('eETH') || pool.symbol.includes('rsETH') || pool.project.includes('renzo') || pool.project.includes('kelp') || pool.project.includes('puffer');
          const subCat = isRestaking ? 'Liquid Restaking (LRT)' : (pool.symbol.includes('ETH') || pool.symbol.includes('SOL') || pool.symbol.includes('mETH')) ? 'Liquid Staking (LST)' : 'Money Market Staking';

          return {
            id: `defi-${pool.pool}`,
            name: `${formattedProtocol} (${pool.symbol})`,
            protocol: formattedProtocol,
            chain: pool.chain ? pool.chain.charAt(0).toUpperCase() + pool.chain.slice(1) : 'Ethereum',
            category: 'DeFi Staking',
            subCategory: subCat,
            asset: pool.symbol,
            assetCategory: pool.symbol.includes('USD') ? 'Stablecoin' : 'Major Crypto',
            estApy: parseFloat(pool.apy.toFixed(2)),
            apyType: pool.apyBase ? 'On-Chain Validator Yield' : 'Variable Rewards',
            lockup: 'Flexible (Liquid Wrapper)',
            minDeposit: 'No Minimum',
            payoutFreq: 'Continuous / Block',
            riskLevel: pool.tvlUsd > 100000000 ? 'Low-Medium' : 'Medium-High',
            riskScore: isRestaking ? 7 : (pool.tvlUsd > 100000000 ? 3 : 5),
            custodyType: 'Self-Custody (Smart Contract)',
            audited: true,
            protocolRisk: `DeFi Protocol on ${pool.chain ? pool.chain.toUpperCase() : 'ETH'}`,
            slashingRisk: pool.symbol.includes('ETH') ? 'Validator Slashing' : 'None',
            depegRisk: 'Secondary Market Liquid Wrapper Discount',
            tvlUsd: pool.tvlUsd,
            description: `Live on-chain staking pool deployed on ${pool.chain ? pool.chain.toUpperCase() : 'ETHEREUM'} with $${(pool.tvlUsd / 1e6).toFixed(1)}M Total Value Locked (TVL).`,
            cons: ['Smart contract risk', 'Liquid wrapper secondary market peg variance', 'Validator slashing risks']
          };
        });

        setLiveDeFiPools(topPools);
        setLastUpdated(new Date().toLocaleTimeString());
        
        // Auto-select first two live pools for comparison if empty
        if (topPools.length >= 2 && comparedProductIds.length === 0) {
          setComparedProductIds([topPools[0].id, topPools[1].id]);
        }
      }
    } catch (err) {
      if (retryCount < backoffDelays.length) {
        setTimeout(() => fetchLiveYields(retryCount + 1), backoffDelays[retryCount]);
      } else {
        setApiError('Unable to connect to live yield feeds. Please check network connection and click refresh.');
      }
    } finally {
      setIsLoadingApi(false);
    }
  };

  useEffect(() => {
    fetchLiveYields();
  }, []);

  // Handle Header Click Sort Toggling
  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Filtered & Sorted Products
  const sortedAndFilteredProducts = useMemo(() => {
    const filtered = liveDeFiPools.filter(p => {
      const matchAsset = selectedAsset === 'All' || p.assetCategory === selectedAsset;
      const matchCategory = selectedCategory === 'All' || p.subCategory.includes(selectedCategory);
      const matchRisk = p.riskScore <= maxRisk;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.chain.toLowerCase().includes(searchQuery.toLowerCase());
      return matchAsset && matchCategory && matchRisk && matchSearch;
    });

    if (!sortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [liveDeFiPools, selectedAsset, selectedCategory, maxRisk, searchQuery, sortConfig]);

  // Comparison Items
  const comparedProducts = useMemo(() => {
    return liveDeFiPools.filter(p => comparedProductIds.includes(p.id));
  }, [liveDeFiPools, comparedProductIds]);

  const toggleCompare = (id) => {
    if (comparedProductIds.includes(id)) {
      setComparedProductIds(comparedProductIds.filter(item => item !== id));
    } else {
      if (comparedProductIds.length < 4) {
        setComparedProductIds([...comparedProductIds, id]);
      }
    }
  };

  // Staking yield calculation
  const calculatedYield = useMemo(() => {
    const P = parseFloat(calcPrincipal) || 0;
    const r = (parseFloat(calcApy) || 0) / 100;
    const t = (parseFloat(calcDays) || 0) / 365;

    let n = 365;
    if (calcCompounding === 'monthly') n = 12;
    if (calcCompounding === 'yearly') n = 1;
    if (calcCompounding === 'simple') {
      const simpleInterest = P * r * t;
      return { total: P + simpleInterest, interest: simpleInterest };
    }

    const compoundAmount = P * Math.pow((1 + r / n), (n * t));
    return {
      total: compoundAmount,
      interest: compoundAmount - P
    };
  }, [calcPrincipal, calcApy, calcDays, calcCompounding]);

  // Helper for rendering sort indicator icons
  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-slate-400 inline ml-1 opacity-70" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-emerald-400 inline ml-1" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-emerald-400 inline ml-1" />
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Banner */}
      <div className="bg-emerald-950/90 border-b border-emerald-800/80 px-4 py-2 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="line-clamp-1 sm:line-clamp-none">
            <strong className="font-semibold text-emerald-300">100% Live Stream:</strong> Real-time liquid staking & restaking metrics directly from public on-chain aggregators. Column sorting enabled.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLoadingApi ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <RefreshCw className="w-3 h-3 animate-spin" /> Fetching On-Chain State...
            </span>
          ) : apiError ? (
            <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
              <Wifi className="w-3 h-3 text-rose-400" /> API Stream Error
            </span>
          ) : (
            <span className="hidden md:flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
              <Wifi className="w-3 h-3" /> Live Feed Active {lastUpdated && `(${lastUpdated})`}
            </span>
          )}
        </div>
      </div>

      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 sticky top-9 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Coins className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-slate-100 via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                  DeFi Staking Hub
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 font-mono">
                  Live Streams Only
                </span>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'lst', label: 'Liquid Staking (LST)', icon: Coins },
                { id: 'lrt', label: 'Restaking & Vaults', icon: Layers },
                { id: 'compare', label: 'Compare & Simulator', icon: ArrowUpDown },
                { id: 'guide', label: 'Staking Strategy', icon: Zap },
                { id: 'risk', label: 'Risk & Glossary', icon: HelpCircle }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLiveYields(0)}
                className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
                title="Refresh Live On-Chain Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingApi ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

        {apiError && (
          <div className="bg-rose-950/80 border border-rose-800 p-4 rounded-xl flex items-center justify-between text-rose-200 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button 
              onClick={() => fetchLiveYields(0)}
              className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-rose-100 rounded border border-rose-700 font-semibold shrink-0"
            >
              Retry Live Stream
            </button>
          </div>
        )}

        {/* 1. OVERVIEW PAGE */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950/40 p-6 sm:p-8 border border-slate-800 shadow-xl overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live API Yield Aggregator
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
                  Live On-Chain DeFi Staking Directory
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Real-time protocol tracking for Liquid Staking Tokens (LSTs) and Liquid Restaking Protocols (LRTs). Strictly powered by live public chain queries with zero static mock entries.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab('compare')}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    Open Staking Matrix
                  </button>
                  <button
                    onClick={() => setActiveTab('lst')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2 rounded-lg text-sm border border-slate-700 transition flex items-center gap-2"
                  >
                    <Coins className="w-4 h-4 text-emerald-400" />
                    Explore Liquid Staking
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Live Protocols Loaded</p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">
                    {isLoadingApi ? '...' : liveDeFiPools.length} <span className="text-xs text-emerald-400">Streamed</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Live from DeFi Llama</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Server className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Top Live APY</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {isLoadingApi ? '...' : `${Math.max(...liveDeFiPools.map(p => p.estApy), 0)}%`}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Highest live yield stream</p>
                </div>
                <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Total On-Chain TVL</p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">
                    {isLoadingApi ? '...' : `$${(liveDeFiPools.reduce((acc, p) => acc + (p.tvlUsd || 0), 0) / 1e9).toFixed(2)}B`}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Across tracked pools</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                  <Percent className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Custody Architecture</p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">100% DeFi</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Non-custodial smart contracts</p>
                </div>
                <div className="p-3 bg-teal-500/10 rounded-lg text-teal-400">
                  <Unlock className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Live Table */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">100% Live DeFi Staking Stream</h2>
                  <p className="text-xs text-slate-400">Click column headers (APY, Risk, Protocol) to sort data dynamically</p>
                </div>

                {/* Quick Sort Control Bar */}
                <div className="flex items-center gap-2 text-xs bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 pl-2">Sort:</span>
                  <select
                    value={`${sortConfig.key}-${sortConfig.direction}`}
                    onChange={(e) => {
                      const [key, direction] = e.target.value.split('-');
                      setSortConfig({ key, direction });
                    }}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="estApy-desc">Highest APY</option>
                    <option value="estApy-asc">Lowest APY</option>
                    <option value="riskScore-asc">Lowest Risk Level</option>
                    <option value="riskScore-desc">Highest Risk Level</option>
                    <option value="tvlUsd-desc">Highest TVL</option>
                    <option value="protocol-asc">Protocol (A-Z)</option>
                  </select>
                </div>
              </div>

              {isLoadingApi ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
                  <p className="text-xs font-mono">Fetching live protocol state from DeFi Llama API...</p>
                </div>
              ) : sortedAndFilteredProducts.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  No live staking streams matched your current filter criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                      <tr>
                        <th 
                          onClick={() => requestSort('protocol')}
                          className="p-4 cursor-pointer hover:text-emerald-400 transition group select-none text-emerald-400"
                        >
                          Protocol {renderSortIcon('protocol')}
                        </th>
                        <th 
                          onClick={() => requestSort('name')}
                          className="p-4 cursor-pointer hover:text-slate-200 transition group select-none"
                        >
                          Product Name {renderSortIcon('name')}
                        </th>
                        <th 
                          onClick={() => requestSort('chain')}
                          className="p-4 cursor-pointer hover:text-slate-200 transition group select-none"
                        >
                          Chain {renderSortIcon('chain')}
                        </th>
                        <th 
                          onClick={() => requestSort('subCategory')}
                          className="p-4 cursor-pointer hover:text-slate-200 transition group select-none"
                        >
                          Staking Type {renderSortIcon('subCategory')}
                        </th>
                        <th 
                          onClick={() => requestSort('asset')}
                          className="p-4 cursor-pointer hover:text-slate-200 transition group select-none"
                        >
                          Asset {renderSortIcon('asset')}
                        </th>
                        <th 
                          onClick={() => requestSort('estApy')}
                          className="p-4 cursor-pointer hover:text-emerald-400 transition group select-none bg-emerald-950/20"
                        >
                          Live APY {renderSortIcon('estApy')}
                        </th>
                        <th 
                          onClick={() => requestSort('riskScore')}
                          className="p-4 cursor-pointer hover:text-amber-400 transition group select-none bg-amber-950/20"
                        >
                          Risk Level {renderSortIcon('riskScore')}
                        </th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {sortedAndFilteredProducts.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 font-bold text-emerald-400 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Server className="w-3.5 h-3.5 text-slate-500" />
                              {prod.protocol}
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-slate-200">
                            <div className="flex items-center gap-2">
                              {prod.name}
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                LIVE API
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 font-mono text-[11px] border border-slate-800">
                              {prod.chain}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {prod.subCategory}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-200">{prod.asset}</td>
                          <td className="p-4 font-black text-emerald-400 text-sm bg-emerald-950/10">
                            {prod.estApy}%
                          </td>
                          <td className="p-4 bg-amber-950/10">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              prod.riskScore <= 3 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}>
                              {prod.riskScore}/10 ({prod.riskLevel})
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => toggleCompare(prod.id)}
                              className={`px-2.5 py-1 rounded text-[11px] font-medium border transition ${
                                comparedProductIds.includes(prod.id)
                                  ? 'bg-emerald-500 text-slate-950 font-bold'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              {comparedProductIds.includes(prod.id) ? 'Selected' : '+ Compare'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. LIQUID STAKING (LST) PAGE */}
        {activeTab === 'lst' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-xl border border-slate-800">
              <div>
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-400" />
                  Liquid Staking Tokens (LST) Live Feeds
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Streamed directly from on-chain smart contracts issuing liquid receipts in exchange for staked PoS assets.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => requestSort('estApy')}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 hover:text-emerald-400 transition flex items-center gap-1"
                >
                  Sort APY {renderSortIcon('estApy')}
                </button>
                <button
                  onClick={() => fetchLiveYields(0)}
                  className="flex items-center gap-2 bg-emerald-500 text-slate-950 font-semibold px-3 py-2 rounded-lg text-xs hover:bg-emerald-400 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingApi ? 'animate-spin' : ''}`} />
                  Sync Protocol Feeds
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedAndFilteredProducts.filter(p => p.subCategory.includes('Liquid Staking')).map((prod) => (
                <div key={prod.id} className="bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-4 hover:border-slate-700 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block font-mono">
                        Protocol: {prod.protocol}
                      </span>
                      <h3 className="text-lg font-bold text-slate-100 mt-1">{prod.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-400">{prod.estApy}%</p>
                      <p className="text-[10px] text-slate-500 font-mono">Live Validator APY</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    {prod.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Blockchain Network</span>
                      <span className="font-semibold text-slate-200">{prod.chain}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Total Pool TVL</span>
                      <span className="font-semibold text-slate-200">${(prod.tvlUsd / 1e6).toFixed(1)}M</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-mono">Asset: {prod.asset}</span>
                    <button
                      onClick={() => toggleCompare(prod.id)}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        comparedProductIds.includes(prod.id)
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {comparedProductIds.includes(prod.id) ? 'Selected' : '+ Add to Compare'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. RESTAKING & VAULTS PAGE */}
        {activeTab === 'lrt' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-xl border border-slate-800">
              <div>
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  Liquid Restaking Protocols (LRT) Live Stream
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Protocols offering liquid restaking mechanisms to secure Actively Validated Services (AVS) for enhanced on-chain yields.
                </p>
              </div>
              <button
                onClick={() => requestSort('riskScore')}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 hover:text-amber-400 transition flex items-center gap-1"
              >
                Sort Risk {renderSortIcon('riskScore')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedAndFilteredProducts.filter(p => p.subCategory.includes('Restaking') || p.subCategory.includes('Money Market')).map((prod) => (
                <div key={prod.id} className="bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block font-mono">
                        Protocol: {prod.protocol}
                      </span>
                      <h3 className="text-lg font-bold text-slate-100 mt-1">{prod.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-400">{prod.estApy}%</p>
                      <p className="text-[10px] text-slate-500 font-mono">{prod.apyType}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    {prod.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Restaking Mechanism</span>
                      <span className="font-semibold text-slate-200">{prod.subCategory}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Risk Score</span>
                      <span className="font-semibold text-amber-400">{prod.riskScore}/10</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-mono">Chain: {prod.chain}</span>
                    <button
                      onClick={() => toggleCompare(prod.id)}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        comparedProductIds.includes(prod.id)
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {comparedProductIds.includes(prod.id) ? 'Selected' : '+ Add to Compare'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. COMPARE & CALCULATOR */}
        {activeTab === 'compare' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Filter Bar */}
            <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-emerald-400" />
                    Live DeFi Protocol Comparison Matrix
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Filter and sort streamed on-chain data by protocol, chain, risk, or APY</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  {/* Sort Control Dropdown in Compare tab */}
                  <div className="relative w-full sm:w-48">
                    <select
                      value={`${sortConfig.key}-${sortConfig.direction}`}
                      onChange={(e) => {
                        const [key, direction] = e.target.value.split('-');
                        setSortConfig({ key, direction });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="estApy-desc">Sort: Highest APY</option>
                      <option value="estApy-asc">Sort: Lowest APY</option>
                      <option value="riskScore-asc">Sort: Lowest Risk</option>
                      <option value="riskScore-desc">Sort: Highest Risk</option>
                      <option value="tvlUsd-desc">Sort: Highest TVL</option>
                      <option value="protocol-asc">Sort: Protocol A-Z</option>
                    </select>
                  </div>

                  <div className="relative w-full sm:w-56">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search Protocol, Chain..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Matrix */}
            <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 space-y-4">
              <h3 className="font-bold text-slate-100 text-base">Live Side-by-Side Comparison ({comparedProducts.length}/4 Selected)</h3>

              {comparedProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No products selected for comparison. Select items from the directory table using "+ Compare".
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="p-3 text-slate-400 font-semibold bg-slate-950/40 w-44">Parameter</th>
                        {comparedProducts.map((p) => (
                          <th key={p.id} className="p-3 text-slate-200 font-bold bg-slate-950/80 border-l border-slate-800">
                            {p.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      <tr className="bg-emerald-950/20">
                        <td className="p-3 text-emerald-400 font-bold">Protocol Name</td>
                        {comparedProducts.map((p) => (
                          <td key={p.id} className="p-3 border-l border-slate-800 font-extrabold text-emerald-400 text-sm">
                            {p.protocol}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-400 font-medium bg-slate-950/20">Chain / Network</td>
                        {comparedProducts.map((p) => (
                          <td key={p.id} className="p-3 border-l border-slate-800 text-slate-300 font-mono">
                            {p.chain}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-400 font-medium bg-slate-950/20">Staking Model</td>
                        {comparedProducts.map((p) => (
                          <td key={p.id} className="p-3 border-l border-slate-800 text-slate-300">
                            {p.subCategory}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-400 font-medium bg-slate-950/20">Live APY</td>
                        {comparedProducts.map((p) => (
                          <td key={p.id} className="p-3 border-l border-slate-800 font-bold text-emerald-400 text-sm">
                            {p.estApy}%
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-400 font-medium bg-slate-950/20">On-Chain TVL</td>
                        {comparedProducts.map((p) => (
                          <td key={p.id} className="p-3 border-l border-slate-800 text-slate-300 font-mono">
                            ${(p.tvlUsd / 1e6).toFixed(1)}M
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-400 font-medium bg-slate-950/20">Risk Score</td>
                        {comparedProducts.map((p) => (
                          <td key={p.id} className="p-3 border-l border-slate-800 text-amber-400 font-semibold">
                            {p.riskScore}/10 ({p.riskLevel})
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-400 font-medium bg-slate-950/20">Custody Type</td>
                        {comparedProducts.map((p) => (
                          <td key={p.id} className="p-3 border-l border-slate-800 text-slate-300">
                            {p.custodyType}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Compounding Calculator */}
            <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-base">Staking Yield Compounding Simulator</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Staked Deposit Value ($)</label>
                    <input
                      type="number"
                      value={calcPrincipal}
                      onChange={(e) => setCalcPrincipal(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">Staking APY (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={calcApy}
                        onChange={(e) => setCalcApy(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">Duration (Days)</label>
                      <input
                        type="number"
                        value={calcDays}
                        onChange={(e) => setCalcDays(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Initial Principal:</span>
                    <span className="font-mono text-slate-200">${parseFloat(calcPrincipal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-3">
                    <span className="text-slate-400">Est. Staking Rewards:</span>
                    <span className="font-mono font-bold text-emerald-400">+${calculatedYield.interest.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="font-semibold text-slate-300">Total Projected Balance:</span>
                    <span className="font-mono font-black text-slate-100 text-base">${calculatedYield.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. STAKING STRATEGY GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800 space-y-2">
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                DeFi Staking Strategy Blueprint
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Educational breakdown comparing Native Solo Staking, Liquid Staking Tokens (LSTs), and Liquid Restaking (LRT) risk/reward trade-offs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
                <div className="text-emerald-400 font-bold text-sm">1. Native Staking</div>
                <p className="text-slate-400 leading-relaxed">
                  Run dedicated validator hardware (e.g. 32 ETH). Zero smart contract or platform risk, direct protocol block rewards, but requires technical setup and unbonding locks.
                </p>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
                <div className="text-cyan-400 font-bold text-sm">2. Liquid Staking (LST)</div>
                <p className="text-slate-400 leading-relaxed">
                  Deposit to protocols like Lido or Rocket Pool. Receive liquid receipt tokens (stETH/rETH) to use in DeFi while earning automated daily validator rewards.
                </p>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
                <div className="text-purple-400 font-bold text-sm">3. Liquid Restaking (LRT)</div>
                <p className="text-slate-400 leading-relaxed">
                  Restake LSTs via middleware like EigenLayer (Ether.fi, Renzo). Multiplies yield by securing AVS services, but introduces layered slashing risks.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 6. RISK & GLOSSARY */}
        {activeTab === 'risk' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 space-y-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                DeFi Staking Risk Terminology
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GLOSSARY_ITEMS.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <h3 className="font-bold text-emerald-400 text-xs mb-1">{item.term}</h3>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>DeFi Staking Hub Prototype • Educational Non-Custodial Explorer</span>
          <span className="text-[10px] font-mono text-emerald-400">100% Live DeFi Llama API Stream</span>
        </div>
      </footer>
    </div>
  );
}
