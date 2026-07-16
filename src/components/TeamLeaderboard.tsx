'use client';

import { useState } from 'react';

interface TeamOverall {
  teamNumber: number;
  totalSubmitted: number;
  totalPossible: number;
  pct: number;
  lateCount: number;
  onTimeCount: number;
}

interface TeamLeaderboardProps {
  teams: TeamOverall[];
}

const TEAM_NAMES = ['Team 1', 'Team 2', 'Team 3', 'Team 4'];
const TEAM_EMOJIS = ['🔵', '🟢', '🟣', '🟩'];
const TEAM_COLORS = [
  { bar: 'linear-gradient(90deg, #3b82f6, #60a5fa)', text: '#60a5fa', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
  { bar: 'linear-gradient(90deg, #06b6d4, #22d3ee)', text: '#22d3ee', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.3)' },
  { bar: 'linear-gradient(90deg, #6366f1, #818cf8)', text: '#818cf8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)' },
  { bar: 'linear-gradient(90deg, #10b981, #34d399)', text: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
];

function getMedal(rank: number) {
  if (rank === 0) return { icon: '🥇', label: 'Champion', cls: 'medal-gold' };
  if (rank === 1) return { icon: '🥈', label: 'Runner-up', cls: 'medal-silver' };
  if (rank === 2) return { icon: '🥉', label: 'Third Place', cls: 'medal-bronze' };
  return { icon: '', label: '', cls: '' };
}

export function TeamLeaderboard({ teams }: TeamLeaderboardProps) {
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);

  const sorted = [...teams].sort((a, b) => b.pct - a.pct);
  const leaderPct = sorted[0]?.pct || 0;

  return (
    <div className="glass-card p-6 fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏅</span>
          <div>
            <h2 className="text-lg font-bold text-white">Team Leaderboard</h2>
            <p className="text-xs text-slate-400">Overall performance across all categories</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" /> On Track
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 ml-2" /> Needs Push
          <span className="inline-block w-2 h-2 rounded-full bg-red-400 ml-2" /> Behind
        </div>
      </div>

      {/* Ranked team rows */}
      <div className="space-y-3">
        {sorted.map((team, rank) => {
          const idx = team.teamNumber - 1;
          const medal = getMedal(rank);
          const gap = leaderPct - team.pct;
          const isExpanded = expandedTeam === team.teamNumber;
          const isLeader = rank === 0;
          const statusColor = team.pct >= 75 ? '#34d399' : team.pct >= 50 ? '#fbbf24' : '#f87171';
          const statusLabel = team.pct >= 75 ? 'On Track' : team.pct >= 50 ? 'Needs Push' : 'Behind';

          return (
            <div
              key={team.teamNumber}
              className={`leaderboard-row rounded-xl p-4 cursor-pointer border transition-all ${
                isLeader ? 'border-blue-500/30' : 'border-slate-700/30'
              }`}
              style={{
                background: isLeader
                  ? `linear-gradient(135deg, ${TEAM_COLORS[idx].bg}, rgba(15,34,64,0.8))`
                  : 'rgba(15,34,64,0.5)',
                animationDelay: `${rank * 0.15}s`,
              }}
              onClick={() => setExpandedTeam(isExpanded ? null : team.teamNumber)}
            >
              {/* Main row */}
              <div className="flex items-center gap-4">
                {/* Rank / Medal */}
                <div className="flex-shrink-0 w-10 text-center">
                  {medal.icon ? (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${medal.cls} bounce-in`}
                      style={{ animationDelay: `${rank * 0.2}s` }}>
                      {medal.icon}
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-slate-600">#{rank + 1}</span>
                  )}
                </div>

                {/* Team info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{TEAM_EMOJIS[idx]}</span>
                    <span className="font-bold text-white text-sm">{TEAM_NAMES[idx]}</span>
                    {isLeader && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 pulse-ring">
                        👑 LEADER
                      </span>
                    )}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full ml-auto sm:ml-2 font-semibold"
                      style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 rounded-full bg-slate-700/50 overflow-hidden animated-bar">
                      <div
                        className="h-full rounded-full bar-fill"
                        style={{
                          width: `${team.pct}%`,
                          background: TEAM_COLORS[idx].bar,
                          animationDelay: `${rank * 0.2}s`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold min-w-[42px] text-right" style={{ color: TEAM_COLORS[idx].text }}>
                      {team.pct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Gap indicator */}
              {gap > 0 && (
                <div className="mt-2 ml-14 flex items-center gap-2 gap-pulse">
                  <span className="text-[11px] text-amber-400">
                    ⚡ {gap}% behind leader
                  </span>
                  <span className="text-[11px] text-slate-500">
                    · {team.totalPossible - team.totalSubmitted} remaining
                  </span>
                </div>
              )}

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-4 ml-14 pt-4 border-t border-slate-700/30 grid grid-cols-3 gap-4 count-up">
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-400">{team.onTimeCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">On Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-400">{team.lateCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Late</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{team.totalSubmitted}/{team.totalPossible}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total</div>
                  </div>
                  {gap > 0 && (
                    <div className="col-span-3 text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <span className="text-amber-400 text-xs font-medium">
                          💪 Submit {Math.ceil((gap / 100) * team.totalPossible)} more report{Math.ceil((gap / 100) * team.totalPossible) !== 1 ? 's' : ''} to catch up with the leader!
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom motivational message */}
      <div className="mt-5 text-center">
        <p className="text-xs text-slate-500">
          {leaderPct === 100
            ? '🎉 All teams have completed their submissions!'
            : sorted[sorted.length - 1]?.pct === 0
            ? '🚀 Submissions are starting to roll in — every report counts!'
            : `📈 ${sorted[0]?.totalSubmitted} submissions in so far — keep the momentum going!`}
        </p>
      </div>
    </div>
  );
}
