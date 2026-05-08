/* eslint-disable */
/* Mobile screens for the FitPlus prototype.
   Each screen is a pure component — the parent (App) drives navigation. */

const M = {};

// helper
const Hstack = ({ children, gap = 12, style }) =>
  <div style={{ display: 'flex', alignItems: 'center', gap, ...style }}>{children}</div>;
const Vstack = ({ children, gap = 12, style }) =>
  <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>{children}</div>;

// ─── Top header used across mobile screens ────────────────────────────
function MHeader({ left, title, right, eyebrow, big }) {
  return (
    <div style={{ padding: '8px 22px 0 22px' }}>
      <Hstack style={{ justifyContent: 'space-between' }}>
        <div>{left}</div>
        <div>{right}</div>
      </Hstack>
      {eyebrow && <div className="eyebrow" style={{ marginTop: 14 }}>{eyebrow}</div>}
      {title && (
        <div className="serif-d" style={{
          fontSize: big ? 38 : 30, lineHeight: 1.05, letterSpacing: '-0.02em',
          color: 'var(--ink)', marginTop: 6
        }}>{title}</div>
      )}
    </div>
  );
}

// ─── HOME / DASHBOARD ────────────────────────────────────────────────
M.Home = function HomeScreen({ user = 'Andrei', onNavigate }) {
  const days = ['L','M','M','J','V','S','D'];
  const streak = [1,1,1,1,1,0,0];
  return (
    <div className="screen" style={{ background: 'var(--bg)', height: '100%', overflowY: 'auto', paddingBottom: 90 }}>
      <MHeader
        eyebrow={`Joi · 8 mai`}
        title={<>Bună,<br/><span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>{user}.</span></>}
        right={<Avatar name="AM"/>}
        big
      />

      {/* Hero ring card */}
      <div style={{ padding: '20px 22px 0' }}>
        <div className="card" style={{
          padding: '22px 20px',
          background: 'var(--hero-grad)',
          borderColor: 'transparent',
          color: 'var(--ink)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <ProgressRing size={146} stroke={12} value={0.62} label="1 247" sub="kcal" />
            <Vstack gap={10} style={{ flex: 1 }}>
              <div>
                <div className="eyebrow">remaining</div>
                <div className="serif-d" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>753<span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 4 }}>kcal</span></div>
              </div>
              <div style={{ height: 1, background: 'rgba(0,0,0,0.08)' }}/>
              <Hstack gap={8}>
                <Icon name="flame" size={14} color="var(--accent)"/>
                <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>Goal · 2 000 kcal</span>
              </Hstack>
            </Vstack>
          </div>
        </div>
      </div>

      {/* Streak card */}
      <div style={{ padding: '14px 22px 0' }}>
        <div className="card" style={{ padding: '16px 18px' }}>
          <Hstack style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <Hstack gap={8}>
              <Icon name="flame" size={16} color="var(--accent)"/>
              <span style={{ fontWeight: 600, fontSize: 14 }}>5 zile la rând</span>
            </Hstack>
            <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>STREAK</span>
          </Hstack>
          <Hstack gap={6} style={{ justifyContent: 'space-between' }}>
            {days.map((d,i) => (
              <Vstack key={i} gap={6} style={{ alignItems: 'center' }}>
                <StreakDot on={!!streak[i]}/>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{d}</span>
              </Vstack>
            ))}
          </Hstack>
        </div>
      </div>

      {/* Macro mini */}
      <div style={{ padding: '14px 22px 0' }}>
        <div className="card" style={{ padding: '18px' }}>
          <Hstack gap={16}>
            <TripleRing size={92} stroke={6} values={[0.74, 0.55, 0.42]}/>
            <Vstack gap={10} style={{ flex: 1 }}>
              <span className="eyebrow">macros today</span>
              <Vstack gap={8}>
                <Hstack gap={8}><div style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--macro-protein)' }}/><span style={{ fontSize: 12, color: 'var(--ink-2)' }}>Proteine</span><span className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>74 / 100g</span></Hstack>
                <Hstack gap={8}><div style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--macro-carbs)' }}/><span style={{ fontSize: 12, color: 'var(--ink-2)' }}>Carbohidrați</span><span className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>138 / 250g</span></Hstack>
                <Hstack gap={8}><div style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--macro-fat)' }}/><span style={{ fontSize: 12, color: 'var(--ink-2)' }}>Grăsimi</span><span className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>28 / 67g</span></Hstack>
              </Vstack>
            </Vstack>
          </Hstack>
        </div>
      </div>

      {/* Today plan / quick actions */}
      <div style={{ padding: '22px 22px 0' }}>
        <Hstack style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="serif-d" style={{ fontSize: 22 }}>Pentru azi</span>
          <span className="eyebrow">3 sugestii</span>
        </Hstack>
        <Vstack gap={10}>
          <SuggestionRow
            icon="bowl" tint="var(--accent-soft)" iconColor="var(--accent)"
            title="Plate Coach" sub="Foto la prânzul de azi"
            cta="Scan" onClick={() => onNavigate?.('plate')}
          />
          <SuggestionRow
            icon="dumbbell" tint="var(--primary-soft)" iconColor="var(--primary)"
            title="Antrenament Push" sub="45 min · piept, umeri, triceps"
            cta="Start" onClick={() => onNavigate?.('workout')}
          />
          <SuggestionRow
            icon="leaf" tint="var(--surface-2)" iconColor="var(--good)"
            title="Cere sfat — Diet AI" sub='"Ce mănânc pre-workout?"'
            cta="Chat" onClick={() => onNavigate?.('chat')}
          />
        </Vstack>
      </div>
    </div>
  );
};

