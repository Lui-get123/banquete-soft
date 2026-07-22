import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function getEventosHandler(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching eventos:', error);
    return NextResponse.json({ error: 'Error al obtener eventos' }, { status: 500 });
  }
}

async function postEventoHandler(request: NextRequest) {
  try {
    const { nombre } = await request.json();
    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('eventos')
      .insert([{ nombre }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating evento:', error);
    return NextResponse.json({ error: 'Error al crear evento' }, { status: 500 });
  }
}

export const GET = withAuth(getEventosHandler);
export const POST = withAuth(postEventoHandler);
