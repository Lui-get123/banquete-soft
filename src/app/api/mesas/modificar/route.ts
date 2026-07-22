import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function postModificar(request: NextRequest) {
  try {
    const eventoId = request.headers.get('x-evento-id');
    if (!eventoId) return NextResponse.json({ error: 'Falta evento_id' }, { status: 400 });

    const body = await request.json();
    const { unassignList } = body;

    if (!unassignList || !Array.isArray(unassignList)) {
      return NextResponse.json({ error: 'Lista inválida' }, { status: 400 });
    }

    for (const instruction of unassignList) {
      let query = supabase.from('asistentes')
        .update({ mesa: null, silla: null, comida_servida: false })
        .eq('mesa', instruction.mesa)
        .eq('evento_id', parseInt(eventoId));
      
      if (instruction.silla !== undefined) {
        query = query.eq('silla', instruction.silla);
      }
      
      const { error } = await query;
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in bulk unassign:', error);
    return NextResponse.json({ error: 'Error al desasignar en lote' }, { status: 500 });
  }
}

export const POST = withAuth(postModificar);
