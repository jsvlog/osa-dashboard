'use client';

import { useState } from 'react';

interface TeamRaceData {
  teamNumber: number;
  submitted: number;
  late: number;
  total: number;
  pct: number;
}

interface TeamRaceProps {
  teams: TeamRaceData[];
  categoryLabel: string;
}

const TEAM_COLORS = [
  { bar: 'linear-gradient(90deg, #3b82f6, #60a5fa)', dot: '#60a5fa', bg: 'rgba(59,130,246,0.08)' },
  { bar: 'linear-gradient(90deg, #06b6d4, #22d3ee)', dot: '#22d3ee', bg: 'rgba(6,182,212,0.08)' },
  { bar: 'linear-gradient(90deg, #6366f1, #818cf8)', dot: '#818cf8', bg: 'rgba(99,102,241,0.08)' },
  { bar: 'linear-gradient(90deg, #10b981, #34d399)', dot: '#34d399', bg: 'rgba(16,185,129,0.08)' },
];

const TEAM_RUNNERS = ['🏃‍♂️', '🏃‍♀️', '🚴‍♂️', '🚴‍♀️'];

export function TeamRace({ teams, categoryLabel }: TeamRaceProps) {
  const [hoveredTeam, setHoveredTeam] = useState<number | null>(null);

  const sorted = [...teams].sort((a, b) => b.pct - a.pct);
  const leader = sorted[0];

  return (
    <div className="glass-card p-6 fade-in-up mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏁</span>
          <div>
            <h2 className="text-lg font-bold text-white">Submission Race</h2>
            <p className="text-xs text-slate-400">{categoryLabel} — who&apos;s leading?</p>
          </div>
        </div>
        {leader && leader.pct > 0 && (
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span
              className="px-3 py-1 rounded-full font-semibold pulse-ring"
              style={{
                background: TEAM_COLORS[leader.teamNumber - 1].bg,
                color: TEAM_COLORS[leader.teamNumber - 1].dot,
                border: `1px solid ${TEAM_COLORS[leader.teamNumber - 1].dot}40`,
              }}
            >
              👑 Team {leader.teamNumber} leads
            </span>
          </div>
        )}
      </div>

      {/* Race track */}
      <div className="space-y-3">
        {sorted.map((team, rank) => {
          const idx = team.teamNumber - 1;
          const gap = leader.pct - team.pct;
          const isHovered = hoveredTeam === team.teamNumber;
          const isLeader = rank === 0 && team.pct > 0;

          return (
            <div
              key={team.teamNumber}
              className="race-run"
              style={{ animationDelay: `${rank * 0.12}s` }}
              onMouseEnter={() => setHoveredTeam(team.teamNumber)}
              onMouseLeave={() => setHoveredTeam(null)}
            >
              {/* Team label row */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold" style={{ color: TEAM_COLORS[idx].dot }}>
                  {isLeader ? '👑' : `#${rank + 1}`} Team {team.teamNumber}
                </span>
                <span className="text-[10px] text-slate-500 ml-auto">
                  {team.submitted}/{team.total}
                </span>
                {gap > 0 && (
                  <span className="text-[10px] text-amber-400 gap-pulse font-medium">
                    -{gap}%
                  </span>
                )}
              </div>

              {/* Race lane */}
              <div className="race-track h-9 relative">
                {/* Finish line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 z-10"
                  style={{ left: '98%', background: 'rgba(251,191,36,0.3)' }}
                />

                {/* Progress fill */}
                <div
                  className="absolute top-1 bottom-1 rounded-lg bar-fill transition-all"
                  style={{
                    width: `${Math.max(team.pct, 2)}%`,
                    background: TEAM_COLORS[idx].bar,
                    opacity: isHovered ? 1 : 0.85,
                    animationDelay: `${rank * 0.15}s`,
                  }}
                />

                {/* Runner icon */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 z-20 transition-all text-lg"
                  style={{
                    left: `${Math.max(team.pct - 3, 1)}%`,
                    filter: isLeader ? 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' : 'none',
                  }}
                >
                  {TEAM_RUNNERS[idx]}
                </div>

                {/* Percentage badge */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 z-20 right-3"
                >
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(10,22,40,0.8)',
                      color: TEAM_COLORS[idx].dot,
                      border: `1px solid ${TEAM_COLORS[idx].dot}30`,
                    }}
                  >
                    {team.pct}%
                  </span>
                </div>
              </div>

              {/* Hover detail */}
              {isHovered && (
                <div className="mt-1.5 flex items-center gap-4 text-[11px] count-up">
                  <span className="text-emerald-400">✓ {team.submitted} submitted</span>
                  {team.late > 0 && (
                    <span className="text-red-400">⚠ {team.late} late</span>
                  )}
                  <span className="text-slate-500">
                    {team.total - team.submitted} remaining
                  </span>
                  {gap > 0 && (
                    <span className="text-amber-400 ml-auto font-medium">
                      💪 {Math.ceil((gap / 100) * team.total)} more to catch up!
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Finish line label */}
      <div className="mt-3 text-right">
        <span className="text-[10px] text-slate-600 uppercase tracking-wider">🏁 Finish Line — 100%</span>
      </div>
    </div>
  );
}
