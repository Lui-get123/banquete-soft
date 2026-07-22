import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateQRToken } from '@/lib/utils';
import { withAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function getAsistentes(request: NextRequest) {
  try {
    const eventoId = request.headers.get('x-evento-id');
    if (!eventoId) return NextResponse.json({ error: 'Falta evento_id' }, { status: 400 });

    const { data: asistentes, error } = await supabase
      .from('asistentes')
      .select('*')
      .eq('evento_id', parseInt(eventoId))
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(asistentes);
  } catch (error) {
    console.error('Error fetching asistentes:', error);
    return NextResponse.json({ error: 'Error al obtener asistentes' }, { status: 500 });
  }
}

async function postAsistentes(request: NextRequest) {
  try {
    const eventoId = request.headers.get('x-evento-id');
    if (!eventoId) return NextResponse.json({ error: 'Falta evento_id' }, { status: 400 });

    const body = await request.json();
    const { comunes, boletas } = body;

    if (!comunes || !boletas || !Array.isArray(boletas) || boletas.length === 0) {
      return NextResponse.json({ error: 'Estructura de datos inválida' }, { status: 400 });
    }

    const { telefono, email, metodo_pago } = comunes;
    if (!telefono || !metodo_pago) {
      return NextResponse.json({ error: 'Faltan datos de contacto o método de pago' }, { status: 400 });
    }

    // Validar cada boleta
    for (let i = 0; i < boletas.length; i++) {
      const b = boletas[i];
      if (!b.nombre || !b.documento || b.monto === undefined || b.monto === null) {
        return NextResponse.json({ error: `Faltan datos en la boleta ${i + 1}` }, { status: 400 });
      }
    }

    // Preparar el array para insertar
    const fecha_pago = new Date().toISOString();
    const toInsert = boletas.map((b: any) => ({
      nombre: b.nombre,
      documento: b.documento,
      telefono,
      email: email || null,
      metodo_pago,
      monto: b.monto,
      fecha_pago,
      qr_token: generateQRToken(),
      estado: 'no_presente',
      evento_id: parseInt(eventoId)
    }));

    const { data: newAsistentes, error } = await supabase
      .from('asistentes')
      .insert(toInsert)
      .select();

    if (error) throw error;

    return NextResponse.json(newAsistentes, { status: 201 });
  } catch (error) {
    console.error('Error creating asistentes:', error);
    return NextResponse.json({ error: 'Error al crear asistentes' }, { status: 500 });
  }
}

export const GET = withAuth(getAsistentes);
export const POST = withAuth(postAsistentes);
