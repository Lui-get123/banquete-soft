import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function postReset(request: NextRequest) {
  try {
    const eventoId = request.headers.get('x-evento-id');
    if (!eventoId) return NextResponse.json({ error: 'Falta evento_id' }, { status: 400 });

    const { error: unassignError } = await supabase
      .from('asistentes')
      .update({ mesa: null, silla: null, comida_servida: false })
      .eq('evento_id', parseInt(eventoId))
      .not('mesa', 'is', null);

    if (unassignError) throw unassignError;

    const configId = `layout_${eventoId}`;
    const { error: configError } = await supabase
      .from('configuracion')
      .delete()
      .eq('id', configId)
      .eq('evento_id', parseInt(eventoId));

    if (configError) throw configError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting salon:', error);
    return NextResponse.json({ error: 'Error al reiniciar el salón' }, { status: 500 });
  }
}

export const POST = withAuth(postReset);
