import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Desasignar a todos los asistentes (donde mesa no sea nula)
    const { error: unassignError } = await supabase
      .from('asistentes')
      .update({ mesa: null, silla: null })
      .not('mesa', 'is', null);

    if (unassignError) throw unassignError;

    // 2. Eliminar la configuración del salón
    const { error: configError } = await supabase
      .from('configuracion')
      .delete()
      .eq('id', 'layout');

    if (configError) throw configError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting salon:', error);
    return NextResponse.json({ error: 'Error al reiniciar el salón' }, { status: 500 });
  }
}
