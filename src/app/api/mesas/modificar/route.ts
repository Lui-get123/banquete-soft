import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { unassignList } = body;

    if (!unassignList || !Array.isArray(unassignList)) {
      return NextResponse.json({ error: 'Lista inválida' }, { status: 400 });
    }

    for (const instruction of unassignList) {
      let query = supabase.from('asistentes').update({ mesa: null, silla: null }).eq('mesa', instruction.mesa);
      
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
