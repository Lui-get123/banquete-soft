import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { asistente_id, comida_servida } = body;

    if (!asistente_id || typeof comida_servida !== 'boolean') {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { error } = await supabase
      .from('asistentes')
      .update({ comida_servida })
      .eq('id', asistente_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error serving food:', error);
    return NextResponse.json({ error: 'Error al actualizar estado de comida' }, { status: 500 });
  }
}
