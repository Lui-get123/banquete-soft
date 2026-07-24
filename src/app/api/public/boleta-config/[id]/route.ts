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
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const configId = `boleta_layout_${id}`;

    const { data, error } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('id', configId)
      .eq('evento_id', parseInt(id))
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return NextResponse.json(null);
    }

    const response = NextResponse.json(data.valor);
    response.headers.set('Cache-Control', 'public, max-age=60');
    return response;
  } catch (error) {
    console.error('Error fetching public boleta config:', error);
    return NextResponse.json({ error: 'Error al obtener config' }, { status: 500 });
  }
}
