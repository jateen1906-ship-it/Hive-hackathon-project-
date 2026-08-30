import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  ArrowRight, 
  Route, 
  Gauge, 
  ClipboardCheck, 
  FileSearch, 
  MapPin, 
  AlertTriangle,
  FileText,
  Layers,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DISCLAIMER } from "@/lib/riskMeta";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#08090d] text-foreground selection:bg-indigo-500 selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: TOP HERO (Reference Image 1)                      */}
      {/* ------------------------------------------------------------- */}
      <section className="cinematic-hero-bg relative overflow-hidden pt-6 pb-20 md:pb-28">
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
          {/* Header Navigation */}
          <header className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
              <div className="flex items-center tracking-tighter text-white text-xl font-black">
                <span className="text-white font-mono mr-1.5 opacity-90 text-lg">|||</span>
                <span>TruckShield</span>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <button 
                onClick={() => navigate("/login")} 
                data-testid="landing-login"
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                Log in
              </button>
              <button 
                onClick={() => navigate("/register")} 
                data-testid="landing-register"
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition-all hover:bg-slate-100 hover:shadow-lg active:scale-95"
              >
                Get started
              </button>
            </div>
          </header>

          {/* Hero Content */}
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-center pt-20 pb-16 text-center md:pt-28 md:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5rem] leading-[1.08]">
                Plan The Route.<br />
                Clear The Risk.
              </h1>
              <p className="mt-6 max-w-2xl text-base text-slate-400 sm:text-lg md:text-xl font-normal">
                The compliance-risk intelligence platform for freight teams who'd rather be moving.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
                <button
                  onClick={() => navigate("/register")}
                  data-testid="landing-cta-analyze"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-slate-950 shadow-xl transition-all hover:bg-slate-100 hover:scale-[1.02] active:scale-95"
                >
                  Get started <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="text-base font-medium text-slate-300 transition-colors hover:text-white px-4 py-3.5"
                >
                  Log in
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: MAC WINDOW BOARD SHOWCASE (Reference Image 2)      */}
      {/* ------------------------------------------------------------- */}
      <section className="relative z-20 -mt-10 md:-mt-16 pb-20 bg-dot-pattern">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="overflow-hidden rounded-2xl bg-white mac-mockup-shadow border border-slate-200/80"
          >
            {/* Mac Window Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#fbfcfd] px-4 py-3 sm:px-6">
              {/* Traffic Light Window Dots */}
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#ef4444] border border-red-500/20" />
                <div className="h-3 w-3 rounded-full bg-[#f59e0b] border border-amber-500/20" />
                <div className="h-3 w-3 rounded-full bg-[#10b981] border border-emerald-500/20" />
              </div>

              {/* URL Address Bar Pill */}
              <div className="flex items-center justify-center">
                <div className="rounded-md border border-slate-200/60 bg-white px-6 py-1 text-xs font-mono text-slate-600 shadow-2xs">
                  app.truckshield.io/dispatch
                </div>
              </div>

              <div className="w-12 text-right">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              </div>
            </div>

            {/* Board Sub-Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 px-6 py-3.5 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900">Dispatch 14 · Q1 Freight</span>
                <span className="text-slate-400">Mar 30 – Apr 10</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700">22 / 34 pts</span>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[65%] rounded-full bg-indigo-600" />
                </div>
              </div>
            </div>

            {/* 4-Column Board Content */}
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 bg-[#f8fafc]">
              {/* Column 1: TO DO / PRE-DISPATCH */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                  <span>To Do</span>
                  <span className="rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[10px] text-slate-700 font-semibold">2</span>
                </div>

                {/* Card 1 */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs border-l-4 border-l-red-500 transition-all hover:shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] font-semibold text-slate-500">AUTH-106</span>
                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">P0</span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-800 leading-snug">
                    Role-based access control
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                    <span>8pt</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">GK</span>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs border-l-4 border-l-amber-500 transition-all hover:shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] font-semibold text-slate-500">API-104</span>
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">P1</span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-800 leading-snug">
                    Rate limiting middleware
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                    <span>3pt</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">TB</span>
                  </div>
                </div>
              </div>

              {/* Column 2: IN PROGRESS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                  <span>In Progress</span>
                  <span className="rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[10px] text-slate-700 font-semibold">3</span>
                </div>

                {/* Card 3 */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs border-l-4 border-l-red-500 transition-all hover:shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] font-semibold text-slate-500">AUTH-105</span>
                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">P0</span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-800 leading-snug">
                    OAuth Google sign-in
                  </div>
                  <div className="mt-2.5 h-1 w-full rounded-full bg-slate-100">
                    <div className="h-full w-[45%] rounded-full bg-indigo-600" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>5pt</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">AO</span>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs border-l-4 border-l-slate-400 transition-all hover:shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] font-semibold text-slate-500">DASH-105</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">P2</span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-800 leading-snug">
                    Dark mode toggle
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                    <span>3pt</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-100 text-[10px] font-bold text-pink-700">MD</span>
                  </div>
                </div>

                {/* Card 5 */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs border-l-4 border-l-red-500 transition-all hover:shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] font-semibold text-slate-500">API-105</span>
                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">P0</span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-800 leading-snug">
                    Fix 500 on user delete
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                    <span>2pt</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">WG</span>
                  </div>
                </div>
              </div>

              {/* Column 3: IN REVIEW */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                  <span>In Review</span>
                  <span className="rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[10px] text-slate-700 font-semibold">1</span>
                </div>

                {/* Card 6 */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs border-l-4 border-l-amber-500 transition-all hover:shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] font-semibold text-slate-500">DASH-104</span>
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">P1</span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-800 leading-snug">
                    Analytics charts
                  </div>
                  <div className="mt-2.5 h-1 w-full rounded-full bg-slate-100">
                    <div className="h-full w-[70%] rounded-full bg-indigo-600" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>5pt</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-700">JW</span>
                  </div>
                </div>
              </div>

              {/* Column 4: DONE */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                  <span>Done</span>
                  <span className="rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[10px] text-slate-700 font-semibold">1</span>
                </div>

                {/* Card 7 */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs border-l-4 border-l-red-500 transition-all hover:shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] font-semibold text-slate-500">AUTH-107</span>
                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">P0</span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-800 leading-snug">
                    Fix token refresh loop
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                    <span>1pt</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">AO</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: HOW IT WORKS (Reference Image 3)                   */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-dot-pattern py-24 sm:py-32 border-t border-slate-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              How it works
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              From idea to shipped in three moves.
            </h2>
            <p className="mt-3 text-base text-slate-500 sm:text-lg">
              A workflow your team actually wants to follow.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 01 */}
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-2xs transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="text-3xl font-black tracking-tight text-slate-300 font-mono">
                01
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">
                Shape the work
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Capture epics, break them into tickets, and prioritize the backlog.
              </p>
            </motion.div>

            {/* Step 02 */}
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-2xs transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="text-3xl font-black tracking-tight text-slate-300 font-mono">
                02
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">
                Plan the sprint
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Pull stories into a sprint with capacity tracking and AI suggestions.
              </p>
            </motion.div>

            {/* Step 03 */}
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-2xs transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="text-3xl font-black tracking-tight text-slate-300 font-mono">
                03
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">
                Ship & reflect
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Move tickets across the board, watch the burndown, run the retro.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: FEATURES GRID (Reference Image 4)                  */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-dot-pattern py-24 sm:py-32 border-t border-slate-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              Features
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Everything you need. Nothing you don't.
            </h2>
            <p className="mt-3 text-base text-slate-500 sm:text-lg">
              Designed for teams who'd rather be shipping than configuring.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-2xs transition-all hover:shadow-md hover:-translate-y-0.5">
              <h3 className="text-base font-bold text-slate-900">
                Kanban board
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Drag-and-drop tickets across customizable columns with real-time updates.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-2xs transition-all hover:shadow-md hover:-translate-y-0.5">
              <h3 className="text-base font-bold text-slate-900">
                Sprint planning
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Plan sprints with team capacity tracking and side-by-side backlog view.
              </p>
            </div>

            {/* Feature 3 (Highlighted with glow matching reference) */}
            <div className="rounded-2xl border border-indigo-200 bg-white p-7 shadow-2xs transition-all hover:shadow-md hover:-translate-y-0.5 card-featured-glow">
              <h3 className="text-base font-bold text-slate-900">
                Backlog grooming
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Organize tickets by epic, filter by priority, and groom with ease.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-2xs transition-all hover:shadow-md hover:-translate-y-0.5">
              <h3 className="text-base font-bold text-slate-900">
                Burndown charts
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Track sprint progress with ideal vs. actual burndown visualization.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-2xs transition-all hover:shadow-md hover:-translate-y-0.5">
              <h3 className="text-base font-bold text-slate-900">
                Velocity tracking
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Monitor team velocity across sprints to improve estimation accuracy.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-2xs transition-all hover:shadow-md hover:-translate-y-0.5">
              <h3 className="text-base font-bold text-slate-900">
                AI sprint suggestions
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Get AI-powered recommendations for which tickets to pull into your next sprint.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5: BOTTOM HERO / CTA (Reference Image 5)              */}
      {/* ------------------------------------------------------------- */}
      <section className="cinematic-hero-bg relative overflow-hidden py-24 sm:py-32 border-t border-slate-800/80">
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            Your best sprint<br />
            starts today.
          </h2>
          <p className="mt-5 text-base text-slate-400 sm:text-lg">
            Set up your workspace and bring your team in.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-slate-950 shadow-xl transition-all hover:bg-slate-100 hover:scale-[1.02] active:scale-95"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="text-base font-medium text-slate-300 transition-colors hover:text-white px-4 py-3.5"
            >
              Log in
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER                                                        */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-900 bg-[#06070a] py-10 text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-white font-mono text-base font-bold">|||</span>
              <span className="font-bold text-white text-base">TruckShield</span>
            </div>
            <div className="text-xs text-slate-400">
              Demo account: <code className="rounded bg-slate-900 px-2 py-0.5 text-slate-300">demo@truckshield.app</code> / <code className="rounded bg-slate-900 px-2 py-0.5 text-slate-300">Demo@12345</code>
            </div>
          </div>
          <p className="mt-6 text-xs text-slate-600 max-w-3xl">
            {DISCLAIMER}
          </p>
        </div>
      </footer>
    </div>
  );
}
