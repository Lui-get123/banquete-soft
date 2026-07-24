import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos')
      .select('id, nombre, precio_boleta')
      .order('id', { ascending: false });

    if (eventosError) throw eventosError;

    const { data: asistentes, error: asistentesError } = await supabase
      .from('asistentes')
      .select('evento_id, monto, estado');

    if (asistentesError) throw asistentesError;

    // Aggregate
    const stats = eventos.map(evento => {
      const eventoAsistentes = asistentes.filter(a => a.evento_id === evento.id);
      
      const totalRegistros = eventoAsistentes.length;
      const presentes = eventoAsistentes.filter(a => a.estado === 'presente').length;
      const recaudado = eventoAsistentes.reduce((sum, a) => sum + (a.monto || 0), 0);

      return {
        ...evento,
        totalRegistros,
        presentes,
        recaudado
      };
    });

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching eventos stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas de eventos' }, { status: 500 });
  }
}
