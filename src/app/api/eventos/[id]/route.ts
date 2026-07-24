import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'ID de evento inválido' }, { status: 400 });
    }

    const eventoId = parseInt(id);

    // 1. Eliminar asistentes asociados
    const { error: errorAsistentes } = await supabase
      .from('asistentes')
      .delete()
      .eq('evento_id', eventoId);
      
    if (errorAsistentes) throw errorAsistentes;

    // 2. Eliminar mesas asociadas (si existen)
    const { error: errorMesas } = await supabase
      .from('mesas')
      .delete()
      .eq('evento_id', eventoId);

    if (errorMesas) throw errorMesas;

    // 3. Eliminar configuraciones de boleta asociadas (si existen)
    const { error: errorBoletaConfig } = await supabase
      .from('boleta_config')
      .delete()
      .eq('evento_id', eventoId);
      
    if (errorBoletaConfig) throw errorBoletaConfig;

    // 4. Finalmente, eliminar el evento
    const { error: errorEvento } = await supabase
      .from('eventos')
      .delete()
      .eq('id', eventoId);

    if (errorEvento) throw errorEvento;

    return NextResponse.json({ success: true, message: 'Evento eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting evento:', error);
    return NextResponse.json({ error: 'Error al eliminar el evento' }, { status: 500 });
  }
}
