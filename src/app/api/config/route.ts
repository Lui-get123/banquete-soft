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
      .select('whatsapp_contacto, email_user, email_pass')
      .eq('id', parseInt(userId))
      .single();

    if (error) throw error;

    return NextResponse.json({
      whatsapp_contacto: user.whatsapp_contacto,
      email_user: user.email_user,
      email_pass: user.email_pass
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
    const { whatsapp_contacto, email_user, email_pass } = body;

    const { error } = await supabase
      .from('users')
      .update({ 
        whatsapp_contacto: whatsapp_contacto || null,
        email_user: email_user || null,
        email_pass: email_pass || null
      })
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
