import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateQRToken } from '@/lib/utils';
import { withAuth, checkEventOwnership } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function postBulkAsistentes(request: NextRequest) {
  try {
    const eventoId = request.headers.get('x-evento-id');
    if (!eventoId) return NextResponse.json({ error: 'Falta evento_id' }, { status: 400 });

    const isOwner = await checkEventOwnership(request, eventoId);
    if (!isOwner) return NextResponse.json({ error: 'No autorizado para este evento' }, { status: 403 });

    const body = await request.json();
    const { asistentes } = body;

    if (!asistentes || !Array.isArray(asistentes) || asistentes.length === 0) {
      return NextResponse.json({ error: 'Estructura de datos inválida' }, { status: 400 });
    }

    const fecha_pago = new Date().toISOString();
    
    // Prepare data for insertion
    const toInsert = asistentes.map((b: any) => ({
      nombre: b.nombre,
      documento: String(b.documento),
      telefono: String(b.telefono),
      email: b.email || null,
      metodo_pago: b.metodo_pago?.toLowerCase() || 'transferencia',
      monto: parseFloat(b.monto) || 0,
      fecha_pago,
      qr_token: generateQRToken(),
      estado: 'no_presente',
      evento_id: parseInt(eventoId)
    }));

    // Batch insert using Supabase
    // Supabase supports bulk inserts out of the box by passing an array of objects
    const { data: newAsistentes, error } = await supabase
      .from('asistentes')
      .insert(toInsert)
      .select();

    if (error) throw error;

    return NextResponse.json(newAsistentes, { status: 201 });
  } catch (error) {
    console.error('Error creating bulk asistentes:', error);
    return NextResponse.json({ error: 'Error al importar asistentes masivamente' }, { status: 500 });
  }
}

export const POST = withAuth(postBulkAsistentes);
