import { useState } from "react";

const P = {
  bg: "#0C0A15",
  bgAlt: "#08060E",
  surface: "#16122A",
  surfaceLight: "#1E1838",
  surfaceHover: "#271F48",
  elevated: "#2D2450",
  border: "#2A2248",
  borderLight: "#362C5E",
  borderFocus: "#A855F7",
  text: "#F0F0FC",
  textSecondary: "#9B8FC0",
  textMuted: "#6B5E8A",
  textInverse: "#0C0A15",
  primary: "#A855F7",
  primaryLight: "#C084FC",
  primaryDark: "#7E22CE",
  primaryDim: "rgba(168,85,247,0.12)",
  primaryGlow: "rgba(168,85,247,0.25)",
  secondary: "#EC4899",
  secondaryDim: "rgba(236,72,153,0.12)",
  success: "#10B981",
  successDim: "rgba(16,185,129,0.12)",
  warning: "#F59E0B",
  warningDim: "rgba(245,158,11,0.12)",
  danger: "#EF4444",
  dangerDim: "rgba(239,68,68,0.12)",
  info: "#3B82F6",
  infoDim: "rgba(59,130,246,0.12)",
  fire: "#F97316",
  fireDim: "rgba(249,115,22,0.12)",
  gold: "#EAB308",
  goldDim: "rgba(234,179,8,0.12)",
  cyan: "#22D3EE",
  cyanDim: "rgba(34,211,238,0.12)",
};

