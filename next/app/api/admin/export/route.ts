import { NextRequest, NextResponse } from 'next/server';
import { initDb, getAllSubmissions } from '../../../../src/lib/db';
import { requireAuth } from '../../../../src/lib/auth';

initDb();

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error || 'Não autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const employeeToken = searchParams.get('employee_token');

    const submissions = await getAllSubmissions(10000, 0, employeeToken || undefined);

    if (format === 'csv') {
      const headers = ['ID', 'Nome', 'CPF', 'Token Funcionário', 'Caminho Foto', 'Consentimento', 'Data'];
      const rows = submissions.map((s: any) => [
        s.id,
        s.name,
        s.cpf,
        s.employee_token || '',
        s.photo_path,
        s.consent_accepted ? 'Sim' : 'Não',
        s.created_at
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="submissions-${Date.now()}.csv"`
        }
      });
    }

    // JSON
    return NextResponse.json({
      ok: true,
      data: submissions,
      count: submissions.length,
      exported_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Erro ao exportar dados:', error);
    return NextResponse.json({ ok: false, error: 'Erro ao exportar dados' }, { status: 500 });
  }
}

