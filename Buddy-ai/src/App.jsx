import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter, Routes, Route, Navigate, NavLink, Outlet, useLocation, useNavigate,
} from 'react-router-dom';
import {
  Activity, AlarmClock, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen,
  BookOpenCheck, BrainCircuit, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, CircleHelp, Clock3, CloudUpload, Code2, Command, FileCheck2, FileText,
  Filter, GraduationCap, LayoutDashboard, Lightbulb, ListChecks, LoaderCircle, LockKeyhole,
  LogOut, Mail, Menu, MoreHorizontal, Pencil, Plus, RefreshCw, Search, ShieldCheck,
  Sparkles, Target, Trash2, User, UserCog, Users, X, Eye, EyeOff, WandSparkles, Settings,
  ClipboardList, CalendarClock, BookMarked, AlertCircle, CheckCheck, Send, KeyRound,
} from 'lucide-react';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { supabase, isSupabaseConfigured } from './lib/supabase.js';
import { formatDate, formatDateTime, timeGreeting, initials, sortByDueDate, localDateTimeInput } from './lib/format.js';
import { readStudyFile, downloadSummaryExport } from './lib/studyFiles.js';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8787').replace(/\/$/, '');

function Brand({ compact = false }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}>
    <div className="brand-mark"><BrainCircuit size={21} strokeWidth={2.2} /></div>
    {!compact && <div className="brand-copy"><strong>Buddy <span>AI</span></strong><small>YOUR STUDY, IN CONTROL</small></div>}
  </div>;
}

function Button({ children, variant = 'primary', size = '', className = '', loading = false, ...props }) {
  return <button className={`btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`} disabled={props.disabled || loading} {...props}>
    {loading && <LoaderCircle size={16} className="spin" />}{children}
  </button>;
}

function Field({ label, error, hint, className = '', ...props }) {
  return <label className={`field ${className}`}>
    {label && <span className="field-label">{label}</span>}
    {props.children ? props.children : <input {...props} />}
    {hint && !error && <span className="field-hint">{hint}</span>}
    {error && <span className="field-error">{error}</span>}
  </label>;
}

function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header">
    <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>
    {action && <div className="page-header-action">{action}</div>}
  </div>;
}

function Notice({ kind = 'info', children, onClose }) {
  const Icon = kind === 'success' ? CheckCircle2 : kind === 'error' ? AlertCircle : Lightbulb;
  return <div className={`notice notice-${kind}`}><Icon size={17} /><div>{children}</div>{onClose && <button className="icon-btn notice-close" onClick={onClose} aria-label="ปิด"><X size={15} /></button>}</div>;
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(id);
  }, [toast, onClose]);
  if (!toast) return null;
  return <div className={`toast toast-${toast.kind || 'success'}`}><CheckCircle2 size={18} /><span>{toast.message}</span><button onClick={onClose}><X size={15} /></button></div>;
}

function LoadingScreen({ label = 'กำลังเตรียมพื้นที่เรียนของคุณ…' }) {
  return <div className="loading-screen"><div className="loading-logo"><BrainCircuit size={28} /></div><LoaderCircle className="spin loading-spinner" size={23} /><p>{label}</p></div>;
}

function SetupScreen() {
  return <div className="setup-screen">
    <div className="setup-card">
      <Brand />
      <div className="setup-icon"><Settings size={26} /></div>
      <div className="eyebrow">ONE-TIME SETUP</div>
      <h1>เชื่อมต่อพื้นที่เรียนของคุณ</h1>
      <p className="muted">ตัวเว็บไซต์พร้อมแล้ว แต่ต้องตั้งค่า Supabase ก่อนจึงจะเปิดใช้บัญชีจริงและบันทึกข้อมูลอย่างปลอดภัยได้</p>
      <ol className="setup-steps">
        <li><span>1</span><div><strong>สร้าง Supabase project</strong><p>สร้างโปรเจกต์ใหม่ แล้วคัดลอก Project URL และ Publishable/Anon Key</p></div></li>
        <li><span>2</span><div><strong>ตั้งค่า environment</strong><p>คัดลอก <code>.env.example</code> เป็น <code>.env</code> แล้วกรอกค่า Supabase ให้ครบ</p></div></li>
        <li><span>3</span><div><strong>สร้างฐานข้อมูล</strong><p>เปิด Supabase SQL Editor แล้วรันไฟล์ <code>supabase/schema.sql</code></p></div></li>
        <li><span>4</span><div><strong>เริ่มใช้งาน</strong><p>รัน <code>npm install</code> และ <code>npm run dev</code></p></div></li>
      </ol>
      <div className="setup-note"><ShieldCheck size={18} /><span>ระบบไม่ใช้ Login จำลอง และจะไม่ยอมให้สร้าง Admin ผ่านหน้าสมัครสมาชิกทั่วไป</span></div>
      <a className="text-link" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">เปิด Supabase Dashboard <ArrowUpRight size={14} /></a>
    </div>
  </div>;
}

function AuthLayout({ title, subtitle, children, footnote }) {
  return <div className="auth-page">
    <div className="auth-showcase">
      <div className="auth-showcase-top"><Brand /></div>
      <div className="auth-showcase-content">
        <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
        <div className="auth-glow-card">
          <div className="glow-card-top"><span className="status-dot" /> YOUR WEEK, IN FOCUS <Sparkles size={15} /></div>
          <div className="glow-card-heading">Make time for<br /><em>what matters.</em></div>
          <div className="mini-week"><div><small>MON</small><b>21</b><i /></div><div><small>TUE</small><b>22</b><i /></div><div className="mini-week-active"><small>WED</small><b>23</b><i /></div><div><small>THU</small><b>24</b><i /></div><div><small>FRI</small><b>25</b><i /></div></div>
          <div className="mini-focus-row"><div className="mini-focus-icon"><BookOpenCheck size={17} /></div><div><b>Deep work session</b><small>Introduction to C++ · 45 min</small></div><span>09:00</span></div>
          <div className="mini-progress"><div><span>Weekly goal</span><b>68%</b></div><div className="progress-track"><span style={{ width: '68%' }} /></div></div>
        </div>
        <div className="auth-floating-note"><BrainCircuit size={18} /><span><b>AI, on your side</b><small>A smarter way to study.</small></span><Sparkles size={14} /></div>
        <div className="auth-showcase-copy"><h2>เรียนอย่างมีแผน<br />ใช้เวลาอย่างมีความหมาย</h2><p>วางแผน ทบทวน และวัดผลการเรียนในพื้นที่เดียว</p></div>
      </div>
      <div className="auth-showcase-footer"><span>© 2026 Buddy AI</span><span>Built for better learning.</span></div>
    </div>
    <div className="auth-form-side">
      <div className="auth-form-mobile-brand"><Brand /></div>
      <div className="auth-form-wrap"><div className="auth-heading"><div className="eyebrow">WELCOME TO BUDDY AI</div><h1>{title}</h1><p>{subtitle}</p></div>{children}{footnote && <div className="auth-footnote">{footnote}</div>}</div>
      <div className="auth-bottom"><ShieldCheck size={15} /> บัญชีของคุณได้รับการปกป้องด้วยระบบยืนยันตัวตน</div>
    </div>
  </div>;
}

function LoginPage() {
  const { profileError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { if (profileError) setError(profileError); }, [profileError]);

  async function submit(event) {
    event.preventDefault(); setError(''); setNotice('');
    if (!email.trim() || !password) { setError('กรุณากรอกอีเมลและรหัสผ่าน'); return; }
    setBusy(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (loginError) { setError('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลหรือยืนยันอีเมลก่อน'); return; }
    navigate('/');
  }
  return <AuthLayout title="ยินดีต้อนรับกลับ" subtitle="เข้าสู่ระบบเพื่อไปต่อกับแผนการเรียนของคุณ">
    {error && <Notice kind="error">{error}</Notice>}{notice && <Notice kind="success">{notice}</Notice>}
    <form className="auth-form" onSubmit={submit}>
      <Field label="อีเมล" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
      <Field label="รหัสผ่าน" className="password-field">
        <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="กรอกรหัสผ่านของคุณ" value={password} onChange={e => setPassword(e.target.value)} required />
        <button className="password-toggle" type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
      </Field>
      <div className="auth-form-options"><label className="check-label"><input type="checkbox" /> <span>จดจำการเข้าสู่ระบบ</span></label><button type="button" className="text-link plain" onClick={() => navigate('/forgot-password')}>ลืมรหัสผ่าน?</button></div>
      <Button className="full-width auth-submit" loading={busy} type="submit">เข้าสู่ระบบ <ArrowRight size={17} /></Button>
    </form>
    <div className="auth-divider"><span />หรือ<span /></div>
    <p className="auth-switch">ยังไม่มีบัญชี? <button className="text-link plain" onClick={() => navigate('/register')}>สมัครสมาชิก</button></p>
    <div className="auth-privacy"><LockKeyhole size={15} /><span>ข้อมูลการเรียนเป็นข้อมูลส่วนตัวของคุณ</span></div>
  </AuthLayout>;
}

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false); const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  async function submit(event) {
    event.preventDefault(); setError(''); setSuccess('');
    if (!name.trim()) return setError('กรุณากรอกชื่อที่ใช้แสดง');
    if (!email.trim()) return setError('กรุณากรอกอีเมล');
    if (password.length < 8) return setError('รหัสผ่านควรมีอย่างน้อย 8 ตัวอักษร');
    if (password !== confirm) return setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
    if (!accepted) return setError('กรุณายอมรับข้อกำหนดการใช้งานก่อนสมัคร');
    if (!supabase) return setError('ยังไม่ได้ตั้งค่า Supabase ตรวจสอบไฟล์ .env แล้วรีสตาร์ตเว็บไซต์');
    setBusy(true);
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { display_name: name.trim() }, emailRedirectTo: window.location.origin },
      });
      if (signupError) {
        // Keep provider diagnostics in the browser console only during local development.
        if (import.meta.env.DEV) console.error('[StudyPilot] Signup failed:', { message: signupError.message, code: signupError.code, status: signupError.status });
        const detail = `${signupError.code || ''} ${signupError.message || ''}`.toLowerCase();
        if (/already registered|already been registered|user_already_exists|user_already_registered/.test(detail)) {
          setError('อีเมลนี้อาจมีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบหรือใช้เมนู “ลืมรหัสผ่าน?”');
        } else if (/rate limit|too many requests|email_address_not_authorized|over_email_send_rate_limit/.test(detail)) {
          setError('ระบบส่งอีเมลเกินขีดจำกัดหรืออีเมลนี้ยังไม่ได้รับอนุญาตให้รับอีเมลทดสอบ ตรวจสอบ Supabase → Authentication → Logs และการตั้งค่า SMTP');
        } else if (/error sending confirmation email|email provider|smtp|sending email/.test(detail)) {
          setError('สร้างบัญชีไม่สำเร็จเพราะระบบส่งอีเมลยืนยันมีปัญหา ตรวจสอบ SMTP Host, Port, Username, Password, Sender Email และ Logs ใน Supabase');
        } else if (/database error saving new user|trigger|profiles/.test(detail)) {
          setError('ฐานข้อมูลไม่สามารถสร้างโปรไฟล์ผู้ใช้ได้ ตรวจสอบว่าได้รัน supabase/schema.sql ใน Supabase SQL Editor และดู Auth Logs เพื่อหารายละเอียด');
        } else if (/password|weak_password/.test(detail)) {
          setError('รหัสผ่านไม่ผ่านเงื่อนไขของ Supabase กรุณาตั้งรหัสผ่านที่ยาวขึ้นและปลอดภัย');
        } else if (/invalid email|email_address_invalid/.test(detail)) {
          setError('รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีเมลแล้วลองอีกครั้ง');
        } else {
          setError(import.meta.env.DEV
            ? `สมัครสมาชิกไม่สำเร็จ: ${signupError.message || 'ไม่ทราบสาเหตุ'}${signupError.code ? ` (code: ${signupError.code})` : ''}`
            : 'สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบข้อมูลและลองอีกครั้ง');
        }
        return;
      }
      if (data.session) navigate('/');
      else setSuccess('สร้างบัญชีแล้ว กรุณาเปิดอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ');
    } catch (err) {
      if (import.meta.env.DEV) console.error('[StudyPilot] Unexpected signup error:', err);
      setError(import.meta.env.DEV
        ? `เชื่อมต่อระบบสมัครสมาชิกไม่สำเร็จ: ${err instanceof Error ? err.message : 'ตรวจสอบการเชื่อมต่อเครือข่ายและ Supabase'}`
        : 'เชื่อมต่อระบบสมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  }
  return <AuthLayout title="สร้างบัญชีใหม่" subtitle="เริ่มวางแผนการเรียนอย่างเป็นระบบได้เลย">
    {error && <Notice kind="error">{error}</Notice>}{success && <Notice kind="success">{success}</Notice>}
    <form className="auth-form" onSubmit={submit}>
      <Field label="ชื่อที่ใช้แสดง" autoComplete="name" placeholder="ชื่อของคุณ" value={name} onChange={e => setName(e.target.value)} required />
      <Field label="อีเมล" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
      <Field label="รหัสผ่าน" className="password-field" hint="อย่างน้อย 8 ตัวอักษร">
        <input type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="สร้างรหัสผ่าน" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />
        <button className="password-toggle" type="button" onClick={() => setShow(v => !v)} aria-label="แสดง/ซ่อนรหัสผ่าน">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
      </Field>
      <Field label="ยืนยันรหัสผ่าน" type="password" autoComplete="new-password" placeholder="กรอกรหัสผ่านอีกครั้ง" value={confirm} onChange={e => setConfirm(e.target.value)} required />
      <label className="check-label terms-check"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /><span>ฉันยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว</span></label>
      <Button className="full-width auth-submit" loading={busy} type="submit">สร้างบัญชี <ArrowRight size={17} /></Button>
    </form>
    <p className="auth-switch">มีบัญชีอยู่แล้ว? <button className="text-link plain" onClick={() => navigate('/login')}>เข้าสู่ระบบ</button></p>
    <div className="auth-privacy"><ShieldCheck size={15} /><span>บัญชีใหม่จะได้รับสิทธิ์ Student โดยอัตโนมัติ</span></div>
  </AuthLayout>;
}

function ForgotPasswordPage() {
  const navigate = useNavigate(); const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [done, setDone] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (requestError) setError('ส่งคำขอไม่สำเร็จ กรุณาลองใหม่ภายหลัง'); else setDone(true);
  }
  return <AuthLayout title="กู้คืนรหัสผ่าน" subtitle="เราจะส่งลิงก์เปลี่ยนรหัสผ่านไปยังอีเมลที่คุณกรอก">
    {error && <Notice kind="error">{error}</Notice>}
    {done ? <div className="success-panel"><div className="success-icon"><Mail size={24} /></div><h3>ตรวจสอบอีเมลของคุณ</h3><p>หากอีเมลนี้มีบัญชีในระบบและบริการอีเมลตั้งค่าไว้ถูกต้อง คุณจะได้รับลิงก์สำหรับเปลี่ยนรหัสผ่าน</p><Button className="full-width" onClick={() => navigate('/login')}>กลับไปเข้าสู่ระบบ</Button></div> : <form className="auth-form" onSubmit={submit}><Field label="อีเมล" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required /><Button className="full-width auth-submit" loading={busy} type="submit">ส่งลิงก์กู้คืน <ArrowRight size={17} /></Button><button className="back-link" type="button" onClick={() => navigate('/login')}><ArrowLeft size={15} /> กลับหน้าเข้าสู่ระบบ</button></form>}
  </AuthLayout>;
}

