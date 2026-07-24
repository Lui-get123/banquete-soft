import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth, checkEventOwnership } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function getConfigHandler(request: NextRequest) {
  try {
    const eventoId = request.headers.get('x-evento-id');
    if (!eventoId) return NextResponse.json({ error: 'Falta evento_id' }, { status: 400 });

    const isOwner = await checkEventOwnership(request, eventoId);
    if (!isOwner) return NextResponse.json({ error: 'No autorizado para este evento' }, { status: 403 });

    const configId = `layout_${eventoId}`;

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
    console.error('Error fetching mesas config:', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

async function postConfigHandler(request: NextRequest) {
  try {
    const eventoId = request.headers.get('x-evento-id');
    if (!eventoId) return NextResponse.json({ error: 'Falta evento_id' }, { status: 400 });

    const isOwner = await checkEventOwnership(request, eventoId);
    if (!isOwner) return NextResponse.json({ error: 'No autorizado para este evento' }, { status: 403 });

    const body = await request.json();

    if (!body || !body.mesas) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Upsert expects a unique constraint, but since we are introducing evento_id
    // Wait, upserting by id='layout' alone will overwrite across events if id is the only PK.
    // Assuming 'id' + 'evento_id' is NOT the primary key (PK is just 'id'), 
    // we need to either change the DB constraint or just use a dynamic ID like `layout_${eventoId}`
    const configId = `layout_${eventoId}`;

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
    console.error('Error saving mesas config:', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}

export const GET = withAuth(getConfigHandler);
export const POST = withAuth(postConfigHandler);
