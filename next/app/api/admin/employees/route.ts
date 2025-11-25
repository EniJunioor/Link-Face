import { NextRequest, NextResponse } from 'next/server';
import { initDb, getAllEmployees, createEmployee } from '../../../../src/lib/db';
import { v4 as uuidv4 } from 'uuid';

initDb();

export async function GET() {
  try {
    const employees = await getAllEmployees();
    return NextResponse.json({ ok: true, data: employees });
  } catch (error: any) {
    console.error('Erro ao buscar funcionários:', error);
    return NextResponse.json({ ok: false, error: 'Erro ao buscar funcionários' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, cpf, phone } = await req.json();
    
    if (!name || !cpf) {
      return NextResponse.json({ ok: false, error: 'Nome e CPF são obrigatórios' }, { status: 400 });
    }

    const token = uuidv4();
    const employeeId = await createEmployee({ name, cpf, phone, token });

    return NextResponse.json({
      ok: true,
      data: {
        id: employeeId,
        name,
        cpf,
        phone,
        token,
        link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/l/${token}`
      }
    });
  } catch (error: any) {
    console.error('Erro ao criar funcionário:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Erro ao criar funcionário' }, { status: 500 });
  }
}