function ResetPasswordPage() {
  const { session } = useAuth(); const navigate = useNavigate();
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [done, setDone] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError('');
    if (password.length < 8) return setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
    if (password !== confirm) return setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
    setBusy(true); const { error: updateError } = await supabase.auth.updateUser({ password }); setBusy(false);
    if (updateError) setError('ลิงก์อาจหมดอายุแล้ว กรุณาขอลิงก์ใหม่'); else { setDone(true); await supabase.auth.signOut(); }
  }
  return <AuthLayout title="ตั้งรหัสผ่านใหม่" subtitle="สร้างรหัสผ่านใหม่ที่คุณยังไม่เคยใช้กับบัญชีนี้">
    {error && <Notice kind="error">{error}</Notice>}
    {done ? <div className="success-panel"><div className="success-icon"><CheckCircle2 size={24} /></div><h3>เปลี่ยนรหัสผ่านแล้ว</h3><p>คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย</p><Button className="full-width" onClick={() => navigate('/login')}>เข้าสู่ระบบ</Button></div> : session ? <form className="auth-form" onSubmit={submit}><Field label="รหัสผ่านใหม่" type="password" autoComplete="new-password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required /><Field label="ยืนยันรหัสผ่านใหม่" type="password" autoComplete="new-password" minLength={8} value={confirm} onChange={e => setConfirm(e.target.value)} required /><Button className="full-width auth-submit" loading={busy} type="submit">บันทึกรหัสผ่าน <Check size={17} /></Button></form> : <><Notice kind="info">เปิดหน้านี้จากลิงก์กู้คืนที่ส่งไปยังอีเมลของคุณ ลิงก์ต้องยังไม่หมดอายุ</Notice><Button className="full-width" variant="secondary" onClick={() => navigate('/forgot-password')}>ขอลิงก์ใหม่</Button></>}
  </AuthLayout>;
}

function RequireAuth({ children, admin = false }) {
  const { user, profile, loading, profileError } = useAuth(); const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (profileError) return <div className="blocked-screen"><ShieldCheck size={34} /><h2>ไม่สามารถเข้าใช้บัญชีนี้ได้</h2><p>{profileError}</p><Button onClick={() => supabase.auth.signOut()}>ออกจากระบบ</Button></div>;
  if (!profile) return <div className="blocked-screen"><AlertCircle size={34} /><h2>ยังไม่พบโปรไฟล์</h2><p>ตรวจสอบว่าได้รันฐานข้อมูลและ trigger สำหรับสร้างโปรไฟล์แล้ว</p><Button variant="secondary" onClick={() => supabase.auth.signOut()}>ออกจากระบบ</Button></div>;
  if (admin && profile.role !== 'admin') return <Navigate to="/app" replace />;
  if (!admin && profile.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}

function RoleRedirect() {
  const { user, profile, loading, profileError } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profileError) return <div className="blocked-screen"><AlertCircle size={34} /><h2>โหลดโปรไฟล์ไม่สำเร็จ</h2><p>{profileError}</p><Button onClick={() => supabase.auth.signOut()}>ออกจากระบบ</Button></div>;
  if (!profile) return <LoadingScreen label="กำลังโหลดโปรไฟล์…" />;
  return <Navigate to={profile.role === 'admin' ? '/admin' : '/app'} replace />;
}

const studentNav = [
  { to: '/app', label: 'ภาพรวม', icon: LayoutDashboard, end: true },
  { to: '/app/planner', label: 'ตารางและงาน', icon: CalendarDays },
  { to: '/app/courses', label: 'รายวิชาของฉัน', icon: BookOpen },
  { to: '/app/summary', label: 'สรุปบทเรียน AI', icon: FileText },
  { to: '/app/quiz', label: 'Quick Quiz', icon: ListChecks },
  { to: '/app/progress', label: 'พัฒนาการ', icon: Activity },
];
const adminNav = [
  { to: '/admin', label: 'ภาพรวมระบบ', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'จัดการผู้ใช้', icon: Users },
  { to: '/admin/courses', label: 'จัดการรายวิชา', icon: BookOpen },
  { to: '/admin/content', label: 'เนื้อหาส่วนกลาง', icon: FileText },
  { to: '/admin/quizzes', label: 'คลังแบบทดสอบ', icon: ClipboardList },
  { to: '/admin/audit', label: 'บันทึกกิจกรรม', icon: ShieldCheck },
  { to: '/admin/settings', label: 'ตั้งค่าระบบ', icon: Settings },
];

