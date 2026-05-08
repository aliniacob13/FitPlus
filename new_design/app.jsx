/* eslint-disable */
/* App composition: design canvas + tweaks panel + interactive prototype.
   This file is the entry point; React/Babel/components are loaded by HTML. */

const { useState } = React;

// ─── Interactive mobile prototype (clickable bottom-tab demo) ────────
function InteractiveMobile() {
  const [tab, setTab] = useState('home');
  const screen = (() => {
    switch (tab) {
      case 'home':    return <M.Home onNavigate={setTab}/>;
      case 'diary':   return <M.Diary  onBack={() => setTab('home')} onNavigate={setTab}/>;
      case 'chat':    return <M.Chat   onBack={() => setTab('home')}/>;
      case 'map':     return <M.Map    onBack={() => setTab('home')}/>;
      case 'profile': return <M.Profile onBack={() => setTab('home')}/>;
      case 'plate':   return <M.Plate  onBack={() => setTab('diary')}/>;
      case 'workout': return <M.Workout onBack={() => setTab('home')}/>;
      default:        return <M.Home onNavigate={setTab}/>;
    }
  })();
  const showTabs = !['plate','workout'].includes(tab);
  return (
    <IOSDevice width={392} height={812}>
      <div className="fp" style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--bg)' }}>
        {screen}
        {showTabs && <M.TabBar active={tab} onChange={setTab}/>}
      </div>
    </IOSDevice>
  );
}

// ─── Static mobile artboard wrapper ───────────────────────────────────
function MobileArtboard({ children, withTabs, activeTab }) {
  return (
    <IOSDevice width={392} height={812}>
      <div className="fp" style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--bg)' }}>
        {children}
        {withTabs && <M.TabBar active={activeTab} onChange={() => {}}/>}
      </div>
    </IOSDevice>
  );
}

// ─── Web artboard (browser window + shell) ────────────────────────────
function WebArtboard({ active, children, url }) {
  return (
    <ChromeWindow
      width={1180} height={760}
      tabs={[{ title: 'FitPlus · ' + (url || ''), active: true }]}
      activeIndex={0}
      url={'app.fitplus.ro/' + (url || '')}
    >
      <WebShell active={active} onChange={() => {}}>{children}</WebShell>
    </ChromeWindow>
  );
}

// ─── Tweaks panel ─────────────────────────────────────────────────────
const FP_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "lime"
}/*EDITMODE-END*/;

// ─── Interactive auth flow (welcome → login/register → onboarding → app) ──
function InteractiveAuth() {
  const [route, setRoute] = useState('welcome');
  const screen = (() => {
    switch (route) {
      case 'welcome':  return <A.MWelcome  onNavigate={setRoute}/>;
      case 'login':    return <A.MLogin    onBack={() => setRoute('welcome')} onNavigate={setRoute}/>;
      case 'register': return <A.MRegister onBack={() => setRoute('welcome')} onNavigate={setRoute}/>;
      case 'onboard':  return <A.MOnboard  onBack={() => setRoute('register')} onNavigate={setRoute}/>;
      case 'app':      return <M.Home onNavigate={() => {}}/>;
      default:         return <A.MWelcome onNavigate={setRoute}/>;
    }
  })();
  return (
    <IOSDevice width={392} height={812}>
      <div className="fp" style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--bg)' }}>
        {screen}
        {route === 'app' && <M.TabBar active="home" onChange={() => {}}/>}
      </div>
    </IOSDevice>
  );
}

function FitPlusTweaks() {
  const [tweaks, setTweak] = useTweaks(FP_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-palette', tweaks.palette);
  }, [tweaks.palette]);

  return (
    <TweaksPanel title="Tweaks · FitPlus">
      <TweakSection title="Paletă de culori">
        <TweakRadio
          label=""
          value={tweaks.palette}
          options={[
            { value: 'forest',     label: 'Forest' },
            { value: 'terracotta', label: 'Terra' },
            { value: 'indigo',     label: 'Indigo' },
            { value: 'lime',       label: 'Lime · Dark' },
          ]}
          onChange={(v) => setTweak('palette', v)}
        />
        <div style={{ fontSize: 11, color: '#888', marginTop: 8, lineHeight: 1.4 }}>
          • <b>Forest</b> — wellness organic (recomandat).<br/>
          • <b>Terra</b> — cald, cărămiziu cu accent verde închis.<br/>
          • <b>Indigo</b> — athletic premium (sport, blue + amber).<br/>
          • <b>Lime · Dark</b> — paleta originală FitPlus.
        </div>
      </TweakSection>
    </TweaksPanel>
  );
}