const Swatch = ({ color, label, hex, size = 48 }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ width: size, height: size, borderRadius: 10, background: color, border: `1px solid ${P.border}` }} />
    <div style={{ fontSize: 10, color: P.textMuted, marginTop: 4 }}>{label}</div>
    <div style={{ fontSize: 9, color: P.textMuted, fontFamily: "monospace" }}>{hex}</div>
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 40 }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: P.textMuted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${P.border}` }}>{title}</div>
    {children}
  </div>
);

export default function BrandKit() {
  const [page, setPage] = useState("cover");

  const pages = [
    { key: "cover", label: "Cover" },
    { key: "colors", label: "Colors" },
    { key: "typography", label: "Type" },
    { key: "components", label: "UI" },
    { key: "icons", label: "Icons" },
    { key: "voice", label: "Voice" },
    { key: "usage", label: "Usage" },
  ];

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
        {pages.map((p) => (
          <div key={p.key} onClick={() => setPage(p.key)} style={{ padding: "6px 14px", fontSize: 12, fontWeight: page === p.key ? 600 : 400, color: page === p.key ? P.primary : P.textMuted, background: page === p.key ? P.primaryDim : "transparent", borderRadius: 8, cursor: "pointer", border: `1px solid ${page === p.key ? P.primary : "transparent"}` }}>
            {p.label}
          </div>
        ))}
      </div>

      {page === "cover" && (
        <div style={{ background: P.bg, borderRadius: 16, overflow: "hidden", border: `1px solid ${P.border}` }}>
          <div style={{ padding: "60px 40px", textAlign: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${P.primaryDark}, ${P.primary}, ${P.secondary})` }} />
            <div style={{ fontSize: 11, color: P.textMuted, textTransform: "uppercase", letterSpacing: 3, marginBottom: 24 }}>Automate AI LLC</div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${P.primary}, ${P.secondary})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M14 3L24 8v12l-10 5L4 20V8l10-5z" stroke="#fff" strokeWidth="1.5" fill="none" />
                  <path d="M14 8l6 3v6l-6 3-6-3v-6l6-3z" fill="rgba(255,255,255,0.2)" stroke="#fff" strokeWidth="1" />
                  <path d="M14 13v7M14 13l6-3M14 13l-6-3" stroke="#fff" strokeWidth="1" />
                </svg>
              </div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: P.text, letterSpacing: 6, marginBottom: 8 }}>TRANSFORMR</div>
            <div style={{ fontSize: 13, color: P.textSecondary, letterSpacing: 1, marginBottom: 32 }}>Every rep. Every meal. Every dollar. Every day.</div>
            <div style={{ width: 60, height: 1, background: P.border, margin: "0 auto 32px" }} />
            <div style={{ fontSize: 20, fontWeight: 600, color: P.text, marginBottom: 8 }}>Brand Identity Kit</div>
            <div style={{ fontSize: 13, color: P.textSecondary, marginBottom: 32 }}>Visual Identity, Color System, Typography, UI Components, Voice & Tone</div>
            <div style={{ display: "inline-block", background: P.surface, borderRadius: 10, padding: "10px 24px", border: `1px solid ${P.border}` }}>
              <div style={{ fontSize: 11, color: P.textMuted }}>Version 1.0 — April 2026</div>
            </div>
          </div>
          <div style={{ background: P.surface, padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${P.border}` }}>
            <div style={{ fontSize: 11, color: P.textMuted }}>Confidential — Automate AI LLC</div>
            <div style={{ fontSize: 11, color: P.textMuted }}>Health, Fitness & Life Transformation</div>
          </div>
        </div>
      )}

      {page === "colors" && (
        <div style={{ background: P.bg, borderRadius: 16, padding: 32, border: `1px solid ${P.border}` }}>
          <Section title="Brand colors — primary">
            <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ height: 80, borderRadius: 12, background: P.primary, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>TRANSFORMR Purple</span>
                </div>
                <div style={{ fontSize: 11, color: P.textSecondary, fontFamily: "monospace" }}>#A855F7 — Primary actions, CTAs, active states, progress indicators</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 80, borderRadius: 12, background: P.secondary, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Partner Pink</span>
                </div>
                <div style={{ fontSize: 11, color: P.textSecondary, fontFamily: "monospace" }}>#EC4899 — Partner features, couples mode, relationship elements</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Swatch color="#F3E8FF" label="50" hex="#F3E8FF" />
              <Swatch color="#E9D5FF" label="100" hex="#E9D5FF" />
              <Swatch color="#D8B4FE" label="200" hex="#D8B4FE" />
              <Swatch color="#C084FC" label="300" hex="#C084FC" />
              <Swatch color="#A855F7" label="400" hex="#A855F7" />
              <Swatch color="#9333EA" label="500" hex="#9333EA" />
              <Swatch color="#7E22CE" label="600" hex="#7E22CE" />
              <Swatch color="#6B21A8" label="700" hex="#6B21A8" />
              <Swatch color="#581C87" label="800" hex="#581C87" />
              <Swatch color="#3B0764" label="900" hex="#3B0764" />
            </div>
          </Section>

          <Section title="Backgrounds — deep space">
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 64, borderRadius: 10, background: P.bgAlt, border: `1px solid ${P.border}`, marginBottom: 6 }} />
                <div style={{ fontSize: 10, color: P.textMuted }}>Deepest</div>
                <div style={{ fontSize: 9, color: P.textMuted, fontFamily: "monospace" }}>#08060E</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 64, borderRadius: 10, background: P.bg, border: `1px solid ${P.border}`, marginBottom: 6 }} />
                <div style={{ fontSize: 10, color: P.textMuted }}>Background</div>
                <div style={{ fontSize: 9, color: P.textMuted, fontFamily: "monospace" }}>#0C0A15</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 64, borderRadius: 10, background: P.surface, border: `1px solid ${P.border}`, marginBottom: 6 }} />
                <div style={{ fontSize: 10, color: P.textMuted }}>Surface</div>
                <div style={{ fontSize: 9, color: P.textMuted, fontFamily: "monospace" }}>#16122A</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 64, borderRadius: 10, background: P.surfaceLight, border: `1px solid ${P.border}`, marginBottom: 6 }} />
                <div style={{ fontSize: 10, color: P.textMuted }}>Elevated</div>
                <div style={{ fontSize: 9, color: P.textMuted, fontFamily: "monospace" }}>#1E1838</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 64, borderRadius: 10, background: P.surfaceHover, border: `1px solid ${P.border}`, marginBottom: 6 }} />
                <div style={{ fontSize: 10, color: P.textMuted }}>Hover</div>
                <div style={{ fontSize: 9, color: P.textMuted, fontFamily: "monospace" }}>#271F48</div>
              </div>
            </div>
          </Section>

          <Section title="Semantic & accent colors">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { label: "Success", color: P.success, dim: P.successDim, hex: "#10B981", use: "Completed, gains, positive" },
                { label: "Warning", color: P.warning, dim: P.warningDim, hex: "#F59E0B", use: "Attention, limits" },
                { label: "Danger", color: P.danger, dim: P.dangerDim, hex: "#EF4444", use: "Missed, broken, overdue" },
                { label: "Info", color: P.info, dim: P.infoDim, hex: "#3B82F6", use: "Informational, data" },
                { label: "Fire", color: P.fire, dim: P.fireDim, hex: "#F97316", use: "Streaks, energy" },
                { label: "Gold", color: P.gold, dim: P.goldDim, hex: "#EAB308", use: "Achievements, milestones" },
                { label: "Cyan", color: P.cyan, dim: P.cyanDim, hex: "#22D3EE", use: "AI features, tech" },
                { label: "Pink", color: P.secondary, dim: P.secondaryDim, hex: "#EC4899", use: "Partner, couples" },
              ].map((c, i) => (
                <div key={i} style={{ background: P.surface, borderRadius: 10, padding: 12, border: `1px solid ${P.border}` }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: c.color }} />
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: c.dim, border: `1px solid ${c.color}30` }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{c.label}</div>
                  <div style={{ fontSize: 9, color: P.textMuted, fontFamily: "monospace" }}>{c.hex}</div>
                  <div style={{ fontSize: 10, color: P.textSecondary, marginTop: 4 }}>{c.use}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Text hierarchy">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 18, color: P.text, fontWeight: 600, width: 200 }}>Primary text</span>
                <span style={{ fontSize: 11, color: P.textMuted, fontFamily: "monospace" }}>#F0F0FC</span>
                <span style={{ fontSize: 11, color: P.textSecondary }}>Headlines, body copy, values</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 18, color: P.textSecondary, fontWeight: 600, width: 200 }}>Secondary text</span>
                <span style={{ fontSize: 11, color: P.textMuted, fontFamily: "monospace" }}>#9B8FC0</span>
                <span style={{ fontSize: 11, color: P.textSecondary }}>Descriptions, labels, metadata</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 18, color: P.textMuted, fontWeight: 600, width: 200 }}>Muted text</span>
                <span style={{ fontSize: 11, color: P.textMuted, fontFamily: "monospace" }}>#6B5E8A</span>
                <span style={{ fontSize: 11, color: P.textSecondary }}>Hints, placeholders, disabled</span>
              </div>
            </div>
          </Section>
        </div>
      )}

      {page === "typography" && (
        <div style={{ background: P.bg, borderRadius: 16, padding: 32, border: `1px solid ${P.border}` }}>
          <Section title="Type scale">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { name: "Hero", size: 32, weight: 700, lh: 38, sample: "Transform your life" },
                { name: "H1", size: 24, weight: 700, lh: 30, sample: "Dashboard" },
                { name: "H2", size: 20, weight: 600, lh: 26, sample: "Today's plan" },
                { name: "H3", size: 17, weight: 600, lh: 22, sample: "Workout summary" },
                { name: "Body", size: 15, weight: 400, lh: 22, sample: "Track your progress across fitness, nutrition, and life goals." },
                { name: "Body Bold", size: 15, weight: 600, lh: 22, sample: "142.3 lbs this morning" },
                { name: "Caption", size: 13, weight: 400, lh: 18, sample: "Last updated 2 minutes ago" },
                { name: "Tiny", size: 11, weight: 500, lh: 14, sample: "STREAK" },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 16, paddingBottom: 12, borderBottom: `1px solid ${P.border}` }}>
                  <div style={{ width: 80, fontSize: 10, color: P.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{t.name}</div>
                  <div style={{ flex: 1, fontSize: t.size, fontWeight: t.weight, lineHeight: `${t.lh}px`, color: P.text }}>{t.sample}</div>
                  <div style={{ fontSize: 10, color: P.textMuted, fontFamily: "monospace", whiteSpace: "nowrap" }}>{t.size}px / {t.weight}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Stat typography — monospace">
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ background: P.surface, borderRadius: 12, padding: 20, flex: 1, textAlign: "center", border: `1px solid ${P.border}` }}>
                <div style={{ fontSize: 10, color: P.textMuted, marginBottom: 4 }}>STAT LARGE</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: P.text, fontFamily: "'SF Mono', 'JetBrains Mono', monospace" }}>142.3</div>
                <div style={{ fontSize: 9, color: P.textMuted, fontFamily: "monospace", marginTop: 4 }}>28px / 700 / monospace</div>
              </div>
              <div style={{ background: P.surface, borderRadius: 12, padding: 20, flex: 1, textAlign: "center", border: `1px solid ${P.border}` }}>
                <div style={{ fontSize: 10, color: P.textMuted, marginBottom: 4 }}>STAT SMALL</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: P.primary, fontFamily: "'SF Mono', 'JetBrains Mono', monospace" }}>2,847</div>
                <div style={{ fontSize: 9, color: P.textMuted, fontFamily: "monospace", marginTop: 4 }}>20px / 600 / monospace</div>
              </div>
              <div style={{ background: P.surface, borderRadius: 12, padding: 20, flex: 1, textAlign: "center", border: `1px solid ${P.border}` }}>
                <div style={{ fontSize: 10, color: P.textMuted, marginBottom: 4 }}>COUNTDOWN</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: P.text, fontFamily: "'SF Mono', 'JetBrains Mono', monospace" }}>487</div>
                <div style={{ fontSize: 9, color: P.textMuted, fontFamily: "monospace", marginTop: 4 }}>36px / 800 / monospace</div>
              </div>
            </div>
          </Section>

          <Section title="Font families">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: P.surface, borderRadius: 10, padding: 16, border: `1px solid ${P.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: P.text }}>SF Pro Display / Inter</div>
                  <div style={{ fontSize: 12, color: P.textSecondary }}>Headlines, navigation, UI labels</div>
                </div>
                <div style={{ fontSize: 10, color: P.textMuted }}>PRIMARY</div>
              </div>
              <div style={{ background: P.surface, borderRadius: 10, padding: 16, border: `1px solid ${P.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: P.text }}>SF Pro Text / Inter</div>
                  <div style={{ fontSize: 12, color: P.textSecondary }}>Body copy, descriptions, form inputs</div>
                </div>
                <div style={{ fontSize: 10, color: P.textMuted }}>BODY</div>
              </div>
              <div style={{ background: P.surface, borderRadius: 10, padding: 16, border: `1px solid ${P.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: P.text, fontFamily: "'SF Mono', 'JetBrains Mono', monospace" }}>SF Mono / JetBrains Mono</div>
                  <div style={{ fontSize: 12, color: P.textSecondary }}>All numbers, stats, countdowns, weights, calories, streaks</div>
                </div>
                <div style={{ fontSize: 10, color: P.textMuted }}>DATA</div>
              </div>
            </div>
          </Section>
        </div>
      )}

      {page === "components" && (
        <div style={{ background: P.bg, borderRadius: 16, padding: 32, border: `1px solid ${P.border}` }}>
          <Section title="Buttons">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div style={{ background: P.primary, color: "#fff", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: `0 4px 20px ${P.primaryGlow}` }}>Primary action</div>
              <div style={{ background: P.primaryDim, color: P.primary, padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, border: `1px solid ${P.primary}40` }}>Secondary action</div>
              <div style={{ background: "transparent", color: P.textSecondary, padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, border: `1px solid ${P.border}` }}>Tertiary action</div>
              <div style={{ background: P.danger, color: "#fff", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600 }}>Destructive</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ background: P.success, color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>Log set</div>
              <div style={{ background: P.fire, color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>Start workout</div>
              <div style={{ background: P.secondary, color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>Send nudge</div>
              <div style={{ background: P.info, color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>AI coach</div>
            </div>
          </Section>

          <Section title="Cards">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: P.surface, borderRadius: 14, padding: 16, border: `1px solid ${P.border}` }}>
                <div style={{ fontSize: 10, color: P.textMuted, marginBottom: 4 }}>STANDARD CARD</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: P.text }}>Surface background</div>
                <div style={{ fontSize: 12, color: P.textSecondary, marginTop: 4 }}>Used for most content containers, list items, data displays</div>
              </div>
              <div style={{ background: P.surface, borderRadius: 14, padding: 16, border: `2px solid ${P.primary}`, boxShadow: `0 0 20px ${P.primaryGlow}` }}>
                <div style={{ fontSize: 10, color: P.primary, marginBottom: 4 }}>HIGHLIGHTED CARD</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: P.text }}>Purple glow border</div>
                <div style={{ fontSize: 12, color: P.textSecondary, marginTop: 4 }}>Used for countdown, active challenges, featured content</div>
              </div>
              <div style={{ background: `linear-gradient(135deg, ${P.surface}, #1a1145)`, borderRadius: 14, padding: 16, border: `1px solid ${P.primary}40` }}>
                <div style={{ fontSize: 10, color: P.primaryLight, marginBottom: 4 }}>GRADIENT CARD</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: P.text }}>Purple gradient surface</div>
                <div style={{ fontSize: 12, color: P.textSecondary, marginTop: 4 }}>Used for AI insights, trajectory simulator, premium features</div>
              </div>
              <div style={{ background: P.successDim, borderRadius: 14, padding: 16, border: `1px solid ${P.success}30` }}>
                <div style={{ fontSize: 10, color: P.success, marginBottom: 4 }}>STATUS CARD</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: P.text }}>Semantic background tint</div>
                <div style={{ fontSize: 12, color: P.textSecondary, marginTop: 4 }}>Used for readiness score, alerts, achievements</div>
              </div>
            </div>
          </Section>

          <Section title="Badges & pills">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "AI Powered", bg: P.cyanDim, color: P.cyan },
                { label: "12 day streak", bg: P.fireDim, color: P.fire },
                { label: "New PR", bg: P.goldDim, color: P.gold },
                { label: "Completed", bg: P.successDim, color: P.success },
                { label: "At risk", bg: P.dangerDim, color: P.danger },
                { label: "Partner", bg: P.secondaryDim, color: P.secondary },
                { label: "Diamond", bg: P.primaryDim, color: P.primary },
                { label: "Rest day", bg: `${P.textMuted}15`, color: P.textMuted },
              ].map((b, i) => (
                <div key={i} style={{ background: b.bg, color: b.color, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 8 }}>{b.label}</div>
              ))}
            </div>
          </Section>

          <Section title="Progress indicators">
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ position: "relative", width: 72, height: 72 }}>
                <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke={P.border} strokeWidth="5" />
                  <circle cx="36" cy="36" r="30" fill="none" stroke={P.primary} strokeWidth="5" strokeLinecap="round" strokeDasharray={188} strokeDashoffset={60} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: P.text, fontFamily: "monospace" }}>68%</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: P.textSecondary }}>Calories</span>
                    <span style={{ fontSize: 11, color: P.primary, fontFamily: "monospace" }}>1,847 / 2,800</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: P.surfaceLight }}>
                    <div style={{ height: "100%", width: "66%", borderRadius: 3, background: P.primary }} />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: P.textSecondary }}>Protein</span>
                    <span style={{ fontSize: 11, color: P.info, fontFamily: "monospace" }}>98 / 155g</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: P.surfaceLight }}>
                    <div style={{ height: "100%", width: "63%", borderRadius: 3, background: P.info }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: P.textSecondary }}>Water</span>
                    <span style={{ fontSize: 11, color: P.cyan, fontFamily: "monospace" }}>64 / 100 oz</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: P.surfaceLight }}>
                    <div style={{ height: "100%", width: "64%", borderRadius: 3, background: P.cyan }} />
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </div>
      )}

      {page === "icons" && (
        <div style={{ background: P.bg, borderRadius: 16, padding: 32, border: `1px solid ${P.border}` }}>
          <Section title="App icon">
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ width: 96, height: 96, borderRadius: 22, background: `linear-gradient(135deg, ${P.primaryDark}, ${P.primary}, ${P.secondary})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 32px ${P.primaryGlow}` }}>
                <svg width="52" height="52" viewBox="0 0 28 28" fill="none">
                  <path d="M14 3L24 8v12l-10 5L4 20V8l10-5z" stroke="#fff" strokeWidth="1.5" fill="none" />
                  <path d="M14 8l6 3v6l-6 3-6-3v-6l6-3z" fill="rgba(255,255,255,0.15)" stroke="#fff" strokeWidth="1" />
                  <path d="M14 13v7M14 13l6-3M14 13l-6-3" stroke="#fff" strokeWidth="1" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: P.text, marginBottom: 4 }}>Geometric prism — transformation through facets</div>
                <div style={{ fontSize: 12, color: P.textSecondary, lineHeight: 1.6 }}>The hexagonal prism represents multiple dimensions of life (fitness, nutrition, business, habits, mindset, relationships) unified into one structure. The inner glow suggests AI intelligence at the core. Purple,to,pink gradient conveys transformation and energy.</div>
              </div>
            </div>
          </Section>

          <Section title="Tab bar icons (conceptual)">
            <div style={{ display: "flex", gap: 24 }}>
              {[
                { label: "Dashboard", desc: "Home hub" },
                { label: "Fitness", desc: "Body training" },
                { label: "Nutrition", desc: "Food & macros" },
                { label: "Goals", desc: "Life targets" },
                { label: "Profile", desc: "Settings" },
              ].map((t, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: i === 0 ? P.primaryDim : P.surface, border: `1px solid ${i === 0 ? P.primary : P.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: i === 0 ? P.primary : P.textMuted, opacity: i === 0 ? 1 : 0.5 }} />
                  </div>
                  <div style={{ fontSize: 11, color: i === 0 ? P.primary : P.textMuted, fontWeight: i === 0 ? 600 : 400 }}>{t.label}</div>
                  <div style={{ fontSize: 9, color: P.textMuted }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Feature color mapping">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { icon: "AI", label: "AI features", color: P.cyan },
                { icon: "PR", label: "Personal records", color: P.gold },
                { icon: "ST", label: "Streaks", color: P.fire },
                { icon: "PT", label: "Partner", color: P.secondary },
                { icon: "OK", label: "Completed", color: P.success },
                { icon: "$$", label: "Revenue", color: P.gold },
                { icon: "ZZ", label: "Sleep", color: P.primaryLight },
                { icon: "H2", label: "Water", color: P.cyan },
                { icon: "KG", label: "Weight", color: P.info },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: P.surface, borderRadius: 8, padding: "8px 12px", border: `1px solid ${P.border}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: f.color, fontFamily: "monospace" }}>{f.icon}</div>
                  <div style={{ fontSize: 12, color: P.textSecondary }}>{f.label}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {page === "voice" && (
        <div style={{ background: P.bg, borderRadius: 16, padding: 32, border: `1px solid ${P.border}` }}>
          <Section title="Brand voice">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { trait: "Direct", desc: "No fluff, no filler. Say what needs to be said. Respect the user's time and intelligence.", example: "You're 40g short on protein. Grab a shake." },
                { trait: "Data,driven", desc: "Every claim backed by the user's own numbers. No generic advice. Personalized to their data.", example: "Your bench has stalled for 3 weeks. Switching to pause reps." },
                { trait: "Motivating", desc: "Firm but never harsh. Push without breaking. Celebrate wins without being cheesy.", example: "12,day streak. Don't let Day 13 be the one you skip." },
                { trait: "Honest", desc: "If something isn't working, say it. Users trust apps that tell the truth, not what they want to hear.", example: "You've been under 2,400 cal for 5 days. Your weight will stall." },
              ].map((v, i) => (
                <div key={i} style={{ background: P.surface, borderRadius: 12, padding: 16, border: `1px solid ${P.border}` }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: P.primary, marginBottom: 6 }}>{v.trait}</div>
                  <div style={{ fontSize: 12, color: P.textSecondary, lineHeight: 1.6, marginBottom: 10 }}>{v.desc}</div>
                  <div style={{ background: P.primaryDim, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: P.primaryLight, fontStyle: "italic" }}>"{v.example}"</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Taglines & copy">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { type: "Primary", text: "Every rep. Every meal. Every dollar. Every day." },
                { type: "App Store", text: "AI,powered life transformation for fitness, nutrition, business, and beyond." },
                { type: "Onboarding", text: "Your AI coach for body, business, and everything in between." },
                { type: "Push notification", text: "You haven't eaten today and it's 2 PM. Your body needs fuel." },
                { type: "Achievement", text: "New PR unlocked. The old you didn't stand a chance." },
                { type: "Weekly review", text: "This week: 4 workouts, 19,600 calories, 3 PRs. Grade: A." },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${P.border}` }}>
                  <div style={{ fontSize: 10, color: P.textMuted, textTransform: "uppercase", letterSpacing: 1, width: 100 }}>{t.type}</div>
                  <div style={{ fontSize: 13, color: P.text, flex: 1 }}>{t.text}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {page === "usage" && (
        <div style={{ background: P.bg, borderRadius: 16, padding: 32, border: `1px solid ${P.border}` }}>
          <Section title="Do's">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Use purple (#A855F7) as the primary action color on every screen",
                "Use monospace font for ALL numeric data (weights, calories, streaks, countdowns, percentages)",
                "Use deep space backgrounds (#0C0A15) as the default, not white or gray",
                "Use semantic colors consistently (green = success, red = danger, orange = streaks)",
                "Use the purple glow effect (box,shadow) on featured or active cards",
                "Use 12,16px border radius on all cards and containers",
                "Use pink (#EC4899) exclusively for partner and couples features",
                "Use cyan (#22D3EE) exclusively for AI,powered feature indicators",
                "Always show skeleton loading states, never blank screens",
                "Minimum 44pt touch targets on all interactive elements",
              ].map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: P.textSecondary, lineHeight: 1.6 }}>
                  <span style={{ color: P.success, fontSize: 14, lineHeight: 1.4 }}>+</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Don'ts">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Don't use purple for negative or destructive actions (that's red)",
                "Don't use light/white backgrounds as the default theme",
                "Don't use regular proportional fonts for numeric data",
                "Don't mix semantic colors (never green for warnings or red for success)",
                "Don't use more than 2 accent colors on a single card",
                "Don't use sharp corners (0px radius) on any UI element",
                "Don't display blank screens during loading, always use skeletons",
                "Don't use generic system fonts, always use the defined type scale",
                "Don't use purple glow on every card, reserve it for featured content only",
                "Don't make interactive elements smaller than 44pt",
              ].map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: P.textSecondary, lineHeight: 1.6 }}>
                  <span style={{ color: P.danger, fontSize: 14, lineHeight: 1.4 }}>x</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Spacing & layout tokens">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[
                { label: "xs", value: "4px", use: "Icon gaps" },
                { label: "sm", value: "8px", use: "Inline spacing" },
                { label: "md", value: "12px", use: "Card padding" },
                { label: "lg", value: "16px", use: "Section gaps" },
                { label: "xl", value: "20px", use: "Card padding" },
                { label: "xxl", value: "24px", use: "Section spacing" },
                { label: "xxxl", value: "32px", use: "Page margins" },
                { label: "radius", value: "12,16px", use: "Card corners" },
              ].map((s, i) => (
                <div key={i} style={{ background: P.surface, borderRadius: 8, padding: 10, border: `1px solid ${P.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: P.primary, fontFamily: "monospace" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: P.textMuted, marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: P.textSecondary, marginTop: 2 }}>{s.use}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
