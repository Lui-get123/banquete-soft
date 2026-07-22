import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { asistente_id, mesa, silla } = body;

    if (!asistente_id) {
      return NextResponse.json({ error: 'Falta ID de asistente' }, { status: 400 });
    }

    // Check if the seat is already taken by someone else (only if assigning)
    if (mesa !== null && silla !== null) {
      const { data: existing } = await supabase
        .from('asistentes')
        .select('id, nombre')
        .eq('mesa', mesa)
        .eq('silla', silla)
        .single();
        
      if (existing && existing.id !== asistente_id) {
        return NextResponse.json({ error: `La silla ya está ocupada por ${existing.nombre}` }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('asistentes')
      .update({ mesa, silla, updated_at: new Date().toISOString() })
      .eq('id', asistente_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error assigning mesa:', error);
    return NextResponse.json({ error: 'Error al asignar la silla' }, { status: 500 });
  }
}
