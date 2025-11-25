"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, XIcon, LoadingIcon, UploadIcon } from '../components/Icons';

interface Submission {
  id: number;
  name: string;
  cpf: string;
  employee_token: string | null;
  photo_path: string;
  consent_accepted: number;
  created_at: string;
}

interface Employee {
  id: number;
  name: string;
  cpf: string;
  phone: string | null;
  token: string;
  created_at: string;
}

export default function AdminPanel() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState({ total: 0, today: 0, byEmployee: [] });
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [newEmployee, setNewEmployee] = useState({ name: '', cpf: '', phone: '', email: '' });
  const [showNewEmployee, setShowNewEmployee] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [selectedEmployee, authenticated]);

  const checkAuth = async () => {
    try {
      // Verifica se há sessão (cookie será enviado automaticamente)
      const res = await fetch('/api/admin/submissions?limit=1');
      if (res.ok) {
        setAuthenticated(true);
      } else if (res.status === 401) {
        router.push('/admin/login');
      }
    } catch {
      router.push('/admin/login');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [subsRes, empRes] = await Promise.all([
        fetch(`/api/admin/submissions?${selectedEmployee ? `employee_token=${selectedEmployee}` : ''}`, {
          credentials: 'include'
        }),
        fetch('/api/admin/employees', {
          credentials: 'include'
        })
      ]);

      if (subsRes.status === 401 || empRes.status === 401) {
        router.push('/admin/login');
        return;
      }

      const subsData = await subsRes.json();
      const empData = await empRes.json();

      if (subsData.ok) {
        setSubmissions(subsData.data);
        setStats(subsData.stats || { total: 0, today: 0, byEmployee: [] });
      }
      if (empData.ok) {
        setEmployees(empData.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadData();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/submissions?search=${encodeURIComponent(searchTerm)}`, {
        credentials: 'include'
      });
      
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      
      const data = await res.json();
      if (data.ok) {
        setSubmissions(data.data);
      }
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const url = `/api/admin/export?format=${format}${selectedEmployee ? `&employee_token=${selectedEmployee}` : ''}`;
      const res = await fetch(url, {
        credentials: 'include'
      });
      
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `submissions-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erro ao exportar:', error);
    }
  };

  const handleCreateEmployee = async () => {
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newEmployee)
      });
      
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      
      const data = await res.json();
      if (data.ok) {
        alert(`Funcionário criado! Token: ${data.data.token}\nLink: ${data.data.link}`);
        setNewEmployee({ name: '', cpf: '', phone: '', email: '' });
        setShowNewEmployee(false);
        loadData();
      }
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
    }
  };

  if (!authenticated) {
    return (
      <div className="app-container">
        <div className="main-card" style={{ maxWidth: '400px' }}>
          <div className="flex justify-center py-12">
            <LoadingIcon className="w-8 h-8" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="main-card" style={{ maxWidth: '1200px' }}>
        <div className="app-header">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="section-title">Painel Administrativo</h1>
              <p className="section-description">Gerencie submissões e funcionários</p>
            </div>
            <button onClick={handleLogout} className="btn btn-outline">
              Sair
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Total de Submissões</div>
            <div className="text-3xl font-bold text-black">{stats.total}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Hoje</div>
            <div className="text-3xl font-bold text-black">{stats.today}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Funcionários</div>
            <div className="text-3xl font-bold text-black">{employees.length}</div>
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="form-input flex-1"
            />
            <button onClick={handleSearch} className="btn btn-primary">
              Buscar
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="form-input"
            >
              <option value="">Todos os funcionários</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.token}>
                  {emp.name} ({emp.token.slice(0, 8)}...)
                </option>
              ))}
            </select>

            <button
              onClick={() => handleExport('csv')}
              className="btn btn-outline"
            >
              Exportar CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="btn btn-outline"
            >
              Exportar JSON
            </button>
            <button
              onClick={() => setShowNewEmployee(!showNewEmployee)}
              className="btn btn-secondary"
            >
              {showNewEmployee ? 'Cancelar' : '+ Novo Funcionário'}
            </button>
          </div>
        </div>

        {/* Formulário novo funcionário */}
        {showNewEmployee && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Criar Novo Funcionário</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nome"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                className="form-input"
              />
              <input
                type="text"
                placeholder="CPF"
                value={newEmployee.cpf}
                onChange={(e) => setNewEmployee({ ...newEmployee, cpf: e.target.value })}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Telefone (opcional)"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                className="form-input"
              />
              <input
                type="email"
                placeholder="Email (opcional)"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                className="form-input"
              />
            </div>
            <button onClick={handleCreateEmployee} className="btn btn-primary mt-4">
              Criar Funcionário
            </button>
          </div>
        )}

        {/* Tabela de submissões */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingIcon className="w-8 h-8" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="text-left p-3 text-sm font-semibold">ID</th>
                  <th className="text-left p-3 text-sm font-semibold">Nome</th>
                  <th className="text-left p-3 text-sm font-semibold">CPF</th>
                  <th className="text-left p-3 text-sm font-semibold">Foto</th>
                  <th className="text-left p-3 text-sm font-semibold">Consentimento</th>
                  <th className="text-left p-3 text-sm font-semibold">Data</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-sm">{sub.id}</td>
                    <td className="p-3 text-sm font-medium">{sub.name}</td>
                    <td className="p-3 text-sm">{sub.cpf}</td>
                    <td className="p-3">
                      <a
                        href={`/api/photos/${sub.id}`}
                        target="_blank"
                        className="text-red-600 hover:underline text-sm flex items-center gap-1"
                      >
                        <UploadIcon className="w-4 h-4" />
                        Ver Foto
                      </a>
                    </td>
                    <td className="p-3">
                      {sub.consent_accepted ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckIcon className="w-4 h-4" />
                          Sim
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <XIcon className="w-4 h-4" />
                          Não
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(sub.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {submissions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Nenhuma submissão encontrada
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

