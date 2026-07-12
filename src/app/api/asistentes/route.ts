import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateQRToken } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// GET - List all asistentes
export async function GET() {
  try {
    const { data: asistentes, error } = await supabase
      .from('asistentes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(asistentes);
  } catch (error) {
    console.error('Error fetching asistentes:', error);
    return NextResponse.json(
      { error: 'Error al obtener asistentes' },
      { status: 500 }
    );
  }
}

// POST - Create new asistentes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { comunes, boletas } = body;

    if (!comunes || !boletas || !Array.isArray(boletas) || boletas.length === 0) {
      return NextResponse.json(
        { error: 'Estructura de datos inválida' },
        { status: 400 }
      );
    }

    const { telefono, email, metodo_pago } = comunes;

    if (!telefono || !metodo_pago) {
      return NextResponse.json(
        { error: 'Faltan datos de contacto o método de pago' },
        { status: 400 }
      );
    }

    // Validar cada boleta
    for (let i = 0; i < boletas.length; i++) {
      const b = boletas[i];
      if (!b.nombre || !b.documento || b.monto === undefined || b.monto === null) {
        return NextResponse.json(
          { error: `Faltan datos en la boleta ${i + 1}` },
          { status: 400 }
        );
      }
    }

    // Extraer documentos para validar duplicados
    const documentos = boletas.map((b: any) => b.documento);

    const { data: existing } = await supabase
      .from('asistentes')
      .select('documento')
      .in('documento', documentos);

    if (existing && existing.length > 0) {
      const docs = existing.map((e: any) => e.documento).join(', ');
      return NextResponse.json(
        { error: `Ya existen asistentes con los documentos: ${docs}` },
        { status: 400 }
      );
    }

    const fecha_pago = new Date().toISOString();
    
    // Preparar el array para insertar
    const toInsert = boletas.map((b: any) => ({
      nombre: b.nombre,
      documento: b.documento,
      telefono,
      email: email || null,
      metodo_pago,
      monto: b.monto,
      fecha_pago,
      qr_token: generateQRToken(),
      estado: 'no_presente'
    }));

    const { data: newAsistentes, error } = await supabase
      .from('asistentes')
      .insert(toInsert)
      .select();

    if (error) throw error;

    return NextResponse.json(newAsistentes, { status: 201 });
  } catch (error) {
    console.error('Error creating asistentes:', error);
    return NextResponse.json(
      { error: 'Error al crear asistentes' },
      { status: 500 }
    );
  }
}