// ─── Top-level App ────────────────────────────────────────────────────
function App() {
  return (
    <>
      <FitPlusTweaks/>
      <DesignCanvas>

        {/* ── Section 0: Auth & Onboarding ── */}
        <DCSection id="auth-mobile" title="Auth & Onboarding · mobile"
          subtitle="Welcome, sign in, register, multi-step onboarding">

          <DCArtboard id="a-welcome" label="00 · Welcome" width={420} height={840}>
            <MobileArtboard><A.MWelcome/></MobileArtboard>
          </DCArtboard>

          <DCArtboard id="a-login" label="01 · Sign in" width={420} height={840}>
            <MobileArtboard><A.MLogin/></MobileArtboard>
          </DCArtboard>

          <DCArtboard id="a-register" label="02 · Create account" width={420} height={840}>
            <MobileArtboard><A.MRegister/></MobileArtboard>
          </DCArtboard>

          <DCArtboard id="a-onboard" label="03 · Onboarding" width={420} height={840}>
            <MobileArtboard><A.MOnboard/></MobileArtboard>
          </DCArtboard>

          <DCArtboard id="a-proto" label="Tap-able · auth flow" width={420} height={840}>
            <InteractiveAuth/>
          </DCArtboard>

        </DCSection>

        <DCSection id="auth-web" title="Auth & Onboarding · web"
          subtitle="Split-screen brand panel + form, big onboarding card">

          <DCArtboard id="aw-login" label="01 · Sign in" width={1200} height={780}>
            <ChromeWindow width={1180} height={760} tabs={[{ title: 'FitPlus · Sign in', active: true }]} activeIndex={0} url="app.fitplus.ro/login">
              <A.WLogin/>
            </ChromeWindow>
          </DCArtboard>

          <DCArtboard id="aw-register" label="02 · Create account" width={1200} height={780}>
            <ChromeWindow width={1180} height={760} tabs={[{ title: 'FitPlus · Register', active: true }]} activeIndex={0} url="app.fitplus.ro/register">
              <A.WRegister/>
            </ChromeWindow>
          </DCArtboard>

          <DCArtboard id="aw-onboard" label="03 · Onboarding" width={1200} height={780}>
            <ChromeWindow width={1180} height={760} tabs={[{ title: 'FitPlus · Welcome', active: true }]} activeIndex={0} url="app.fitplus.ro/welcome">
              <A.WOnboard/>
            </ChromeWindow>
          </DCArtboard>

        </DCSection>

        {/* ── Section 1: Mobile · primary flow (static) ── */}
        <DCSection id="mobile-flow" title="Mobile · primary flow"
          subtitle="Toate ecranele principale, redesign Wellness Organic">

          <DCArtboard id="m-home" label="01 · Home" width={420} height={840}>
            <MobileArtboard withTabs activeTab="home"><M.Home/></MobileArtboard>
          </DCArtboard>

          <DCArtboard id="m-diary" label="02 · Food Diary" width={420} height={840}>
            <MobileArtboard withTabs activeTab="diary"><M.Diary/></MobileArtboard>
          </DCArtboard>

          <DCArtboard id="m-plate" label="03 · Plate Coach" width={420} height={840}>
            <MobileArtboard><M.Plate/></MobileArtboard>
          </DCArtboard>

          <DCArtboard id="m-chat" label="04 · AI Coach" width={420} height={840}>
            <MobileArtboard withTabs activeTab="chat"><M.Chat/></MobileArtboard>
          </DCArtboard>

          <DCArtboard id="m-workout" label="05 · Workout" width={420} height={840}>
            <MobileArtboard><M.Workout/></MobileArtboard>
          </DCArtboard>

          <DCArtboard id="m-map" label="06 · Gym Map" width={420} height={840}>
            <MobileArtboard withTabs activeTab="map"><M.Map/></MobileArtboard>
          </DCArtboard>

          <DCArtboard id="m-profile" label="07 · Profile" width={420} height={840}>
            <MobileArtboard withTabs activeTab="profile"><M.Profile/></MobileArtboard>
          </DCArtboard>

        </DCSection>

        {/* ── Section 2: Web · desktop ── */}
        <DCSection id="web-flow" title="Web · desktop"
          subtitle="Aceeași aplicație, layout pentru ecran mare (1180 × 760)">

          <DCArtboard id="w-dash" label="01 · Dashboard" width={1200} height={780}>
            <WebArtboard active="dash" url="dashboard"><W.Dash/></WebArtboard>
          </DCArtboard>

          <DCArtboard id="w-diary" label="02 · Food Diary" width={1200} height={780}>
            <WebArtboard active="diary" url="diary"><W.Diary/></WebArtboard>
          </DCArtboard>

          <DCArtboard id="w-chat" label="03 · AI Coach" width={1200} height={780}>
            <WebArtboard active="chat" url="ai/diet"><W.Chat/></WebArtboard>
          </DCArtboard>

          <DCArtboard id="w-map" label="04 · Gym Map" width={1200} height={780}>
            <WebArtboard active="map" url="gyms"><W.Map/></WebArtboard>
          </DCArtboard>

        </DCSection>

        {/* ── Section 3: Interactive prototype ── */}
        <DCSection id="proto" title="Interactive prototype"
          subtitle="Apasă tab-urile de jos sau cardurile de pe Home — navigare reală între ecrane">

          <DCArtboard id="p-mobile" label="Tap-able demo · mobile" width={420} height={840}>
            <InteractiveMobile/>
          </DCArtboard>

        </DCSection>

      </DesignCanvas>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
