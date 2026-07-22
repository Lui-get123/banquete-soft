import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('id', 'layout')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is fine for the first time
      throw error;
    }

    if (!data) {
      return NextResponse.json(null);
    }

    const response = NextResponse.json(data.valor);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    console.error('Error fetching mesas config:', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || !body.mesas) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { error } = await supabase
      .from('configuracion')
      .upsert({
        id: 'layout',
        valor: body
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving mesas config:', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}
