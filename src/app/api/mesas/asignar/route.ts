import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function patchAsignar(request: NextRequest) {
  try {
    const eventoId = request.headers.get('x-evento-id');
    if (!eventoId) return NextResponse.json({ error: 'Falta evento_id' }, { status: 400 });

    const body = await request.json();
    const { asistente_id, mesa, silla } = body;

    if (!asistente_id || mesa === undefined || silla === undefined) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    if (mesa !== null && silla !== null) {
      const { data: existing, error: checkError } = await supabase
        .from('asistentes')
        .select('id')
        .eq('mesa', mesa)
        .eq('silla', silla)
        .eq('evento_id', parseInt(eventoId));

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        if (existing[0].id !== asistente_id) {
          return NextResponse.json({ error: 'La silla ya está ocupada' }, { status: 400 });
        }
      }
    }

    const { error } = await supabase
      .from('asistentes')
      .update({ mesa, silla, comida_servida: false })
      .eq('id', asistente_id)
      .eq('evento_id', parseInt(eventoId));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning mesa:', error);
    return NextResponse.json({ error: 'Error al asignar mesa' }, { status: 500 });
  }
}

export const PATCH = withAuth(patchAsignar);
