import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  ArrowUpRight,
  Check,
  Clock3,
  Copy,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Link2,
  LockKeyhole,
  LogOut,
  Music,
  Paperclip,
  Palette,
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';

type QrMode = 'link' | 'pdf' | 'image' | 'audio' | 'file';
type SavedQr = { id: string; name: string; url: string; mode: QrMode; color: string; createdAt: string };

const STORAGE_KEY = 'clarity-qr-history';
const SESSION_KEY = 'clarity-qr-session';
const DEFAULT_URL = 'https://clarity.studio/welcome';
const THEMES: { id: string; label: string; dark: string; preview: string }[] = [
  { id: 'biru', label: 'Biru', dark: '#102f50', preview: '#1d63c8' },
  { id: 'hitam', label: 'Hitam', dark: '#0a0a0a', preview: '#222222' },
  { id: 'hijau', label: 'Hijau', dark: '#0d4d2b', preview: '#1b9e5a' },
  { id: 'merah', label: 'Merah', dark: '#7a1220', preview: '#e23b4f' },
  { id: 'emas', label: 'Emas', dark: '#7a5a08', preview: '#e0a82e' },
  { id: 'ungu', label: 'Ungu', dark: '#3a1d6b', preview: '#7a4ed1' },
];
const QR_OPTIONS = {
  width: 720,
  margin: 2,
  color: { dark: '#102f50', light: '#ffffff' },
  errorCorrectionLevel: 'H' as const,
};
const MODES: { id: QrMode; label: string; icon: typeof Link2; accept: string }[] = [
  { id: 'link', label: 'Link', icon: Link2, accept: '' },
  { id: 'pdf', label: 'PDF', icon: FileText, accept: 'application/pdf' },
  { id: 'image', label: 'Gambar', icon: ImageIcon, accept: 'image/*' },
  { id: 'audio', label: 'Audio', icon: Music, accept: 'audio/*' },
  { id: 'file', label: 'File', icon: Paperclip, accept: '*/*' },
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [mode, setMode] = useState<QrMode>('link');
  const [color, setColor] = useState<string>('#102f50');
  const [name, setName] = useState('Website utama');
  const [url, setUrl] = useState(DEFAULT_URL);
  const [fileName, setFileName] = useState('');
  const [qrData, setQrData] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<SavedQr[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as SavedQr[]) : [];
  });
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (!isLoggedIn) return;
    void QRCode.toDataURL(DEFAULT_URL, QR_OPTIONS).then(setQrData);
  }, [isLoggedIn]);

  async function generateQr(value: string = url, dark = color) {
    const target = value.trim();
    if (!target) {
      setNotice('Isi dulu yang mau dibuat QR.');
      return;
    }

    setIsGenerating(true);
    setNotice('');
    try {
      setQrData(await QRCode.toDataURL(target, { ...QR_OPTIONS, color: { dark, light: '#ffffff' } }));
    } catch {
      setNotice('Belum bisa dibuat QR. Coba periksa lagi.');
    } finally {
      setIsGenerating(false);
    }
  }

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'clarity';
    if (password !== adminPassword) {
      setLoginError('Password belum sesuai.');
      return;
    }
    sessionStorage.setItem(SESSION_KEY, 'true');
    setIsLoggedIn(true);
    setLoginError('');
  }

  function saveQr() {
    if (!qrData || !url.trim()) {
      setNotice('Buat QR dulu sebelum disimpan.');
      return;
    }
    const item: SavedQr = {
      id: crypto.randomUUID(),
      name: name.trim() || 'QR tanpa nama',
      url: url.trim(),
      mode,
      color,
      createdAt: new Date().toISOString(),
    };
    setHistory((items) => [item, ...items].slice(0, 20));
    setNotice('QR so ta simpang di perangkat ini.');
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadQr() {
    if (!qrData) return;
    const download = document.createElement('a');
    download.href = qrData;
    download.download = `${name.trim() || 'dynamic-qr'}.png`;
    download.click();
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    setFileName(file.name);
    setName(file.name.replace(/\.[^.]+$/, ''));
    setNotice('');
    void generateQr(objectUrl);
  }

  function switchMode(next: QrMode) {
    setMode(next);
    setNotice('');
    setFileName('');
    if (next === 'link') {
      setUrl(DEFAULT_URL);
      setName('Website utama');
      void generateQr(DEFAULT_URL);
    } else {
      setUrl('');
      setName('');
      setQrData('');
    }
  }

  function openSaved(item: SavedQr) {
    setMode(item.mode);
    setColor(item.color);
    setName(item.name);
    setUrl(item.url);
    setFileName(item.mode === 'link' ? '' : item.name);
    void generateQr(item.url, item.color);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
  }

  if (!isLoggedIn) {
    return (
      <main className="login-shell">
        <div className="ambient ambient-one" /><div className="ambient ambient-two" />
        <section className="login-card glass-panel">
          <Brand />
          <div className="login-icon"><LockKeyhole size={25} /></div>
          <p className="eyebrow">BY GIVEN</p>
          <h1>Tampa bekeng<br /><em>scan scan.</em></h1>
          <p className="login-copy">Yang nemau ribet, disini dpe tampa, login duls biar aman.</p>
          <form onSubmit={login} className="login-form">
            <label htmlFor="password">Tulis bae bae</label>
            <input id="password" type="password" placeholder="Masukkan password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus />
            {loginError && <span className="form-error">{loginError}</span>}
            <button className="primary-button" type="submit">Kalo so yakin maso jo <ArrowUpRight size={18} /></button>
          </form>
          <div className="secure-note"><ShieldCheck size={15} /> So pasti jemba dan belum terpercaya</div>
        </section>
        <p className="page-signature">DYNAMIC QR CODE <span>·</span> DA BEKENG CUMA FOR QR CODE</p>
      </main>
    );
  }

  const currentMode = MODES.find((m) => m.id === mode)!;

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar"><Brand /><nav><span className="nav-active">Tes jo tu QR</span></nav><button className="logout-button" onClick={logout}><LogOut size={15} /> Keluar</button></header>

      <section className="hero-copy"><div><p className="eyebrow"><Sparkles size={14} /> QR JEMBA</p><h1>Langsung jo<br /><em>tes QR.</em></h1></div><p className="hero-description">So bilang kalo nemau ribet co tes ni website ni dia, di jamin jemba. Bisa link, PDF, gambar, audio, jo file.</p></section>

      <section className="studio-grid">
        <div className="editor-card glass-panel">
          <div className="section-heading"><div><p className="mini-label">DEPE TAMPA</p><h2>Taru dpe barang disini</h2></div><span className="live-pill"><span /> LIVE</span></div>

          <div className="mode-tabs">
            {MODES.map((m) => <button key={m.id} className={`mode-tab ${mode === m.id ? 'mode-active' : ''}`} onClick={() => switchMode(m.id)}><m.icon size={15} /> {m.label}</button>)}
          </div>

          <div className="theme-row"><p className="theme-label"><Palette size={13} /> Dpe warna QR</p><div className="theme-dots">{THEMES.map((t) => <button key={t.id} type="button" className={`theme-dot ${color === t.dark ? 'theme-dot-active' : ''}`} style={{ background: t.preview }} aria-label={t.label} title={t.label} onClick={() => { setColor(t.dark); setNotice(''); if (url.trim()) void generateQr(url, t.dark); }} />)}</div></div>

          {mode === 'link' ? (
            <form onSubmit={(event) => { event.preventDefault(); void generateQr(); }}>
              <label htmlFor="qr-name">Dpe Nama QR</label>
              <input id="qr-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Misalnya: Menu restoran" />
              <label htmlFor="qr-url">Isi sini dpe link</label>
              <div className="url-input"><Link2 size={17} /><input id="qr-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://website-anda.com" /></div>
              <div className="input-hint"><span>Pake link lengkap eh so deng https://</span><span className="secure-link"><ShieldCheck size={13} /> Aman</span></div>
              <button className="generate-button" type="submit" disabled={isGenerating}>{isGenerating ? 'Lagi bekeng QR...' : 'Bekeng jo'}</button>
            </form>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); void generateQr(); }}>
              <label htmlFor="qr-name">Dpe Nama QR</label>
              <input id="qr-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Misalnya: Laporan keuangan" />
              <label htmlFor="qr-file">Pili dpe {currentMode.label}</label>
              <label className="file-drop" htmlFor="qr-file">
                <Upload size={20} />
                <span>{fileName || `Klik untuk pili ${currentMode.label.toLowerCase()}`}</span>
                <input id="qr-file" type="file" accept={currentMode.accept} onChange={handleFile} hidden />
              </label>
              {fileName && <div className="input-hint"><span>So pili: {fileName}</span><span className="secure-link"><ShieldCheck size={13} /> Lokal</span></div>}
              <button className="generate-button" type="submit" disabled={isGenerating || !url}>{isGenerating ? 'Lagi bekeng QR...' : 'Bekeng jo'}</button>
            </form>
          )}

          {notice && <p className="notice"><Check size={15} /> {notice}</p>}
          <div className="editor-footer"><span><Clock3 size={14} /> So ta simpang otomatis dia</span><span>{mode === 'link' ? 'Apa itu database?' : 'QR jalan di perangkat ini'}</span></div>
        </div>

        <div className="preview-card">
          <div className="preview-top"><p className="mini-label">DEPE HASIL</p><span className="preview-status"><span /> SO KURANG MO SHARE INI</span></div>
          <div className="qr-stage">{qrData ? <img className="qr-image" src={qrData} alt="QR code untuk link tujuan" /> : <div className="qr-placeholder"><QrCode size={65} strokeWidth={1.2} /><span>Ng pe QR mo muncul sini</span></div>}</div>
          <div className="preview-caption"><div><p>{name || 'QR tanpa nama'}</p><span>{url || 'Belum ada link'}</span></div><button className="icon-button" onClick={() => void copyLink()} aria-label="Salin link"><Copy size={17} /></button></div>
          <div className="preview-actions"><button className="secondary-button" onClick={downloadQr} disabled={!qrData}><Download size={16} /> Download PNG</button><button className="save-button" onClick={saveQr} disabled={!qrData}><Check size={16} /> Simpang Jo</button></div>
        </div>
      </section>

      <section className="history-section"><div className="history-heading"><div><p className="mini-label">DISINI DPE DATA</p><h2>QR yang so ta simpang</h2></div><span>{history.length} / 20 item</span></div>{history.length === 0 ? <EmptyState /> : <div className="history-list">{history.map((item) => { const ModeIcon = MODES.find((m) => m.id === item.mode)?.icon ?? QrCode; return <div className="history-item" key={item.id}><div className="history-qr"><ModeIcon size={20} /></div><div className="history-info"><strong>{item.name}</strong><span>{item.url}</span></div><span className="history-date">{dateFormatter.format(new Date(item.createdAt))}</span><button className="view-button" onClick={() => openSaved(item)}><Eye size={16} /> Buka</button><button className="delete-button" onClick={() => setHistory((items) => items.filter((saved) => saved.id !== item.id))} aria-label={`Hapus ${item.name}`}><Trash2 size={16} /></button></div>; })}</div>}</section>
      <footer><span>BY GIVEN <b>·</b> QR ND RIBET</span><span>Semua dpe data ta simpang di link ini</span></footer>
      {copied && <div className="toast"><Check size={15} /> Link so ta salin</div>}
    </main>
  );
}

function Brand() {
  return <div className="brand-lockup"><span className="brand-mark"><QrCode size={19} strokeWidth={2.5} /></span><span>DynamicQrCode<span className="brand-dot">.</span></span></div>;
}

function EmptyState() {
  return <div className="empty-state"><div className="empty-icon"><Plus size={20} /></div><div><strong>Blum da QR ta simpang</strong><p>QR yang ngni da simpang mo muncul sini bole mo pake lagi.</p></div></div>;
}

export default App;
