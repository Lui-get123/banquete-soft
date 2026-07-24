import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'ID de evento inválido' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('eventos')
      .select('id, nombre')
      .eq('id', parseInt(id))
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching public evento:', error);
    return NextResponse.json({ error: 'Error al obtener evento' }, { status: 500 });
  }
}
