import { NextRequest, NextResponse } from 'next/server';
import { initDb, getAllSubmissions, searchSubmissions, getSubmissionStats } from '../../../../src/lib/db';

initDb();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const employeeToken = searchParams.get('employee_token');

    if (search) {
      const results = await searchSubmissions(search, limit);
      return NextResponse.json({ ok: true, data: results, count: results.length });
    }

    const submissions = await getAllSubmissions(limit, offset, employeeToken || undefined);
    const stats = await getSubmissionStats();

    return NextResponse.json({
      ok: true,
      data: submissions,
      count: submissions.length,
      stats
    });
  } catch (error: any) {
    console.error('Erro ao buscar submissões:', error);
    return NextResponse.json({ ok: false, error: 'Erro ao buscar submissões' }, { status: 500 });
  }
}