function AppShell({ admin = false, children }) {
  const { profile, user } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false); const [signOutBusy, setSignOutBusy] = useState(false);
  const navItems = admin ? adminNav : studentNav;
  const title = navItems.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))?.label || 'Buddy AI';
  async function logout() { setSignOutBusy(true); await supabase.auth.signOut(); navigate('/login'); setSignOutBusy(false); }
  return <div className={`app-shell ${admin ? 'admin-shell' : ''}`}>
    {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="ปิดเมนู" />}
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><Brand /><button className="icon-btn sidebar-close" onClick={() => setMobileOpen(false)} aria-label="ปิดเมนู"><X size={18} /></button></div>
      <div className="workspace-label">{admin ? 'WORKSPACE' : 'YOUR WORKSPACE'}</div>
      <div className="workspace-switcher"><div className="workspace-icon">{admin ? <ShieldCheck size={17} /> : <GraduationCap size={17} />}</div><div><b>{admin ? 'Admin console' : 'My learning space'}</b><small>{admin ? 'System management' : 'Personal workspace'}</small></div><ChevronDown size={14} /></div>
      <nav className="main-nav">
        <span className="nav-group-label">{admin ? 'ADMINISTRATION' : 'LEARN'}</span>
        {navItems.map(item => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}><Icon size={18} strokeWidth={1.85} /><span>{item.label}</span>{item.to === '/app/quiz' && <span className="nav-badge">NEW</span>}</NavLink>; })}
      </nav>
      {!admin && <div className="sidebar-ai-card"><div className="ai-card-icon"><Sparkles size={17} /></div><strong>Study smarter</strong><p>ให้ AI ช่วยแบ่งบทเรียนเป็นเป้าหมายเล็ก ๆ ที่ทำได้จริง</p><button onClick={() => navigate('/app/summary')}>ลองใช้ AI <ArrowRight size={14} /></button><div className="ai-card-orb" /></div>}
      <div className="sidebar-bottom">
        <NavLink to={admin ? '/admin/settings' : '/app/settings'} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`} onClick={() => setMobileOpen(false)}><Settings size={18} /><span>ตั้งค่า</span></NavLink>
        <div className="sidebar-user"><div className={`avatar ${admin ? 'avatar-admin' : ''}`}>{initials(profile?.display_name || user?.email || 'S')}</div><div className="sidebar-user-copy"><strong>{profile?.display_name || 'ผู้ใช้งาน'}</strong><small>{admin ? 'Administrator' : user?.email}</small></div><button className="icon-btn" onClick={logout} disabled={signOutBusy} title="ออกจากระบบ"><LogOut size={16} /></button></div>
      </div>
    </aside>
    <div className="main-column">
      <header className="topbar"><div className="topbar-left"><button className="icon-btn mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="เปิดเมนู"><Menu size={20} /></button><div className="breadcrumb">Workspace <ChevronRight size={13} /> <strong>{title}</strong></div></div><div className="topbar-actions"><div className="topbar-date"><CalendarClock size={15} /> {formatDate(new Date(), { weekday: 'short', day: 'numeric', month: 'short' })}</div><span className="topbar-separator" /><div className="topbar-profile"><div className={`avatar avatar-small ${admin ? 'avatar-admin' : ''}`}>{initials(profile?.display_name || user?.email || 'S')}</div><span>{profile?.display_name || 'Student'}</span><ChevronDown size={14} /></div></div></header>
      <main className="page-content">{children || <Outlet />}</main>
      <footer className="app-footer"><span>© 2026 Buddy AI</span><span><span className="footer-status-dot" /> Your learning space, thoughtfully designed.</span></footer>
    </div>
  </div>;
}

function StatCard({ title, value, detail, icon: Icon, tone = 'violet', trend, footnote }) {
  return <div className="stat-card"><div className="stat-card-top"><span>{title}</span><div className={`stat-icon stat-${tone}`}><Icon size={19} /></div></div><div className="stat-value">{value}</div><div className="stat-bottom">{trend && <span className={`stat-trend ${trend.startsWith('-') ? 'trend-down' : ''}`}><ArrowUpRight size={13} />{trend}</span>}<span>{detail}</span></div>{footnote && <small className="stat-footnote">{footnote}</small>}</div>;
}

function ProgressBar({ value = 0, tone = 'violet' }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  return <div className={`progress-track progress-${tone}`}><span style={{ width: `${clamped}%` }} /></div>;
}

function EmptyState({ icon: Icon = BookOpen, title, description, action }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={23} /></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

function TaskTypeLabel({ type }) {
  const labels = { study: ['อ่านหนังสือ', 'purple'], assignment: ['งานที่ต้องส่ง', 'orange'], exam: ['วันสอบ', 'red'], activity: ['กิจกรรม', 'blue'], class: ['คาบเรียน', 'green'], break: ['เวลาพัก', 'gray'] };
  const [label, tone] = labels[type] || ['งานทั่วไป', 'gray'];
  return <span className={`type-chip type-${tone}`}>{label}</span>;
}

function DashboardPage() {
  const { profile, user } = useAuth(); const [courses, setCourses] = useState([]); const [tasks, setTasks] = useState([]); const [attempts, setAttempts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const navigate = useNavigate();
  const load = useCallback(async () => {
    setLoading(true); setError('');
    const [c, t, q] = await Promise.all([
      supabase.from('courses').select('*').order('created_at', { ascending: false }).limit(8),
      supabase.from('study_tasks').select('*').order('due_at', { ascending: true }).limit(100),
      supabase.from('quiz_attempts').select('*').order('created_at', { ascending: false }).limit(20),
    ]);
    if (c.error || t.error || q.error) setError('โหลดข้อมูลบางส่วนไม่สำเร็จ ตรวจสอบว่าได้รัน schema.sql แล้ว');
    setCourses(c.data || []); setTasks(t.data || []); setAttempts(q.data || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const nextTasks = sortByDueDate(tasks.filter(t => t.status !== 'completed' && (!t.due_at || new Date(t.due_at) >= today))).slice(0, 4);
  const done = tasks.filter(t => t.status === 'completed').length;
  const studyMinutes = tasks.filter(t => t.task_type === 'study' && t.status === 'completed').reduce((n, t) => n + (t.duration_minutes || 0), 0);
  const average = attempts.length ? Math.round(attempts.reduce((n, q) => n + (q.total ? (q.score / q.total) * 100 : 0), 0) / attempts.length) : null;
  const firstName = (profile?.display_name || user?.email?.split('@')[0] || 'นักศึกษา').trim().split(/\s+/)[0];
  return <>
    <div className="welcome-banner"><div className="welcome-banner-content"><div className="eyebrow"><span className="eyebrow-dot" /> YOUR PERSONAL STUDY SPACE</div><h1>{timeGreeting()} {firstName} <span className="wave">✦</span></h1><p>ทุกก้าวเล็ก ๆ คือความก้าวหน้าของคุณ มาวางแผนวันนี้ให้ดีขึ้นกัน</p><div className="welcome-actions"><Button onClick={() => navigate('/app/planner')}><Plus size={16} /> เพิ่มงานหรือกิจกรรม</Button><button className="banner-quiet-btn" onClick={() => navigate('/app/summary')}><Sparkles size={16} /> ให้ AI ช่วยสรุป <ArrowRight size={14} /></button></div></div><div className="welcome-visual"><div className="welcome-circle circle-a" /><div className="welcome-circle circle-b" /><div className="welcome-book"><BookOpenCheck size={47} strokeWidth={1.35} /></div><div className="welcome-floating floating-star"><Sparkles size={17} /></div><div className="welcome-floating floating-check"><Check size={17} /></div></div></div>
    {error && <Notice kind="error">{error}</Notice>}
    <div className="section-heading section-heading-spaced"><div><h2>ภาพรวมการเรียน</h2><p>ติดตามสิ่งสำคัญของคุณในจุดเดียว</p></div><span className="live-label"><span /> ข้อมูลบัญชีของคุณ</span></div>
    <div className="stats-grid">
      <StatCard title="รายวิชาของฉัน" value={loading ? '—' : courses.length} detail="วิชาที่บันทึกไว้" icon={BookOpen} tone="violet" />
      <StatCard title="งานที่ต้องทำ" value={loading ? '—' : tasks.filter(t => t.status !== 'completed').length} detail="รายการที่ยังไม่เสร็จ" icon={ListChecks} tone="orange" />
      <StatCard title="เวลาเรียนสำเร็จ" value={loading ? '—' : `${Math.floor(studyMinutes / 60)} ชม. ${studyMinutes % 60} น.`} detail="จากงานอ่านหนังสือที่เสร็จแล้ว" icon={Clock3} tone="blue" />
      <StatCard title="คะแนน Quiz เฉลี่ย" value={loading ? '—' : average === null ? '—' : `${average}%`} detail={attempts.length ? `${attempts.length} ครั้งล่าสุด` : 'ยังไม่มีประวัติการทำ Quiz'} icon={Target} tone="green" />
    </div>
    <div className="dashboard-grid">
      <section className="panel upcoming-panel"><div className="panel-heading"><div><h3>สิ่งที่ต้องทำถัดไป</h3><p>เรียงตามกำหนดเวลา</p></div><button className="text-link plain" onClick={() => navigate('/app/planner')}>ดูทั้งหมด <ArrowRight size={14} /></button></div>
        {loading ? <div className="inline-loading"><LoaderCircle className="spin" size={20} /> กำลังโหลดรายการ…</div> : nextTasks.length ? <div className="task-list">{nextTasks.map((task, i) => <div className="task-row" key={task.id}><div className={`task-dot task-dot-${i % 4}`} /><div className="task-main"><div className="task-title-row"><strong>{task.title}</strong><TaskTypeLabel type={task.task_type} /></div><div className="task-meta"><Clock3 size={13} /> {task.due_at ? formatDateTime(task.due_at) : 'ยังไม่กำหนดเวลา'}{task.duration_minutes ? <><span className="meta-dot">·</span>{task.duration_minutes} นาที</> : null}</div></div><span className={`priority priority-${task.priority || 'medium'}`}>{({ high: 'สำคัญมาก', medium: 'ปานกลาง', low: 'ทั่วไป' })[task.priority] || 'ปานกลาง'}</span></div>)}</div> : <EmptyState icon={CheckCheck} title="วันนี้ยังไม่มีงานค้าง" description="เพิ่มงานหรือกำหนดวันสอบ เพื่อให้ AI ช่วยวางแผนการเรียนได้แม่นยำขึ้น" action={<Button size="sm" onClick={() => navigate('/app/planner')}><Plus size={14} /> เพิ่มรายการแรก</Button>} />}
      </section>
      <section className="panel progress-panel"><div className="panel-heading"><div><h3>พัฒนาการของฉัน</h3><p>ภาพรวมจากข้อมูลที่บันทึกไว้</p></div><button className="icon-btn" onClick={() => navigate('/app/progress')} title="ดูพัฒนาการ"><ArrowUpRight size={17} /></button></div>
        <div className="progress-ring-wrap"><div className="progress-ring" style={{ '--progress': `${tasks.length ? Math.round((done / tasks.length) * 100) : 0}%` }}><div><strong>{tasks.length ? Math.round((done / tasks.length) * 100) : 0}%</strong><small>งานสำเร็จ</small></div></div><div className="ring-legend"><div><span className="legend-dot legend-violet" /><div><strong>{done}</strong><small>เสร็จแล้ว</small></div></div><div><span className="legend-dot legend-gray" /><div><strong>{Math.max(0, tasks.length - done)}</strong><small>กำลังทำ/รอทำ</small></div></div></div></div>
        <div className="progress-callout"><div className="callout-icon"><Sparkles size={16} /></div><div><b>{attempts.length ? 'เรียนรู้ต่อเนื่องได้ดี!' : 'เริ่มต้นจากเป้าหมายเล็ก ๆ'}</b><p>{attempts.length ? 'ทบทวนหัวข้อที่คะแนนยังไม่เต็ม เพื่อเพิ่มความมั่นใจก่อนสอบ' : 'ทำ Quick Quiz หลังอ่านบทเรียน เพื่อเริ่มเก็บข้อมูลพัฒนาการของคุณ'}</p></div></div>
      </section>
    </div>
    <div className="section-heading section-heading-spaced"><div><h2>ทางลัดสำหรับวันนี้</h2><p>เริ่มทำสิ่งสำคัญได้ทันที</p></div></div>
    <div className="quick-actions-grid">
      <button className="quick-action-card" onClick={() => navigate('/app/summary')}><div className="quick-action-icon quick-icon-violet"><WandSparkles size={20} /></div><div><b>สรุปบทเรียนด้วย AI</b><p>เปลี่ยนเนื้อหายาวให้ทบทวนง่าย</p></div><ArrowUpRight size={17} className="quick-arrow" /></button>
      <button className="quick-action-card" onClick={() => navigate('/app/quiz')}><div className="quick-action-icon quick-icon-blue"><ListChecks size={20} /></div><div><b>เริ่มทำ Quick Quiz</b><p>ทดสอบความเข้าใจในไม่กี่นาที</p></div><ArrowUpRight size={17} className="quick-arrow" /></button>
      <button className="quick-action-card" onClick={() => navigate('/app/planner')}><div className="quick-action-icon quick-icon-orange"><CalendarClock size={20} /></div><div><b>จัดเวลาเรียน</b><p>บันทึกสอบ งาน และกิจกรรม</p></div><ArrowUpRight size={17} className="quick-arrow" /></button>
    </div>
  </>;
}

function PlannerPage() {
  const { user } = useAuth(); const [tasks, setTasks] = useState([]); const [courses, setCourses] = useState([]); const [loading, setLoading] = useState(true); const [showForm, setShowForm] = useState(false); const [filter, setFilter] = useState('all'); const [search, setSearch] = useState(''); const [toast, setToast] = useState(null); const [busyId, setBusyId] = useState('');
  const [form, setForm] = useState({ title: '', task_type: 'study', course_id: '', due_at: '', duration_minutes: 45, priority: 'medium', description: '', is_locked: false });
  const load = useCallback(async () => {
    setLoading(true);
    const [t, c] = await Promise.all([supabase.from('study_tasks').select('*').order('due_at', { ascending: true }), supabase.from('courses').select('*').order('name')]);
    setTasks(t.data || []); setCourses(c.data || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => sortByDueDate(tasks.filter(t => (filter === 'all' || (filter === 'open' ? t.status !== 'completed' : t.status === filter)) && `${t.title} ${t.description || ''}`.toLowerCase().includes(search.toLowerCase()))), [tasks, filter, search]);
  async function addTask(event) {
    event.preventDefault(); if (!form.title.trim()) return;
    const payload = { user_id: user.id, title: form.title.trim(), task_type: form.task_type, course_id: form.course_id || null, due_at: form.due_at ? new Date(form.due_at).toISOString() : null, duration_minutes: Math.max(5, Number(form.duration_minutes) || 45), priority: form.priority, description: form.description.trim(), status: 'pending', is_locked: form.is_locked };
    const { error } = await supabase.from('study_tasks').insert(payload);
    if (error) setToast({ kind: 'error', message: 'เพิ่มรายการไม่สำเร็จ กรุณาลองใหม่' });
    else { setToast({ kind: 'success', message: 'เพิ่มรายการลงในตารางแล้ว' }); setShowForm(false); setForm({ title: '', task_type: 'study', course_id: '', due_at: '', duration_minutes: 45, priority: 'medium', description: '', is_locked: false }); load(); }
  }
  async function toggleTask(task) {
    setBusyId(task.id); const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase.from('study_tasks').update({ status: nextStatus }).eq('id', task.id);
    setBusyId(''); if (error) setToast({ kind: 'error', message: 'อัปเดตสถานะไม่สำเร็จ' }); else { setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t)); setToast({ kind: 'success', message: nextStatus === 'completed' ? 'ทำเครื่องหมายว่าเสร็จแล้ว' : 'ย้ายกลับไปงานที่ต้องทำ' }); }
  }
  async function removeTask(task) {
    if (!window.confirm(`ต้องการลบรายการ “${task.title}” หรือไม่?`)) return;
    setBusyId(task.id); const { error } = await supabase.from('study_tasks').delete().eq('id', task.id); setBusyId('');
    if (error) setToast({ kind: 'error', message: 'ลบรายการไม่สำเร็จ' }); else { setTasks(prev => prev.filter(t => t.id !== task.id)); setToast({ kind: 'success', message: 'ลบรายการแล้ว' }); }
  }
  return <>
    <PageHeader eyebrow="PLAN YOUR TIME" title="ตารางและงานของฉัน" description="จัดการเวลาอ่านหนังสือ วันสอบ งานส่ง และกิจกรรมในที่เดียว" action={<Button onClick={() => setShowForm(v => !v)}><Plus size={16} /> เพิ่มรายการ</Button>} />
    {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    {showForm && <section className="panel form-panel"><div className="panel-heading"><div><h3>เพิ่มงานหรือกิจกรรม</h3><p>กำหนดข้อมูลที่จำเป็น แล้วบันทึกลงตารางส่วนตัว</p></div><button className="icon-btn" onClick={() => setShowForm(false)}><X size={18} /></button></div>
      <form className="form-grid" onSubmit={addTask}>
        <Field label="ชื่อรายการ" className="span-two" placeholder="เช่น ทบทวนบทที่ 3 เรื่อง Loop" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        <Field label="ประเภท"><select value={form.task_type} onChange={e => setForm({ ...form, task_type: e.target.value })}><option value="study">อ่านหนังสือ</option><option value="assignment">งานที่ต้องส่ง</option><option value="exam">วันสอบ</option><option value="activity">กิจกรรม</option><option value="class">คาบเรียน</option><option value="break">เวลาพัก</option></select></Field>
        <Field label="รายวิชา"><select value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}><option value="">ไม่ระบุรายวิชา</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="กำหนดเวลา" type="datetime-local" value={form.due_at} onChange={e => setForm({ ...form, due_at: e.target.value })} />
        <Field label="เวลาที่ใช้โดยประมาณ (นาที)" type="number" min="5" max="1440" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} />
        <Field label="ความสำคัญ"><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option value="high">สำคัญมาก</option><option value="medium">ปานกลาง</option><option value="low">ทั่วไป</option></select></Field>
        <Field label="รายละเอียดเพิ่มเติม" className="span-two"><textarea rows="2" placeholder="สิ่งที่ต้องเตรียมหรือหัวข้อที่ต้องอ่าน" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
        <label className="check-label span-two"><input type="checkbox" checked={form.is_locked} onChange={e => setForm({ ...form, is_locked: e.target.checked })} /><span>ล็อกเวลานี้ไว้ ไม่ให้แผนจัดตารางอัตโนมัติย้ายเวลา</span></label>
        <div className="form-actions span-two"><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>ยกเลิก</Button><Button type="submit"><Check size={16} /> บันทึกรายการ</Button></div>
      </form>
    </section>}
    <div className="planner-toolbar"><div className="segmented-control"><button onClick={() => setFilter('all')} className={filter === 'all' ? 'selected' : ''}>ทั้งหมด <span>{tasks.length}</span></button><button onClick={() => setFilter('open')} className={filter === 'open' ? 'selected' : ''}>ยังไม่เสร็จ <span>{tasks.filter(t => t.status !== 'completed').length}</span></button><button onClick={() => setFilter('completed')} className={filter === 'completed' ? 'selected' : ''}>เสร็จแล้ว</button></div><div className="search-field"><Search size={16} /><input placeholder="ค้นหางาน…" value={search} onChange={e => setSearch(e.target.value)} /><button aria-label="ค้นหา" onClick={() => setSearch(search.trim())}><Filter size={15} /></button></div></div>
    <div className="panel planner-list-panel"><div className="panel-heading"><div><h3>รายการของฉัน</h3><p>{filtered.length} รายการที่แสดง</p></div><button className="icon-btn" onClick={load} title="รีเฟรช"><RefreshCw size={16} /></button></div>
      {loading ? <div className="inline-loading"><LoaderCircle className="spin" size={20} /> กำลังโหลด…</div> : filtered.length ? <div className="planner-list">{filtered.map(task => <div className={`planner-item ${task.status === 'completed' ? 'planner-item-done' : ''}`} key={task.id}><button className={`task-check ${task.status === 'completed' ? 'task-check-done' : ''}`} onClick={() => toggleTask(task)} disabled={busyId === task.id} aria-label="เปลี่ยนสถานะ">{busyId === task.id ? <LoaderCircle size={15} className="spin" /> : task.status === 'completed' ? <Check size={15} /> : null}</button><div className="planner-item-main"><div className="planner-item-title"><strong>{task.title}</strong><TaskTypeLabel type={task.task_type} /></div>{task.description && <p>{task.description}</p>}<div className="planner-item-meta"><span><Clock3 size={13} /> {task.due_at ? formatDateTime(task.due_at) : 'ไม่กำหนดเวลา'}</span>{task.duration_minutes && <span><AlarmClock size={13} /> {task.duration_minutes} นาที</span>}{task.is_locked && <span><LockKeyhole size={12} /> ล็อกเวลา</span>}</div></div><div className="planner-item-end"><span className={`priority priority-${task.priority || 'medium'}`}>{({ high: 'สำคัญมาก', medium: 'ปานกลาง', low: 'ทั่วไป' })[task.priority] || 'ปานกลาง'}</span><button className="icon-btn danger-hover" onClick={() => removeTask(task)} aria-label="ลบรายการ"><Trash2 size={15} /></button></div></div>)}</div> : <EmptyState icon={CalendarDays} title="ยังไม่มีรายการในตาราง" description="เพิ่มงาน วันสอบ หรือช่วงอ่านหนังสือ เพื่อเริ่มจัดการเวลาของคุณ" action={<Button onClick={() => setShowForm(true)}><Plus size={15} /> เพิ่มรายการแรก</Button>} />}
    </div>
    <div className="info-strip"><div className="info-strip-icon"><Sparkles size={18} /></div><div><b>เคล็ดลับการวางแผน</b><p>กำหนดเวลาที่ต้องใช้และวันครบกำหนดให้ชัดเจน ระบบจะใช้ข้อมูลเหล่านี้เป็นพื้นฐานสำหรับคำแนะนำการเรียนในขั้นต่อไป</p></div></div>
  </>;
}

function CoursesPage() {
  const { user } = useAuth(); const [courses, setCourses] = useState([]); const [loading, setLoading] = useState(true); const [showForm, setShowForm] = useState(false); const [name, setName] = useState(''); const [code, setCode] = useState(''); const [color, setColor] = useState('violet'); const [busy, setBusy] = useState(false); const [toast, setToast] = useState(null);
  const load = useCallback(async () => { setLoading(true); const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false }); setCourses(data || []); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);
  async function submit(event) { event.preventDefault(); if (!name.trim()) return; setBusy(true); const { error } = await supabase.from('courses').insert({ user_id: user.id, name: name.trim(), code: code.trim() || null, color, is_public: false }); setBusy(false); if (error) setToast({ kind: 'error', message: 'เพิ่มรายวิชาไม่สำเร็จ' }); else { setName(''); setCode(''); setColor('violet'); setShowForm(false); setToast({ kind: 'success', message: 'เพิ่มรายวิชาแล้ว' }); load(); } }
  async function remove(course) { if (!window.confirm(`ลบรายวิชา “${course.name}” หรือไม่? งานที่เชื่อมกับวิชานี้จะยังอยู่`)) return; const { error } = await supabase.from('courses').delete().eq('id', course.id); if (error) setToast({ kind: 'error', message: 'ลบรายวิชาไม่สำเร็จ' }); else { setCourses(prev => prev.filter(c => c.id !== course.id)); setToast({ kind: 'success', message: 'ลบรายวิชาแล้ว' }); } }
  const swatches = ['violet', 'blue', 'green', 'orange', 'pink'];
  return <><PageHeader eyebrow="YOUR CURRICULUM" title="รายวิชาของฉัน" description="รวบรวมวิชาเพื่อเชื่อมโยงตารางอ่านหนังสือ สรุปบทเรียน และผล Quiz" action={<Button onClick={() => setShowForm(v => !v)}><Plus size={16} /> เพิ่มรายวิชา</Button>} />{toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    {showForm && <section className="panel form-panel"><div className="panel-heading"><div><h3>เพิ่มรายวิชาใหม่</h3><p>รายวิชาจะถูกบันทึกไว้ในบัญชีของคุณ</p></div><button className="icon-btn" onClick={() => setShowForm(false)}><X size={18} /></button></div><form className="form-grid" onSubmit={submit}><Field label="ชื่อรายวิชา" className="span-two" placeholder="เช่น การเขียนโปรแกรมภาษา C++" value={name} onChange={e => setName(e.target.value)} required /><Field label="รหัสวิชา (ถ้ามี)" placeholder="เช่น IT101" value={code} onChange={e => setCode(e.target.value)} /><div className="field"><span className="field-label">สีประจำวิชา</span><div className="swatch-picker">{swatches.map(s => <button type="button" key={s} className={`swatch swatch-${s} ${color === s ? 'swatch-selected' : ''}`} onClick={() => setColor(s)} aria-label={s}>{color === s && <Check size={13} />}</button>)}</div></div><div className="form-actions span-two"><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>ยกเลิก</Button><Button type="submit" loading={busy}>บันทึกรายวิชา</Button></div></form></section>}
    <div className="section-heading section-heading-spaced"><div><h2>วิชาที่บันทึกไว้</h2><p>{courses.length} รายวิชา · รวมรายวิชาส่วนตัวและรายวิชากลางที่เผยแพร่</p></div></div>
    {loading ? <div className="panel inline-loading"><LoaderCircle className="spin" size={20} /> กำลังโหลดรายวิชา…</div> : courses.length ? <div className="courses-grid">{courses.map((course, i) => <div className="course-card" key={course.id}><div className={`course-card-top course-color-${course.color || 'violet'}`}><div className="course-card-symbol"><BookOpen size={21} /></div><span>{course.is_public ? 'COURSE CATALOG' : 'MY COURSE'}</span><button className="icon-btn" onClick={() => remove(course)} aria-label="ลบรายวิชา" disabled={course.is_public}><MoreHorizontal size={19} /></button></div><div className="course-card-body"><div className="course-code">{course.code || `COURSE ${String(i + 1).padStart(2, '0')}`}</div><h3>{course.name}</h3><p>{course.is_public ? 'รายวิชาส่วนกลางจากผู้ดูแลระบบ' : 'รายวิชาส่วนตัวของคุณ'}</p><div className="course-card-footer"><span><BookMarked size={14} /> ใช้กับตารางและ Quiz ได้</span><span className="course-arrow"><ArrowUpRight size={16} /></span></div></div></div>)}</div> : <div className="panel"><EmptyState icon={BookOpen} title="เริ่มจากเพิ่มรายวิชาแรก" description="เพิ่มวิชาที่กำลังเรียน เพื่อให้จัดการงานและติดตามผลได้ง่ายขึ้น" action={<Button onClick={() => setShowForm(true)}><Plus size={15} /> เพิ่มรายวิชา</Button>} /></div>}
  </>;
}

async function callAI(path, payload, token) {
  const response = await fetch(`${API_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'AI service ไม่พร้อมใช้งาน');
  return body;
}

