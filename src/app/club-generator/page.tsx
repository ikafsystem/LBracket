'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ArrowLeft, Shuffle, Search, ShieldCheck, Star, Trophy } from 'lucide-react';

interface Team {
  name: string;
  teamId: string;
  rating?: number;
}

interface LeagueData {
  league: string;
  gender: string;
  teams: Team[];
  logoUrl?: string;
}

type Step = 'select-league' | 'ready' | 'spinning' | 'result';

const WC_NAME = 'World Cup 2026';
const WC_LOGO = '/league-logos/world-cup.png';

const WC_TEAMS: Team[] = [
  'Algeria','Argentina','Australia','Austria','Belgium','Bosnia & Herzegovina',
  'Brazil','Cabo Verde','Canada','Colombia','Congo DR','Croatia','Curaçao',
  'Czech Republic','Ecuador','Egypt','England','France','Germany','Ghana',
  'Haiti','Iraq','Iran','Japan','Jordan','Korea Republic','Mexico','Morocco',
  'Netherlands','New Zealand','Norway','Panama','Paraguay','Portugal','Qatar',
  'Saudi Arabia','Scotland','Senegal','South Africa','Spain','Sweden',
  'Switzerland','Tunisia','Türkiye','United States','Uruguay','Uzbekistan',
  'Ivory Coast',
].map((n) => ({ name: n, teamId: '' }));

const CL_NAME = 'Champions League 26/27';
const CL_LOGO = '/league-logos/champions-league.png';

const CL_TEAMS: Team[] = [
  { name: 'Arsenal', teamId: '1', rating: 5 },
  { name: 'Manchester City', teamId: '10', rating: 5 },
  { name: 'Manchester United', teamId: '11', rating: 4 },
  { name: 'Aston Villa', teamId: '2', rating: 4 },
  { name: 'Liverpool', teamId: '9', rating: 5 },
  { name: 'Inter Milan', teamId: '131682', rating: 5 },
  { name: 'Napoli', teamId: '48', rating: 4.5 },
  { name: 'Roma', teamId: '52', rating: 4 },
  { name: 'Como', teamId: '1745', rating: 3.5 },
  { name: 'Barcelona', teamId: '241', rating: 5 },
  { name: 'Real Madrid', teamId: '243', rating: 5 },
  { name: 'Villarreal', teamId: '483', rating: 4 },
  { name: 'Atlético Madrid', teamId: '240', rating: 4.5 },
  { name: 'Real Betis', teamId: '449', rating: 4 },
  { name: 'Bayern München', teamId: '21', rating: 5 },
  { name: 'Borussia Dortmund', teamId: '22', rating: 4.5 },
  { name: 'RB Leipzig', teamId: '112172', rating: 4 },
  { name: 'VfB Stuttgart', teamId: '36', rating: 3.5 },
  { name: 'Paris Saint-Germain', teamId: '73', rating: 5 },
  { name: 'Lens', teamId: '64', rating: 3.5 },
  { name: 'Lille', teamId: '65', rating: 3.5 },
  { name: 'PSV Eindhoven', teamId: '247', rating: 3.5 },
  { name: 'Feyenoord', teamId: '246', rating: 3.5 },
  { name: 'Porto', teamId: '236', rating: 3.5 },
  { name: 'Slavia Praha', teamId: '266', rating: 3 },
  { name: 'Galatasaray', teamId: '325', rating: 4 },
  { name: 'Shakhtar Donetsk', teamId: '101059', rating: 2.5 },
];

const TOP_LEAGUES = [
  { key: 'English Premier League', short: 'Premier League', logo: '/league-logos/premier-league.png' },
  { key: 'Spanish La Liga', short: 'La Liga', logo: '/league-logos/la-liga.png' },
  { key: 'French Ligue 1', short: 'Ligue 1', logo: '/league-logos/ligue-1.png' },
  { key: 'Italian Serie A', short: 'Serie A', logo: '/league-logos/serie-a.png' },
  { key: 'German Bundesliga', short: 'Bundesliga', logo: '/league-logos/bundesliga.png' },
  { key: 'International', short: 'International', logo: '/league-logos/international.svg' },
];

