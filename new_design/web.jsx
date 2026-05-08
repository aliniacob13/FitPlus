/* eslint-disable */
/* Web (desktop) screens for FitPlus prototype.
   Designed at 1180×740 to fit inside the browser window chrome.    */

const W = {};

const HS = ({ children, gap = 16, style }) =>
  <div style={{ display: 'flex', alignItems: 'center', gap, ...style }}>{children}</div>;
const VS = ({ children, gap = 16, style }) =>
  <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>{children}</div>;

// ─── Web shell (sidebar nav + content) ──────────────────────────────
function Shell({ active, onChange, children }) {
  const items = [
    { k: 'dash', label: 'Dashboard', icon: 'home' },
    { k: 'diary', label: 'Food Diary', icon: 'bowl' },
    { k: 'chat', label: 'AI Coach', icon: 'spark' },
    { k: 'map', label: 'Gyms', icon: 'pin' },
    { k: 'profile', label: 'Profile', icon: 'user' },
  ];
  return (
    <div className="fp" style={{ display: 'flex', height: '100%', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{ width: 230, padding: '24px 18px', borderRight: '1px solid var(--line-soft)',
        display: 'flex', flexDirection: 'column', gap: 24, flexShrink: 0 }}>
        <HS gap={10}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="leaf" size={18} color="var(--primary-ink)"/>
          </div>
          <div>
            <div className="serif-d" style={{ fontSize: 20, letterSpacing: '-0.02em', lineHeight: 1 }}>FitPlus</div>
            <div className="eyebrow" style={{ fontSize: 9, marginTop: 2 }}>wellness · daily</div>
          </div>
        </HS>

        <VS gap={2}>
          {items.map(it => {
            const on = active === it.k;
            return (
              <button key={it.k} onClick={() => onChange(it.k)} style={{
                border: 0, background: on ? 'var(--surface-2)' : 'transparent',
                padding: '10px 12px', borderRadius: 12, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                color: on ? 'var(--ink)' : 'var(--muted)',
                fontWeight: on ? 600 : 500, fontSize: 13, fontFamily: 'inherit'
              }}>
                <Icon name={it.icon} size={16}/> {it.label}
              </button>
            );
          })}
        </VS>

        <div style={{ marginTop: 'auto' }}>
          <div className="card" style={{ padding: 14 }}>
            <Icon name="spark" size={14} color="var(--accent)"/>
            <div className="serif-d" style={{ fontSize: 17, marginTop: 6 }}>Try Pro</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5, marginTop: 2 }}>
              Plan-uri AI personalizate, plate scan nelimitat & analize săptămânale.
            </div>
            <button className="btn" style={{ marginTop: 10, padding: '8px 12px', fontSize: 12 }}>Upgrade</button>
          </div>
          <HS gap={10} style={{ marginTop: 14, padding: '6px 4px' }}>
            <Avatar name="AM" size={32}/>
            <VS gap={1}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Andrei M.</span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>andrei@fitplus.ro</span>
            </VS>
          </HS>
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────────
W.Dash = function Dashboard() {
  return (
    <div className="screen" style={{ padding: 32 }}>
      {/* Header */}
      <HS style={{ justifyContent: 'space-between', marginBottom: 22 }}>
        <VS gap={6}>
          <span className="eyebrow">JOI · 8 MAI 2026</span>
          <span className="serif-d" style={{ fontSize: 40, letterSpacing: '-0.02em', lineHeight: 1 }}>
            Bună, <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>Andrei.</span>
          </span>
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>Mai ai 753 kcal & un Push day pentru azi.</span>
        </VS>
        <HS gap={10}>
          <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 999 }}>
            <Icon name="search" size={14} color="var(--muted)"/>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Caută alimente, săli, exerciții…</span>
            <span className="mono" style={{ fontSize: 10, padding: '2px 6px', background: 'var(--surface-2)', borderRadius: 6, color: 'var(--muted)' }}>⌘K</span>
          </div>
          <button className="card" style={{ width: 38, height: 38, borderRadius: 19, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bell" size={16}/>
          </button>
        </HS>
      </HS>

      {/* Top cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16 }}>
        {/* Calorie hero */}
        <div className="card" style={{ padding: 24, background: 'var(--hero-grad)', borderColor: 'transparent', minHeight: 220 }}>
          <HS gap={24} style={{ alignItems: 'center', height: '100%' }}>
            <ProgressRing size={170} stroke={14} value={0.62} label="1 247" sub="kcal · 62%"/>
            <VS gap={12} style={{ flex: 1 }}>
              <div>
                <span className="eyebrow">remaining for today</span>
                <div className="serif-d" style={{ fontSize: 48, letterSpacing: '-0.03em', lineHeight: 1 }}>753 <span style={{ fontSize: 14, color: 'var(--muted)' }}>kcal</span></div>
              </div>
              <div style={{ height: 1, background: 'rgba(0,0,0,0.08)' }}/>
              <HS gap={20}>
                <VS gap={2}><span className="mono" style={{ fontSize: 14, color: 'var(--macro-protein)' }}>74g</span><span className="eyebrow" style={{ fontSize: 9 }}>protein</span></VS>
                <VS gap={2}><span className="mono" style={{ fontSize: 14, color: 'var(--macro-carbs)' }}>138g</span><span className="eyebrow" style={{ fontSize: 9 }}>carbs</span></VS>
                <VS gap={2}><span className="mono" style={{ fontSize: 14, color: 'var(--macro-fat)' }}>28g</span><span className="eyebrow" style={{ fontSize: 9 }}>fat</span></VS>
              </HS>
              <button className="btn" style={{ alignSelf: 'flex-start' }}><Icon name="plus" size={14} color="var(--primary-ink)"/> Add meal</button>
            </VS>
          </HS>
        </div>

        {/* Streak */}
        <div className="card" style={{ padding: 22 }}>
          <HS style={{ justifyContent: 'space-between' }}>
            <span className="eyebrow">streak</span>
            <Icon name="flame" size={16} color="var(--accent)"/>
          </HS>
          <div className="serif-d" style={{ fontSize: 56, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 6 }}>5</div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>zile la rând cu target atins</span>
          <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
            {['L','M','M','J','V','S','D'].map((d,i) => (
              <VS key={i} gap={4} style={{ alignItems: 'center' }}>
                <StreakDot on={i < 5}/>
                <span style={{ fontSize: 9, color: 'var(--muted)' }}>{d}</span>
              </VS>
            ))}
          </div>
        </div>

        {/* Workout card */}
        <div className="card" style={{ padding: 22 }}>
          <HS style={{ justifyContent: 'space-between' }}>
            <span className="eyebrow">today · push day</span>
            <Icon name="dumbbell" size={16} color="var(--primary)"/>
          </HS>
          <div className="serif-d" style={{ fontSize: 28, letterSpacing: '-0.02em', marginTop: 6 }}>45 <span style={{ fontSize: 14, color: 'var(--muted)' }}>min</span></div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>5 exerciții · 17 seturi · piept, umeri</span>
          <div style={{ marginTop: 14, height: 6, background: 'var(--line)', borderRadius: 999 }}>
            <div style={{ width: '40%', height: '100%', background: 'var(--primary)', borderRadius: 999 }}/>
          </div>
          <HS style={{ justifyContent: 'space-between', marginTop: 8 }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>2 / 5</span>
            <button style={{ border: 0, background: 'transparent', color: 'var(--ink)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Continue →</button>
          </HS>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginTop: 16 }}>
        {/* AI suggestion / chat preview */}
        <div className="card" style={{ padding: 22 }}>
          <HS style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <HS gap={10}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="leaf" size={16} color="var(--primary)"/>
              </div>
              <VS gap={2}>
                <span className="serif-d" style={{ fontSize: 18 }}>Diet Coach</span>
                <span className="eyebrow">sugestii pentru azi</span>
              </VS>
            </HS>
            <button className="btn ghost" style={{ padding: '8px 14px', fontSize: 12 }}>Open chat →</button>
          </HS>

          <VS gap={10}>
            <SuggCard
              title="Cină recomandată — somon cu sparanghel & cartof dulce"
              body="Iei 38g proteine și încheie ziua aproape de target. ~520 kcal."
              kcal="520" tag="Cină" hue="primary"/>
            <SuggCard
              title='Ai sub-consumat fier săptămâna asta'
              body="Adaugă lentilă, spanac, sau carne roșie 2× pe săptămână."
              kcal="—" tag="Insight" hue="accent"/>
            <SuggCard
              title="Streak alert — mai ai 30 min să loggezi cina"
              body="Deschide Plate Coach și fă o poză rapidă."
              kcal="—" tag="Reminder" hue="warn"/>
          </VS>
        </div>

        {/* Weight chart + stats */}
        <div className="card" style={{ padding: 22 }}>
          <HS style={{ justifyContent: 'space-between' }}>
            <VS gap={2}>
              <span className="eyebrow">greutate</span>
              <HS gap={10} style={{ alignItems: 'baseline' }}>
                <span className="serif-d" style={{ fontSize: 36, letterSpacing: '-0.02em' }}>78.4</span>
                <span style={{ fontSize: 12, color: 'var(--good)', fontWeight: 600 }}>↓ 2.3 kg</span>
              </HS>
            </VS>
            <div className="seg">
              <button>7d</button><button className="on">30d</button><button>90d</button>
            </div>
          </HS>
          <WeightChartWeb/>
          <HS style={{ justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--line-soft)', marginTop: 14 }}>
            <VS gap={2}><span className="mono" style={{ fontSize: 14 }}>23.4</span><span className="eyebrow" style={{ fontSize: 9 }}>BMI</span></VS>
            <VS gap={2}><span className="mono" style={{ fontSize: 14 }}>1 920</span><span className="eyebrow" style={{ fontSize: 9 }}>BMR</span></VS>
            <VS gap={2}><span className="mono" style={{ fontSize: 14 }}>2 580</span><span className="eyebrow" style={{ fontSize: 9 }}>TDEE</span></VS>
            <VS gap={2}><span className="mono" style={{ fontSize: 14, color: 'var(--good)' }}>-580</span><span className="eyebrow" style={{ fontSize: 9 }}>deficit</span></VS>
          </HS>
        </div>
      </div>
    </div>
  );
};

function SuggCard({ title, body, kcal, tag, hue }) {
  const tints = { primary: ['var(--primary-soft)', 'var(--primary)'], accent: ['var(--accent-soft)', 'var(--accent)'], warn: ['var(--surface-2)', 'var(--warn)'] };
  const [bg, fg] = tints[hue];
  return (
    <div className="card flat" style={{ padding: 14, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="spark" size={18} color={fg}/>
      </div>
      <VS gap={4} style={{ flex: 1 }}>
        <HS gap={8}>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: bg, color: fg, fontWeight: 600, letterSpacing: '0.06em' }}>{tag.toUpperCase()}</span>
          {kcal !== '—' && <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{kcal} kcal</span>}
        </HS>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{title}</span>
        <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{body}</span>
      </VS>
      <Icon name="arrow" size={16} color="var(--muted)"/>
    </div>
  );
}

function WeightChartWeb() {
  const data = [80.7, 80.4, 80.6, 80.1, 79.8, 79.9, 79.4, 79.2, 79.0, 79.1, 78.7, 78.5, 78.6, 78.4];
  const max = Math.max(...data) + 0.3, min = Math.min(...data) - 0.3;
  const span = max - min;
  const Wd = 360, H = 120, step = Wd / (data.length - 1);
  const pts = data.map((v, i) => `${i*step},${H - ((v-min)/span)*H}`);
  const path = 'M' + pts.join(' L');
  const fill = path + ` L${Wd},${H} L0,${H} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${Wd} ${H}`} style={{ marginTop: 14, display: 'block' }}>
      <defs>
        <linearGradient id="wgrad2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#wgrad2)"/>
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={(data.length-1)*step} cy={H - ((data[data.length-1]-min)/span)*H} r="4" fill="var(--primary)" stroke="var(--surface)" strokeWidth="2"/>
    </svg>
  );
}

// ─── DIARY (web) ─────────────────────────────────────────────────────
W.Diary = function DiaryWeb() {
  return (
    <div className="screen" style={{ padding: 32 }}>
      <HS style={{ justifyContent: 'space-between', marginBottom: 22 }}>
        <VS gap={6}>
          <span className="eyebrow">FOOD DIARY</span>
          <span className="serif-d" style={{ fontSize: 40, letterSpacing: '-0.02em', lineHeight: 1 }}>Today · May 8</span>
        </VS>
        <HS gap={10}>
          <button className="btn ghost"><Icon name="left" size={14}/> Yesterday</button>
          <button className="btn"><Icon name="plus" size={14} color="var(--primary-ink)"/> Add food</button>
          <button className="btn accent"><Icon name="camera" size={14} color="#fff"/> Plate Coach</button>
        </HS>
      </HS>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16 }}>
        {/* Left – summary */}
        <VS gap={16}>
          <div className="card" style={{ padding: 22 }}>
            <HS gap={20}>
              <ProgressRing size={130} stroke={12} value={0.62} label="62%" sub="of goal"/>
              <VS gap={6} style={{ flex: 1 }}>
                <div className="serif-d" style={{ fontSize: 36, letterSpacing: '-0.02em', lineHeight: 1 }}>1 247</div>
                <span className="eyebrow">consumed of 2 000</span>
                <span style={{ fontSize: 12, color: 'var(--good)', fontWeight: 600, marginTop: 4 }}>+ 753 kcal left</span>
              </VS>
            </HS>
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <MacroBar label="Protein" value={74}  target={100} color="var(--macro-protein)"/>
              <MacroBar label="Carbs"   value={138} target={250} color="var(--macro-carbs)"/>
              <MacroBar label="Fat"     value={28}  target={67}  color="var(--macro-fat)"/>
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <HS style={{ justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="eyebrow">water · today</span>
              <Icon name="water" size={14} color="var(--accent)"/>
            </HS>
            <HS gap={6}>
              {[1,1,1,1,1,0,0,0].map((on, i) => (
                <div key={i} style={{
                  flex: 1, height: 38, borderRadius: 8,
                  background: on ? 'var(--accent)' : 'var(--surface-2)',
                  border: '1px solid ' + (on ? 'transparent' : 'var(--line)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon name="water" size={14} color={on ? '#fff' : 'var(--muted-2)'}/>
                </div>
              ))}
            </HS>
            <HS style={{ justifyContent: 'space-between', marginTop: 10 }}>
              <span className="mono" style={{ fontSize: 12 }}>1.25 / 2.0 L</span>
              <button className="btn ghost" style={{ padding: '6px 10px', fontSize: 11 }}>+ glass</button>
            </HS>
          </div>
        </VS>

        {/* Right – meals */}
        <VS gap={12}>
          <MealWeb name="Breakfast" emoji="☕" time="08:12" total={420}
            items={[
              { name: 'Iaurt grecesc · 180g', macro: 'P 18 · C 8 · F 5', kcal: 165 },
              { name: 'Mure & afine · 80g',   macro: 'P 1 · C 11 · F 0', kcal: 45  },
              { name: 'Fulgi de ovăz · 40g',  macro: 'P 5 · C 27 · F 3', kcal: 152 },
              { name: 'Miere · 10g',          macro: 'P 0 · C 8 · F 0',  kcal: 32  },
            ]}/>
          <MealWeb name="Lunch" emoji="🥗" time="13:40" total={648}
            items={[
              { name: 'Piept de pui la grătar · 160g', macro: 'P 38 · C 0 · F 12', kcal: 264 },
              { name: 'Quinoa · 110g',                  macro: 'P 5 · C 22 · F 2',  kcal: 134 },
              { name: 'Salată mixtă + dressing · 180g', macro: 'P 2 · C 8 · F 7',   kcal: 95  },
              { name: 'Avocado · 60g',                  macro: 'P 1 · C 5 · F 9',   kcal: 96  },
            ]}/>
          <MealWeb name="Snack" emoji="🍎" time="—" total={179}
            items={[{ name: 'Măr + 25g migdale', macro: 'P 6 · C 26 · F 14', kcal: 179 }]}/>
          <MealWeb name="Dinner" emoji="🌙" time="—" total={0}
            empty/>
        </VS>
      </div>
    </div>
  );
};

function MealWeb({ name, emoji, time, total, items, empty }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <HS style={{ justifyContent: 'space-between' }}>
        <HS gap={10}>
          <span style={{ fontSize: 18 }}>{emoji}</span>
          <span className="serif-d" style={{ fontSize: 18 }}>{name}</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{time}</span>
        </HS>
        <HS gap={6}>
          {!empty && <span className="mono" style={{ fontSize: 14 }}>{total}</span>}
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{empty ? 'no entries yet' : 'kcal'}</span>
        </HS>
      </HS>
      {!empty && (
        <VS gap={8} style={{ marginTop: 12 }}>
          {items.map((it, i) => (
            <HS key={i} style={{ justifyContent: 'space-between', padding: '6px 0', borderTop: i ? '1px solid var(--line-soft)' : 'none' }}>
              <VS gap={2}>
                <span style={{ fontSize: 13 }}>{it.name}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{it.macro}</span>
              </VS>
              <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{it.kcal} kcal</span>
            </HS>
          ))}
        </VS>
      )}
      {empty && (
        <div style={{ marginTop: 10, padding: '14px 16px', borderRadius: 14, background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Plan-uit: somon cu sparanghel · ~520 kcal</span>
          <button className="btn ghost" style={{ padding: '6px 10px', fontSize: 11 }}>Log meal</button>
        </div>
      )}
    </div>
  );
}

// ─── CHAT (web split layout) ─────────────────────────────────────────
W.Chat = function ChatWeb() {
  return (
    <div className="screen" style={{ display: 'flex', height: '100%' }}>
      {/* Conversation list */}
      <div style={{ width: 270, borderRight: '1px solid var(--line-soft)', padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span className="serif-d" style={{ fontSize: 22 }}>Conversations</span>
        <div className="card" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 999 }}>
          <Icon name="search" size={14} color="var(--muted)"/>
          <input placeholder="Search…" style={{ border: 0, background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 12, flex: 1 }}/>
        </div>
        <div className="seg" style={{ alignSelf: 'flex-start' }}>
          <button className="on">All</button><button>Diet</button><button>Workout</button>
        </div>
        <VS gap={4} style={{ overflowY: 'auto' }}>
          <ConvRow active title="Cină ușoară cu somon" sub="Sugerez somon cu sparanghel…" tag="Diet" tagColor="var(--primary)" time="now"/>
          <ConvRow title="Plan push de azi" sub="Ai 5 exerciții, 45 min…" tag="Workout" tagColor="var(--accent)" time="2h"/>
          <ConvRow title="Ce mănânc pre-workout" sub="Banana + iaurt e bună…" tag="Diet" tagColor="var(--primary)" time="ieri"/>
          <ConvRow title="Lipsă fier — propuneri" sub="Lentilă + spanac de 2x/spt." tag="Diet" tagColor="var(--primary)" time="ieri"/>
          <ConvRow title="Pull day săptămâna viitoare" sub="Hai să creștem volumul…" tag="Workout" tagColor="var(--accent)" time="2 zile"/>
          <ConvRow title="Rețete vegetariene rapide" sub="3 idei sub 500 kcal…" tag="Diet" tagColor="var(--primary)" time="3 zile"/>
        </VS>
        <button className="btn"><Icon name="plus" size={14} color="var(--primary-ink)"/> New conversation</button>
      </div>

      {/* Chat thread */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <HS style={{ justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid var(--line-soft)' }}>
          <HS gap={12}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="leaf" size={18} color="var(--primary)"/>
            </div>
            <VS gap={2}>
              <span className="serif-d" style={{ fontSize: 18 }}>Diet Coach</span>
              <span className="eyebrow">cină ușoară cu somon</span>
            </VS>
          </HS>
          <HS gap={8}>
            <span className="mono" style={{ fontSize: 10, padding: '4px 8px', background: 'var(--good)', color: '#fff', borderRadius: 999, fontWeight: 600, letterSpacing: '0.06em' }}>● ONLINE</span>
            <button className="btn ghost" style={{ padding: '8px 12px', fontSize: 12 }}>Export</button>
          </HS>
        </HS>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <BubbleW role="ai">
            <span className="serif-d" style={{ fontSize: 16, color: 'var(--ink)' }}>Bună, Andrei.</span>
            <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              Văd că azi ai consumat <b>1 247 kcal</b> și mai ai loc pentru ~750. Proteinele tale sunt la 74g — ai nevoie de încă ~25g. Ce ai în plan pentru cină?
            </div>
          </BubbleW>

          <BubbleW role="user">Vreau ceva ușor cu pește. Am somon și legume.</BubbleW>

          <BubbleW role="ai">
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              Sugerez <b>somon la cuptor cu sparanghel & cartof dulce</b>. ~520 kcal, 38g proteine, încheie ziua aproape de target.
            </div>
            <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: 'var(--bg-deep)' }}>
              <HS style={{ justifyContent: 'space-between' }}>
                <span className="eyebrow">macro estimat</span>
                <span className="mono" style={{ fontSize: 12 }}>520 kcal</span>
              </HS>
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <MacroBar label="Protein" value={38} target={100} color="var(--macro-protein)"/>
                <MacroBar label="Carbs"   value={42} target={250} color="var(--macro-carbs)"/>
                <MacroBar label="Fat"     value={22} target={67}  color="var(--macro-fat)"/>
              </div>
            </div>
            <HS gap={8} style={{ marginTop: 12 }}>
              <button className="btn" style={{ padding: '8px 14px', fontSize: 12 }}>Adaugă în jurnal</button>
              <button className="btn ghost" style={{ padding: '8px 14px', fontSize: 12 }}>Rețetă completă</button>
              <button className="btn ghost" style={{ padding: '8px 14px', fontSize: 12 }}>Altă variantă</button>
            </HS>
          </BubbleW>

          <BubbleW role="user">Cât timp dă durează?</BubbleW>
          <BubbleW role="ai" typing/>
        </div>

        <div style={{ padding: '16px 32px 24px', borderTop: '1px solid var(--line-soft)' }}>
          <div className="card" style={{ padding: '10px 10px 10px 16px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 999 }}>
            <Icon name="spark" size={16} color="var(--accent)"/>
            <input placeholder="Întreabă-mă orice despre nutriție sau antrenament…"
              style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 13, color: 'var(--ink)' }}/>
            <button style={{ width: 36, height: 36, border: 0, background: 'transparent', cursor: 'pointer' }}>
              <Icon name="mic" size={16}/>
            </button>
            <button style={{ width: 38, height: 38, border: 0, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="send" size={16} color="var(--primary-ink)"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function ConvRow({ active, title, sub, tag, tagColor, time }) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
      background: active ? 'var(--surface-2)' : 'transparent',
      borderLeft: active ? '2px solid var(--primary)' : '2px solid transparent'
    }}>
      <HS style={{ justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        <span className="mono" style={{ fontSize: 9, color: 'var(--muted)' }}>{time}</span>
      </HS>
      <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>
      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, background: tagColor + '22', color: tagColor, fontWeight: 600, letterSpacing: '0.06em', marginTop: 6, display: 'inline-block' }}>{tag.toUpperCase()}</span>
    </div>
  );
}

function BubbleW({ role, children, typing }) {
  if (role === 'user') {
    return (
      <div style={{ alignSelf: 'flex-end', maxWidth: '70%',
        background: 'var(--ink)', color: 'var(--bg)',
        padding: '12px 18px', borderRadius: '22px 22px 4px 22px', fontSize: 14, lineHeight: 1.5 }}>
        {children}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: '78%' }}>
      <div style={{ width: 32, height: 32, borderRadius: 12, background: 'var(--primary-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="leaf" size={16} color="var(--primary)"/>
      </div>
      <div className="card" style={{ padding: '14px 18px', borderRadius: '4px 22px 22px 22px', background: 'var(--surface)' }}>
        {typing
          ? <div style={{ display: 'flex', gap: 5 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--muted-2)', animation: `fp-pulse 1.2s ${i*0.15}s ease infinite` }}/>)}
            </div>
          : children}
      </div>
    </div>
  );
}

// ─── MAP / GYMS (web) ─────────────────────────────────────────────────
W.Map = function MapWeb() {
  const gyms = [
    { name: 'World Class · Pipera', addr: 'Bd. Pipera 42 · Sector 1', dist: '0.6 km', price: '249 lei/lună', rating: 4.8, reviews: 412, tags: ['Pool','24/7','Sauna'], img: 'GYM' },
    { name: 'Smartfit Studio',      addr: 'Calea Dorobanți 12 · Sector 1', dist: '1.2 km', price: '149 lei/lună', rating: 4.6, reviews: 218, tags: ['Yoga','HIIT','Pilates'], img: 'STUDIO' },
    { name: '7Card · CrossFit Hub', addr: 'Str. Aviatorilor 8 · Sector 1', dist: '2.0 km', price: 'Cu 7Card',    rating: 4.9, reviews: 156, tags: ['CrossFit','Coaches'], img: 'CROSSFIT' },
    { name: 'StayFit Plus',         addr: 'Bd. Mărăști 22 · Sector 2',     dist: '2.4 km', price: '129 lei/lună', rating: 4.4, reviews: 89,  tags: ['Cardio','Free wifi'], img: 'CARDIO' },
  ];
  return (
    <div className="screen" style={{ display: 'flex', height: '100%' }}>
      {/* List */}
      <div style={{ width: 420, padding: '24px 22px', borderRight: '1px solid var(--line-soft)', overflowY: 'auto' }}>
        <VS gap={6} style={{ marginBottom: 18 }}>
          <span className="eyebrow">SĂLI APROAPE DE TINE</span>
          <span className="serif-d" style={{ fontSize: 30, letterSpacing: '-0.02em' }}>Bucharest, RO</span>
        </VS>
        <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 999, marginBottom: 14 }}>
          <Icon name="search" size={14} color="var(--muted)"/>
          <input placeholder="Caută o sală sau zonă…" style={{ border: 0, background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 13, flex: 1 }}/>
        </div>
        <HS gap={6} style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          {['Aproape','7Card','24/7','Piscină','Yoga','CrossFit','Sauna'].map((t,i) =>
            <span key={t} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 500, borderRadius: 999, background: i===0 ? 'var(--ink)' : 'var(--surface-2)', color: i===0 ? 'var(--bg)' : 'var(--muted)', border: '1px solid var(--line)', cursor: 'pointer' }}>{t}</span>
          )}
        </HS>
        <VS gap={12}>
          {gyms.map(g => (
            <div key={g.name} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex' }}>
              <PlaceholderImg label={g.img} height={108} radius={0}/>
              <div style={{ padding: '14px 16px', flex: 1 }}>
                <HS style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{g.name}</span>
                  <Icon name="heart" size={14} color="var(--muted)"/>
                </HS>
                <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginTop: 2 }}>{g.addr}</span>
                <HS gap={10} style={{ marginTop: 8 }}>
                  <HS gap={4}><Icon name="star" size={12} color="var(--accent)"/><span className="mono" style={{ fontSize: 11 }}>{g.rating}</span><span style={{ fontSize: 10, color: 'var(--muted)' }}>({g.reviews})</span></HS>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>·</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{g.dist}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>·</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 500 }}>{g.price}</span>
                </HS>
                <HS gap={6} style={{ marginTop: 10 }}>
                  {g.tags.map(t => <span key={t} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 999, background: 'var(--surface-2)', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.05em' }}>{t}</span>)}
                </HS>
              </div>
            </div>
          ))}
        </VS>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-deep)' }}>
        <FauxMapWeb/>
        <div style={{ position: 'absolute', top: 18, right: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="card" style={{ width: 38, height: 38, borderRadius: 12, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={16}/></button>
          <button className="card" style={{ width: 38, height: 38, borderRadius: 12, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 18 }}>−</span></button>
          <button className="card" style={{ width: 38, height: 38, borderRadius: 12, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="pin" size={16}/></button>
        </div>
        <div className="card" style={{ position: 'absolute', bottom: 18, left: 18, right: 18, padding: 16, display: 'flex', gap: 16 }}>
          <PlaceholderImg label="GYM · pinned" height={70} radius={12}/>
          <VS gap={4} style={{ flex: 1 }}>
            <HS style={{ justifyContent: 'space-between' }}>
              <span className="serif-d" style={{ fontSize: 18 }}>World Class · Pipera</span>
              <HS gap={4}><Icon name="star" size={12} color="var(--accent)"/><span className="mono" style={{ fontSize: 11 }}>4.8</span></HS>
            </HS>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Bd. Pipera 42 · 0.6 km · piscină, sauna</span>
            <HS gap={8} style={{ marginTop: 4 }}>
              <button className="btn" style={{ padding: '6px 12px', fontSize: 11 }}>Vezi detalii</button>
              <button className="btn ghost" style={{ padding: '6px 12px', fontSize: 11 }}>Direcții</button>
            </HS>
          </VS>
        </div>
      </div>
    </div>
  );
};

function FauxMapWeb() {
  return (
    <svg viewBox="0 0 800 600" style={{ width: '100%', height: '100%', display: 'block' }} preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="gridw" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="var(--line)" strokeWidth="0.6"/>
        </pattern>
      </defs>
      <rect width="800" height="600" fill="url(#gridw)"/>
      {/* roads */}
      <path d="M-20,300 C200,260 360,360 820,260" stroke="var(--line)" strokeWidth="22" fill="none" strokeLinecap="round"/>
      <path d="M-20,300 C200,260 360,360 820,260" stroke="var(--bg)" strokeWidth="10" fill="none" strokeLinecap="round"/>
      <path d="M250,-20 C290,180 200,360 280,620" stroke="var(--line)" strokeWidth="16" fill="none" strokeLinecap="round"/>
      <path d="M250,-20 C290,180 200,360 280,620" stroke="var(--bg)" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <path d="M580,-20 C540,180 640,360 590,620" stroke="var(--line)" strokeWidth="16" fill="none" strokeLinecap="round"/>
      <path d="M580,-20 C540,180 640,360 590,620" stroke="var(--bg)" strokeWidth="6" fill="none" strokeLinecap="round"/>
      {/* parks */}
      <ellipse cx="160" cy="480" rx="120" ry="60" fill="var(--primary-soft)" opacity="0.55"/>
      <ellipse cx="660" cy="120" rx="100" ry="58" fill="var(--primary-soft)" opacity="0.55"/>
      {/* pins */}
      <g><circle cx="320" cy="260" r="44" fill="var(--accent)" opacity="0.16"/><circle cx="320" cy="260" r="14" fill="var(--accent)"/><circle cx="320" cy="260" r="5" fill="#fff"/></g>
      <g><circle cx="480" cy="400" r="14" fill="var(--primary)"/><circle cx="480" cy="400" r="5" fill="#fff"/></g>
      <g><circle cx="640" cy="320" r="14" fill="var(--primary)"/><circle cx="640" cy="320" r="5" fill="#fff"/></g>
      <g><circle cx="180" cy="200" r="14" fill="var(--primary)"/><circle cx="180" cy="200" r="5" fill="#fff"/></g>
      {/* you-are-here */}
      <g><circle cx="400" cy="480" r="22" fill="var(--primary)" opacity="0.22"/><circle cx="400" cy="480" r="9" fill="#fff" stroke="var(--primary)" strokeWidth="4"/></g>
    </svg>
  );
}

// expose
window.W = W;
window.WebShell = Shell;
