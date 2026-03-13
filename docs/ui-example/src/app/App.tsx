import { MapPin, Calendar, Sparkles, ChevronDown, Plus, Search } from 'lucide-react';
import { useState } from 'react';

interface Fair {
  id: string;
  title: string;
  location: string;
  date: string;
  opportunities: number;
  gradient: string;
}

const fairs: Fair[] = [
  {
    id: '1',
    title: 'IFH/Intherm 2026',
    location: 'NürnbergMesse, Nürnberg, Germany',
    date: '8 Nis 2026 — 11 Nis 2026',
    opportunities: 19,
    gradient: 'from-violet-500/20 to-purple-500/20'
  },
  {
    id: '2',
    title: 'MCE Expocomfort Milano 2026',
    location: 'Fiera Milano, Rho, Milan, Italy',
    date: '17 Mar 2026 — 20 Mar 2026',
    opportunities: 14,
    gradient: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    id: '3',
    title: 'Aqua-Therm Moscow 2026',
    location: 'Crocus Expo, Moscow, Russia',
    date: '10 Şub 2026 — 13 Şub 2026',
    opportunities: 19,
    gradient: 'from-pink-500/20 to-rose-500/20'
  },
  {
    id: '4',
    title: 'Chillventa Nürnberg 2025',
    location: 'NürnbergMesse, Nürnberg, Germany',
    date: '14 Eki 2025 — 16 Eki 2025',
    opportunities: 17,
    gradient: 'from-emerald-500/20 to-teal-500/20'
  },
  {
    id: '5',
    title: 'ISK-SODEX Istanbul 2025',
    location: 'Tüyap Fuar ve Kongre Merkezi, Büyükçekmece, İstanbul',
    date: '8 Eki 2025 — 11 Eki 2025',
    opportunities: 21,
    gradient: 'from-amber-500/20 to-orange-500/20'
  },
  {
    id: '6',
    title: 'MOTEK Mediterranean 2025',
    location: 'İstanbul Fuar Merkezi (İFM), Yeşilköy, İstanbul',
    date: '24 Eyl 2025 — 27 Eyl 2025',
    opportunities: 20,
    gradient: 'from-indigo-500/20 to-blue-500/20'
  },
  {
    id: '7',
    title: 'WIN Eurasia 2025',
    location: 'Tüyap Fuar ve Kongre Merkezi, Büyükçekmece, İstanbul',
    date: '12 Haz 2025 — 15 Haz 2025',
    opportunities: 20,
    gradient: 'from-fuchsia-500/20 to-pink-500/20'
  },
  {
    id: '8',
    title: 'Hannover Messe 2025',
    location: 'Deutsche Messe, Hannover, Germany',
    date: '21 Nis 2025 — 25 Nis 2025',
    opportunities: 21,
    gradient: 'from-lime-500/20 to-green-500/20'
  },
  {
    id: '9',
    title: 'Chillventa Nürnberg 2024',
    location: 'NürnbergMesse, Nürnberg, Germany',
    date: '15 Eki 2024 — 17 Eki 2024',
    opportunities: 13,
    gradient: 'from-cyan-500/20 to-sky-500/20'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('fuarlar');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-xl bg-slate-950/30">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Navigation */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/50">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-xl font-semibold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Fuar CRM
                  </h1>
                </div>

                {/* Navigation */}
                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab('fuarlar')}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      activeTab === 'fuarlar'
                        ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-white border border-white/20 shadow-lg shadow-violet-500/20'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Fuarlar
                  </button>
                  <button
                    onClick={() => setActiveTab('analiz')}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      activeTab === 'analiz'
                        ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-white border border-white/20 shadow-lg shadow-violet-500/20'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    AI Analiz
                  </button>
                  <button
                    onClick={() => setActiveTab('yonetim')}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                      activeTab === 'yonetim'
                        ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-white border border-white/20 shadow-lg shadow-violet-500/20'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Yönetim
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </nav>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/20">
                  <Search className="w-5 h-5 text-white/80" />
                </button>
                <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-medium shadow-lg shadow-violet-500/50 hover:shadow-violet-500/70 transition-all duration-300 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Yeni Fuar
                </button>
                <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 text-white/80 transition-all duration-300">
                  Çıkış
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Header */}
          <div className="mb-8">
            <div className="flex items-baseline gap-2 mb-6">
              <h2 className="text-3xl font-semibold text-white">12 fuar</h2>
              <span className="text-white/50">·</span>
              <span className="text-white/60">220 toplam fırsat</span>
            </div>
          </div>

          {/* Fair Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fairs.map((fair, index) => (
              <div
                key={fair.id}
                className="group relative"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Gradient border effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/50 via-cyan-500/50 to-pink-500/50 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Card */}
                <div className="relative backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 p-6 hover:border-white/30 transition-all duration-500 overflow-hidden group-hover:transform group-hover:scale-[1.02]">
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${fair.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/80 group-hover:bg-clip-text transition-all duration-300">
                      {fair.title}
                    </h3>

                    {/* Location */}
                    <div className="flex items-start gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-white/70 leading-relaxed">
                        {fair.location}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <p className="text-sm text-white/70">
                        {fair.date}
                      </p>
                    </div>

                    {/* Opportunities Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 backdrop-blur-xl">
                      <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                        {fair.opportunities}
                      </span>
                      <span className="text-sm text-white/80">fırsat</span>
                    </div>
                  </div>

                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
