import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateQRToken } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asistentes, evento_id, telefono, email } = body;

    if (!evento_id || !asistentes || !Array.isArray(asistentes) || asistentes.length === 0) {
      return NextResponse.json({ error: 'Datos de registro inválidos' }, { status: 400 });
    }

    if (!telefono || !email) {
      return NextResponse.json({ error: 'El teléfono y correo son obligatorios' }, { status: 400 });
    }

    // Validar que el evento existe
    const { data: evento, error: eventoError } = await supabase
      .from('eventos')
      .select('id')
      .eq('id', parseInt(evento_id))
      .single();

    if (eventoError || !evento) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    // Preparar el array para insertar
    const fecha_pago = new Date().toISOString();
    const toInsert = asistentes.map((b: any) => ({
      nombre: b.nombre,
      documento: b.documento,
      telefono,
      email,
      metodo_pago: 'Auto-Registro',
      monto: 0,
      fecha_pago,
      qr_token: generateQRToken(),
      estado: 'no_presente',
      evento_id: parseInt(evento_id)
    }));

    const { data: newAsistentes, error } = await supabase
      .from('asistentes')
      .insert(toInsert)
      .select();

    if (error) throw error;

    return NextResponse.json(newAsistentes, { status: 201 });
  } catch (error) {
    console.error('Error in public registration:', error);
    return NextResponse.json({ error: 'Error al procesar el registro' }, { status: 500 });
  }
}
