import React, { useState, useEffect } from 'react';
import { 
  Bird, 
  Egg, 
  CircleDollarSign, 
  LayoutDashboard, 
  Plus, 
  Trash2, 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning,
  Thermometer,
  Wind,
  Settings,
  Edit2,
  Check,
  X,
  MapPin,
  Search,
  Droplets,
  TrendingUp,
  Calendar,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

// Utility for formatting dates safely
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    if (typeof dateString === 'string' && dateString.includes('-')) {
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        const date = new Date(year, parseInt(month) - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); // Removed year for cleaner UI in charts/logs
        }
      }
    }
    const fallbackDate = new Date(dateString);
    if (!isNaN(fallbackDate.getTime())) return fallbackDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return String(dateString);
  } catch (e) {
    return String(dateString);
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [weather, setWeather] = useState(null);
  
  // Settings & Location state (with LocalStorage)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [locationConfig, setLocationConfig] = useState(() => {
    const saved = localStorage.getItem('flock_location');
    return saved ? JSON.parse(saved) : { type: 'auto', lat: 43.2231, lon: -71.0481, name: 'Barrington, NH' };
  });
  const [locationSearch, setLocationSearch] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Save location changes
  useEffect(() => { localStorage.setItem('flock_location', JSON.stringify(locationConfig)); }, [locationConfig]);

  // Cute egg logger state
  const [tappedEggs, setTappedEggs] = useState(0);
  const [isWobbling, setIsWobbling] = useState(false);
  const [floatingEggs, setFloatingEggs] = useState([]);
  
  // App Data State (Initialized from LocalStorage)
  const [flock, setFlock] = useState(() => {
    const saved = localStorage.getItem('flock_birds');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Henrietta', breed: 'Rhode Island Red', hatchDate: '2024-03-01' },
      { id: 2, name: 'Mabel', breed: 'Plymouth Rock', hatchDate: '2024-03-15' }
    ];
  });
  
  const [eggLogs, setEggLogs] = useState(() => {
    const saved = localStorage.getItem('flock_eggs');
    return saved ? JSON.parse(saved) : [
      { id: 1, date: new Date(Date.now() - 86400000).toISOString().split('T')[0], count: 2, weather: { temp: 45, humidity: 60, code: 3 } }
    ];
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('flock_expenses');
    return saved ? JSON.parse(saved) : [
      { id: 1, date: new Date().toISOString().split('T')[0], item: 'Layer Pellets (50lb)', cost: 22.99 }
    ];
  });

  // Save data whenever it changes
  useEffect(() => { localStorage.setItem('flock_birds', JSON.stringify(flock)); }, [flock]);
  useEffect(() => { localStorage.setItem('flock_eggs', JSON.stringify(eggLogs)); }, [eggLogs]);
  useEffect(() => { localStorage.setItem('flock_expenses', JSON.stringify(expenses)); }, [expenses]);

  // Form states
  const [newBird, setNewBird] = useState({ name: '', breed: '', hatchDate: '' });
  const [newEggLog, setNewEggLog] = useState({ date: new Date().toISOString().split('T')[0], count: '' });
  const [newExpense, setNewExpense] = useState({ date: new Date().toISOString().split('T')[0], item: '', cost: '' });
  const [editingLogId, setEditingLogId] = useState(null);
  const [editLogData, setEditLogData] = useState({ date: '', count: '' });

  // Fetch automatic weather
  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`);
        const data = await res.json();
        if (data.current) {
          setWeather({ 
            temperature: Math.round(data.current.temperature_2m),
            humidity: Math.round(data.current.relative_humidity_2m),
            weathercode: data.current.weather_code,
            windspeed: Math.round(data.current.wind_speed_10m),
            locationName: locationConfig.name 
          });
        }
      } catch (e) {
        console.error("Failed to fetch weather data", e);
      }
    };

    if (locationConfig.type === 'manual') fetchWeather(locationConfig.lat, locationConfig.lon);
    else {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
          () => fetchWeather(43.2231, -71.0481)
        );
      } else fetchWeather(43.2231, -71.0481);
    }
  }, [locationConfig]);

  // ... (keeping existing handlers for Search, Weather Icons, Birds, etc.)
  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!locationSearch) return;
    setIsSearchingLocation(true);
    setLocationError('');
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationSearch)}&count=1&language=en`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const locName = `${result.name}${result.admin1 ? `, ${result.admin1}` : ''}`;
        setLocationConfig({ type: 'manual', lat: result.latitude, lon: result.longitude, name: locName });
        setIsSettingsOpen(false);
        setLocationSearch('');
      } else setLocationError('Location not found. Please try again.');
    } catch (err) { setLocationError('Error connecting to map service.'); } 
    finally { setIsSearchingLocation(false); }
  };

  const getWeatherIcon = (code, sizeClass = "w-8 h-8") => {
    if (code === undefined) return <Sun className={`${sizeClass} text-yellow-500`} />;
    if (code <= 1) return <Sun className={`${sizeClass} text-yellow-500`} />;
    if (code <= 3) return <Cloud className={`${sizeClass} text-gray-400`} />;
    if (code <= 67) return <CloudRain className={`${sizeClass} text-blue-500`} />;
    if (code <= 77) return <CloudSnow className={`${sizeClass} text-blue-200`} />;
    if (code >= 95) return <CloudLightning className={`${sizeClass} text-purple-500`} />;
    return <Cloud className={`${sizeClass} text-gray-400`} />;
  };

  const getWeatherDescription = (code) => {
    if (code === undefined) return "Loading...";
    if (code === 0) return "Clear sky";
    if (code <= 3) return "Partly cloudy";
    if (code === 45 || code === 48) return "Foggy";
    if (code <= 67) return "Rainy";
    if (code <= 77) return "Snowy";
    if (code >= 95) return "Thunderstorms";
    return "Overcast";
  };

  const handleAddBird = (e) => {
    e.preventDefault();
    if (!newBird.name) return;
    setFlock([...flock, { ...newBird, id: Date.now() }]);
    setNewBird({ name: '', breed: '', hatchDate: '' });
  };

  const handleAddEggLog = (e) => {
    e.preventDefault();
    if (!newEggLog.count || isNaN(newEggLog.count)) return;
    const weatherToLog = weather ? { temp: weather.temperature, humidity: weather.humidity, code: weather.weathercode } : null;
    saveEggEntry(newEggLog.date, parseInt(newEggLog.count, 10), weatherToLog);
    setNewEggLog({ date: new Date().toISOString().split('T')[0], count: '' });
  };

  const handleChickenTap = () => {
    setIsWobbling(false);
    setTimeout(() => setIsWobbling(true), 10);
    setTappedEggs(prev => prev + 1);
    const newEgg = { id: Date.now() };
    setFloatingEggs(prev => [...prev, newEgg]);
    setTimeout(() => { setFloatingEggs(prev => prev.filter(egg => egg.id !== newEgg.id)); }, 800);
  };

  const handleSaveTappedEggs = () => {
    if (tappedEggs === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const weatherToLog = weather ? { temp: weather.temperature, humidity: weather.humidity, code: weather.weathercode } : null;
    saveEggEntry(today, tappedEggs, weatherToLog);
    setTappedEggs(0);
  };

  const saveEggEntry = (dateStr, countStr, weatherObj) => {
    const existingLogIndex = eggLogs.findIndex(log => log.date === dateStr);
    if (existingLogIndex >= 0) {
      const updatedLogs = [...eggLogs];
      updatedLogs[existingLogIndex].count += countStr;
      if (!updatedLogs[existingLogIndex].weather && weatherObj) updatedLogs[existingLogIndex].weather = weatherObj;
      setEggLogs(updatedLogs);
    } else {
      setEggLogs([{ date: dateStr, count: countStr, id: Date.now(), weather: weatherObj }, ...eggLogs].sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.item || !newExpense.cost) return;
    setExpenses([{ ...newExpense, cost: parseFloat(newExpense.cost), id: Date.now() }, ...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)));
    setNewExpense({ date: new Date().toISOString().split('T')[0], item: '', cost: '' });
  };

  const deleteBird = (id) => setFlock(flock.filter(bird => bird.id !== id));
  const deleteEggLog = (id) => setEggLogs(eggLogs.filter(log => log.id !== id));
  const deleteExpense = (id) => setExpenses(expenses.filter(exp => exp.id !== id));

  const startEditingLog = (log) => { setEditingLogId(log.id); setEditLogData({ date: log.date, count: log.count }); };
  const saveEditedLog = () => {
    if (!editLogData.count || isNaN(editLogData.count)) return;
    setEggLogs(eggLogs.map(log => log.id === editingLogId ? { ...log, date: editLogData.date, count: parseInt(editLogData.count, 10) } : log).sort((a, b) => new Date(b.date) - new Date(a.date)));
    setEditingLogId(null);
  };

  // --- Calculations & Analytics ---
  const totalEggs = eggLogs.reduce((sum, log) => sum + log.count, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.cost, 0);
  const costPerDozen = totalEggs > 0 ? ((totalExpenses / totalEggs) * 12).toFixed(2) : '0.00';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  let earliestLogTime = startOfToday;
  if (eggLogs.length > 0) {
    earliestLogTime = Math.min(...eggLogs.map(log => {
      const [y, m, d] = log.date.split('-');
      return new Date(y, parseInt(m) - 1, d).getTime();
    }));
  }
  
  const daysTracking = Math.max(1, Math.ceil((startOfToday - earliestLogTime) / (1000 * 60 * 60 * 24)) + 1);
  const avgPerDayAllTime = (totalEggs / daysTracking).toFixed(1);

  const eggsLast7Days = eggLogs.reduce((sum, log) => {
    const [y, m, d] = log.date.split('-');
    if ((startOfToday - new Date(y, parseInt(m) - 1, d).getTime()) <= 7 * 24 * 60 * 60 * 1000) return sum + log.count;
    return sum;
  }, 0);

  const eggsLast30Days = eggLogs.reduce((sum, log) => {
    const [y, m, d] = log.date.split('-');
    if ((startOfToday - new Date(y, parseInt(m) - 1, d).getTime()) <= 30 * 24 * 60 * 60 * 1000) return sum + log.count;
    return sum;
  }, 0);

  // Generate Chart Data (Last 7 Days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const log = eggLogs.find(l => l.date === dateStr);
    return { date: dateStr, displayDate: formatDate(dateStr), count: log ? log.count : 0 };
  });
  const maxChartCount = Math.max(...chartData.map(d => d.count), 5); // Minimum scale of 5

  return (
    <div className="min-h-screen bg-orange-50 text-gray-800 font-sans pb-20 md:pb-0 md:flex">
      <style>{`
        @keyframes drop-egg { 0% { transform: translate(-50%, -20px) scale(0.5); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(-50%, 60px) scale(1.2); opacity: 0; } }
        .animate-drop { animation: drop-egg 0.8s ease-out forwards; }
        @keyframes wobble-chicken { 0% { transform: rotate(0deg); } 25% { transform: rotate(-15deg) scale(1.1); } 50% { transform: rotate(10deg) scale(1.1); } 75% { transform: rotate(-5deg) scale(1.1); } 100% { transform: rotate(0deg) scale(1); } }
        .animate-wobble { animation: wobble-chicken 0.3s ease-in-out; }
        @keyframes fade-in-scale { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in-scale 0.3s ease-out forwards; }
      `}</style>

      {/* Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-orange-200 flex justify-around p-3 z-50 md:relative md:w-64 md:border-t-0 md:border-r md:flex-col md:justify-start md:p-6 md:h-screen shadow-lg">
        <div className="hidden md:flex items-center gap-2 mb-10 text-orange-600 font-bold text-2xl">
          <svg viewBox="0 0 100 100" className="w-8 h-8 drop-shadow-sm">
            <path d="M 35 85 L 35 95 M 28 95 L 42 95" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
            <path d="M 65 85 L 65 95 M 58 95 L 72 95" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
            <path d="M 35 28 C 30 15 45 10 50 20 C 55 10 70 15 65 28 Z" fill="#ef4444" />
            <circle cx="50" cy="55" r="32" fill="#fffbeb" stroke="#f59e0b" strokeWidth="4" />
            <path d="M 18 55 C 8 65 12 80 28 75" fill="#fde68a" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 82 55 C 92 65 88 80 72 75" fill="#fde68a" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="32" cy="55" r="5" fill="#fca5a5" opacity="0.6" />
            <circle cx="68" cy="55" r="5" fill="#fca5a5" opacity="0.6" />
            <circle cx="38" cy="45" r="4" fill="#1f2937" />
            <circle cx="37" cy="43" r="1.5" fill="#ffffff" />
            <circle cx="62" cy="45" r="4" fill="#1f2937" />
            <circle cx="61" cy="43" r="1.5" fill="#ffffff" />
            <path d="M 46 58 C 44 65 50 68 50 62 C 50 68 56 65 54 58 Z" fill="#ef4444" />
            <path d="M 42 50 L 58 50 L 50 58 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <span>Flock Tracker</span>
        </div>
        
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { id: 'flock', icon: Bird, label: 'My Flock' },
          { id: 'eggs', icon: Egg, label: 'Egg Logs' },
          { id: 'expenses', icon: CircleDollarSign, label: 'Expenses' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:p-3 md:mb-2 rounded-xl transition-colors ${
              activeTab === item.id ? 'text-orange-600 bg-orange-100 md:font-semibold' : 'text-gray-500 hover:bg-orange-50 hover:text-orange-500'
            }`}
          >
            <item.icon className="w-6 h-6 md:w-5 md:h-5" />
            <span className="text-xs md:text-base">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto relative">
        <button onClick={() => setIsSettingsOpen(true)} className="absolute top-4 right-4 md:top-8 md:right-8 p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors z-10" title="Settings">
          <Settings className="w-6 h-6" />
        </button>

        <div className="md:hidden flex items-center gap-2 mb-6 text-orange-600 font-bold text-xl pr-12">
           <svg viewBox="0 0 100 100" className="w-8 h-8 drop-shadow-sm">
            <path d="M 35 85 L 35 95 M 28 95 L 42 95" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
            <path d="M 65 85 L 65 95 M 58 95 L 72 95" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
            <path d="M 35 28 C 30 15 45 10 50 20 C 55 10 70 15 65 28 Z" fill="#ef4444" />
            <circle cx="50" cy="55" r="32" fill="#fffbeb" stroke="#f59e0b" strokeWidth="4" />
            <path d="M 18 55 C 8 65 12 80 28 75" fill="#fde68a" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 82 55 C 92 65 88 80 72 75" fill="#fde68a" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="32" cy="55" r="5" fill="#fca5a5" opacity="0.6" />
            <circle cx="68" cy="55" r="5" fill="#fca5a5" opacity="0.6" />
            <circle cx="38" cy="45" r="4" fill="#1f2937" />
            <circle cx="37" cy="43" r="1.5" fill="#ffffff" />
            <circle cx="62" cy="45" r="4" fill="#1f2937" />
            <circle cx="61" cy="43" r="1.5" fill="#ffffff" />
            <path d="M 46 58 C 44 65 50 68 50 62 C 50 68 56 65 54 58 Z" fill="#ef4444" />
            <path d="M 42 50 L 58 50 L 50 58 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <span>Flock Tracker</span>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            
            {/* Smart Weather Alerts */}
            {weather && weather.temperature <= 32 && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-blue-800">Freezing Temp Alert!</h4>
                  <p className="text-sm text-blue-700">It's {weather.temperature}°F. Make sure your flock's water isn't frozen and they are draft-free.</p>
                </div>
              </div>
            )}
            {weather && weather.temperature >= 85 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-red-800">Heat Alert!</h4>
                  <p className="text-sm text-red-700">It's {weather.temperature}°F. Ensure your flock has access to deep shade, ventilation, and fresh cool water.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">{weather && getWeatherIcon(weather.weathercode)}</div>
                <h3 className="text-gray-500 font-medium mb-4 flex items-center gap-2"><Thermometer className="w-4 h-4" /> Current Weather</h3>
                {weather ? (
                  <div>
                    <div className="flex items-end gap-3 mb-2">
                      <span className="text-4xl font-bold text-gray-800">{weather.temperature}°F</span>
                      {getWeatherIcon(weather.weathercode)}
                    </div>
                    <p className="text-gray-600 font-medium">{getWeatherDescription(weather.weathercode)}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1"><Wind className="w-4 h-4" /><span>{weather.windspeed} mph</span></div>
                      <div className="flex items-center gap-1"><Droplets className="w-4 h-4" /><span>{weather.humidity}% hum</span></div>
                    </div>
                  {weather.locationName && locationConfig.type === 'manual' && (
                    <p className="text-xs text-gray-400 mt-3 flex items-center gap-1"><MapPin className="w-3 h-3" /> {weather.locationName}</p>
                  )}
                </div>
              ) : (
                <div className="animate-pulse flex flex-col gap-2"><div className="h-10 w-24 bg-gray-200 rounded"></div><div className="h-4 w-32 bg-gray-200 rounded"></div></div>
              )}
              </div>

              <div className="bg-orange-500 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-between">
                <h3 className="text-orange-100 font-medium mb-2 flex items-center gap-2"><Egg className="w-4 h-4" /> Total Eggs Logged</h3>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold">{totalEggs}</span>
                  {totalEggs > 0 && <span className="text-orange-200 font-medium mb-1">~{avgPerDayAllTime}/day</span>}
                </div>
                <p className="text-orange-100 text-sm mt-2">All time production</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex flex-col justify-between">
                <h3 className="text-gray-500 font-medium mb-2 flex items-center gap-2"><Bird className="w-4 h-4" /> Flock Size</h3>
                <span className="text-5xl font-bold text-gray-800">{flock.length}</span>
                <p className="text-gray-500 text-sm mt-2">Active birds</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cute Logger */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex flex-col items-center text-center">
                <h2 className="text-xl font-semibold mb-2 text-gray-800">Log Today's Eggs</h2>
                <p className="text-gray-500 text-sm mb-6">Tap the chicken for each egg collected!</p>
                <div className="relative mb-8">
                  <button onClick={handleChickenTap} className={`relative z-10 w-32 h-32 transition-transform transform active:scale-95 select-none ${isWobbling ? 'animate-wobble' : ''}`} style={{ WebkitTapHighlightColor: 'transparent' }} title="Tap me!">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                      <path d="M 35 85 L 35 95 M 28 95 L 42 95" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
                      <path d="M 65 85 L 65 95 M 58 95 L 72 95" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
                      <path d="M 35 28 C 30 15 45 10 50 20 C 55 10 70 15 65 28 Z" fill="#ef4444" />
                      <circle cx="50" cy="55" r="32" fill="#fffbeb" stroke="#f59e0b" strokeWidth="4" />
                      <path d="M 18 55 C 8 65 12 80 28 75" fill="#fde68a" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 82 55 C 92 65 88 80 72 75" fill="#fde68a" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="32" cy="55" r="5" fill="#fca5a5" opacity="0.6" />
                      <circle cx="68" cy="55" r="5" fill="#fca5a5" opacity="0.6" />
                      <circle cx="38" cy="45" r="4" fill="#1f2937" />
                      <circle cx="37" cy="43" r="1.5" fill="#ffffff" />
                      <circle cx="62" cy="45" r="4" fill="#1f2937" />
                      <circle cx="61" cy="43" r="1.5" fill="#ffffff" />
                      <path d="M 46 58 C 44 65 50 68 50 62 C 50 68 56 65 54 58 Z" fill="#ef4444" />
                      <path d="M 42 50 L 58 50 L 50 58 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {floatingEggs.map(egg => (
                    <div key={egg.id} className="absolute bottom-0 left-1/2 -translate-x-1/2 text-2xl animate-drop pointer-events-none z-0">🥚</div>
                  ))}
                </div>
                <div className="min-h-[3rem] flex flex-wrap justify-center gap-1 mb-6 max-w-full px-4">
                  {Array.from({ length: tappedEggs }).map((_, i) => (<span key={i} className="text-2xl animate-fade-in" title={`Egg ${i + 1}`}>🥚</span>))}
                  {tappedEggs === 0 && <span className="text-gray-300 text-lg mt-2">Basket empty. Tap chicken!</span>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-gray-700 w-8 text-right">{tappedEggs}</div>
                  <button onClick={handleSaveTappedEggs} disabled={tappedEggs === 0} className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-2 px-6 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Save Eggs
                  </button>
                  {tappedEggs > 0 && (
                    <button onClick={() => setTappedEggs(0)} className="text-gray-400 hover:text-red-500 p-2 transition-colors rounded-full hover:bg-red-50" title="Clear basket"><Trash2 className="w-5 h-5" /></button>
                  )}
                </div>
              </div>

              {/* 7 Day Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex flex-col">
                <h2 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-gray-400" /> Past 7 Days</h2>
                <div className="flex-1 flex items-end justify-between gap-2 h-48">
                  {chartData.map((data, i) => {
                    const heightPercent = data.count > 0 ? (data.count / maxChartCount) * 100 : 0;
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 group">
                        <span className="text-xs font-bold text-gray-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{data.count}</span>
                        <div className="w-full bg-orange-100 rounded-t-md relative flex items-end justify-center" style={{ height: '100%' }}>
                          <div 
                            className="w-full bg-orange-500 rounded-t-md transition-all duration-500"
                            style={{ height: `${heightPercent}%`, minHeight: data.count > 0 ? '4px' : '0' }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-2 rotate-[-45deg] sm:rotate-0 origin-top-left sm:origin-center">{data.displayDate}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FLOCK TAB */}
        {activeTab === 'flock' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h1 className="text-3xl font-bold text-gray-800">My Flock</h1>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Add New Bird</h2>
              <form onSubmit={handleAddBird} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input type="text" required placeholder="Bird Name" value={newBird.name} onChange={(e) => setNewBird({...newBird, name: e.target.value})} className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                <input type="text" placeholder="Breed (e.g. Silkie)" value={newBird.breed} onChange={(e) => setNewBird({...newBird, breed: e.target.value})} className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 ml-1 mb-1">Hatch Date</span>
                  <input type="date" value={newBird.hatchDate} onChange={(e) => setNewBird({...newBird, hatchDate: e.target.value})} className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-auto"><Plus className="w-5 h-5" /> Add Bird</button>
              </form>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flock.map(bird => (
                <div key={bird.id} className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100 flex flex-col relative group">
                  <button onClick={() => deleteBird(bird.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3"><Bird className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-gray-800">{bird.name}</h3>
                  <p className="text-gray-500">{bird.breed || 'Unknown Breed'}</p>
                  {bird.hatchDate && <p className="text-sm text-gray-400 mt-2">Hatched: {formatDate(bird.hatchDate)}</p>}
                </div>
              ))}
              {flock.length === 0 && <div className="col-span-full py-10 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">No birds in your flock yet.</div>}
            </div>
          </div>
        )}

        {/* EGG LOGS TAB */}
        {activeTab === 'eggs' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h1 className="text-3xl font-bold text-gray-800">Egg Production</h1>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex flex-col items-center justify-center text-center">
                <h3 className="text-gray-500 text-xs md:text-sm font-medium mb-1 flex items-center gap-1"><Calendar className="w-3 h-3 md:w-4 md:h-4" /> 7 Days</h3>
                <span className="text-2xl md:text-3xl font-bold text-gray-800">{eggsLast7Days}</span>
                <span className="text-xs font-medium text-green-600 mt-1 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {(eggsLast7Days / 7).toFixed(1)}/day</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex flex-col items-center justify-center text-center">
                <h3 className="text-gray-500 text-xs md:text-sm font-medium mb-1 flex items-center gap-1"><Calendar className="w-3 h-3 md:w-4 md:h-4" /> 30 Days</h3>
                <span className="text-2xl md:text-3xl font-bold text-gray-800">{eggsLast30Days}</span>
                <span className="text-xs font-medium text-green-600 mt-1 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {(eggsLast30Days / 30).toFixed(1)}/day</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex flex-col items-center justify-center text-center">
                <h3 className="text-gray-500 text-xs md:text-sm font-medium mb-1">All Time</h3>
                <span className="text-2xl md:text-3xl font-bold text-gray-800">{totalEggs}</span>
                <span className="text-xs font-medium text-orange-600 mt-1 bg-orange-50 px-2 py-0.5 rounded-full">~{avgPerDayAllTime}/day</span>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Manual Log</h2>
              <form onSubmit={handleAddEggLog} className="flex flex-col sm:flex-row gap-3">
                <input type="date" required value={newEggLog.date} onChange={(e) => setNewEggLog({...newEggLog, date: e.target.value})} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                <input type="number" required min="1" placeholder="Total eggs collected" value={newEggLog.count} onChange={(e) => setNewEggLog({...newEggLog, count: e.target.value})} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Save</button>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50"><h3 className="font-semibold text-gray-700">Recent Logs</h3></div>
              <div className="divide-y divide-gray-100">
                {eggLogs.map(log => (
                  <div key={log.id} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    {editingLogId === log.id ? (
                      <div className="flex-1 flex flex-col sm:flex-row gap-3 mr-4">
                        <input type="date" value={editLogData.date} onChange={(e) => setEditLogData({...editLogData, date: e.target.value})} className="flex-1 px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        <input type="number" min="0" value={editLogData.count} onChange={(e) => setEditLogData({...editLogData, count: e.target.value})} className="w-24 px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Egg className="w-5 h-5" /></div>
                        <div>
                          <p className="font-semibold text-gray-800">{formatDate(log.date)}</p>
                          <p className="text-sm text-gray-800 font-medium">{log.count} eggs collected</p>
                          {log.weather && (
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                              {getWeatherIcon(log.weather.code, "w-4 h-4")} <span>{log.weather.temp}°F</span><span>•</span><span>{log.weather.humidity}%</span><span>•</span><span>{getWeatherDescription(log.weather.code)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {editingLogId === log.id ? (
                        <><button onClick={saveEditedLog} className="text-green-500 hover:bg-green-50 p-2 rounded-full"><Check className="w-5 h-5" /></button><button onClick={() => setEditingLogId(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full"><X className="w-5 h-5" /></button></>
                      ) : (
                        <><button onClick={() => startEditingLog(log)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-full"><Edit2 className="w-5 h-5" /></button><button onClick={() => deleteEggLog(log.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full"><Trash2 className="w-5 h-5" /></button></>
                      )}
                    </div>
                  </div>
                ))}
                {eggLogs.length === 0 && <div className="py-8 text-center text-gray-500">No egg records yet.</div>}
              </div>
            </div>
          </div>
        )}

        {/* EXPENSES TAB */}
        {activeTab === 'expenses' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-800">Expenses & Feed</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
                <h3 className="text-gray-500 font-medium mb-2 flex items-center gap-2">Total Spend</h3>
                <span className="text-5xl font-bold text-gray-800">${totalExpenses.toFixed(2)}</span>
                <p className="text-gray-500 text-sm mt-2">All time expenses</p>
              </div>

              <div className="bg-green-500 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-between">
                <h3 className="text-green-100 font-medium mb-2 flex items-center gap-2">Cost Per Dozen</h3>
                <span className="text-5xl font-bold">${costPerDozen}</span>
                <p className="text-green-100 text-sm mt-2">Based on {totalEggs} total eggs laid</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Add Expense</h2>
              <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input type="date" required value={newExpense.date} onChange={(e) => setNewExpense({...newExpense, date: e.target.value})} className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                <input type="text" required placeholder="Item (e.g. Feed)" value={newExpense.item} onChange={(e) => setNewExpense({...newExpense, item: e.target.value})} className="md:col-span-2 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                <div className="relative flex">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500">$</span></div>
                  <input type="number" required step="0.01" min="0" placeholder="0.00" value={newExpense.cost} onChange={(e) => setNewExpense({...newExpense, cost: e.target.value})} className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <button type="submit" className="md:col-span-4 bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-xl flex items-center justify-center gap-2 mt-2"><Plus className="w-5 h-5" /> Add</button>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center"><h3 className="font-semibold text-gray-700">History</h3></div>
              <div className="divide-y divide-gray-100">
                {expenses.map(exp => (
                  <div key={exp.id} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-100 p-2 rounded-lg text-gray-600"><CircleDollarSign className="w-5 h-5" /></div>
                      <div>
                        <p className="font-semibold text-gray-800">{exp.item}</p>
                        <p className="text-sm text-gray-500">{formatDate(exp.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-gray-700">${exp.cost.toFixed(2)}</span>
                      <button onClick={() => deleteExpense(exp.id)} className="text-gray-300 hover:text-red-500 p-2"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && <div className="py-8 text-center text-gray-500">No expenses tracked yet.</div>}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-[100] animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Settings className="w-6 h-6 text-gray-500" /> Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-orange-500" /> Location for Weather</h3>
                <div className="flex items-center gap-3 mb-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <input type="radio" id="loc-auto" checked={locationConfig.type === 'auto'} onChange={() => setLocationConfig({ ...locationConfig, type: 'auto' })} className="w-4 h-4 text-orange-500 focus:ring-orange-500" />
                  <label htmlFor="loc-auto" className="flex-1 cursor-pointer font-medium text-gray-700">Automatic Location (GPS)</label>
                </div>
                <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <input type="radio" id="loc-manual" checked={locationConfig.type === 'manual'} onChange={() => setLocationConfig({ ...locationConfig, type: 'manual' })} className="w-4 h-4 text-orange-500 focus:ring-orange-500" />
                    <label htmlFor="loc-manual" className="flex-1 cursor-pointer font-medium text-gray-700">Custom Location</label>
                  </div>
                  {locationConfig.type === 'manual' && (
                    <form onSubmit={handleSearchLocation} className="mt-2 flex flex-col gap-2 ml-7">
                      <div className="flex gap-2">
                        <input type="text" placeholder="City, State or Zip" value={locationSearch} onChange={(e) => { setLocationSearch(e.target.value); setLocationError(''); }} className="flex-1 pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm" />
                        <button type="submit" disabled={isSearchingLocation || !locationSearch} className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium"><Search className="w-4 h-4" /></button>
                      </div>
                      {locationError && <p className="text-xs text-red-500 mt-1">{locationError}</p>}
                    </form>
                  )}
                  {locationConfig.type === 'manual' && locationConfig.name && <p className="ml-7 text-xs text-green-600 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Set to: {locationConfig.name}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}