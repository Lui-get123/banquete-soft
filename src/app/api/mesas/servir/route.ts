import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function patchServir(request: NextRequest) {
  try {
    const eventoId = request.headers.get('x-evento-id');
    if (!eventoId) return NextResponse.json({ error: 'Falta evento_id' }, { status: 400 });

    const body = await request.json();
    const { asistente_id, comida_servida } = body;

    if (!asistente_id || typeof comida_servida !== 'boolean') {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { error } = await supabase
      .from('asistentes')
      .update({ comida_servida })
      .eq('id', asistente_id)
      .eq('evento_id', parseInt(eventoId));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error serving food:', error);
    return NextResponse.json({ error: 'Error al actualizar estado de comida' }, { status: 500 });
  }
}

export const PATCH = withAuth(patchServir);
