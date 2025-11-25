"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingIcon } from '../../components/Icons';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (data.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="main-card" style={{ maxWidth: '400px' }}>
        <div className="app-header">
          <h1 className="section-title">Acesso Administrativo</h1>
          <p className="section-description">Digite a senha para acessar o painel</p>
        </div>

        <form onSubmit={handleLogin} className="form-container">
          <div>
            <label htmlFor="password" className="form-label">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha"
              className="form-input"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="status-alert status-error">
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="btn btn-primary btn-full"
          >
            {loading ? (
              <>
                <LoadingIcon className="w-5 h-5" />
                <span>Entrando...</span>
              </>
            ) : (
              <span>Entrar</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