const topLogoMap: Record<string, string> = {};
TOP_LEAGUES.forEach((t) => { topLogoMap[t.key] = t.logo; });
topLogoMap[CL_NAME] = CL_LOGO;
topLogoMap[WC_NAME] = WC_LOGO;

const fallbackLogos: Record<string, string> = {
  'Dutch Eredivisie': '/league-logos/eredivisie.svg',
};

const countryCode: Record<string, string> = {
  'Algeria': 'dz', 'Argentina': 'ar', 'Australia': 'au', 'Austria': 'at',
  'Belgium': 'be', 'Bosnia & Herzegovina': 'ba', 'Brazil': 'br',
  'Cabo Verde': 'cv', 'Canada': 'ca', 'Colombia': 'co', 'Congo DR': 'cd',
  'Croatia': 'hr', 'Curaçao': 'cw', 'Czech Republic': 'cz', 'Denmark': 'dk',
  'Ecuador': 'ec', 'Egypt': 'eg', 'England': 'gb', 'Finland': 'fi',
  'France': 'fr', 'Germany': 'de', 'Ghana': 'gh', 'Haiti': 'ht',
  'Holland': 'nl', 'Hungary': 'hu', 'Iceland': 'is', 'Indonesia': 'id',
  'Iraq': 'iq', 'Iran': 'ir', 'Italy': 'it', 'Ivory Coast': 'ci',
  'Japan': 'jp', 'Jordan': 'jo', 'Korea Republic': 'kr', 'Mexico': 'mx',
  'Morocco': 'ma', 'Netherlands': 'nl', 'New Zealand': 'nz',
  'Northern Ireland': 'gb', 'Norway': 'no', 'Panama': 'pa', 'Paraguay': 'py',
  'Poland': 'pl', 'Portugal': 'pt', 'Qatar': 'qa', 'Republic of Ireland': 'ie',
  'Romania': 'ro', 'Saudi Arabia': 'sa', 'Scotland': 'gb', 'Senegal': 'sn',
  'South Africa': 'za', 'Spain': 'es', 'Sweden': 'se', 'Switzerland': 'ch',
  'Tunisia': 'tn', 'Türkiye': 'tr', 'Ukraine': 'ua', 'United States': 'us',
  'Uruguay': 'uy', 'Uzbekistan': 'uz', 'Wales': 'gb',
};