function SuggestionRow({ icon, title, sub, cta, tint, iconColor, onClick }) {
  return (
    <button onClick={onClick} className="card" style={{
      width: '100%', textAlign: 'left', padding: '14px 16px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)'
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 14, background: tint,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon name={icon} size={20} color={iconColor}/>
      </div>
      <Vstack gap={2} style={{ flex: 1 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{title}</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{sub}</span>
      </Vstack>
      <span style={{
        fontSize: 11, fontWeight: 600, padding: '6px 12px',
        borderRadius: 999, background: 'var(--ink)', color: 'var(--bg)',
        letterSpacing: '0.03em'
      }}>{cta}</span>
    </button>
  );
}

// ─── FOOD DIARY ────────────────────────────────────────────────────────
M.Diary = function DiaryScreen({ onNavigate, onBack }) {
  return (
    <div className="screen" style={{ background: 'var(--bg)', height: '100%', overflowY: 'auto', paddingBottom: 90 }}>
      <MHeader
        left={<button onClick={onBack} style={{ background: 'transparent', border: 0, padding: 0, color: 'var(--ink)' }}><Icon name="left" size={22}/></button>}
        right={<Icon name="search" size={20} color="var(--ink)"/>}
        eyebrow="JURNAL ALIMENTAR"
        title="Today, May 8"
      />

      <div style={{ padding: '20px 22px 0' }}>
        {/* date pills */}
        <div className="seg" style={{ background: 'var(--surface-2)' }}>
          <button>Mon</button><button>Tue</button><button>Wed</button>
          <button className="on">Thu</button><button>Fri</button>
        </div>
      </div>

      {/* Big calorie summary */}
      <div style={{ padding: '14px 22px 0' }}>
        <div className="card" style={{ padding: '20px', background: 'var(--surface)' }}>
          <Hstack gap={20}>
            <ProgressRing size={120} stroke={11} value={0.62} label="62%" sub="of goal" accent="var(--accent)"/>
            <Vstack gap={8} style={{ flex: 1 }}>
              <div>
                <div className="serif-d" style={{ fontSize: 38, lineHeight: 1, letterSpacing: '-0.03em' }}>1 247</div>
                <div className="eyebrow">consumed</div>
              </div>
              <div style={{ height: 1, background: 'var(--line)' }}/>
              <Hstack style={{ justifyContent: 'space-between' }}>
                <Vstack gap={2}><span className="mono" style={{ fontSize: 13 }}>2 000</span><span className="eyebrow" style={{ fontSize: 9 }}>goal</span></Vstack>
                <Vstack gap={2}><span className="mono" style={{ fontSize: 13, color: 'var(--good)' }}>753</span><span className="eyebrow" style={{ fontSize: 9 }}>left</span></Vstack>
              </Hstack>
            </Vstack>
          </Hstack>

          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <MacroBar label="Protein" value={74} target={100} color="var(--macro-protein)"/>
            <MacroBar label="Carbs" value={138} target={250} color="var(--macro-carbs)"/>
            <MacroBar label="Fat" value={28} target={67} color="var(--macro-fat)"/>
          </div>
        </div>
      </div>

      {/* Meals */}
      <div style={{ padding: '24px 22px 0' }}>
        <Vstack gap={14}>
          <Meal mealName="Breakfast" emoji="☕" time="8:12" total={420}
            items={[
              { name: 'Iaurt grecesc', amount: '180 g', kcal: 165 },
              { name: 'Mure & afine', amount: '80 g',  kcal: 45 },
              { name: 'Fulgi de ovăz', amount: '40 g',  kcal: 152 },
              { name: 'Miere', amount: '10 g', kcal: 32 },
            ]}/>
          <Meal mealName="Lunch" emoji="🥗" time="13:40" total={648}
            items={[
              { name: 'Piept de pui la grătar', amount: '160 g', kcal: 264 },
              { name: 'Quinoa', amount: '110 g',  kcal: 134 },
              { name: 'Salată mixtă + dressing', amount: '180 g',  kcal: 95 },
              { name: 'Avocado', amount: '60 g', kcal: 96 },
            ]}/>
          <Meal mealName="Snack" emoji="🍎" time="—" total={179}
            items={[{ name: 'Măr, migdale', amount: '1 + 25g', kcal: 179 }]}/>
          <button className="btn ghost" style={{ width: '100%', padding: '14px', borderRadius: 18 }}>
            <Icon name="plus" size={16}/> Adaugă masă
          </button>
          <button className="btn accent" style={{ width: '100%', padding: '14px', borderRadius: 18 }} onClick={() => onNavigate?.('plate')}>
            <Icon name="camera" size={16} color="#fff"/> Plate Coach — Scan farfurie
          </button>
        </Vstack>
      </div>
    </div>
  );
};

function Meal({ mealName, emoji, time, total, items }) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <Hstack style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <Hstack gap={10}>
          <span style={{ fontSize: 18 }}>{emoji}</span>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{mealName}</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{time}</span>
        </Hstack>
        <Hstack gap={6}>
          <span className="mono" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{total}</span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>kcal</span>
        </Hstack>
      </Hstack>
      <Vstack gap={8}>
        {items.map((it, i) => (
          <Hstack key={i} style={{ justifyContent: 'space-between' }}>
            <Vstack gap={1}>
              <span style={{ fontSize: 13, color: 'var(--ink)' }}>{it.name}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{it.amount}</span>
            </Vstack>
            <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{it.kcal}</span>
          </Hstack>
        ))}
      </Vstack>
    </div>
  );
}

// ─── AI CHAT ─────────────────────────────────────────────────────────
M.Chat = function ChatScreen({ onBack }) {
  const [agent, setAgent] = useState('diet');
  return (
    <div className="screen" style={{ background: 'var(--bg)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 22px 14px', borderBottom: '1px solid var(--line-soft)' }}>
        <Hstack style={{ justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{ background: 'transparent', border: 0, padding: 0, color: 'var(--ink)' }}><Icon name="left" size={22}/></button>
          <Vstack gap={2} style={{ alignItems: 'center' }}>
            <span className="eyebrow">AI COACH</span>
            <span className="serif-d" style={{ fontSize: 18, color: 'var(--ink)' }}>{agent === 'diet' ? 'Nutrition' : 'Workout'}</span>
          </Vstack>
          <Icon name="menu" size={20} color="var(--ink)"/>
        </Hstack>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
          <div className="seg">
            <button className={agent==='diet' ? 'on':''} onClick={() => setAgent('diet')}>Diet</button>
            <button className={agent==='workout' ? 'on':''} onClick={() => setAgent('workout')}>Workout</button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
        <Vstack gap={14}>
          <Bubble role="ai">
            <span className="serif-d" style={{ fontSize: 16, color: 'var(--ink)' }}>Bună, Andrei.</span>
            <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              Văd că azi ai 1 247 kcal și mai ai loc pentru ~750. Ce ai în plan pentru cină?
            </div>
          </Bubble>

          <Bubble role="user">
            Vreau ceva ușor cu pește. Am somon și legume.
          </Bubble>

          <Bubble role="ai" typing={false}>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              Sugerez <b>somon la cuptor cu sparanghel & cartof dulce</b> (~520 kcal). Iei 38g proteine și încheie ziua aproape de target.
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 14, background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Hstack style={{ justifyContent: 'space-between' }}><span className="eyebrow">macro</span><span className="mono" style={{ fontSize: 11 }}>520 kcal</span></Hstack>
              <Hstack gap={10} style={{ marginTop: 2 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--macro-protein)' }}>P 38g</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--macro-carbs)' }}>C 42g</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--macro-fat)' }}>F 22g</span>
              </Hstack>
            </div>
            <Hstack gap={8} style={{ marginTop: 10 }}>
              <button className="btn" style={{ padding: '8px 12px', fontSize: 12 }}>Adaugă în jurnal</button>
              <button className="btn ghost" style={{ padding: '8px 12px', fontSize: 12 }}>Altă variantă</button>
            </Hstack>
          </Bubble>

          <Bubble role="ai" typing={true}/>
        </Vstack>
      </div>

      {/* Composer */}
      <div style={{ padding: '8px 16px 18px' }}>
        <div className="card" style={{ padding: '8px 8px 8px 16px', display: 'flex', alignItems: 'center', gap: 10, borderRadius: 999 }}>
          <Icon name="spark" size={16} color="var(--accent)"/>
          <input placeholder="Întreabă-mă orice…"
            style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 14, color: 'var(--ink)' }}/>
          <button style={{ width: 36, height: 36, border: 0, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="send" size={16} color="var(--primary-ink)"/>
          </button>
        </div>
      </div>
    </div>
  );
};

function Bubble({ role, children, typing }) {
  if (role === 'user') {
    return (
      <div style={{ alignSelf: 'flex-end', maxWidth: '78%', marginLeft: 'auto',
        background: 'var(--ink)', color: 'var(--bg)',
        padding: '10px 14px', borderRadius: '20px 20px 4px 20px', fontSize: 13, lineHeight: 1.5 }}>
        {children}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--primary-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="leaf" size={14} color="var(--primary)"/>
      </div>
      <div className="card" style={{ padding: '12px 14px', maxWidth: '82%', borderRadius: '4px 20px 20px 20px', background: 'var(--surface)' }}>
        {typing
          ? <Hstack gap={4}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted-2)', animation: `fp-pulse 1.2s ${i*0.15}s ease infinite` }}/>)}
            </Hstack>
          : children}
      </div>
    </div>
  );
}

// ─── MAP / GYM DISCOVERY ───────────────────────────────────────────────
M.Map = function MapScreen({ onBack }) {
  const gyms = [
    { name: 'World Class · Pipera', dist: '0.6 km', price: '249 lei/lună', rating: 4.8, tags: ['Pool','24/7'] },
    { name: 'Smartfit Studio',      dist: '1.2 km', price: '149 lei/lună', rating: 4.6, tags: ['Yoga','HIIT'] },
    { name: '7Card · CrossFit Hub', dist: '2.0 km', price: 'Cu 7Card',     rating: 4.9, tags: ['Crossfit'] },
  ];
  return (
    <div className="screen" style={{ background: 'var(--bg)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Faux map */}
      <div style={{ position: 'relative', flex: '0 0 56%', overflow: 'hidden' }}>
        <FauxMap/>
        <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={onBack} className="card" style={{ width: 38, height: 38, borderRadius: 19, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'var(--surface)' }}>
            <Icon name="left" size={18}/>
          </button>
          <div className="card" style={{ flex: 1, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderRadius: 999, background: 'var(--surface)' }}>
            <Icon name="search" size={16} color="var(--muted)"/>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Săli, fitness, yoga…</span>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, display: 'flex', gap: 8, overflowX: 'auto' }}>
          {['Aproape','7Card','24/7','Piscină','Yoga','CrossFit'].map(t =>
            <span key={t} className="card" style={{ padding: '8px 14px', fontSize: 12, fontWeight: 500, borderRadius: 999, background: 'var(--surface)', whiteSpace: 'nowrap' }}>{t}</span>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 90px', background: 'var(--bg)' }}>
        <Hstack style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="serif-d" style={{ fontSize: 22 }}>3 săli aproape</span>
          <span className="eyebrow">sortare · distanță</span>
        </Hstack>
        <Vstack gap={12}>
          {gyms.map(g => (
            <div key={g.name} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex' }}>
              <PlaceholderImg label="GYM" height={94} radius={0}/>
              <div style={{ padding: '12px 14px', flex: 1, minWidth: 0 }}>
                <Hstack style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{g.name}</span>
                  <Hstack gap={3}>
                    <Icon name="star" size={12} color="var(--accent)"/>
                    <span className="mono" style={{ fontSize: 11 }}>{g.rating}</span>
                  </Hstack>
                </Hstack>
                <Hstack gap={8} style={{ marginTop: 4 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{g.dist}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>·</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-2)' }}>{g.price}</span>
                </Hstack>
                <Hstack gap={6} style={{ marginTop: 8 }}>
                  {g.tags.map(t => <span key={t} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, background: 'var(--surface-2)', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.05em' }}>{t}</span>)}
                </Hstack>
              </div>
            </div>
          ))}
        </Vstack>
      </div>
    </div>
  );
};

function FauxMap() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-deep)' }}>
      <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%', display: 'block' }} preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--line)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="400" height="300" fill="url(#grid)"/>
        {/* roads */}
        <path d="M-10,150 C100,140 180,180 410,120" stroke="var(--line)" strokeWidth="14" fill="none" strokeLinecap="round"/>
        <path d="M-10,150 C100,140 180,180 410,120" stroke="var(--bg)" strokeWidth="6" fill="none" strokeLinecap="round"/>
        <path d="M120,-10 C140,80 80,180 130,310" stroke="var(--line)" strokeWidth="10" fill="none" strokeLinecap="round"/>
        <path d="M120,-10 C140,80 80,180 130,310" stroke="var(--bg)" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M280,-10 C260,80 320,180 290,310" stroke="var(--line)" strokeWidth="10" fill="none" strokeLinecap="round"/>
        <path d="M280,-10 C260,80 320,180 290,310" stroke="var(--bg)" strokeWidth="4" fill="none" strokeLinecap="round"/>
        {/* parks */}
        <ellipse cx="80"  cy="240" rx="60" ry="34" fill="var(--primary-soft)" opacity="0.6"/>
        <ellipse cx="330" cy="60"  rx="50" ry="30" fill="var(--primary-soft)" opacity="0.6"/>
        {/* pins */}
        <g><circle cx="160" cy="130" r="22" fill="var(--accent)" opacity="0.18"/><circle cx="160" cy="130" r="9" fill="var(--accent)"/><circle cx="160" cy="130" r="3" fill="#fff"/></g>
        <g><circle cx="240" cy="200" r="9" fill="var(--primary)"/><circle cx="240" cy="200" r="3" fill="#fff"/></g>
        <g><circle cx="320" cy="155" r="9" fill="var(--primary)"/><circle cx="320" cy="155" r="3" fill="#fff"/></g>
        {/* you-are-here */}
        <g><circle cx="200" cy="240" r="14" fill="var(--primary)" opacity="0.22"/><circle cx="200" cy="240" r="6" fill="#fff" stroke="var(--primary)" strokeWidth="3"/></g>
      </svg>
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────
M.Profile = function ProfileScreen({ onBack, onNavigate }) {
  return (
    <div className="screen" style={{ background: 'var(--bg)', height: '100%', overflowY: 'auto', paddingBottom: 90 }}>
      <MHeader
        left={<button onClick={onBack} style={{ background: 'transparent', border: 0, padding: 0, color: 'var(--ink)' }}><Icon name="left" size={22}/></button>}
        right={<Icon name="gear" size={20}/>}
        eyebrow="PROFIL"
        title="Andrei M."
      />

      <div style={{ padding: '14px 22px 0' }}>
        {/* Hero stats */}
        <div className="card" style={{ padding: '20px', background: 'var(--surface)' }}>
          <Hstack gap={16}>
            <Avatar name="AM" size={64} tint="var(--primary-soft)"/>
            <Vstack gap={4} style={{ flex: 1 }}>
              <span className="serif-d" style={{ fontSize: 20 }}>Andrei Mocanu</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Intermediate · obiectiv slăbit</span>
              <Hstack gap={8} style={{ marginTop: 4 }}>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.05em' }}>PRO</span>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600 }}>5 zile streak</span>
              </Hstack>
            </Vstack>
          </Hstack>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <Stat n="78.4" u="kg"/>
            <Stat n="183" u="cm"/>
            <Stat n="23.4" u="BMI"/>
          </div>
        </div>
      </div>

      {/* Weight chart */}
      <div style={{ padding: '16px 22px 0' }}>
        <div className="card" style={{ padding: '20px' }}>
          <Hstack style={{ justifyContent: 'space-between' }}>
            <Vstack gap={2}>
              <span className="eyebrow">greutate · 30 zile</span>
              <Hstack gap={8} style={{ alignItems: 'baseline' }}>
                <span className="serif-d" style={{ fontSize: 30, letterSpacing: '-0.02em' }}>78.4</span>
                <span style={{ fontSize: 12, color: 'var(--good)', fontWeight: 600 }}>↓ 2.3 kg</span>
              </Hstack>
            </Vstack>
            <div className="seg">
              <button>7d</button><button className="on">30d</button><button>90d</button>
            </div>
          </Hstack>
          <WeightChart/>
        </div>
      </div>

      {/* Settings list */}
      <div style={{ padding: '20px 22px 0' }}>
        <Vstack gap={2}>
          <Setting icon="leaf"     label="Diet preferences"   sub="2 alergii · vegetarian"/>
          <Setting icon="dumbbell" label="Fitness goals"      sub="Slăbit · 4×/săptămână"/>
          <Setting icon="heart"    label="Săli favorite"      sub="3 săli salvate"/>
          <Setting icon="bell"     label="Notificări"         sub="Pornit · 4 reguli"/>
          <Setting icon="gear"     label="Cont & abonament"   sub="Pro · expiră 12 nov"/>
        </Vstack>
      </div>
    </div>
  );
};

function Stat({ n, u }) {
  return (
    <Vstack gap={2} style={{ alignItems: 'center' }}>
      <span className="serif-d" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{n}</span>
      <span className="eyebrow" style={{ fontSize: 9 }}>{u}</span>
    </Vstack>
  );
}

function WeightChart() {
  const data = [80.7, 80.4, 80.6, 80.1, 79.8, 79.9, 79.4, 79.2, 79.0, 79.1, 78.7, 78.5, 78.6, 78.4];
  const max = Math.max(...data) + 0.3, min = Math.min(...data) - 0.3;
  const span = max - min;
  const W = 280, H = 120, step = W / (data.length - 1);
  const pts = data.map((v, i) => `${i*step},${H - ((v-min)/span)*H}`);
  const path = 'M' + pts.join(' L');
  const fill = path + ` L${W},${H} L0,${H} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 16, display: 'block' }}>
      <defs>
        <linearGradient id="wgrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#wgrad)"/>
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={(data.length-1)*step} cy={H - ((data[data.length-1]-min)/span)*H} r="4" fill="var(--primary)" stroke="var(--surface)" strokeWidth="2"/>
    </svg>
  );
}

function Setting({ icon, label, sub }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 4px', borderBottom: '1px solid var(--line-soft)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={16}/>
      </div>
      <Vstack gap={2} style={{ flex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</span>
      </Vstack>
      <Icon name="right" size={16} color="var(--muted-2)"/>
    </div>
  );
}

// ─── PLATE COACH ─────────────────────────────────────────────────────
M.Plate = function PlateScreen({ onBack }) {
  return (
    <div className="screen" style={{ background: 'var(--bg)', height: '100%', overflowY: 'auto', paddingBottom: 30 }}>
      <MHeader
        left={<button onClick={onBack} style={{ background: 'transparent', border: 0, padding: 0, color: 'var(--ink)' }}><Icon name="left" size={22}/></button>}
        right={<span className="eyebrow">AI VISION</span>}
        eyebrow="PLATE COACH"
        title="Ce e pe farfurie?"
      />

      <div style={{ padding: '16px 22px 0' }}>
        {/* photo viewport */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}>
          <PlaceholderImg label="PHOTO · plate" height={280} radius={22}/>
          {/* AI annotations */}
          <div style={{ position: 'absolute', top: '24%', left: '18%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 0 6px rgba(45,74,62,0.18)' }}/>
            <div style={{ background: 'var(--ink)', color: 'var(--bg)', fontSize: 10, padding: '4px 8px', borderRadius: 999, fontWeight: 500 }}>Somon · ~160g</div>
          </div>
          <div style={{ position: 'absolute', top: '52%', left: '52%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 0 6px rgba(217,119,87,0.18)' }}/>
            <div style={{ background: 'var(--ink)', color: 'var(--bg)', fontSize: 10, padding: '4px 8px', borderRadius: 999, fontWeight: 500 }}>Sparanghel · ~120g</div>
          </div>
          <div style={{ position: 'absolute', top: '70%', left: '20%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--good)', boxShadow: '0 0 0 6px rgba(90,141,111,0.2)' }}/>
            <div style={{ background: 'var(--ink)', color: 'var(--bg)', fontSize: 10, padding: '4px 8px', borderRadius: 999, fontWeight: 500 }}>Cartof dulce · ~100g</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 22px 0' }}>
        <div className="card" style={{ padding: '18px' }}>
          <Hstack style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <Vstack gap={2}>
              <span className="eyebrow">analiză estimată</span>
              <span className="serif-d" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>~ 540 kcal</span>
            </Vstack>
            <Hstack gap={6} style={{ background: 'var(--primary-soft)', padding: '4px 8px', borderRadius: 999 }}>
              <Icon name="spark" size={12} color="var(--primary)"/>
              <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>92% confidence</span>
            </Hstack>
          </Hstack>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 8 }}>
            <MacroBar label="P" value={38} target={100} color="var(--macro-protein)"/>
            <MacroBar label="C" value={42} target={250} color="var(--macro-carbs)"/>
            <MacroBar label="F" value={22} target={67} color="var(--macro-fat)"/>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 22px 30px' }}>
        <Vstack gap={10}>
          <button className="btn" style={{ width: '100%' }}>Salvează în jurnal · prânz</button>
          <button className="btn ghost" style={{ width: '100%' }}>Editează ingrediente</button>
        </Vstack>
      </div>
    </div>
  );
};

// ─── WORKOUT PLAN ────────────────────────────────────────────────────
M.Workout = function WorkoutScreen({ onBack }) {
  const exercises = [
    { name: 'Bench press', meta: '4 × 8 · 60 kg', muscle: 'Piept', icon: 'dumbbell', done: true },
    { name: 'Overhead press', meta: '3 × 10 · 30 kg', muscle: 'Umeri', icon: 'dumbbell', done: true },
    { name: 'Cable fly', meta: '3 × 12', muscle: 'Piept', icon: 'dumbbell', done: false, current: true },
    { name: 'Lateral raise', meta: '3 × 12 · 8 kg', muscle: 'Umeri', icon: 'dumbbell', done: false },
    { name: 'Triceps pushdown', meta: '3 × 12', muscle: 'Triceps', icon: 'dumbbell', done: false },
  ];
  return (
    <div className="screen" style={{ background: 'var(--bg)', height: '100%', overflowY: 'auto', paddingBottom: 30 }}>
      <MHeader
        left={<button onClick={onBack} style={{ background: 'transparent', border: 0, padding: 0, color: 'var(--ink)' }}><Icon name="left" size={22}/></button>}
        right={<Icon name="play" size={20} color="var(--primary)"/>}
        eyebrow="ANTRENAMENT · ZIUA 14 / 28"
        title="Push day"
      />

      {/* Hero */}
      <div style={{ padding: '14px 22px 0' }}>
        <div className="card" style={{ padding: 20, background: 'var(--hero-grad)', borderColor: 'transparent' }}>
          <Hstack style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Vstack gap={2}>
              <span className="eyebrow">timp estimat</span>
              <span className="serif-d" style={{ fontSize: 38, letterSpacing: '-0.02em' }}>45 min</span>
              <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>5 exerciții · 17 seturi</span>
            </Vstack>
            <button className="btn" style={{ padding: '12px 18px' }}>
              <Icon name="play" size={14} color="var(--primary-ink)"/> Continue
            </button>
          </Hstack>
          {/* progress */}
          <div style={{ marginTop: 14 }}>
            <Hstack style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-2)' }}>2 / 5 exerciții</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>40%</span>
            </Hstack>
            <div style={{ height: 6, background: 'rgba(0,0,0,0.1)', borderRadius: 999 }}>
              <div style={{ width: '40%', height: '100%', background: 'var(--ink)', borderRadius: 999 }}/>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 22px 0' }}>
        <Vstack gap={10}>
          {exercises.map((e, i) => (
            <div key={i} className="card" style={{ padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center',
              background: e.current ? 'var(--primary-soft)' : 'var(--surface)',
              borderColor: e.current ? 'var(--primary)' : 'var(--line)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12,
                background: e.done ? 'var(--good)' : (e.current ? 'var(--primary)' : 'var(--surface-2)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {e.done ? <Icon name="check" size={18} color="#fff"/> : <Icon name={e.icon} size={16} color={e.current ? 'var(--primary-ink)' : 'var(--muted)'}/>}
              </div>
              <Vstack gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Hstack gap={8}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{e.name}</span>
                  {e.current && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700, letterSpacing: '0.06em' }}>NOW</span>}
                </Hstack>
                <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{e.meta}</span>
              </Vstack>
              <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 999, background: 'var(--surface-2)', color: 'var(--muted)', fontWeight: 500 }}>{e.muscle}</span>
            </div>
          ))}
        </Vstack>
      </div>
    </div>
  );
};

// ─── Bottom tab bar (used by interactive prototype) ───────────────────
M.TabBar = function TabBar({ active, onChange }) {
  const items = [
    { k: 'home', icon: 'home', label: 'Home' },
    { k: 'diary', icon: 'bowl', label: 'Diary' },
    { k: 'chat', icon: 'spark', label: 'AI', primary: true },
    { k: 'map', icon: 'pin', label: 'Map' },
    { k: 'profile', icon: 'user', label: 'You' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      padding: '10px 14px 22px',
      background: 'linear-gradient(to top, var(--bg) 60%, rgba(0,0,0,0))',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 26, padding: '8px 6px',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
      }}>
        {items.map(it => {
          const on = active === it.k;
          if (it.primary) {
            return (
              <button key={it.k} onClick={() => onChange(it.k)} style={{
                width: 50, height: 50, borderRadius: '50%',
                background: 'var(--primary)', color: 'var(--primary-ink)',
                border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: -22,
                boxShadow: '0 6px 18px rgba(0,0,0,0.15)'
              }}>
                <Icon name={it.icon} size={22} color="var(--primary-ink)"/>
              </button>
            );
          }
          return (
            <button key={it.k} onClick={() => onChange(it.k)} style={{
              border: 0, background: 'transparent', padding: '6px 10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              color: on ? 'var(--ink)' : 'var(--muted)', cursor: 'pointer'
            }}>
              <Icon name={it.icon} size={20} color={on ? 'var(--ink)' : 'var(--muted)'}/>
              <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// expose
window.M = M;
