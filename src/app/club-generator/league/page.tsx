'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';

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

const TOP_LEAGUES: Record<string, string> = {
  'English Premier League': '/league-logos/premier-league.png',
  'Spanish La Liga': '/league-logos/la-liga.png',
  'French Ligue 1': '/league-logos/ligue-1.png',
  'Italian Serie A': '/league-logos/serie-a.png',
  'German Bundesliga': '/league-logos/bundesliga.png',
};

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

function LeagueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = searchParams.get('name');
  const [data, setData] = useState<LeagueData[]>([]);
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/teams.json')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const isCL = name === CL_NAME;
  const isWC = name === WC_NAME;
  const league = isCL
    ? { league: CL_NAME, gender: '', teams: CL_TEAMS }
    : isWC
      ? { league: WC_NAME, gender: '', teams: WC_TEAMS }
      : data.find((l) => l.league === name);

  const leagueLogo = isCL
    ? CL_LOGO
    : isWC
      ? WC_LOGO
      : name
        ? TOP_LEAGUES[name] || league?.logoUrl || fallbackLogos[name] || null
        : null;

  const isInternational = name === 'International' || isWC;

  const getLogo = (team: Team): string | null => {
    if (failedLogos.has(team.teamId || team.name)) return null;
    if (isInternational && team.name && countryCode[team.name]) {
      return `https://flagcdn.com/w160/${countryCode[team.name]}.png`;
    }
    if (team.teamId) {
      return `https://www.fcratings.com/assets/thumbnails/clubs/${team.teamId}.png`;
    }
    return null;
  };

  const onLogoError = (team: Team) => {
    setFailedLogos((prev) => new Set(prev).add(team.teamId || team.name));
  };

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
          <h1 className="text-xl font-bold">{name || 'League'}</h1>
          <p className="text-sm text-slate-400">
            {league ? `${league.teams.length} clubs` : 'Loading...'}
          </p>
        </div>
        {leagueLogo && (
          <img src={leagueLogo} alt="" className="w-10 h-10 object-contain ml-auto" />
        )}
      </div>

      {league && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {league.teams.map((team) => {
            const logo = getLogo(team);
            return (
              <div
                key={team.teamId || team.name}
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50"
              >
                {logo ? (
                  <img
                    src={logo}
                    alt={team.name}
                    className="w-14 h-14 object-contain"
                    onError={() => onLogoError(team)}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-slate-500 text-xs font-bold">
                    {team.name.charAt(0)}
                  </div>
                )}
                <p className="text-xs font-semibold text-white text-center leading-tight line-clamp-2">
                  {team.name}
                </p>
                {team.rating && (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          team.rating! >= star
                            ? 'fill-yellow-400 text-yellow-400'
                            : team.rating! >= star - 0.5
                              ? 'fill-yellow-400/50 text-yellow-400'
                              : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!league && name && (
        <div className="text-center text-slate-500 py-12">
          League not found
        </div>
      )}
    </div>
  );
}

export default function LeaguePage() {
  return (
    <Suspense>
      <LeagueContent />
    </Suspense>
  );
}
