import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth, checkEventOwnership } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function getBoletaConfigHandler(request: NextRequest) {
  try {
    const eventoId = request.headers.get('x-evento-id');
    if (!eventoId) return NextResponse.json({ error: 'Falta evento_id' }, { status: 400 });

    const isOwner = await checkEventOwnership(request, eventoId);
    if (!isOwner) return NextResponse.json({ error: 'No autorizado para este evento' }, { status: 403 });

    const configId = `boleta_layout_${eventoId}`;

    const { data, error } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('id', configId)
      .eq('evento_id', parseInt(eventoId))
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return NextResponse.json(null);
    }

    const response = NextResponse.json(data.valor);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    console.error('Error fetching boleta config:', error);
    return NextResponse.json({ error: 'Error al obtener configuración de boleta' }, { status: 500 });
  }
}

async function postBoletaConfigHandler(request: NextRequest) {
  try {
    const eventoId = request.headers.get('x-evento-id');
    if (!eventoId) return NextResponse.json({ error: 'Falta evento_id' }, { status: 400 });

    const isOwner = await checkEventOwnership(request, eventoId);
    if (!isOwner) return NextResponse.json({ error: 'No autorizado para este evento' }, { status: 403 });

    const body = await request.json();

    if (!body) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const configId = `boleta_layout_${eventoId}`;

    const { error } = await supabase
      .from('configuracion')
      .upsert({
        id: configId,
        valor: body,
        evento_id: parseInt(eventoId)
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving boleta config:', error);
    return NextResponse.json({ error: 'Error al guardar configuración de boleta' }, { status: 500 });
  }
}

export const GET = withAuth(getBoletaConfigHandler);
export const POST = withAuth(postBoletaConfigHandler);