export default function ClubGenerator() {
  const router = useRouter();
  const [data, setData] = useState<LeagueData[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [search, setSearch] = useState('');
  const [step, setStep] = useState<Step>('select-league');
  const [displayName, setDisplayName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/teams.json')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const isWC = selectedLeague === WC_NAME;
  const league = selectedLeague === CL_NAME
    ? { league: CL_NAME, gender: '', teams: CL_TEAMS, logoUrl: CL_LOGO }
    : isWC
      ? { league: WC_NAME, gender: '', teams: WC_TEAMS, logoUrl: WC_LOGO }
      : (data.find((l) => l.league === selectedLeague) ?? null);

  const filtered = data.filter((l) =>
    l.league.toLowerCase().includes(search.toLowerCase())
  );

  const otherLeagues = filtered.filter(
    (l) => !TOP_LEAGUES.find((t) => t.key === l.league)
  );

  const getLeagueLogo = (leagueName: string, remoteUrl?: string): string | null => {
    if (topLogoMap[leagueName]) return topLogoMap[leagueName];
    if (remoteUrl && !imgErrors.has(remoteUrl)) return remoteUrl;
    if (fallbackLogos[leagueName]) return fallbackLogos[leagueName];
    return null;
  };

  const pickRandom = useCallback(() => {
    if (!league || league.teams.length === 0) return;
    const idx = Math.floor(Math.random() * league.teams.length);
    return league.teams[idx];
  }, [league]);

  const startSpin = () => {
    if (!league || league.teams.length === 0) return;
    setStep('spinning');
    setSelectedTeam(null);

    const teams = league.teams;
    let speed = 50;
    const minSpeed = 200;
    const totalDuration = 2000;

    const spin = () => {
      const rand = Math.floor(Math.random() * teams.length);
      setDisplayName(teams[rand].name);
    };

    spin();
    intervalRef.current = setInterval(spin, speed);
    const start = Date.now();

    const decelerate = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= totalDuration) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const final = pickRandom()!;
        setDisplayName(final.name);
        setSelectedTeam(final);
        setStep('result');
        return;
      }
      const progress = elapsed / totalDuration;
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const newSpeed = 50 + eased * (minSpeed - 50);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(spin, newSpeed);
      timeoutRef.current = setTimeout(decelerate, newSpeed * 3);
    };

    timeoutRef.current = setTimeout(decelerate, speed * 3);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const selectLeague = (key: string) => {
    setSelectedLeague(key);
    setSearch('');
    setIsOpen(false);
    setStep('ready');
    setSelectedTeam(null);
  };

  const totalTeams = league?.teams?.length ?? 0;
  const selectedLogo = getLeagueLogo(selectedLeague, league?.logoUrl);
  const isInternational = selectedLeague === 'International' || isWC;
  const clubLogoUrl = isInternational && selectedTeam?.name && countryCode[selectedTeam.name]
    ? `https://flagcdn.com/w160/${countryCode[selectedTeam.name]}.png`
    : selectedTeam?.teamId
      ? `https://www.fcratings.com/assets/thumbnails/clubs/${selectedTeam.teamId}.png`
      : null;

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-3 pt-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg hover:bg-[#2557D6]/20 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Club Generator</h1>
          <p className="text-sm text-slate-400">
            Randomly pick a club from any league
          </p>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Select League</CardTitle>
          <CardDescription className="text-slate-400">
            Choose a league then pick a random club
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">
              Top 5 European Leagues, UCL, World Cup, International
            </p>
            <div className="grid grid-cols-3 gap-2">
              {TOP_LEAGUES.map((t) => {
                const matched = data.find((l) => l.league === t.key);
                const label = t.key === 'International' ? 'teams' : 'clubs';
                return (
                  <button
                    key={t.key}
                    onClick={() => matched && selectLeague(t.key)}
                    disabled={!matched}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border transition-all text-center ${
                      !matched ? 'opacity-40 cursor-not-allowed' : ''
                    } ${
                      selectedLeague === t.key
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                    }`}
                  >
                    <img
                      src={t.logo}
                      alt={t.key}
                      className="w-10 h-10 object-contain"
                    />
                    <p className="text-xs font-semibold text-white leading-tight">
                      {t.short}
                    </p>
                    {matched && (
                      <p className="text-[10px] text-slate-500">
                        {matched.teams.length} {label}
                      </p>
                    )}
                    {selectedLeague === t.key && (
                      <ShieldCheck className="h-3 w-3 text-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => selectLeague(CL_NAME)}
              className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border transition-all text-center ${
                selectedLeague === CL_NAME
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
              }`}
            >
              <img src={CL_LOGO} alt="Champions League" className="w-10 h-10 object-contain" />
              <p className="text-xs font-semibold text-white leading-tight">
                Champions League
              </p>
              <p className="text-[10px] text-slate-500">
                26/27
              </p>
              <p className="text-[10px] text-slate-500">
                {CL_TEAMS.length} clubs
              </p>
              {selectedLeague === CL_NAME && (
                <ShieldCheck className="h-3 w-3 text-blue-400" />
              )}
            </button>
            <button
              onClick={() => selectLeague(WC_NAME)}
              className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border transition-all text-center ${
                selectedLeague === WC_NAME
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
              }`}
            >
              <img src={WC_LOGO} alt="World Cup" className="w-10 h-10 object-contain" />
              <p className="text-xs font-semibold text-white leading-tight">
                World Cup
              </p>
              <p className="text-[10px] text-slate-500">
                2026
              </p>
              <p className="text-[10px] text-slate-500">
                {WC_TEAMS.length} teams
              </p>
              {selectedLeague === WC_NAME && (
                <ShieldCheck className="h-3 w-3 text-blue-400" />
              )}
            </button>
          </div>

          <div className="relative">
            <div
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white cursor-pointer"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <span className={selectedLeague ? 'text-white' : 'text-slate-500'}>
                {selectedLeague || 'Other leagues...'}
              </span>
            </div>

            {isOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-lg bg-slate-700 border border-slate-600 shadow-xl max-h-72 overflow-y-auto">
                <div className="p-2 sticky top-0 bg-slate-700">
                  <input
                    className="w-full px-3 py-2 rounded-md bg-slate-600 border border-slate-500 text-white text-sm placeholder:text-slate-400 outline-none"
                    placeholder="Search leagues..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                {otherLeagues.length === 0 && (
                  <div className="px-3 py-4 text-sm text-slate-500 text-center">
                    No leagues found
                  </div>
                )}
                {otherLeagues.map((l) => {
                  const logo = getLeagueLogo(l.league, l.logoUrl);
                  return (
                    <button
                      key={l.league}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                        selectedLeague === l.league
                          ? 'bg-blue-600/30 text-blue-300'
                          : 'text-white hover:bg-slate-600'
                      }`}
                      onClick={() => selectLeague(l.league)}
                    >
                      {logo ? (
                        <img
                          src={logo}
                          alt=""
                          className="w-5 h-5 object-contain rounded shrink-0"
                          onError={() => setImgErrors((prev) => new Set(prev).add(logo))}
                        />
                      ) : (
                        <div className="w-5 h-5 rounded bg-slate-600 shrink-0" />
                      )}
                      <span className="truncate">{l.league}</span>
                      <span className="text-slate-500 text-xs ml-auto shrink-0">
                        {l.teams.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {league && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                {totalTeams} club{totalTeams !== 1 ? 's' : ''} available in{' '}
                {league.league}
              </p>
              <button
                onClick={() => router.push(`/club-generator/league?name=${encodeURIComponent(league.league)}`)}
                className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 shrink-0 transition-colors"
              >
                All {league.league} Clubs
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {step !== 'select-league' && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Club Picker</CardTitle>
            <CardDescription className="text-slate-400">
              {step === 'result' && selectedTeam
                ? 'Your randomly selected club'
                : 'Press the button to spin'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center py-8">
              {step === 'result' && clubLogoUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={clubLogoUrl}
                    alt={selectedTeam?.name ?? ''}
                    className="w-24 h-24 object-contain drop-shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <p className="text-xl font-bold tracking-wide text-emerald-300">
                    {displayName}
                  </p>
                </div>
              ) : (
                <div
                  className={`w-full max-w-xs h-24 flex items-center justify-center rounded-xl border-2 transition-all duration-300 ${
                    step === 'spinning'
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                      : 'border-slate-600 bg-slate-700/50'
                  }`}
                >
                  {selectedLogo && step !== 'spinning' && (
                    <img
                      src={selectedLogo}
                      alt=""
                      className="w-8 h-8 object-contain mr-3 opacity-50"
                    />
                  )}
                  <p
                    className={`text-xl font-bold tracking-wide ${
                      step === 'spinning'
                        ? 'text-blue-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {step === 'ready'
                      ? '???'
                      : displayName || '???'}
                  </p>
                </div>
              )}

              {step === 'result' && selectedTeam && (
                <div className="mt-4 text-center space-y-1">
                  {selectedTeam.rating && (
                    <div className="flex items-center justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            selectedTeam.rating! >= star
                              ? 'fill-yellow-400 text-yellow-400'
                              : selectedTeam.rating! >= star - 0.5
                                ? 'fill-yellow-400/50 text-yellow-400'
                                : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    {selectedLogo && (
                      <img
                        src={selectedLogo}
                        alt=""
                        className="w-5 h-5 object-contain"
                      />
                    )}
                    <p className="text-sm text-slate-400">{league?.league}</p>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xs text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Selected</span>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={startSpin}
              disabled={step === 'spinning'}
              size="lg"
              className="w-full"
            >
              <Shuffle className={`h-5 w-5 ${step === 'spinning' ? 'animate-spin' : ''}`} />
              {step === 'spinning'
                ? 'Picking...'
                : step === 'result'
                  ? 'Pick Again'
                  : 'Pick Random Club'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
