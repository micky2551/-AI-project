import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  const fetchProfile = useCallback(async (user) => {
    if (!supabase || !user) {
      setProfile(null);
      setLoading(false);
      return null;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) {
      setProfileError('โหลดข้อมูลบัญชีไม่สำเร็จ กรุณาตรวจสอบว่าได้ติดตั้งฐานข้อมูลตาม schema.sql แล้ว');
      setProfile(null);
      setLoading(false);
      return null;
    }
    if (data && data.is_active === false) {
      setProfile(data);
      setProfileError('บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
      await supabase.auth.signOut();
      setSession(null);
      setLoading(false);
      return null;
    }
    setProfile(data);
    setProfileError('');
    setLoading(false);
    return data;
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      if (data.session?.user) fetchProfile(data.session.user);
      else setLoading(false);
    }).catch(() => alive && setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!alive) return;
      setSession(nextSession);
      if (nextSession?.user) {
        // Avoid nested Supabase auth calls inside the auth event callback.
        window.setTimeout(() => alive && fetchProfile(nextSession.user), 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    profileError,
    refreshProfile: () => fetchProfile(session?.user),
  }), [session, profile, loading, profileError, fetchProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
