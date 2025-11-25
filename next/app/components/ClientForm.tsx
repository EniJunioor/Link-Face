"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CameraIcon, UploadIcon, RefreshIcon, CheckIcon, XIcon, LoadingIcon, UploadFileIcon } from './Icons';

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
    <div className="app-container">
      <div className="main-card">
        {/* Header */}
        <div className="app-header">
          <div className="app-logo">
            <span className="logo-link">Link</span>
            <span className="logo-face">-Face</span>
          </div>
          <p className="app-subtitle">Verificação de Identidade Segura</p>
        </div>

        {/* Título */}
        <h1 className="section-title">Confirmação de Identidade</h1>
        <p className="section-description">
          Preencha seus dados e envie uma foto nítida para verificação
        </p>

        <div className="form-container">
          {/* Campos de entrada */}
          <div className="form-grid">
            <div>
              <label htmlFor="name" className="form-label">
                Nome Completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Maria Silva"
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="cpf" className="form-label">
                CPF
              </label>
              <input
                id="cpf"
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="00000000000"
                inputMode="numeric"
                className="form-input"
              />
              <p className="form-hint">Apenas números</p>
            </div>
          </div>

          {/* Seção de foto */}
          <div className="photo-section">
            {/* Tabs de modo */}
            <div className="mode-tabs">
              <button
                onClick={() => setMode('camera')}
                className={`mode-tab ${mode === 'camera' ? 'mode-tab-active' : 'mode-tab-inactive'}`}
              >
                <CameraIcon className="w-5 h-5" />
                <span>Câmera</span>
              </button>
              <button
                onClick={() => setMode('upload')}
                className={`mode-tab ${mode === 'upload' ? 'mode-tab-active' : 'mode-tab-inactive'}`}
              >
                <UploadIcon className="w-5 h-5" />
                <span>Upload</span>
              </button>
            </div>

            {/* Modo Câmera */}
            {mode === 'camera' && !photoDataUrl && (
              <div className="space-y-4">
                <div className="media-container">
                  <video 
                    ref={videoRef} 
                    playsInline 
                    autoPlay 
                    muted 
                    className="w-full h-full"
                  />
                </div>
                <div className="action-buttons">
                  <button 
                    onClick={enableCamera} 
                    className="btn btn-secondary btn-full sm:flex-1"
                  >
                    <CameraIcon className="w-5 h-5" />
                    <span>Ativar Câmera</span>
                  </button>
                  <button 
                    onClick={capturePhoto} 
                    className="btn btn-primary btn-full sm:flex-1"
                  >
                    <CameraIcon className="w-5 h-5" />
                    <span>Capturar Foto</span>
                  </button>
                </div>
              </div>
            )}

            {/* Modo Upload */}
            {mode === 'upload' && !photoDataUrl && (
              <div
                className="upload-zone"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon-wrapper">
                  <UploadFileIcon className="w-20 h-20 text-gray-400" />
                </div>
                <p className="upload-text">Clique para selecionar uma imagem</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="btn btn-primary mx-auto"
                >
                  <UploadIcon className="w-5 h-5" />
                  <span>Escolher Arquivo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={onPickFile}
                />
              </div>
            )}

            {/* Preview da foto */}
            {photoDataUrl && (
              <div className="space-y-4">
                <div className="photo-preview-container">
                  <img src={photoDataUrl} alt="Prévia da foto" />
                </div>
                <button
                  onClick={() => setPhotoDataUrl('')}
                  className="btn btn-outline btn-full"
                >
                  <RefreshIcon className="w-5 h-5" />
                  <span>Trocar Foto</span>
                </button>
              </div>
            )}
          </div>

          {/* Termo de consentimento */}
          <div className="consent-wrapper">
            <label className="consent-checkbox-wrapper">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                className="consent-checkbox"
              />
              <div className="consent-text">
                <strong>Autorizo</strong> a coleta, armazenamento e utilização da minha imagem facial exclusivamente para atualização de cadastro e identificação no sistema de registro de ponto eletrônico, conforme a legislação vigente e a <strong>Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)</strong>.
              </div>
            </label>
          </div>

          {/* Botão de envio */}
          <button
            onClick={submit}
            disabled={!canSubmit || status.type === 'loading'}
            className="btn btn-primary btn-full"
          >
            {status.type === 'loading' ? (
              <>
                <LoadingIcon className="w-5 h-5" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-5 h-5" />
                <span>Enviar Dados</span>
              </>
            )}
          </button>

          {/* Mensagens de status */}
          {status.type === 'success' && (
            <div className="status-alert status-success">
              <CheckIcon className="w-5 h-5 flex-shrink-0" />
              <span>{status.msg}</span>
            </div>
          )}
          {status.type === 'error' && (
            <div className="status-alert status-error">
              <XIcon className="w-5 h-5 flex-shrink-0" />
              <span>{status.msg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