async function applyStudyFile(file, setContent, setAttachment, setFileName, setError) {
  if (!file) return;
  try {
    const loaded = await readStudyFile(file);
    setContent(loaded.content); setAttachment(loaded.attachment); setFileName(loaded.fileName); setError('');
  } catch (error) { setError(error instanceof Error ? error.message : 'อ่านไฟล์ไม่สำเร็จ'); }
}

function SummaryPage() {
  const { session, user } = useAuth();
  const [courses, setCourses] = useState([]); const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState(''); const [content, setContent] = useState(''); const [summary, setSummary] = useState('');
  const [attachment, setAttachment] = useState(null); const [fileName, setFileName] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState(''); const [editingSummary, setEditingSummary] = useState(false); const [searchMaterials, setSearchMaterials] = useState('');
  const [busy, setBusy] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [savedNotice, setSavedNotice] = useState('');
  const [materials, setMaterials] = useState([]); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const [c, m] = await Promise.all([
      supabase.from('courses').select('id,name').order('name'),
      supabase.from('learning_materials').select('id,title,summary,source_text,created_at,course_id').order('created_at', { ascending: false }).limit(100),
    ]);
    setCourses(c.data || []); setMaterials(m.data || []);
    if (c.error || m.error) setError('โหลดรายการรายวิชาหรือสรุปที่บันทึกไว้ไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ฐานข้อมูล');
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  async function generate(event) {
    event.preventDefault(); setError(''); setSavedNotice(''); setSummary('');
    if (!attachment && content.trim().length < 50) { setError('กรุณาใส่เนื้อหาอย่างน้อย 50 ตัวอักษรหรือแนบไฟล์'); return; }
    setBusy(true);
    try {
      const result = await callAI('/api/ai/summary', { content: content.trim(), title: title.trim() || fileName || 'บทเรียนไม่มีชื่อ', attachment }, session.access_token);
      setSummary(result.summary); setEditingSummary(false);
    } catch (err) { setError(err.message || 'สรุปบทเรียนไม่สำเร็จ'); }
    finally { setBusy(false); }
  }
  async function saveSummary() {
    if (!summary.trim()) return;
    setSaving(true); setError(''); setSavedNotice('');
    const titleValue = title.trim() || 'สรุปบทเรียน';
    const sourceText = content.trim() || (attachment ? '[ไฟล์แนบ: ' + (fileName || attachment.name) + ']' : '');
    const row = { title: titleValue, course_id: courseId || null, source_text: sourceText, summary: summary.trim() };
    const result = selectedMaterialId
      ? await supabase.from('learning_materials').update(row).eq('id', selectedMaterialId).select('id').maybeSingle()
      : await supabase.from('learning_materials').insert({ ...row, user_id: user.id }).select('id').single();
    setSaving(false);
    if (result.error || !result.data?.id) { setError('บันทึกสรุปไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อและสิทธิ์ฐานข้อมูล'); return; }
    setSelectedMaterialId(result.data.id); setSavedNotice('บันทึกสรุปในบัญชีของคุณแล้ว'); setEditingSummary(false);
    await load();
  }
  function viewMaterial(material) {
    const storedAttachment = typeof material.source_text === 'string' && material.source_text.startsWith('[ไฟล์แนบ:');
    setSelectedMaterialId(material.id); setTitle(material.title || ''); setCourseId(material.course_id || ''); setSummary(material.summary || '');
    setContent(storedAttachment ? '' : material.source_text || ''); setAttachment(null); setFileName(storedAttachment ? material.source_text.slice('[ไฟล์แนบ:'.length).replace(']', '').trim() : '');
    setEditingSummary(false); setError(''); setSavedNotice(storedAttachment ? 'โหลดสรุปแล้ว หากต้องการสร้างใหม่จากต้นฉบับ ให้แนบไฟล์เดิมอีกครั้ง' : 'โหลดสรุปที่บันทึกไว้แล้ว');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function deleteMaterial(material) {
    if (!window.confirm('ลบสรุป “' + material.title + '” หรือไม่? การลบนี้ย้อนกลับไม่ได้')) return;
    const { error: deleteError } = await supabase.from('learning_materials').delete().eq('id', material.id);
    if (deleteError) { setError('ลบสรุปไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ฐานข้อมูล'); return; }
    setMaterials(prev => prev.filter(item => item.id !== material.id));
    if (selectedMaterialId === material.id) { setSelectedMaterialId(''); setTitle(''); setContent(''); setSummary(''); setAttachment(null); setFileName(''); setEditingSummary(false); }
    setSavedNotice('ลบสรุปแล้ว');
  }
  function clearSummaryForm() { setSelectedMaterialId(''); setTitle(''); setContent(''); setSummary(''); setCourseId(''); setAttachment(null); setFileName(''); setEditingSummary(false); setError(''); setSavedNotice(''); }
  const filteredMaterials = materials.filter(item => (item.title || '').toLowerCase().includes(searchMaterials.toLowerCase()) || (item.summary || '').toLowerCase().includes(searchMaterials.toLowerCase()));
  return <>
    <PageHeader eyebrow="LEARN WITH CLARITY" title="สรุปบทเรียนด้วย AI" description="วางข้อความหรือแนบไฟล์ PDF/รูปภาพ แล้วเปลี่ยนเป็นสรุปที่บันทึกและกลับมาแก้ไขได้" action={<div className="ai-status"><span className="ai-status-dot" /><Sparkles size={15} /> AI assistant</div>} />
    <div className="summary-layout">
      <div className="summary-main-column">
        <section className="panel summary-input-panel">
          <div className="panel-heading"><div><h3><WandSparkles size={18} /> สร้างสรุปใหม่</h3><p>เลือกไฟล์หรือวางเนื้อหาที่ต้องการทำความเข้าใจ</p></div><div className="ai-mini-label"><Sparkles size={13} /> AI POWERED</div></div>
          {error && <Notice kind="error">{error}</Notice>}{savedNotice && <Notice kind="success">{savedNotice}</Notice>}
          <form onSubmit={generate} className="summary-form">
            <Field label="ชื่อบทเรียน" placeholder="เช่น C++ — เงื่อนไขและการวนซ้ำ" value={title} onChange={e => setTitle(e.target.value)} />
            <Field label="รายวิชา"><select value={courseId} onChange={e => setCourseId(e.target.value)}><option value="">เลือกภายหลัง / ไม่ระบุ</option>{courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}</select></Field>
            <Field label="แนบไฟล์จากเครื่อง" hint="รองรับ TXT, MD, CSV, PDF, PNG, JPG และ WEBP · สูงสุด 8 MB">
              <input type="file" accept=".txt,.md,.markdown,.csv,.log,.pdf,.png,.jpg,.jpeg,.webp,text/plain,text/markdown,text/csv,application/pdf,image/png,image/jpeg,image/webp" onChange={async e => { const file = e.target.files && e.target.files[0]; if (file) await applyStudyFile(file, setContent, setAttachment, setFileName, setError); e.target.value = ''; }} />
            </Field>
            {fileName && <div className="file-selection"><FileCheck2 size={16} /><span>{fileName}</span><button type="button" className="text-link plain" onClick={() => { setAttachment(null); setFileName(''); }}>เอาไฟล์ออก</button></div>}
            <Field label="เนื้อหาบทเรียน" hint={content.length.toLocaleString() + ' ตัวอักษร · หากแนบ PDF/รูปภาพ ไม่จำเป็นต้องวางข้อความ'}><textarea className="summary-textarea" rows="10" placeholder="วางเนื้อหาบทเรียนหรือโน้ตตรงนี้…" value={content} onChange={e => setContent(e.target.value)} /></Field>
            <div className="summary-input-footer"><span><ShieldCheck size={14} /> ข้อความสูงสุด 50,000 ตัวอักษร</span><div className="summary-form-actions"><Button type="button" variant="secondary" onClick={clearSummaryForm}><Plus size={15} /> สรุปใหม่</Button><Button type="submit" loading={busy}><Sparkles size={16} /> สร้างสรุปด้วย AI</Button></div></div>
          </form>
        </section>
        <section className="panel summary-result-panel">
          <div className="panel-heading"><div><h3><FileText size={18} /> สรุปบทเรียน</h3><p>{selectedMaterialId ? 'แก้ไขสรุปที่บันทึกไว้ หรือบันทึกการเปลี่ยนแปลง' : 'เนื้อหาที่ AI สร้างจากข้อความหรือไฟล์ที่ส่ง'}</p></div>
            {summary && <div className="summary-export-actions">
              <Button size="sm" variant="secondary" onClick={() => downloadSummaryExport(summary, title, 'pdf').catch(err => setError(err.message || 'ส่งออก PDF ไม่สำเร็จ'))}><FileText size={14} /> PDF</Button>
              <Button size="sm" variant="secondary" onClick={() => downloadSummaryExport(summary, title, 'png').catch(err => setError(err.message || 'ส่งออก PNG ไม่สำเร็จ'))}><FileCheck2 size={14} /> PNG</Button>
              <Button size="sm" variant="secondary" onClick={() => setEditingSummary(v => !v)}><Pencil size={14} /> {editingSummary ? 'ดูตัวอย่าง' : 'แก้ไขข้อความ'}</Button>
              <Button size="sm" onClick={saveSummary} loading={saving}><Check size={14} /> {selectedMaterialId ? 'บันทึกการแก้ไข' : 'บันทึกสรุป'}</Button>
            </div>}
          </div>
          {summary ? <div className="summary-output">
            <div className="summary-output-meta"><div className="summary-output-icon"><Sparkles size={17} /></div><div><strong>{title.trim() || 'สรุปบทเรียน'}</strong><small>AI-generated summary · โปรดตรวจทานกับเอกสารต้นฉบับ</small></div></div>
            {editingSummary
              ? <textarea className="summary-edit-textarea" rows="18" value={summary} onChange={e => setSummary(e.target.value)} aria-label="แก้ไขข้อความสรุป" />
              : <div className="summary-markdown">{summary.split('\n').map((line, i) => line.startsWith('### ') ? <h4 key={i}>{line.replace(/^###\s*/, '')}</h4> : line.startsWith('## ') ? <h3 key={i}>{line.replace(/^##\s*/, '')}</h3> : line.startsWith('# ') ? <h2 key={i}>{line.replace(/^#\s*/, '')}</h2> : line.startsWith('- ') || line.startsWith('* ') ? <p className="summary-bullet" key={i}><span>•</span>{line.slice(2)}</p> : line.trim() ? <p key={i}>{line}</p> : <div key={i} className="summary-space" />)}</div>}
            <div className="summary-next-step"><div><Lightbulb size={18} /><b>พร้อมทดสอบความเข้าใจหรือยัง?</b></div><p>ใช้เนื้อหาต้นฉบับนี้สร้าง Quick Quiz เพื่อดูว่าหัวข้อไหนควรกลับไปทบทวน</p><button className="text-link plain" onClick={() => { window.sessionStorage.setItem('studyPilotQuizContent', content); if (attachment && !content.trim()) window.alert('หากต้องการสร้าง Quick Quiz จากไฟล์ PDF/รูปภาพนี้ ให้แนบไฟล์เดิมอีกครั้งในหน้า Quick Quiz'); window.location.href = '/app/quiz'; }}>สร้าง Quick Quiz <ArrowRight size={14} /></button></div>
          </div> : <EmptyState icon={FileText} title="สรุปบทเรียนจะแสดงที่นี่" description="เมื่อสร้างสรุปสำเร็จ คุณสามารถแก้ไข ส่งออก PDF/PNG และบันทึกไว้ใช้ครั้งต่อไปได้" />}
        </section>
      </div>
      <aside className="summary-side-column">
        <section className="panel summary-tips"><div className="tips-icon"><Lightbulb size={20} /></div><h3>เคล็ดลับให้สรุปดีขึ้น</h3><ul><li>แบ่งเนื้อหาเป็นบทหรือหัวข้อ</li><li>ใส่คำจำกัดความและตัวอย่างที่อาจออกสอบ</li><li>ตรวจทานกับเอกสารต้นฉบับเสมอ</li><li>อย่าใส่รหัสผ่านหรือข้อมูลส่วนตัวในเอกสาร</li></ul></section>
        <section className="panel recent-materials">
          <div className="panel-heading"><div><h3>สรุปที่บันทึกไว้</h3><p>{materials.length} รายการล่าสุดที่ค้นหาได้</p></div><BookMarked size={18} className="muted-icon" /></div>
          <div className="search-field"><Search size={15} /><input value={searchMaterials} onChange={e => setSearchMaterials(e.target.value)} placeholder="ค้นหาชื่อหรือเนื้อหาสรุป…" /></div>
          {loading ? <div className="inline-loading"><LoaderCircle size={18} className="spin" /></div> : filteredMaterials.length ? <div className="recent-material-list">{filteredMaterials.map(material => <div className="recent-material-entry" key={material.id}><button className="recent-material" onClick={() => viewMaterial(material)}><div className="recent-material-icon"><FileText size={16} /></div><div><b>{material.title}</b><small>{formatDate(material.created_at)}</small></div><ChevronRight size={15} /></button><button className="icon-btn danger-hover recent-delete" onClick={() => deleteMaterial(material)} aria-label={'ลบสรุป ' + material.title} title="ลบสรุป"><Trash2 size={15} /></button></div>)}</div> : <EmptyState icon={FileText} title="ไม่พบสรุปบทเรียน" description="บันทึกสรุปแรกของคุณ แล้วจะค้นหาและกลับมาแก้ไขได้จากที่นี่" />}
        </section>
      </aside>
    </div>
  </>;
}

function QuizPage() {
  const { session, user } = useAuth(); const [courses, setCourses] = useState([]); const [courseId, setCourseId] = useState(''); const [topic, setTopic] = useState('');
  const [content, setContent] = useState(() => window.sessionStorage.getItem('studyPilotQuizContent') || ''); const [attachment, setAttachment] = useState(null); const [fileName, setFileName] = useState('');
  const [count, setCount] = useState('5'); const [questions, setQuestions] = useState([]); const [answers, setAnswers] = useState({}); const [submitted, setSubmitted] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [history, setHistory] = useState([]); const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false);
  const load = useCallback(async () => { const [c, q] = await Promise.all([supabase.from('courses').select('id,name').order('name'), supabase.from('quiz_attempts').select('*').order('created_at', { ascending: false }).limit(5)]); setCourses(c.data || []); setHistory(q.data || []); }, []);
  useEffect(() => { load(); }, [load]);
  async function generate(event) {
    event.preventDefault(); setError(''); setQuestions([]); setAnswers({}); setSubmitted(false); setSaved(false);
    if (!attachment && content.trim().length < 50) return setError('กรุณาใส่เนื้อหาบทเรียนอย่างน้อย 50 ตัวอักษรหรือแนบไฟล์');
    setBusy(true);
    try {
      const result = await callAI('/api/ai/quiz', { content: content.trim(), topic: topic.trim() || fileName || 'บทเรียนทั่วไป', count: Number(count), attachment }, session.access_token);
      setQuestions(result.questions || []); if (!result.questions?.length) setError('AI ยังสร้างคำถามที่ใช้ได้ไม่สำเร็จ กรุณาลองใหม่');
    } catch (err) { setError(err.message || 'สร้าง Quiz ไม่สำเร็จ'); } finally { setBusy(false); }
  }
  const score = questions.reduce((n, q, i) => n + (answers[i] === q.answerIndex ? 1 : 0), 0);
  async function submitQuiz() { if (Object.keys(answers).length < questions.length && !window.confirm('ยังตอบไม่ครบทุกข้อ ต้องการส่งคำตอบตอนนี้หรือไม่?')) return; setSubmitted(true); setSaving(true); const wrongTopics = [...new Set(questions.filter((q, i) => answers[i] !== q.answerIndex).map(q => q.topic || topic || 'หัวข้อทั่วไป'))]; const { error: saveError } = await supabase.from('quiz_attempts').insert({ user_id: user.id, course_id: courseId || null, topic: topic.trim() || 'บทเรียนทั่วไป', score, total: questions.length, weak_topics: wrongTopics }); setSaving(false); setSaved(!saveError); if (!saveError) load(); else setError('ตรวจคำตอบสำเร็จ แต่บันทึกประวัติไม่สำเร็จ'); }
  function resetQuiz() { setQuestions([]); setAnswers({}); setSubmitted(false); setSaved(false); setError(''); }
  return <><PageHeader eyebrow="PRACTICE MAKES PROGRESS" title="Quick Quiz" description="เปลี่ยนบทเรียนให้เป็นแบบทดสอบสั้น ๆ พร้อมคำอธิบายคำตอบ" action={<div className="quiz-time-badge"><Clock3 size={15} /> 5–10 นาที</div>} />
    {error && <Notice kind="error">{error}</Notice>}
    {!questions.length ? <div className="quiz-start-layout"><section className="panel quiz-config-panel"><div className="quiz-hero"><div className="quiz-hero-symbol"><ListChecks size={30} /></div><div className="eyebrow">TEST YOUR UNDERSTANDING</div><h2>พร้อมเช็กความเข้าใจ?</h2><p>สร้างข้อสอบจากเนื้อหาที่คุณกำลังเรียน ไม่ใช่คำถามแบบสุ่มจากหัวข้ออื่น</p><div className="quiz-feature-row"><span><CheckCircle2 size={14} /> เฉลยพร้อมเหตุผล</span><span><CheckCircle2 size={14} /> บันทึกคะแนน</span><span><CheckCircle2 size={14} /> ชี้หัวข้อที่ควรทบทวน</span></div></div>
      <form className="quiz-config-form" onSubmit={generate}><Field label="ชื่อหัวข้อ / บทเรียน" placeholder="เช่น C++ — Loop และเงื่อนไข" value={topic} onChange={e => setTopic(e.target.value)} /><Field label="รายวิชา"><select value={courseId} onChange={e => setCourseId(e.target.value)}><option value="">ไม่ระบุรายวิชา</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><div className="field"><span className="field-label">จำนวนคำถาม</span><div className="quiz-count-options">{['5', '10', '20'].map(v => <button type="button" key={v} className={count === v ? 'count-active' : ''} onClick={() => setCount(v)}><b>{v}</b><small>ข้อ</small></button>)}</div></div><Field label="แนบไฟล์ที่ต้องการทดสอบ" hint="รองรับ TXT, MD, CSV, PDF, PNG, JPG และ WEBP · สูงสุด 8 MB"><input type="file" accept=".txt,.md,.markdown,.csv,.log,.pdf,.png,.jpg,.jpeg,.webp,text/plain,text/markdown,text/csv,application/pdf,image/png,image/jpeg,image/webp" onChange={async e => { const file = e.target.files && e.target.files[0]; if (file) await applyStudyFile(file, setContent, setAttachment, setFileName, setError); e.target.value = ''; }} /></Field>{fileName && <div className="file-selection"><FileCheck2 size={16} /><span>{fileName}</span><button type="button" className="text-link plain" onClick={() => { setAttachment(null); setFileName(''); }}>เอาไฟล์ออก</button></div>}<Field label="เนื้อหาที่ต้องการทดสอบ" hint={`${content.length.toLocaleString()} ตัวอักษร`}><textarea rows="8" placeholder="วางเนื้อหาบทเรียนหรือสรุปที่คุณมีอย่างน้อย 50 ตัวอักษร หรือแนบไฟล์ด้านบน" value={content} onChange={e => { setContent(e.target.value); window.sessionStorage.setItem('studyPilotQuizContent', e.target.value); }} /></Field><Button type="submit" className="full-width" loading={busy}><Sparkles size={16} /> สร้างแบบทดสอบ</Button><p className="quiz-disclaimer">คำถามสร้างจากเนื้อหาที่ส่งให้ AI โปรดตรวจสอบความถูกต้องก่อนใช้เป็นข้อมูลอ้างอิงสำหรับการสอบจริง</p></form>
    </section><aside className="quiz-side"><section className="panel quiz-how-panel"><div className="panel-heading"><div><h3>ทำงานอย่างไร</h3><p>เรียนรู้เป็นวงจร</p></div><BrainCircuit className="muted-icon" size={19} /></div><div className="quiz-step"><div className="quiz-step-number">01</div><div><b>ใส่เนื้อหาที่เรียน</b><p>วางข้อความจากบทเรียนหรือสรุปเดิม</p></div></div><div className="quiz-step"><div className="quiz-step-number">02</div><div><b>ตอบคำถามจาก AI</b><p>เลือกคำตอบที่คิดว่าถูกต้อง</p></div></div><div className="quiz-step"><div className="quiz-step-number">03</div><div><b>ทบทวนจุดที่ยังอ่อน</b><p>ดูคะแนนและคำอธิบายหลังส่งคำตอบ</p></div></div></section><section className="panel quiz-history-panel"><div className="panel-heading"><div><h3>ผลสอบล่าสุด</h3><p>จากการทำ Quiz ก่อนหน้า</p></div></div>{history.length ? history.map(h => <div className="history-row" key={h.id}><div><b>{h.topic}</b><small>{formatDate(h.created_at)}</small></div><span>{h.score}/{h.total}</span></div>) : <p className="muted small-copy">เมื่อทำ Quiz แล้ว ผลคะแนนจะแสดงที่นี่</p>}</section></aside></div> : <section className="panel quiz-taking-panel"><div className="quiz-taking-header"><div><div className="eyebrow">QUICK QUIZ SESSION</div><h2>{topic || 'ทดสอบความเข้าใจ'}</h2><p>{questions.length} คำถาม · เลือกคำตอบที่ดีที่สุด</p></div><div className="quiz-score-preview"><span>ตอบแล้ว</span><b>{Object.keys(answers).length}/{questions.length}</b></div></div><ProgressBar value={(Object.keys(answers).length / questions.length) * 100} />
      {submitted && <div className="quiz-results-banner"><div className="quiz-result-mark"><Target size={23} /></div><div><small>YOUR RESULT</small><h3>คุณได้ {score} จาก {questions.length} คะแนน ({Math.round(score / questions.length * 100)}%)</h3><p>{score / questions.length >= .8 ? 'ยอดเยี่ยม! ลองทบทวนจุดเล็ก ๆ ที่ยังผิดเพื่อให้แม่นยำยิ่งขึ้น' : 'ลองดูคำอธิบายและกลับไปทบทวนหัวข้อที่ตอบผิด แล้วทำ Quiz อีกครั้ง'}</p></div><div className="quiz-result-score">{Math.round(score / questions.length * 100)}<small>%</small></div></div>}
      <div className="quiz-questions">{questions.map((q, i) => <div className="quiz-question" key={`${i}-${q.question}`}><div className="question-number">QUESTION {String(i + 1).padStart(2, '0')} <span>{q.topic || topic || 'GENERAL'}</span></div><h3>{q.question}</h3><div className="answer-options">{(q.options || []).map((option, j) => { const chosen = answers[i] === j; const correct = submitted && j === q.answerIndex; const wrong = submitted && chosen && j !== q.answerIndex; return <button key={j} className={`answer-option ${chosen ? 'answer-chosen' : ''} ${correct ? 'answer-correct' : ''} ${wrong ? 'answer-wrong' : ''}`} disabled={submitted} onClick={() => setAnswers(prev => ({ ...prev, [i]: j }))}><span className="answer-letter">{String.fromCharCode(65 + j)}</span><span>{option}</span>{correct && <CheckCircle2 size={17} />}{wrong && <X size={17} />}</button>; })}</div>{submitted && <div className="answer-explanation"><Lightbulb size={16} /><div><b>{answers[i] === q.answerIndex ? 'ตอบถูกต้อง' : 'คำตอบที่ถูกต้อง: ' + (q.options?.[q.answerIndex] || '')}</b><p>{q.explanation || 'กลับไปตรวจทานหัวข้อนี้กับเอกสารต้นฉบับเพื่อความมั่นใจ'}</p></div></div>}</div>)}</div>
      <div className="quiz-submit-row">{submitted ? <><span className="muted small-copy">{saved ? 'บันทึกผลการทำแบบทดสอบแล้ว' : saving ? 'กำลังบันทึกผล…' : 'ระบบแสดงผลจากการทำแบบทดสอบครั้งนี้'}</span><Button onClick={resetQuiz} variant="secondary"><RefreshCw size={15} /> ทำชุดใหม่</Button></> : <><span className="muted small-copy">ตอบแล้ว {Object.keys(answers).length} จาก {questions.length} ข้อ</span><Button onClick={submitQuiz}><CheckCheck size={16} /> ส่งคำตอบและดูเฉลย</Button></>}</div>
    </section>}
  </>;
}

function ProgressPage() {
  const [attempts, setAttempts] = useState([]); const [tasks, setTasks] = useState([]); const [courses, setCourses] = useState([]); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); const [a,t,c] = await Promise.all([supabase.from('quiz_attempts').select('*').order('created_at', { ascending: false }).limit(50), supabase.from('study_tasks').select('id,status,task_type,duration_minutes,created_at'), supabase.from('courses').select('id,name')]); setAttempts(a.data || []); setTasks(t.data || []); setCourses(c.data || []); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);
  const average = attempts.length ? Math.round(attempts.reduce((n, q) => n + (q.total ? q.score / q.total * 100 : 0), 0) / attempts.length) : 0;
  const done = tasks.filter(t => t.status === 'completed').length; const studyTime = tasks.filter(t => t.status === 'completed' && t.task_type === 'study').reduce((n, t) => n + (t.duration_minutes || 0), 0);
  const chartValues = [...attempts].slice(0, 8).reverse();
  const weakTopics = [...new Set(attempts.flatMap(a => a.weak_topics || []))].slice(0, 8);
  return <><PageHeader eyebrow="YOUR GROWTH, VISUALIZED" title="พัฒนาการของฉัน" description="ทบทวนความคืบหน้าจากงานและแบบทดสอบที่คุณทำไว้" action={<Button variant="secondary" onClick={load}><RefreshCw size={15} /> รีเฟรชข้อมูล</Button>} />
    <div className="stats-grid progress-stats"><StatCard title="คะแนน Quiz เฉลี่ย" value={loading ? '—' : attempts.length ? `${average}%` : '—'} detail={`${attempts.length} ครั้งที่บันทึก`} icon={Target} tone="violet" /><StatCard title="งานที่ทำสำเร็จ" value={loading ? '—' : `${done}/${tasks.length}`} detail="รายการทั้งหมดที่บันทึก" icon={CheckCheck} tone="green" /><StatCard title="เวลาอ่านที่เสร็จแล้ว" value={loading ? '—' : `${Math.floor(studyTime / 60)} ชม. ${studyTime % 60} น.`} detail="ตามเวลาที่วางแผนไว้" icon={Clock3} tone="blue" /><StatCard title="รายวิชาที่ติดตาม" value={loading ? '—' : courses.length} detail="วิชาที่บันทึกในระบบ" icon={BookOpen} tone="orange" /></div>
    <div className="analytics-grid"><section className="panel analytics-chart-panel"><div className="panel-heading"><div><h3>คะแนน Quiz ย้อนหลัง</h3><p>แสดง 8 ครั้งล่าสุดที่บันทึกไว้</p></div><Activity size={18} className="muted-icon" /></div>{loading ? <div className="inline-loading"><LoaderCircle size={19} className="spin" /></div> : chartValues.length ? <div className="bar-chart"><div className="chart-guides"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-area"><div className="chart-lines"><i /><i /><i /><i /><i /></div><div className="chart-bars">{chartValues.map((a, i) => { const percent = a.total ? Math.round(a.score / a.total * 100) : 0; return <div className="chart-bar-col" key={a.id}><div className="chart-value-label">{percent}%</div><div className="chart-bar" style={{ height: `${percent}%` }} title={`${a.topic}: ${percent}%`} /><small>{formatDate(a.created_at, { day: 'numeric', month: 'short' })}</small></div>; })}</div></div></div> : <EmptyState icon={Activity} title="ยังไม่มีข้อมูลคะแนน" description="ทำ Quick Quiz แล้วระบบจะบันทึกคะแนนเพื่อแสดงพัฒนาการในหน้านี้" action={<a className="text-link" href="/app/quiz">ไปทำ Quick Quiz <ArrowRight size={14} /></a>} />}</section>
      <section className="panel weak-topics-panel"><div className="panel-heading"><div><h3>หัวข้อที่ควรทบทวน</h3><p>จากคำตอบที่ผิดใน Quiz</p></div><BrainCircuit size={19} className="muted-icon" /></div>{weakTopics.length ? <div className="weak-topic-list">{weakTopics.map((t,i) => <div className="weak-topic" key={t}><span>{String(i + 1).padStart(2, '0')}</span><b>{t}</b><span className="weak-topic-label">ทบทวนอีกครั้ง</span></div>)}</div> : <EmptyState icon={BookOpenCheck} title="ยังไม่มีหัวข้อที่ต้องทบทวน" description="หลังทำแบบทดสอบ ระบบจะรวบรวมหัวข้อที่คุณตอบผิดไว้ให้" />}</section></div>
    <section className="panel all-attempts-panel"><div className="panel-heading"><div><h3>ประวัติการทำ Quiz</h3><p>ผลการทำแบบทดสอบที่บันทึกไว้</p></div><span className="count-pill">{attempts.length} ครั้ง</span></div>{attempts.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>หัวข้อ</th><th>วันที่</th><th>คะแนน</th><th>ผลลัพธ์</th></tr></thead><tbody>{attempts.map(a => { const p = a.total ? Math.round(a.score / a.total * 100) : 0; return <tr key={a.id}><td><strong>{a.topic}</strong></td><td>{formatDateTime(a.created_at)}</td><td>{a.score}/{a.total}</td><td><span className={`result-pill ${p >= 80 ? 'result-good' : p >= 50 ? 'result-mid' : 'result-low'}`}>{p}%</span></td></tr>; })}</tbody></table></div> : <p className="muted small-copy">ยังไม่มีประวัติการสอบ</p>}</section>
  </>;
}

function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth(); const [name, setName] = useState(profile?.display_name || ''); const [busy, setBusy] = useState(false); const [toast, setToast] = useState(null);
  useEffect(() => setName(profile?.display_name || ''), [profile?.display_name]);
  async function submit(event) { event.preventDefault(); if (!name.trim()) return setToast({ kind: 'error', message: 'กรุณากรอกชื่อที่ใช้แสดง' }); setBusy(true); const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', user.id); setBusy(false); if (error) setToast({ kind: 'error', message: 'บันทึกข้อมูลไม่สำเร็จ' }); else { await refreshProfile(); setToast({ kind: 'success', message: 'บันทึกข้อมูลโปรไฟล์แล้ว' }); } }
  async function sendReset() { setToast(null); const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/reset-password` }); setToast(error ? { kind: 'error', message: 'ส่งอีเมลเปลี่ยนรหัสผ่านไม่สำเร็จ' } : { kind: 'success', message: 'หากตั้งค่าอีเมลไว้แล้ว ลิงก์เปลี่ยนรหัสผ่านจะถูกส่งให้คุณ' }); }
  return <><PageHeader eyebrow="PREFERENCES" title="ตั้งค่าบัญชี" description="จัดการข้อมูลโปรไฟล์และความปลอดภัยของบัญชี" />{toast && <Toast toast={toast} onClose={() => setToast(null)} />}<div className="settings-layout"><section className="panel settings-panel"><div className="panel-heading"><div><h3>โปรไฟล์ของฉัน</h3><p>ข้อมูลที่ใช้แสดงบน Buddy AI</p></div><User size={19} className="muted-icon" /></div><form className="settings-form" onSubmit={submit}><div className="profile-preview"><div className="avatar avatar-large">{initials(name || user.email)}</div><div><b>{name || 'ผู้ใช้งาน'}</b><small>{user.email}</small><span className="role-chip">{profile.role === 'admin' ? 'Administrator' : 'Student'}</span></div></div><Field label="ชื่อที่ใช้แสดง" value={name} onChange={e => setName(e.target.value)} maxLength={80} required /><Field label="อีเมลบัญชี"><input value={user.email || ''} readOnly /><span className="field-hint">อีเมลจัดการผ่านระบบ Authentication</span></Field><div className="form-actions"><Button type="submit" loading={busy}><Check size={16} /> บันทึกการเปลี่ยนแปลง</Button></div></form></section><section className="panel settings-panel"><div className="panel-heading"><div><h3>ความปลอดภัย</h3><p>ดูแลการเข้าถึงบัญชีของคุณ</p></div><ShieldCheck size={19} className="muted-icon" /></div><div className="security-row"><div className="security-icon"><Mail size={18} /></div><div><b>เข้าสู่ระบบด้วยอีเมล</b><small>{user.email}</small></div><span className={`status-pill ${user.email_confirmed_at ? 'status-active' : 'status-pending'}`}>{user.email_confirmed_at ? 'ยืนยันแล้ว' : 'รอยืนยัน'}</span></div><div className="security-row"><div className="security-icon"><KeyRound size={18} /></div><div><b>เปลี่ยนรหัสผ่าน</b><small>ส่งลิงก์สำหรับสร้างรหัสผ่านใหม่</small></div><Button size="sm" variant="secondary" onClick={sendReset}>ส่งลิงก์</Button></div><div className="security-warning"><ShieldCheck size={17} /><p>ห้ามแชร์รหัสผ่านหรือข้อมูลเข้าสู่ระบบกับผู้อื่น ผู้ดูแลระบบจะไม่สามารถดูรหัสผ่านของคุณได้</p></div></section></div></>;
}

function AdminOverviewPage() {
  const [counts, setCounts] = useState({ users: 0, students: 0, admins: 0, courses: 0, contents: 0, quizzes: 0 }); const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); const [p,roles,c,m,q] = await Promise.all([supabase.from('profiles').select('id,display_name,email,role,is_active,created_at').order('created_at', { ascending: false }).limit(5), supabase.from('profiles').select('role,is_active'), supabase.from('courses').select('id', { count: 'exact', head: true }), supabase.from('learning_contents').select('id', { count: 'exact', head: true }), supabase.from('quiz_templates').select('id', { count: 'exact', head: true })]); if (p.error || roles.error) setError('อ่านข้อมูลผู้ใช้ไม่ได้ กรุณาตรวจสอบสิทธิ์ Admin และ RLS'); setUsers(p.data || []); setCounts({ users: roles.data?.length || 0, students: (roles.data || []).filter(x => x.role === 'student').length, admins: (roles.data || []).filter(x => x.role === 'admin').length, courses: c.count || 0, contents: m.count || 0, quizzes: q.count || 0 }); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);
  return <><PageHeader eyebrow="SYSTEM OVERVIEW" title="ภาพรวมระบบ" description="ติดตามผู้ใช้ เนื้อหาการเรียน และทรัพยากรส่วนกลางของ Buddy AI" action={<Button variant="secondary" onClick={load}><RefreshCw size={15} /> รีเฟรช</Button>} />{error && <Notice kind="error">{error}</Notice>}
    <div className="admin-welcome"><div><div className="eyebrow"><ShieldCheck size={13} /> ADMIN CONSOLE</div><h2>ดูแลระบบการเรียนได้จากที่เดียว</h2><p>จัดการบัญชี รายวิชา และเนื้อหาส่วนกลาง พร้อมตรวจสอบการเปลี่ยนแปลงที่สำคัญ</p></div><div className="admin-welcome-icon"><Command size={36} /></div></div>
    <div className="section-heading section-heading-spaced"><div><h2>สถานะระบบ</h2><p>นับจากข้อมูลที่อ่านได้ในขณะนี้</p></div><span className="live-label"><span /> Connected to database</span></div>
    <div className="stats-grid admin-stats"><StatCard title="บัญชีที่แสดงในรายการล่าสุด" value={loading ? '—' : counts.users} detail="แสดง 5 บัญชีล่าสุด" icon={Users} tone="violet" /><StatCard title="รายวิชาทั้งหมด" value={loading ? '—' : counts.courses} detail="รายวิชาส่วนตัวและส่วนกลาง" icon={BookOpen} tone="blue" /><StatCard title="เนื้อหาส่วนกลาง" value={loading ? '—' : counts.contents} detail="บทเรียนที่จัดการโดย Admin" icon={FileText} tone="orange" /><StatCard title="ชุดแบบทดสอบ" value={loading ? '—' : counts.quizzes} detail="คลัง Quiz ส่วนกลาง" icon={ClipboardList} tone="green" /></div>
    <div className="admin-overview-grid"><section className="panel admin-recent-users"><div className="panel-heading"><div><h3>ผู้ใช้ล่าสุด</h3><p>บัญชีที่สมัครใหม่</p></div><button className="text-link plain" onClick={() => window.location.href = '/admin/users'}>จัดการผู้ใช้ <ArrowRight size={14} /></button></div>{loading ? <div className="inline-loading"><LoaderCircle size={18} className="spin" /></div> : users.length ? <div className="admin-recent-list">{users.map(u => <div className="admin-user-row" key={u.id}><div className={`avatar ${u.role === 'admin' ? 'avatar-admin' : ''}`}>{initials(u.display_name || u.email)}</div><div className="admin-user-row-copy"><b>{u.display_name || 'ไม่ระบุชื่อ'}</b><small>{u.email}</small></div><span className={`role-chip ${u.role === 'admin' ? 'role-admin' : ''}`}>{u.role === 'admin' ? 'Admin' : 'Student'}</span><span className={`status-dot-label ${u.is_active ? 'user-active' : 'user-inactive'}`}>{u.is_active ? 'ใช้งาน' : 'ระงับ'}</span></div>)}</div> : <EmptyState icon={Users} title="ยังไม่มีบัญชีผู้ใช้" description="เมื่อมีผู้สมัครสมาชิก รายชื่อจะปรากฏที่นี่" />}</section>
      <section className="panel admin-shortcuts"><div className="panel-heading"><div><h3>ทางลัดสำหรับ Admin</h3><p>งานจัดการที่ทำบ่อย</p></div><Settings className="muted-icon" size={18} /></div><button className="admin-shortcut" onClick={() => window.location.href = '/admin/users'}><div className="admin-shortcut-icon shortcut-violet"><Users size={17} /></div><div><b>จัดการผู้ใช้</b><small>ค้นหา เปลี่ยนบทบาท และระงับบัญชี</small></div><ChevronRight size={16} /></button><button className="admin-shortcut" onClick={() => window.location.href = '/admin/content'}><div className="admin-shortcut-icon shortcut-blue"><FileText size={17} /></div><div><b>เพิ่มเนื้อหาการเรียน</b><small>เผยแพร่บทเรียนส่วนกลาง</small></div><ChevronRight size={16} /></button><button className="admin-shortcut" onClick={() => window.location.href = '/admin/audit'}><div className="admin-shortcut-icon shortcut-orange"><ShieldCheck size={17} /></div><div><b>ตรวจสอบกิจกรรม</b><small>ดูบันทึกการจัดการสำคัญ</small></div><ChevronRight size={16} /></button></section></div>
  </>;
}

function AdminUsersPage() {
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [roleFilter, setRoleFilter] = useState('all'); const [toast, setToast] = useState(null); const [workingId, setWorkingId] = useState('');
  const load = useCallback(async () => { setLoading(true); const { data, error } = await supabase.from('profiles').select('id,display_name,email,role,is_active,created_at').order('created_at', { ascending: false }); if (error) setToast({ kind: 'error', message: 'โหลดผู้ใช้ไม่สำเร็จ ตรวจสอบนโยบาย RLS' }); setUsers(data || []); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);
  const filtered = users.filter(u => (roleFilter === 'all' || u.role === roleFilter) && `${u.display_name || ''} ${u.email || ''}`.toLowerCase().includes(search.toLowerCase()));
  async function changeRole(user, role) { if (!window.confirm(`เปลี่ยนบทบาท ${user.email} เป็น ${role === 'admin' ? 'Admin' : 'Student'} หรือไม่?`)) return; setWorkingId(user.id); const { error } = await supabase.rpc('admin_set_user_role', { p_user_id: user.id, p_role: role }); setWorkingId(''); if (error) setToast({ kind: 'error', message: 'เปลี่ยนบทบาทไม่สำเร็จ: ตรวจสอบสิทธิ์หรือเงื่อนไข Admin คนสุดท้าย' }); else { setToast({ kind: 'success', message: 'เปลี่ยนบทบาทเรียบร้อย' }); load(); } }
  async function toggleActive(user) { const next = !user.is_active; if (!window.confirm(`${next ? 'เปิดใช้งาน' : 'ระงับ'}บัญชี ${user.email}?`)) return; setWorkingId(user.id); const { error } = await supabase.rpc('admin_set_user_active', { p_user_id: user.id, p_is_active: next }); setWorkingId(''); if (error) setToast({ kind: 'error', message: 'เปลี่ยนสถานะบัญชีไม่สำเร็จ' }); else { setToast({ kind: 'success', message: next ? 'เปิดใช้งานบัญชีแล้ว' : 'ระงับบัญชีแล้ว' }); load(); } }
  return <><PageHeader eyebrow="USER DIRECTORY" title="จัดการผู้ใช้" description="ตรวจสอบบทบาทและสถานะบัญชี โดยไม่สามารถดูรหัสผ่านของผู้ใช้ได้" action={<Button variant="secondary" onClick={load}><RefreshCw size={15} /> รีเฟรช</Button>} />{toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    <div className="stats-grid user-stats"><StatCard title="บัญชีทั้งหมด" value={users.length} detail="ข้อมูลที่อ่านได้จากฐานข้อมูล" icon={Users} tone="violet" /><StatCard title="นักศึกษา" value={users.filter(u => u.role === 'student').length} detail="Student role" icon={GraduationCap} tone="blue" /><StatCard title="ผู้ดูแลระบบ" value={users.filter(u => u.role === 'admin').length} detail="Admin role" icon={ShieldCheck} tone="orange" /><StatCard title="บัญชีที่เปิดใช้งาน" value={users.filter(u => u.is_active).length} detail="is_active = true" icon={CheckCircle2} tone="green" /></div>
    <section className="panel user-table-panel"><div className="panel-heading"><div><h3>รายชื่อบัญชี</h3><p>แสดง {filtered.length} จาก {users.length} บัญชี</p></div><span className="count-pill">USER MANAGEMENT</span></div><div className="table-toolbar"><div className="search-field"><Search size={16} /><input placeholder="ค้นหาชื่อหรืออีเมล…" value={search} onChange={e => setSearch(e.target.value)} /></div><select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}><option value="all">ทุกบทบาท</option><option value="student">Student</option><option value="admin">Admin</option></select></div>
      {loading ? <div className="inline-loading"><LoaderCircle size={20} className="spin" /> กำลังโหลดผู้ใช้…</div> : filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>ผู้ใช้</th><th>บทบาท</th><th>วันที่สมัคร</th><th>สถานะ</th><th>การจัดการ</th></tr></thead><tbody>{filtered.map(u => <tr key={u.id}><td><div className="table-user"><div className={`avatar avatar-small ${u.role === 'admin' ? 'avatar-admin' : ''}`}>{initials(u.display_name || u.email)}</div><div><strong>{u.display_name || 'ไม่ระบุชื่อ'}</strong><small>{u.email}</small></div></div></td><td><span className={`role-chip ${u.role === 'admin' ? 'role-admin' : ''}`}>{u.role === 'admin' ? 'Admin' : 'Student'}</span></td><td>{formatDate(u.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</td><td><span className={`status-pill ${u.is_active ? 'status-active' : 'status-suspended'}`}>{u.is_active ? 'ใช้งานอยู่' : 'ถูกระงับ'}</span></td><td><div className="table-actions"><select aria-label="เปลี่ยนบทบาท" value={u.role} disabled={workingId === u.id} onChange={e => changeRole(u, e.target.value)}><option value="student">Student</option><option value="admin">Admin</option></select><Button size="sm" variant={u.is_active ? 'danger-quiet' : 'secondary'} disabled={workingId === u.id} onClick={() => toggleActive(u)}>{workingId === u.id ? <LoaderCircle size={14} className="spin" /> : u.is_active ? 'ระงับ' : 'เปิดใช้'}</Button></div></td></tr>)}</tbody></table></div> : <EmptyState icon={Search} title="ไม่พบผู้ใช้ที่ค้นหา" description="ลองเปลี่ยนคำค้นหาหรือเงื่อนไขตัวกรอง" />}
      <div className="table-security-note"><ShieldCheck size={15} /> บทบาทและสถานะเปลี่ยนผ่านฟังก์ชัน SQL ที่ตรวจสอบสิทธิ์ Admin ฝั่งฐานข้อมูล</div>
    </section>
  </>;
}

function AdminCoursesPage() {
  const [courses, setCourses] = useState([]); const [loading, setLoading] = useState(true); const [showForm, setShowForm] = useState(false); const [name, setName] = useState(''); const [code, setCode] = useState(''); const [description, setDescription] = useState(''); const [busy, setBusy] = useState(false); const [toast, setToast] = useState(null);
  const load = useCallback(async () => { setLoading(true); const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false }); if (error) setToast({ kind: 'error', message: 'โหลดรายวิชาไม่สำเร็จ' }); setCourses(data || []); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);
  async function submit(event) { event.preventDefault(); setBusy(true); const { error } = await supabase.from('courses').insert({ user_id: null, name: name.trim(), code: code.trim() || null, description: description.trim(), color: 'blue', is_public: true }); setBusy(false); if (error) setToast({ kind: 'error', message: 'เพิ่มรายวิชาส่วนกลางไม่สำเร็จ' }); else { setName(''); setCode(''); setDescription(''); setShowForm(false); setToast({ kind: 'success', message: 'เผยแพร่รายวิชาส่วนกลางแล้ว' }); load(); } }
  async function remove(c) { if (!window.confirm(`ลบรายวิชาส่วนกลาง “${c.name}” หรือไม่?`)) return; const { error } = await supabase.from('courses').delete().eq('id', c.id); if (error) setToast({ kind: 'error', message: 'ลบรายวิชาไม่สำเร็จ' }); else { setToast({ kind: 'success', message: 'ลบรายวิชาแล้ว' }); load(); } }
  return <><PageHeader eyebrow="COURSE CATALOG" title="จัดการรายวิชา" description="จัดการรายวิชาส่วนกลางที่ผู้ใช้สามารถเพิ่มเข้าแผนการเรียนได้" action={<Button onClick={() => setShowForm(v => !v)}><Plus size={16} /> เพิ่มรายวิชากลาง</Button>} />{toast && <Toast toast={toast} onClose={() => setToast(null)} />}{showForm && <section className="panel form-panel"><div className="panel-heading"><div><h3>เพิ่มรายวิชาส่วนกลาง</h3><p>รายการนี้จะเผยแพร่ให้ผู้ใช้ที่มีสิทธิ์เห็นได้</p></div><button className="icon-btn" onClick={() => setShowForm(false)}><X size={17} /></button></div><form className="form-grid" onSubmit={submit}><Field className="span-two" label="ชื่อรายวิชา" value={name} onChange={e => setName(e.target.value)} required placeholder="เช่น พื้นฐานการเขียนโปรแกรม" /><Field label="รหัสวิชา" value={code} onChange={e => setCode(e.target.value)} placeholder="CS101" /><Field className="span-two" label="รายละเอียด"><textarea rows="2" value={description} onChange={e => setDescription(e.target.value)} placeholder="คำอธิบายรายวิชา" /></Field><div className="form-actions span-two"><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>ยกเลิก</Button><Button type="submit" loading={busy}>เผยแพร่รายวิชา</Button></div></form></section>}
    <section className="panel"><div className="panel-heading"><div><h3>รายวิชาในระบบ</h3><p>{courses.length} รายวิชา</p></div><BookOpen className="muted-icon" size={18} /></div>{loading ? <div className="inline-loading"><LoaderCircle size={20} className="spin" /></div> : courses.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>รายวิชา</th><th>รหัส</th><th>ประเภท</th><th>เพิ่มเมื่อ</th><th>การจัดการ</th></tr></thead><tbody>{courses.map(c => <tr key={c.id}><td><div className="table-primary"><div className={`mini-course-icon course-color-${c.color || 'violet'}`}><BookOpen size={15} /></div><div><strong>{c.name}</strong><small>{c.description || (c.user_id ? 'รายวิชาส่วนตัว' : 'รายวิชาส่วนกลาง')}</small></div></div></td><td>{c.code || '—'}</td><td><span className={`type-chip ${c.is_public ? 'type-blue' : 'type-gray'}`}>{c.is_public ? 'ส่วนกลาง' : 'ส่วนตัว'}</span></td><td>{formatDate(c.created_at)}</td><td>{c.is_public ? <Button size="sm" variant="danger-quiet" onClick={() => remove(c)}><Trash2 size={14} /> ลบ</Button> : <span className="muted small-copy">จัดการโดยเจ้าของ</span>}</td></tr>)}</tbody></table></div> : <EmptyState icon={BookOpen} title="ยังไม่มีรายวิชา" description="เพิ่มรายวิชาส่วนกลางเพื่อให้ผู้ใช้เริ่มต้นได้ง่ายขึ้น" />}</section>
  </>;
}

function AdminContentPage() {
  const { user } = useAuth(); const [items, setItems] = useState([]); const [courses, setCourses] = useState([]); const [loading, setLoading] = useState(true); const [showForm, setShowForm] = useState(false); const [editId, setEditId] = useState(null); const [title, setTitle] = useState(''); const [content, setContent] = useState(''); const [courseId, setCourseId] = useState(''); const [published, setPublished] = useState(false); const [busy, setBusy] = useState(false); const [toast, setToast] = useState(null); const [search, setSearch] = useState('');
  const load = useCallback(async () => { setLoading(true); const [c, m] = await Promise.all([supabase.from('courses').select('id,name').order('name'), supabase.from('learning_contents').select('*').order('created_at', { ascending: false })]); if (m.error) setToast({ kind: 'error', message: 'โหลดเนื้อหาไม่สำเร็จ' }); setCourses(c.data || []); setItems(m.data || []); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);
  function startEdit(item) { setEditId(item.id); setTitle(item.title); setContent(item.content); setCourseId(item.course_id || ''); setPublished(item.is_published); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function clearForm() { setEditId(null); setTitle(''); setContent(''); setCourseId(''); setPublished(false); setShowForm(false); }
  async function submit(event) { event.preventDefault(); if (!title.trim() || !content.trim()) return; setBusy(true); const payload = { title: title.trim(), content: content.trim(), course_id: courseId || null, is_published: published, created_by: user.id }; const result = editId ? await supabase.from('learning_contents').update({ title: payload.title, content: payload.content, course_id: payload.course_id, is_published: payload.is_published }).eq('id', editId) : await supabase.from('learning_contents').insert(payload); setBusy(false); if (result.error) setToast({ kind: 'error', message: 'บันทึกเนื้อหาไม่สำเร็จ' }); else { setToast({ kind: 'success', message: editId ? 'แก้ไขเนื้อหาแล้ว' : 'เพิ่มเนื้อหาแล้ว' }); clearForm(); load(); } }
  async function remove(item) { if (!window.confirm(`ลบเนื้อหา “${item.title}” หรือไม่?`)) return; const { error } = await supabase.from('learning_contents').delete().eq('id', item.id); if (error) setToast({ kind: 'error', message: 'ลบเนื้อหาไม่สำเร็จ' }); else { setToast({ kind: 'success', message: 'ลบเนื้อหาแล้ว' }); load(); } }
  async function togglePublish(item) { const { error } = await supabase.from('learning_contents').update({ is_published: !item.is_published }).eq('id', item.id); if (error) setToast({ kind: 'error', message: 'เปลี่ยนสถานะเผยแพร่ไม่สำเร็จ' }); else load(); }
  const filtered = items.filter(i => `${i.title} ${i.content}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageHeader eyebrow="LEARNING LIBRARY" title="เนื้อหาส่วนกลาง" description="สร้าง จัดระเบียบ และเผยแพร่บทเรียนที่นักศึกษาสามารถนำไปทบทวนได้" action={<Button onClick={() => { clearForm(); setShowForm(true); }}><Plus size={16} /> เพิ่มเนื้อหา</Button>} />{toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    {showForm && <section className="panel form-panel"><div className="panel-heading"><div><h3>{editId ? 'แก้ไขเนื้อหา' : 'เพิ่มเนื้อหาใหม่'}</h3><p>ยังไม่เผยแพร่จนกว่าจะเปิดสวิตช์เผยแพร่</p></div><button className="icon-btn" onClick={clearForm}><X size={18} /></button></div><form className="form-grid" onSubmit={submit}><Field className="span-two" label="ชื่อบทเรียน" placeholder="เช่น พื้นฐานตัวแปรในภาษา C++" value={title} onChange={e => setTitle(e.target.value)} required /><Field label="รายวิชา"><select value={courseId} onChange={e => setCourseId(e.target.value)}><option value="">ไม่ระบุรายวิชา</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><div className="field"><span className="field-label">การเผยแพร่</span><label className="toggle-label"><input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} /><span className="toggle-ui" /><span>{published ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}</span></label></div><Field className="span-two" label="เนื้อหาบทเรียน"><textarea rows="8" value={content} onChange={e => setContent(e.target.value)} required placeholder="เนื้อหาบทเรียนหรือข้อความสำหรับทบทวน…" /></Field><div className="form-actions span-two"><Button type="button" variant="secondary" onClick={clearForm}>ยกเลิก</Button><Button type="submit" loading={busy}><Check size={15} /> บันทึกเนื้อหา</Button></div></form></section>}
    <section className="panel admin-content-list"><div className="panel-heading"><div><h3>รายการเนื้อหา</h3><p>{filtered.length} รายการ</p></div><div className="search-field"><Search size={15} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาเนื้อหา…" /></div></div>{loading ? <div className="inline-loading"><LoaderCircle size={19} className="spin" /></div> : filtered.length ? <div className="admin-content-cards">{filtered.map(item => <article className="admin-content-card" key={item.id}><div className="content-card-head"><div className="content-file-icon"><FileText size={19} /></div><span className={`status-pill ${item.is_published ? 'status-active' : 'status-pending'}`}>{item.is_published ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}</span></div><h3>{item.title}</h3><p>{item.content.slice(0, 150)}{item.content.length > 150 ? '…' : ''}</p><div className="content-card-meta"><span>{formatDate(item.created_at)}</span><span>{item.content.length.toLocaleString()} ตัวอักษร</span></div><div className="content-card-actions"><Button size="sm" variant="secondary" onClick={() => startEdit(item)}><Pencil size={14} /> แก้ไข</Button><Button size="sm" variant="secondary" onClick={() => togglePublish(item)}>{item.is_published ? 'ยกเลิกเผยแพร่' : 'เผยแพร่'}</Button><button className="icon-btn danger-hover" onClick={() => remove(item)} aria-label="ลบเนื้อหา"><Trash2 size={15} /></button></div></article>)}</div> : <EmptyState icon={FileText} title="ยังไม่มีเนื้อหาส่วนกลาง" description="เพิ่มบทเรียนที่ผ่านการตรวจสอบ แล้วเลือกเผยแพร่เมื่อต้องการให้ผู้เรียนมองเห็น" />}</section>
  </>;
}

function AdminQuizzesPage() {
  const { user } = useAuth(); const [items, setItems] = useState([]); const [courses, setCourses] = useState([]); const [loading, setLoading] = useState(true); const [showForm, setShowForm] = useState(false); const [title, setTitle] = useState(''); const [courseId, setCourseId] = useState(''); const [raw, setRaw] = useState('[\n  {\n    "question": "ตัวอย่างคำถามคืออะไร?",\n    "options": ["ตัวเลือก A", "ตัวเลือก B", "ตัวเลือก C", "ตัวเลือก D"],\n    "answerIndex": 0,\n    "explanation": "คำอธิบายคำตอบ",\n    "topic": "หัวข้อตัวอย่าง"\n  }\n]'); const [published, setPublished] = useState(false); const [busy, setBusy] = useState(false); const [toast, setToast] = useState(null);
  const load = useCallback(async () => { setLoading(true); const [q,c] = await Promise.all([supabase.from('quiz_templates').select('*').order('created_at', { ascending: false }), supabase.from('courses').select('id,name').order('name')]); setItems(q.data || []); setCourses(c.data || []); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);
  async function submit(event) { event.preventDefault(); setToast(null); let parsed; try { parsed = JSON.parse(raw); if (!Array.isArray(parsed) || !parsed.length || parsed.some(q => !q.question || !Array.isArray(q.options) || q.options.length < 2 || !Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.options.length)) throw new Error(); } catch { setToast({ kind: 'error', message: 'JSON ไม่ถูกต้อง หรือคำถาม/ตัวเลือก/answerIndex ไม่ครบ' }); return; } setBusy(true); const { error } = await supabase.from('quiz_templates').insert({ title: title.trim(), course_id: courseId || null, questions: parsed, is_published: published, created_by: user.id }); setBusy(false); if (error) setToast({ kind: 'error', message: 'บันทึกชุดแบบทดสอบไม่สำเร็จ' }); else { setToast({ kind: 'success', message: 'บันทึกชุดแบบทดสอบแล้ว' }); setTitle(''); setShowForm(false); load(); } }
  async function toggle(item) { const { error } = await supabase.from('quiz_templates').update({ is_published: !item.is_published }).eq('id', item.id); if (error) setToast({ kind: 'error', message: 'เปลี่ยนสถานะไม่สำเร็จ' }); else load(); }
  async function remove(item) { if (!window.confirm(`ลบชุดแบบทดสอบ “${item.title}” หรือไม่?`)) return; const { error } = await supabase.from('quiz_templates').delete().eq('id', item.id); if (error) setToast({ kind: 'error', message: 'ลบชุดแบบทดสอบไม่สำเร็จ' }); else load(); }
  return <><PageHeader eyebrow="QUIZ LIBRARY" title="คลังแบบทดสอบ" description="จัดการชุดแบบทดสอบส่วนกลางที่ผ่านการตรวจสอบก่อนเผยแพร่" action={<Button onClick={() => setShowForm(v => !v)}><Plus size={16} /> สร้างชุด Quiz</Button>} />{toast && <Toast toast={toast} onClose={() => setToast(null)} />}{showForm && <section className="panel form-panel"><div className="panel-heading"><div><h3>สร้างชุดแบบทดสอบส่วนกลาง</h3><p>ใช้ JSON ที่ตรวจสอบรูปแบบแล้วเพื่อเก็บคำถามและเฉลย</p></div><button className="icon-btn" onClick={() => setShowForm(false)}><X size={18} /></button></div><form className="form-grid" onSubmit={submit}><Field className="span-two" label="ชื่อชุดแบบทดสอบ" value={title} onChange={e => setTitle(e.target.value)} placeholder="เช่น C++ — พื้นฐานบทที่ 1" required /><Field label="รายวิชา"><select value={courseId} onChange={e => setCourseId(e.target.value)}><option value="">ไม่ระบุรายวิชา</option>{courses.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></Field><div className="field"><span className="field-label">การเผยแพร่</span><label className="toggle-label"><input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} /><span className="toggle-ui" /><span>{published ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}</span></label></div><Field className="span-two" label="คำถาม (JSON)" hint="answerIndex เริ่มนับจาก 0 เช่น 0 คือช้อยส์แรก"><textarea rows="12" className="code-textarea" value={raw} onChange={e => setRaw(e.target.value)} /></Field><div className="form-actions span-two"><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>ยกเลิก</Button><Button type="submit" loading={busy}>บันทึกชุด Quiz</Button></div></form></section>}
    <section className="panel"><div className="panel-heading"><div><h3>ชุดแบบทดสอบ</h3><p>{items.length} ชุด</p></div><ClipboardList className="muted-icon" size={18} /></div>{loading ? <div className="inline-loading"><LoaderCircle size={19} className="spin" /></div> : items.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>ชื่อชุด</th><th>จำนวนข้อ</th><th>สถานะ</th><th>สร้างเมื่อ</th><th>การจัดการ</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.title}</strong></td><td>{Array.isArray(item.questions) ? item.questions.length : 0} ข้อ</td><td><span className={`status-pill ${item.is_published ? 'status-active' : 'status-pending'}`}>{item.is_published ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}</span></td><td>{formatDate(item.created_at)}</td><td><div className="table-actions"><Button size="sm" variant="secondary" onClick={() => toggle(item)}>{item.is_published ? 'ยกเลิกเผยแพร่' : 'เผยแพร่'}</Button><button className="icon-btn danger-hover" onClick={() => remove(item)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState icon={ClipboardList} title="ยังไม่มีชุด Quiz" description="สร้างข้อสอบส่วนกลางและตรวจสอบเฉลยก่อนเปิดเผยแพร่" />}</section>
    <div className="info-strip"><div className="info-strip-icon"><AlertCircle size={18} /></div><div><b>ตรวจสอบเนื้อหาก่อนเผยแพร่</b><p>ตรวจสอบเฉลย ตัวเลือก และความสอดคล้องกับบทเรียนทุกครั้ง ชุด Quiz กลางนี้แยกจากการทำ Quick Quiz ส่วนตัวของนักศึกษา</p></div></div>
  </>;
}

function AdminAuditPage() {
  const [logs, setLogs] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); const { data, error: e } = await supabase.from('audit_logs').select('id,actor_id,action,target_type,target_id,details,created_at').order('created_at', { ascending: false }).limit(100); setLogs(data || []); setError(e ? 'ไม่สามารถอ่าน Audit Logs ได้ กรุณาตรวจสอบ schema และสิทธิ์' : ''); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);
  return <><PageHeader eyebrow="SECURITY & ACCOUNTABILITY" title="บันทึกกิจกรรม" description="ตรวจสอบการเปลี่ยนบทบาทและสถานะบัญชีที่บันทึกจากฐานข้อมูล" action={<Button variant="secondary" onClick={load}><RefreshCw size={15} /> รีเฟรช</Button>} />{error && <Notice kind="error">{error}</Notice>}<section className="panel"><div className="panel-heading"><div><h3>Audit Log</h3><p>แสดง 100 รายการล่าสุดตามสิทธิ์ที่กำหนด</p></div><ShieldCheck size={19} className="muted-icon" /></div>{loading ? <div className="inline-loading"><LoaderCircle size={19} className="spin" /></div> : logs.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>เวลา</th><th>กิจกรรม</th><th>ประเภทเป้าหมาย</th><th>รายละเอียด</th><th>Actor ID</th></tr></thead><tbody>{logs.map(log => <tr key={log.id}><td>{formatDateTime(log.created_at)}</td><td><span className="audit-action"><ShieldCheck size={14} /> {log.action}</span></td><td>{log.target_type || '—'}</td><td><code className="details-code">{JSON.stringify(log.details || {})}</code></td><td><span className="id-short">{String(log.actor_id || '').slice(0, 8) || '—'}</span></td></tr>)}</tbody></table></div> : <EmptyState icon={ShieldCheck} title="ยังไม่มีบันทึกกิจกรรม" description="การเปลี่ยนบทบาทหรือสถานะบัญชีผ่าน Admin RPC จะถูกบันทึกไว้ที่นี่" />}<div className="table-security-note"><LockKeyhole size={15} /> Audit Logs ไม่มีฟังก์ชันแก้ไขหรือลบย้อนหลังผ่านหน้าจอปกติ</div></section></>;
}

function AdminSettingsPage() {
  const { profile, user } = useAuth(); const [url, setUrl] = useState(import.meta.env.VITE_SUPABASE_URL || ''); const [apiStatus, setApiStatus] = useState('unknown'); const [checking, setChecking] = useState(false);
  async function checkApi() { setChecking(true); try { const response = await fetch(`${API_URL}/health`); const data = await response.json(); setApiStatus(data.status === 'ok' ? 'ok' : 'error'); } catch { setApiStatus('error'); } finally { setChecking(false); } }
  useEffect(() => { checkApi(); }, []);
  return <><PageHeader eyebrow="CONFIGURATION & ACCESS" title="ตั้งค่าระบบ" description="ตรวจสอบข้อมูลเชื่อมต่อและสถานะบริการ โดยไม่เปิดเผย Secret หรือ API Key" /><div className="settings-layout"><section className="panel settings-panel"><div className="panel-heading"><div><h3>สถานะบริการ</h3><p>สถานะที่ตรวจสอบได้จากเครื่องนี้</p></div><Activity size={18} className="muted-icon" /></div><div className="service-status-row"><div className="service-icon"><Code2 size={18} /></div><div><b>Supabase</b><small>Authentication & Database</small></div><span className={`status-pill ${isSupabaseConfigured ? 'status-active' : 'status-pending'}`}>{isSupabaseConfigured ? 'ตั้งค่า Client แล้ว' : 'ยังไม่ตั้งค่า'}</span></div><div className="service-status-row"><div className="service-icon"><Sparkles size={18} /></div><div><b>AI API Server</b><small>Endpoint สำหรับสรุปบทเรียนและสร้าง Quiz</small></div><span className={`status-pill ${apiStatus === 'ok' ? 'status-active' : apiStatus === 'error' ? 'status-suspended' : 'status-pending'}`}>{checking ? 'กำลังตรวจสอบ' : apiStatus === 'ok' ? 'ออนไลน์' : apiStatus === 'error' ? 'ไม่ตอบสนอง' : 'ยังไม่ทราบ'}</span></div><Button variant="secondary" onClick={checkApi} loading={checking}><RefreshCw size={15} /> ตรวจสอบบริการอีกครั้ง</Button></section><section className="panel settings-panel"><div className="panel-heading"><div><h3>ข้อมูลโปรเจกต์</h3><p>ข้อมูลทั่วไปที่ไม่ใช่ความลับ</p></div><Settings size={18} className="muted-icon" /></div><div className="system-detail-row"><span>ชื่อโปรเจกต์</span><b>Buddy AI</b></div><div className="system-detail-row"><span>Admin ที่เข้าสู่ระบบ</span><b>{profile?.display_name || user.email}</b></div><div className="system-detail-row"><span>อีเมลบัญชี</span><b>{user.email}</b></div><div className="system-detail-row"><span>Supabase URL</span><code>{url ? url.replace(/https?:\/\//, '') : 'ยังไม่ได้ตั้งค่า'}</code></div><div className="security-warning"><LockKeyhole size={17} /><p>ไม่แสดง Gemini/Anthropic API Key หรือ Supabase service_role key ในหน้าเว็บ ให้ตั้งค่าผ่าน environment ฝั่งเซิร์ฟเวอร์เท่านั้น</p></div></section></div><section className="panel deployment-panel"><div className="panel-heading"><div><h3>ก่อนนำขึ้นใช้งานจริง</h3><p>รายการตรวจสอบที่แนะนำ</p></div><CheckCheck size={18} className="muted-icon" /></div><div className="deployment-checks"><div><CheckCircle2 size={17} /><span>ตั้งค่า RLS ในตารางทั้งหมด</span></div><div><CheckCircle2 size={17} /><span>สร้าง Admin ด้วยขั้นตอน Provisioning ที่ปลอดภัย</span></div><div><CircleHelp size={17} /><span>ยืนยัน Email redirect URL ให้ตรงกับโดเมนจริง</span></div><div><CircleHelp size={17} /><span>ตั้งค่า HTTPS, CORS และ rate limit ตามโดเมนจริง</span></div><div><CircleHelp size={17} /><span>ตั้งค่าอีเมลสำหรับยืนยันบัญชีและกู้คืนรหัสผ่าน</span></div></div></section></>;
}

function AdminShell() { return <AppShell admin><Routes><Route index element={<AdminOverviewPage />} /><Route path="users" element={<AdminUsersPage />} /><Route path="courses" element={<AdminCoursesPage />} /><Route path="content" element={<AdminContentPage />} /><Route path="quizzes" element={<AdminQuizzesPage />} /><Route path="audit" element={<AdminAuditPage />} /><Route path="settings" element={<AdminSettingsPage />} /><Route path="*" element={<Navigate to="/admin" replace />} /></Routes></AppShell>; }
function StudentShell() { return <AppShell><Routes><Route index element={<DashboardPage />} /><Route path="planner" element={<PlannerPage />} /><Route path="courses" element={<CoursesPage />} /><Route path="summary" element={<SummaryPage />} /><Route path="quiz" element={<QuizPage />} /><Route path="progress" element={<ProgressPage />} /><Route path="settings" element={<SettingsPage />} /><Route path="*" element={<Navigate to="/app" replace />} /></Routes></AppShell>; }

function AppRoutes() {
  const { user, profile, loading } = useAuth();
  return <Routes>
    <Route path="/login" element={user && profile ? <Navigate to={profile.role === 'admin' ? '/admin' : '/app'} replace /> : <LoginPage />} />
    <Route path="/register" element={user && profile ? <Navigate to={profile.role === 'admin' ? '/admin' : '/app'} replace /> : <RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/" element={<RoleRedirect />} />
    <Route path="/app/*" element={<RequireAuth><StudentShell /></RequireAuth>} />
    <Route path="/admin/*" element={<RequireAuth admin><AdminShell /></RequireAuth>} />
    <Route path="*" element={<Navigate to={loading ? '/' : user ? '/' : '/login'} replace />} />
  </Routes>;
}

export default function App() {
  if (!isSupabaseConfigured) return <SetupScreen />;
  return <BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>;
}
