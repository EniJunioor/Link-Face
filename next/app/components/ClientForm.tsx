"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function useTokenFromUrl(): string {
  return useMemo(() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'l' && parts[1]) return parts[1]!;
    const q = url.searchParams.get('token');
    return q || '';
  }, []);
}

function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  const calc = (base: string) => {
    let s = 0; for (let i = 0; i < base.length; i++) s += parseInt(base[i]!, 10) * (base.length + 1 - i);
    const m = (s * 10) % 11; return m === 10 ? 0 : m;
  };
  const d1 = calc(digits.slice(0, 9));
  const d2 = calc(digits.slice(0, 10));
  return d1 === parseInt(digits[9]!, 10) && d2 === parseInt(digits[10]!, 10);
}

export default function ClientForm() {
  const token = useTokenFromUrl();
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle'|'loading'|'success'|'error'; msg?: string }>({ type: 'idle' });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<'camera'|'upload'>('camera');

  const enableCamera = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const isSecure = window.isSecureContext || window.location.hostname === 'localhost';
        if (!isSecure) {
          throw Object.assign(new Error('InsecureContext'), { name: 'InsecureContext' });
        }
      }
      const constraints: MediaStreamConstraints = { video: { facingMode: { ideal: 'user' } }, audio: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await (videoRef.current as HTMLVideoElement).play(); } catch {}
        streamRef.current = stream;
      }
    } catch (e: any) {
      const msg = e?.name === 'InsecureContext'
        ? 'Para usar a câmera pela rede, abra a página em HTTPS (ex.: túnel) ou use localhost.'
        : e?.name === 'NotAllowedError'
        ? 'Permissão negada para acessar a câmera. Verifique as permissões do navegador.'
        : e?.name === 'NotFoundError'
        ? 'Nenhuma câmera foi encontrada no dispositivo.'
        : 'Não foi possível acessar a câmera. Em celulares, use HTTPS ou localhost.';
      setStatus({ type: 'error', msg });
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth, h = video.videoHeight;
    if (!w || !h) return;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPhotoDataUrl(dataUrl);
  }, []);

  const onPickFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const canSubmit = name.trim().length > 3 && isValidCpf(cpf) && !!photoDataUrl && consentAccepted;

  const submit = useCallback(async () => {
    setStatus({ type: 'loading' });
    try {
      const resp = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token || undefined, name: name.trim(), cpf: cpf.replace(/\D/g, ''), photoDataUrl, consentAccepted })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) throw new Error(json.error || 'Falha no envio');
      setStatus({ type: 'success', msg: 'Dados enviados com sucesso!' });
    } catch (e: any) {
      setStatus({ type: 'error', msg: e?.message || 'Erro ao enviar' });
    }
  }, [token, name, cpf, photoDataUrl, consentAccepted]);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Link-Face</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Verificação segura</div>
        </div>
      </header>
      <main className="main">
        <div className="form-wrap">
          <div className="card">
            <h1 style={{ margin: 0, fontSize: 22 }}>Confirmação de identidade</h1>
            <p style={{ margin: '8px 0 0', color: '#6b7280' }}>Preencha seus dados e envie uma foto nítida.</p>
            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, marginBottom: 6 }}>Nome completo</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Maria Silva" style={{ width: '100%', padding: '11px 12px', border: '1px solid #d0d0d5', borderRadius: 10, fontSize: 16 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 14, marginBottom: 6 }}>CPF</label>
                  <input value={cpf} onChange={(e) => setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="00000000000" inputMode="numeric" style={{ width: '100%', padding: '11px 12px', border: '1px solid #d0d0d5', borderRadius: 10, fontSize: 16 }} />
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Apenas números; validamos automaticamente.</div>
                </div>
              </div>
              <div>
                <div className="tabs">
                  <button onClick={() => setMode('camera')} className={`tab ${mode === 'camera' ? 'tab-active' : ''}`}>Câmera</button>
                  <button onClick={() => setMode('upload')} className={`tab ${mode === 'upload' ? 'tab-active' : ''}`}>Upload</button>
                </div>
                {mode === 'camera' && (
                  <div style={{ marginTop: 12 }}>
                    <div className="media-box">
                      <video ref={videoRef} playsInline autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <button onClick={enableCamera} className="btn btn-accent">Ativar câmera</button>
                      <button onClick={capturePhoto} className="btn btn-primary">Tirar foto</button>
                    </div>
                  </div>
                )}
                {mode === 'upload' && (
                  <div style={{ marginTop: 12, border: '1px dashed #d1d5db', borderRadius: 12, padding: 16, textAlign: 'center', background: '#f9fafb' }}>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>Selecione uma imagem do seu dispositivo</div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                      <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary">Escolher arquivo</button>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onPickFile} />
                  </div>
                )}
                {photoDataUrl && (
                  <div style={{ marginTop: 12 }}>
                    <img src={photoDataUrl} alt="Prévia" style={{ width: '100%', borderRadius: 12, objectFit: 'cover' }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => setPhotoDataUrl('')} className="btn btn-muted" style={{ padding: '8px 10px' }}>Trocar foto</button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 16, padding: 16, background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={consentAccepted} 
                    onChange={(e) => setConsentAccepted(e.target.checked)}
                    style={{ marginTop: 2, cursor: 'pointer', width: 18, height: 18 }}
                  />
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                    Autorizo a coleta, armazenamento e a utilização da minha imagem facial exclusivamente para atualização de cadastro e identificação no sistema de registro de ponto eletrônico, conforme a legislação vigente e a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
                  </div>
                </label>
              </div>
              <button onClick={submit} disabled={!canSubmit || status.type === 'loading'} className="btn btn-primary" style={{ background: canSubmit ? undefined : '#9ca3af' }}>
                {status.type === 'loading' ? 'Enviando...' : 'Enviar'}
              </button>
              {status.type === 'success' && <div style={{ color: '#16a34a', fontSize: 14 }}>{status.msg}</div>}
              {status.type === 'error' && <div style={{ color: '#dc2626', fontSize: 14 }}>{status.msg}</div>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


