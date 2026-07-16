'use client';

import React from 'react';
import type { CategoryTree } from '@/lib/types';
import TreeCard from './TreeCard';

interface TreeDashboardProps {
  trees: CategoryTree[];
}

export function TreeDashboard({ trees }: TreeDashboardProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="text-center mb-10 fade-in-up">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="text-3xl">🌳</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            OSA <span className="gradient-text">Dashboard</span>
          </h1>
        </div>
        <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          Track document submissions across all teams. Watch your trees grow as reports come in!
        </p>
      </header>

      {/* 4 tree cards in a 2x2 grid */}
      {trees.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🌱</div>
          <h2 className="text-xl font-semibold text-slate-300 mb-2">No reports yet</h2>
          <p className="text-slate-500 text-sm">
            The admin hasn&apos;t added any report templates yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 justify-center">
          {trees.map((tree) => (
            <TreeCard key={tree.category} category={tree.category} teams={tree.teams} />
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="text-center mt-12 py-6 border-t border-slate-700/30">
        <p className="text-xs text-slate-600">
          OSA Office Document Tracking System
        </p>
      </footer>
    </main>
  );
}
