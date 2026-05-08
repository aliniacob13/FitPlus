/* eslint-disable */
/* Auth + Onboarding screens — both mobile and web variants.
   Lime · Dark theme is the new default; layouts are designed for that
   palette but use only --vars so they look fine in any theme. */

const A = {};

const HS = ({ children, gap = 12, style }) =>
  <div style={{ display: 'flex', alignItems: 'center', gap, ...style }}>{children}</div>;
const VS = ({ children, gap = 12, style }) =>
  <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>{children}</div>;

// ─── Brand block (logo + wordmark) ────────────────────────────────────
function BrandMark({ size = 48 }) {
  return (
    <HS gap={12}>
      <div style={{
        width: size, height: size, borderRadius: size * 0.28,
        background: 'var(--primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 4px var(--primary-soft)'
      }}>
        <Icon name="leaf" size={size * 0.55} color="var(--primary-ink)"/>
      </div>
      <VS gap={2}>
        <span className="serif-d" style={{ fontSize: size * 0.55, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--ink)' }}>FitPlus</span>
        <span className="eyebrow" style={{ fontSize: 10 }}>wellness · daily</span>
      </VS>
    </HS>
  );
}

// ─── MOBILE · Welcome / Splash ────────────────────────────────────────
A.MWelcome = function MobileWelcome({ onNavigate }) {
  return (
    <div className="screen" style={{
      background: 'var(--bg)', height: '100%', position: 'relative',
      display: 'flex', flexDirection: 'column', padding: '40px 24px 30px'
    }}>
      {/* Decorative hero */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <radialGradient id="aw1" cx="50%" cy="20%" r="60%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35"/>
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <rect width="400" height="700" fill="url(#aw1)"/>
          <circle cx="320" cy="140" r="120" fill="none" stroke="var(--primary)" strokeWidth="1" opacity="0.25"/>
          <circle cx="320" cy="140" r="78"  fill="none" stroke="var(--primary)" strokeWidth="1" opacity="0.4"/>
          <circle cx="320" cy="140" r="38"  fill="var(--primary)" opacity="0.18"/>
          <path d="M-20,520 C100,490 200,560 420,500" fill="none" stroke="var(--line)" strokeWidth="1"/>
          <path d="M-20,560 C140,530 240,600 420,540" fill="none" stroke="var(--line)" strokeWidth="1"/>
        </svg>
      </div>

      <BrandMark size={42}/>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>your daily wellness · 2026</div>
        <div className="serif-d" style={{ fontSize: 46, lineHeight: 1.02, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
          Mănâncă bine.<br/>
          Antrenează-te <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>smart.</span>
        </div>
        <div style={{ marginTop: 16, fontSize: 14, color: 'var(--muted)', lineHeight: 1.55, maxWidth: 320 }}>
          Plate Coach AI, antrenamente personalizate și 1 200+ săli aproape de tine.
        </div>

        <VS gap={10} style={{ marginTop: 36 }}>
          <button className="btn" onClick={() => onNavigate?.('register')} style={{ padding: '16px', fontSize: 15, justifyContent: 'center' }}>
            Începe gratuit · 7 zile <Icon name="arrow" size={14} color="var(--primary-ink)"/>
          </button>
          <button className="btn ghost" onClick={() => onNavigate?.('login')} style={{ padding: '16px', fontSize: 14, justifyContent: 'center' }}>
            Am deja cont
          </button>
        </VS>

        <div style={{ marginTop: 18, fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
          Continuând accepți <u>Termenii</u> și <u>Politica de confidențialitate</u>.
        </div>
      </div>
    </div>
  );
};

// ─── MOBILE · Login ───────────────────────────────────────────────────
A.MLogin = function MobileLogin({ onBack, onNavigate }) {
  return (
    <div className="screen" style={{ background: 'var(--bg)', height: '100%', display: 'flex', flexDirection: 'column', padding: '24px 24px 30px' }}>
      <HS style={{ justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 0, padding: 0, color: 'var(--ink)' }}><Icon name="left" size={22}/></button>
        <button onClick={() => onNavigate?.('register')} style={{ background: 'transparent', border: 0, color: 'var(--muted)', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>Cont nou</button>
      </HS>

      <VS gap={6} style={{ marginTop: 28 }}>
        <span className="eyebrow">SIGN IN</span>
        <div className="serif-d" style={{ fontSize: 36, letterSpacing: '-0.02em', lineHeight: 1.05, color: 'var(--ink)' }}>
          Bine ai <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>revenit.</span>
        </div>
        <span style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Continuă streak-ul de 5 zile.</span>
      </VS>

      <VS gap={14} style={{ marginTop: 32 }}>
        <Field label="Email" placeholder="andrei@fitplus.ro" icon="user" value="andrei@fitplus.ro"/>
        <Field label="Parolă" placeholder="••••••••" icon="key" type="password" trailing={<span className="eyebrow" style={{ fontSize: 9, cursor: 'pointer' }}>SHOW</span>} value="••••••••••"/>
        <HS style={{ justifyContent: 'space-between', marginTop: -2 }}>
          <HS gap={6}>
            <Checkbox checked/>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Ține-mă conectat</span>
          </HS>
          <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Ai uitat parola?</span>
        </HS>
      </VS>

      <button className="btn" onClick={() => onNavigate?.('app')} style={{ marginTop: 'auto', padding: '16px', justifyContent: 'center', fontSize: 15 }}>
        Intră în cont <Icon name="arrow" size={14} color="var(--primary-ink)"/>
      </button>

      <Divider label="sau continuă cu"/>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <SocialBtn label="Apple" glyph="" big/>
        <SocialBtn label="Google" glyph="G"/>
        <SocialBtn label="Facebook" glyph="f"/>
      </div>
    </div>
  );
};

// ─── MOBILE · Register ────────────────────────────────────────────────
A.MRegister = function MobileRegister({ onBack, onNavigate }) {
  return (
    <div className="screen" style={{ background: 'var(--bg)', height: '100%', overflowY: 'auto', padding: '24px 24px 30px' }}>
      <HS style={{ justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 0, padding: 0, color: 'var(--ink)' }}><Icon name="left" size={22}/></button>
        <button onClick={() => onNavigate?.('login')} style={{ background: 'transparent', border: 0, color: 'var(--muted)', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>Sign in</button>
      </HS>

      <VS gap={6} style={{ marginTop: 28 }}>
        <span className="eyebrow">CREATE ACCOUNT · 1 / 4</span>
        <div className="serif-d" style={{ fontSize: 34, letterSpacing: '-0.02em', lineHeight: 1.05, color: 'var(--ink)' }}>
          Hai să-ți facem un <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>cont.</span>
        </div>
        <span style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Vom folosi datele ca să-ți personalizăm planul.</span>
      </VS>

      <ProgressDots step={0} total={4} style={{ marginTop: 22 }}/>

      <VS gap={14} style={{ marginTop: 22 }}>
        <Field label="Nume complet" placeholder="ex. Andrei Mocanu" icon="user" value="Andrei Mocanu"/>
        <Field label="Email" placeholder="email@exemplu.ro" icon="bell"/>
        <Field label="Parolă" placeholder="min. 8 caractere" icon="key" type="password" trailing={<PasswordStrength level={3}/>}/>
      </VS>

      <button className="btn" onClick={() => onNavigate?.('onboard')} style={{ marginTop: 24, padding: '16px', justifyContent: 'center', fontSize: 15, width: '100%' }}>
        Continuă <Icon name="arrow" size={14} color="var(--primary-ink)"/>
      </button>

      <Divider label="sau"/>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <SocialBtn label="Apple" glyph="" big/>
        <SocialBtn label="Google" glyph="G"/>
        <SocialBtn label="Facebook" glyph="f"/>
      </div>

      <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 18, lineHeight: 1.5 }}>
        Continuând accepți <u>Termenii</u> și <u>Politica de confidențialitate</u>.
      </p>
    </div>
  );
};

// ─── MOBILE · Onboarding (multi-step) ─────────────────────────────────
A.MOnboard = function MobileOnboard({ onBack, onNavigate }) {
  const [step, setStep] = useState(0);

  const steps = [
    () => <OnboardGoal/>,
    () => <OnboardStats/>,
    () => <OnboardDiet/>,
    () => <OnboardLevel/>,
  ];

  return (
    <div className="screen" style={{ background: 'var(--bg)', height: '100%', display: 'flex', flexDirection: 'column', padding: '24px 24px 30px' }}>
      <HS style={{ justifyContent: 'space-between' }}>
        <button onClick={() => step === 0 ? onBack?.() : setStep(s => s-1)} style={{ background: 'transparent', border: 0, padding: 0, color: 'var(--ink)' }}>
          <Icon name="left" size={22}/>
        </button>
        <button style={{ background: 'transparent', border: 0, color: 'var(--muted)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Skip</button>
      </HS>

      <ProgressDots step={step + 1} total={4} style={{ marginTop: 22 }}/>
      <span className="eyebrow" style={{ marginTop: 18 }}>STEP {step+2} / 4</span>

      <div style={{ flex: 1, marginTop: 8 }}>{steps[step]()}</div>

      <button className="btn"
        onClick={() => step < 3 ? setStep(s => s+1) : onNavigate?.('app')}
        style={{ padding: '16px', justifyContent: 'center', fontSize: 15, width: '100%' }}>
        {step < 3 ? 'Continuă' : 'Hai să începem'} <Icon name="arrow" size={14} color="var(--primary-ink)"/>
      </button>
    </div>
  );
};

// Onboarding sub-screens
function OnboardGoal() {
  const [pick, setPick] = useState('lose');
  const goals = [
    { k: 'lose',     title: 'Slăbesc',   sub: 'Deficit calorificat moderat',     icon: 'arrow-up', flip: true },
    { k: 'maintain', title: 'Mențin',    sub: 'Calorii echilibrate, formă bună', icon: 'check' },
    { k: 'gain',     title: 'Cresc masă',sub: 'Surplus + protein focus',         icon: 'arrow-up' },
    { k: 'health',   title: 'Sănătate',  sub: 'Mai energic, mai puțin stres',    icon: 'leaf' },
  ];
  return (
    <div>
      <div className="serif-d" style={{ fontSize: 30, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Care e <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>obiectivul</span> tău?</div>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>Poți schimba oricând în Profil.</span>
      <VS gap={10} style={{ marginTop: 18 }}>
        {goals.map(g => (
          <button key={g.k} onClick={() => setPick(g.k)} className="card" style={{
            padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
            borderColor: pick === g.k ? 'var(--primary)' : 'var(--line)',
            background: pick === g.k ? 'var(--primary-soft)' : 'var(--surface)',
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 12,
              background: pick === g.k ? 'var(--primary)' : 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: g.flip ? 'rotate(180deg)' : 'none' }}>
              <Icon name={g.icon} size={16} color={pick === g.k ? 'var(--primary-ink)' : 'var(--muted)'}/>
            </div>
            <VS gap={2} style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{g.title}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{g.sub}</span>
            </VS>
            <Radio on={pick === g.k}/>
          </button>
        ))}
      </VS>
    </div>
  );
}

function OnboardStats() {
  return (
    <div>
      <div className="serif-d" style={{ fontSize: 30, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Câteva <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>date</span> despre tine.</div>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>Folosim doar pentru calcularea kcal & macro.</span>

      <VS gap={20} style={{ marginTop: 22 }}>
        <SegPicker label="Sex" options={['Masculin','Feminin','Altceva']} value={0}/>
        <BigStat label="Vârstă" unit="ani" value="28"/>
        <BigStat label="Înălțime" unit="cm" value="183"/>
        <BigStat label="Greutate" unit="kg" value="80.7"/>
      </VS>
    </div>
  );
}

function OnboardDiet() {
  const [picks, setPicks] = useState(new Set(['vegetarian','low-sugar']));
  const togg = (k) => setPicks(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const tags = ['vegetarian','vegan','gluten-free','lactose-free','low-sugar','keto','high-protein','mediterranean'];
  return (
    <div>
      <div className="serif-d" style={{ fontSize: 30, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Preferințe <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>alimentare</span>?</div>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>Selectează tot ce se aplică.</span>

      <div style={{ marginTop: 22, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {tags.map(t => {
          const on = picks.has(t);
          return (
            <button key={t} onClick={() => togg(t)} style={{
              padding: '10px 14px', fontSize: 13, fontWeight: 500,
              border: '1px solid ' + (on ? 'var(--primary)' : 'var(--line)'),
              background: on ? 'var(--primary)' : 'var(--surface)',
              color: on ? 'var(--primary-ink)' : 'var(--ink-2)',
              borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit'
            }}>
              {on && '✓ '}{t}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 24, padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--surface-2)' }}>
        <Icon name="spark" size={16} color="var(--accent)"/>
        <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
          AI-ul va sugera doar rețete care respectă aceste preferințe.
        </span>
      </div>
    </div>
  );
}

function OnboardLevel() {
  const levels = [
    { k: 'beginner', title: 'Începător', sub: '0–3 luni de antrenament' },
    { k: 'intermediate', title: 'Intermediar', sub: '3–18 luni · cunosc bazele', def: true },
    { k: 'advanced', title: 'Avansat', sub: '1.5+ ani · știu ce fac' },
  ];
  const [pick, setPick] = useState('intermediate');
  return (
    <div>
      <div className="serif-d" style={{ fontSize: 30, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Ce <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>nivel</span> ai?</div>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>Adaptăm volumul și intensitatea.</span>
      <VS gap={10} style={{ marginTop: 22 }}>
        {levels.map(l => (
          <button key={l.k} onClick={() => setPick(l.k)} className="card" style={{
            padding: '16px', textAlign: 'left', cursor: 'pointer',
            borderColor: pick === l.k ? 'var(--primary)' : 'var(--line)',
            background: pick === l.k ? 'var(--primary-soft)' : 'var(--surface)',
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: pick === l.k ? 'var(--primary)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="dumbbell" size={16} color={pick === l.k ? 'var(--primary-ink)' : 'var(--muted)'}/>
            </div>
            <VS gap={2} style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{l.title}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{l.sub}</span>
            </VS>
            <Radio on={pick === l.k}/>
          </button>
        ))}
      </VS>

      <div className="card" style={{ marginTop: 18, padding: 16, background: 'var(--hero-grad)', borderColor: 'transparent' }}>
        <span className="eyebrow">PLANUL TĂU CALCULAT</span>
        <HS style={{ justifyContent: 'space-between', marginTop: 8 }}>
          <VS gap={2}><span className="serif-d" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>2 000</span><span className="eyebrow" style={{ fontSize: 9 }}>kcal/zi</span></VS>
          <VS gap={2}><span className="serif-d" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>140g</span><span className="eyebrow" style={{ fontSize: 9 }}>protein</span></VS>
          <VS gap={2}><span className="serif-d" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>4×/spt</span><span className="eyebrow" style={{ fontSize: 9 }}>training</span></VS>
        </HS>
      </div>
    </div>
  );
}

// ─── WEB · Auth split layout ──────────────────────────────────────────
function AuthSplit({ children, eyebrow, title, sub }) {
  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--bg)' }}>
      {/* Left brand panel */}
      <div style={{
        width: 480, padding: '40px 44px',
        background: 'var(--bg-deep)',
        borderRight: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden'
      }}>
        <BrandMark size={42}/>

        {/* deco */}
        <svg viewBox="0 0 480 700" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="awsplit" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="240" cy="380" r="220" fill="url(#awsplit)"/>
          <circle cx="240" cy="380" r="160" fill="none" stroke="var(--primary)" strokeWidth="1" opacity="0.22"/>
          <circle cx="240" cy="380" r="110" fill="none" stroke="var(--primary)" strokeWidth="1" opacity="0.32"/>
          <circle cx="240" cy="380" r="60"  fill="var(--primary)" opacity="0.18"/>
        </svg>

        {/* Marketing snippet */}
        <div style={{ marginTop: 'auto', position: 'relative', zIndex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>de ce fitplus</div>
          <div className="serif-d" style={{ fontSize: 38, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            Mănâncă bine.<br/>
            Antrenează-te <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>smart.</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 14, lineHeight: 1.6, maxWidth: 360 }}>
            Plate Coach AI, antrenamente personalizate și 1 200+ săli aproape de tine — într-o singură aplicație.
          </div>

          {/* Stat tiles */}
          <HS gap={12} style={{ marginTop: 28 }}>
            <div className="card" style={{ padding: '12px 14px', background: 'var(--surface)' }}>
              <span className="serif-d" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>120k+</span>
              <div className="eyebrow" style={{ fontSize: 9, marginTop: 2 }}>users in RO</div>
            </div>
            <div className="card" style={{ padding: '12px 14px', background: 'var(--surface)' }}>
              <span className="serif-d" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>4.8 ★</span>
              <div className="eyebrow" style={{ fontSize: 9, marginTop: 2 }}>app store</div>
            </div>
            <div className="card" style={{ padding: '12px 14px', background: 'var(--surface)' }}>
              <span className="serif-d" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>1 200+</span>
              <div className="eyebrow" style={{ fontSize: 9, marginTop: 2 }}>gyms</div>
            </div>
          </HS>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, padding: '40px 60px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <HS style={{ justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Need help? <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Contact us</span></span>
        </HS>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 460, margin: '0 auto', width: '100%' }}>
          <span className="eyebrow">{eyebrow}</span>
          <div className="serif-d" style={{ fontSize: 44, letterSpacing: '-0.02em', lineHeight: 1.05, marginTop: 8 }}>
            {title}
          </div>
          <span style={{ fontSize: 14, color: 'var(--muted)', marginTop: 10 }}>{sub}</span>

          <div style={{ marginTop: 32 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

A.WLogin = function WebLogin() {
  return (
    <AuthSplit
      eyebrow="SIGN IN · WELCOME BACK"
      title={<>Bine ai <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>revenit.</span></>}
      sub="Continuă streak-ul de 5 zile și planul de azi."
    >
      <VS gap={14}>
        <Field label="Email" placeholder="andrei@fitplus.ro" icon="user" value="andrei@fitplus.ro" big/>
        <Field label="Parolă" placeholder="••••••••" icon="key" type="password" value="••••••••••" trailing={<span className="eyebrow" style={{ fontSize: 9, cursor: 'pointer' }}>SHOW</span>} big/>
        <HS style={{ justifyContent: 'space-between' }}>
          <HS gap={6}>
            <Checkbox checked/>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Ține-mă conectat</span>
          </HS>
          <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Ai uitat parola?</span>
        </HS>
        <button className="btn" style={{ padding: '14px', fontSize: 15, justifyContent: 'center', marginTop: 6 }}>
          Sign in <Icon name="arrow" size={14} color="var(--primary-ink)"/>
        </button>
      </VS>
      <Divider label="sau continuă cu" wide/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <SocialBtn label="Apple" glyph="" big/>
        <SocialBtn label="Google" glyph="G" big/>
        <SocialBtn label="Facebook" glyph="f" big/>
      </div>
      <div style={{ marginTop: 24, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
        Nu ai cont? <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Înregistrează-te gratuit →</span>
      </div>
    </AuthSplit>
  );
};

A.WRegister = function WebRegister() {
  return (
    <AuthSplit
      eyebrow="CREATE ACCOUNT · 1 / 4"
      title={<>Hai să-ți facem un <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>cont.</span></>}
      sub="Vom personaliza planul tău după pasul de onboarding."
    >
      <VS gap={14}>
        <Field label="Nume complet" placeholder="ex. Andrei Mocanu" icon="user" value="Andrei Mocanu" big/>
        <Field label="Email" placeholder="email@exemplu.ro" icon="bell" big/>
        <Field label="Parolă" placeholder="min. 8 caractere" icon="key" type="password" trailing={<PasswordStrength level={3}/>} big/>
        <HS gap={6} style={{ marginTop: 4 }}>
          <Checkbox checked/>
          <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>Sunt de acord cu <u>Termenii</u> și <u>Politica de confidențialitate</u>.</span>
        </HS>
        <button className="btn" style={{ padding: '14px', fontSize: 15, justifyContent: 'center', marginTop: 6 }}>
          Continuă cu onboarding <Icon name="arrow" size={14} color="var(--primary-ink)"/>
        </button>
      </VS>
      <Divider label="sau" wide/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <SocialBtn label="Apple" glyph="" big/>
        <SocialBtn label="Google" glyph="G" big/>
        <SocialBtn label="Facebook" glyph="f" big/>
      </div>
      <div style={{ marginTop: 24, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
        Ai deja cont? <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Sign in →</span>
      </div>
    </AuthSplit>
  );
};

// ─── WEB · Onboarding wizard (single page, big card) ─────────────────
A.WOnboard = function WebOnboard() {
  return (
    <div style={{ background: 'var(--bg)', height: '100%', display: 'flex', flexDirection: 'column', padding: '32px 40px' }}>
      <HS style={{ justifyContent: 'space-between' }}>
        <BrandMark size={36}/>
        <HS gap={20}>
          <ProgressDots step={1} total={4} horizontal/>
          <span className="eyebrow">STEP 1 / 4</span>
          <button className="btn ghost" style={{ padding: '8px 14px', fontSize: 12 }}>Skip</button>
        </HS>
      </HS>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
        <div className="card" style={{ width: '100%', maxWidth: 720, padding: 40 }}>
          <span className="eyebrow">PASUL 1 · OBIECTIV</span>
          <div className="serif-d" style={{ fontSize: 38, letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 8 }}>
            Care e <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>obiectivul</span> tău principal?
          </div>
          <span style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8, display: 'block' }}>Poți schimba oricând în Profil.</span>

          <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <GoalCardWeb pick title="Slăbesc"   sub="Deficit calorificat moderat · -0.5 kg / săpt."   icon="arrow-up" flip/>
            <GoalCardWeb       title="Mențin"    sub="Echilibru caloric · păstrez forma actuală"        icon="check"/>
            <GoalCardWeb       title="Cresc masă"sub="Surplus moderat · accent pe proteine & forță"     icon="arrow-up"/>
            <GoalCardWeb       title="Sănătate"  sub="Mai energic, somn mai bun, mai puțin stres"       icon="leaf"/>
          </div>

          <HS style={{ justifyContent: 'space-between', marginTop: 32 }}>
            <button className="btn ghost" style={{ padding: '12px 16px' }}><Icon name="left" size={14}/> Înapoi</button>
            <button className="btn" style={{ padding: '12px 20px' }}>Continuă <Icon name="arrow" size={14} color="var(--primary-ink)"/></button>
          </HS>
        </div>
      </div>
    </div>
  );
};

function GoalCardWeb({ pick, title, sub, icon, flip }) {
  return (
    <button className="card" style={{
      padding: 20, textAlign: 'left', cursor: 'pointer',
      borderColor: pick ? 'var(--primary)' : 'var(--line)',
      background: pick ? 'var(--primary-soft)' : 'var(--surface)',
      display: 'flex', gap: 14, alignItems: 'flex-start'
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: pick ? 'var(--primary)' : 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        transform: flip ? 'rotate(180deg)' : 'none'
      }}>
        <Icon name={icon} size={18} color={pick ? 'var(--primary-ink)' : 'var(--muted)'}/>
      </div>
      <VS gap={4} style={{ flex: 1 }}>
        <span className="serif-d" style={{ fontSize: 20, letterSpacing: '-0.01em' }}>{title}</span>
        <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{sub}</span>
      </VS>
      <Radio on={pick}/>
    </button>
  );
}

// ─── Shared form primitives ───────────────────────────────────────────
function Field({ label, placeholder, icon, type, trailing, value, big }) {
  return (
    <VS gap={6}>
      <span className="eyebrow" style={{ fontSize: 9 }}>{label}</span>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: big ? '14px 16px' : '12px 14px',
      }}>
        {icon && <Icon name={icon} size={big ? 18 : 16} color="var(--muted)"/>}
        <input type={type === 'password' ? 'text' : 'text'} placeholder={placeholder} defaultValue={value} style={{
          flex: 1, border: 0, background: 'transparent', outline: 'none',
          fontFamily: 'inherit', fontSize: big ? 15 : 14, color: 'var(--ink)'
        }}/>
        {trailing}
      </div>
    </VS>
  );
}

function Checkbox({ checked }) {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: 6,
      background: checked ? 'var(--primary)' : 'transparent',
      border: '1.5px solid ' + (checked ? 'var(--primary)' : 'var(--line)'),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer'
    }}>
      {checked && <Icon name="check" size={12} color="var(--primary-ink)" stroke={2.5}/>}
    </div>
  );
}

function Radio({ on }) {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: '50%',
      background: 'var(--surface)',
      border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--line)'),
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      {on && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }}/>}
    </div>
  );
}

function SocialBtn({ label, glyph, big }) {
  return (
    <button className="card" style={{
      padding: big ? '12px' : '10px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      cursor: 'pointer', background: 'var(--surface)'
    }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', minWidth: 14, textAlign: 'center' }}>{glyph}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>{label}</span>
    </button>
  );
}

function Divider({ label, wide }) {
  return (
    <HS gap={12} style={{ margin: wide ? '28px 0 18px' : '20px 0 14px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--line-soft)' }}/>
      <span className="eyebrow" style={{ fontSize: 9 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--line-soft)' }}/>
    </HS>
  );
}

function ProgressDots({ step, total, style, horizontal }) {
  return (
    <HS gap={6} style={style}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: horizontal ? 0 : 1,
          width: horizontal ? 28 : 'auto',
          height: 4, borderRadius: 999,
          background: i < step ? 'var(--primary)' : 'var(--line)'
        }}/>
      ))}
    </HS>
  );
}

function PasswordStrength({ level }) {
  return (
    <HS gap={3}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          width: 14, height: 4, borderRadius: 2,
          background: i < level ? (level >= 3 ? 'var(--good)' : 'var(--warn)') : 'var(--line)'
        }}/>
      ))}
    </HS>
  );
}

function SegPicker({ label, options, value }) {
  return (
    <VS gap={8}>
      <span className="eyebrow" style={{ fontSize: 9 }}>{label}</span>
      <div className="seg" style={{ background: 'var(--surface-2)', display: 'flex' }}>
        {options.map((o, i) => <button key={o} className={i === value ? 'on' : ''} style={{ flex: 1 }}>{o}</button>)}
      </div>
    </VS>
  );
}

function BigStat({ label, unit, value }) {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
      <HS gap={6} style={{ alignItems: 'baseline' }}>
        <span className="serif-d" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>{value}</span>
        <span className="eyebrow" style={{ fontSize: 10 }}>{unit}</span>
        <Icon name="right" size={16} color="var(--muted-2)" style={{ marginLeft: 8 }}/>
      </HS>
    </div>
  );
}

window.A = A;
