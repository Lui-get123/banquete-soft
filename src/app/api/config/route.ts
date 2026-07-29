import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function getConfigHandler(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('mp_access_token')
      .eq('id', parseInt(userId))
      .single();

    if (error) throw error;

    return NextResponse.json({
      mp_access_token: user.mp_access_token
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

async function postConfigHandler(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { mp_access_token } = body;

    const { error } = await supabase
      .from('users')
      .update({ mp_access_token: mp_access_token || null })
      .eq('id', parseInt(userId));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
  }
}

export const GET = withAuth(getConfigHandler);
export const POST = withAuth(postConfigHandler);
