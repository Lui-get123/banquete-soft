import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function deleteEventoHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'ID de evento inválido' }, { status: 400 });
    }

    const eventoId = parseInt(id);

    // Verify ownership
    if (userRole !== 'superadmin') {
      const { data: ev, error: evError } = await supabase.from('eventos').select('cliente_id').eq('id', eventoId).single();
      if (evError || !ev || ev.cliente_id !== parseInt(userId || '0')) {
        return NextResponse.json({ error: 'No autorizado para eliminar este evento' }, { status: 403 });
      }
    }

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
  } catch (error: any) {
    console.error('Error deleting evento:', error);
    return NextResponse.json({ error: error.message || 'Error al eliminar el evento' }, { status: 500 });
  }
}

export const DELETE = withAuth(deleteEventoHandler);
