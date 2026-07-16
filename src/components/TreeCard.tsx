'use client';

import React from 'react';
import type { TeamProgress, TreeStage, ReportCategory } from '@/lib/types';
import { STAGE_LABELS, CATEGORY_LABELS } from '@/lib/types';

interface TreeCardProps {
  category: ReportCategory;
  teams: TeamProgress[];
}

/* Tree visualization for one team branch */
function TeamBranch({ team, index }: { team: TeamProgress; index: number }) {
  const stage = team.stage;
  const pct = team.percentage;

  /* Branch height based on stage (0-5) */
  const heights = [12, 40, 80, 130, 180, 220];
  const branchHeight = heights[stage];

  /* Colors per team */
  const teamColors = [
    { trunk: '#60a5fa', leaf: '#93c5fd', fruit: '#f59e0b', glow: 'rgba(96,165,250,0.4)' },
    { trunk: '#22d3ee', leaf: '#67e8f9', fruit: '#f472b6', glow: 'rgba(34,211,238,0.4)' },
    { trunk: '#818cf8', leaf: '#a5b4fc', fruit: '#fbbf24', glow: 'rgba(129,140,248,0.4)' },
    { trunk: '#34d399', leaf: '#6ee7b7', fruit: '#fb923c', glow: 'rgba(52,211,153,0.4)' },
  ];
  const c = teamColors[index];

  /* Generate leaves */
  const leafCount = stage * 4;
  const leaves = [];
  for (let i = 0; i < leafCount; i++) {
    const left = 30 + (i % 4) * 13 + (Math.random() * 4 - 2);
    const top = branchHeight - 30 - (Math.floor(i / 4)) * 22 + (Math.random() * 6 - 3);
    const size = 14 + Math.random() * 10;
    leaves.push(
      <div
        key={`leaf-${i}`}
        className="leaf-sway absolute rounded-full opacity-80"
        style={{
          left: `${left}%`,
          top: `${top}px`,
          width: `${size}px`,
          height: `${size * 0.7}px`,
          background: `radial-gradient(ellipse at center, ${c.leaf}, ${c.trunk})`,
          animationDelay: `${i * 0.15}s`,
        }}
      />
    );
  }

  /* Generate fruits (stage 4-5) */
  const fruitCount = stage >= 4 ? (stage === 5 ? 6 : 3) : 0;
  const fruits = [];
  for (let i = 0; i < fruitCount; i++) {
    const left = 25 + (i % 3) * 20 + (Math.random() * 8 - 4);
    const top = branchHeight - 40 - (Math.floor(i / 3)) * 25 + (Math.random() * 6 - 3);
    fruits.push(
      <div
        key={`fruit-${i}`}
        className="fruit-float absolute rounded-full"
        style={{
          left: `${left}%`,
          top: `${top}px`,
          width: '12px',
          height: '12px',
          background: `radial-gradient(circle at 35% 35%, ${c.fruit}, ${c.trunk})`,
          boxShadow: `0 0 8px ${c.glow}`,
          animationDelay: `${i * 0.3}s`,
        }}
      />
    );
  }

  /* Flowers (stage 3) */
  const flowerCount = stage === 3 ? 3 : stage >= 4 ? 2 : 0;
  const flowers = [];
  for (let i = 0; i < flowerCount; i++) {
    flowers.push(
      <div
        key={`flower-${i}`}
        className="absolute"
        style={{
          left: `${28 + i * 22}%`,
          top: `${branchHeight - 25 + (i % 2) * 12}px`,
        }}
      >
        <div
          className="rounded-full"
          style={{
            width: '8px',
            height: '8px',
            background: '#fbbf24',
            boxShadow: `0 0 6px ${c.glow}`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      {/* Team label */}
      <div className="text-xs font-semibold mb-2 text-center" style={{ color: c.trunk }}>
        {team.teamName}
      </div>

      {/* Tree container */}
      <div className="relative w-full flex flex-col items-center" style={{ height: '240px' }}>
        {/* Glow behind tree */}
        {stage >= 3 && (
          <div
            className="absolute bottom-0 rounded-full glow-pulse"
            style={{
              width: '80px',
              height: '40px',
              background: `radial-gradient(ellipse, ${c.glow}, transparent)`,
              filter: 'blur(8px)',
            }}
          />
        )}

        {/* Leaves */}
        <div className="absolute w-full" style={{ height: `${branchHeight}px`, bottom: `${40 + stage * 3}px` }}>
          {leaves}
          {flowers}
          {fruits}
        </div>

        {/* Trunk */}
        <div
          className="tree-branch rounded-t-full"
          style={{
            width: `${8 + stage * 3}px`,
            height: `${40 + stage * 3}px`,
            background: `linear-gradient(to top, ${c.trunk}, ${c.leaf})`,
            borderTopLeftRadius: '50%',
            borderTopRightRadius: '50%',
            marginTop: 'auto',
            animationDelay: `${index * 0.2}s`,
          }}
        />

        {/* Ground */}
        <div className="w-full h-1 rounded-full mt-0.5" style={{ background: 'rgba(148,163,184,0.3)' }} />
      </div>

      {/* Stats */}
      <div className="mt-2 text-center">
        <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: c.trunk }}>
          {STAGE_LABELS[stage]}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {team.submittedCount}/{team.totalReports} · {pct}%
        </div>
      </div>
    </div>
  );
}

export default function TreeCard({ category, teams }: TreeCardProps) {
  const categoryLabel = CATEGORY_LABELS[category];

  /* Category icon */
  const icons: Record<string, string> = {
    monthly: '📅',
    quarterly: '📊',
    semestral: '📋',
    annual: '🏆',
  };

  return (
    <div className="glass-card p-6 fade-in-up w-full">
      {/* Category header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">{icons[category] || '📁'}</span>
        <div>
          <h3 className="text-lg font-bold text-white">{categoryLabel} Reports</h3>
          <p className="text-xs text-slate-400">
            {teams.reduce((s, t) => s + t.submittedCount, 0)} submissions across {teams.length} teams
          </p>
        </div>
      </div>

      {/* 4 team branches side by side */}
      <div className="flex gap-2 sm:gap-4 justify-center">
        {teams.map((team, i) => (
          <TeamBranch key={team.teamNumber} team={team} index={i} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-slate-700/50">
        {[0, 1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: s === 0 ? '#475569' : s <= 2 ? '#60a5fa' : s <= 4 ? '#22d3ee' : '#fbbf24',
                boxShadow: s >= 4 ? '0 0 6px rgba(251,191,36,0.5)' : 'none',
              }}
            />
            <span className="text-[10px] text-slate-500">{STAGE_LABELS[s as TreeStage]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
