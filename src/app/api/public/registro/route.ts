import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateQRToken } from '@/lib/utils';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid';

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

    // Validar que el evento existe y obtener su precio y cliente_id
    const { data: evento, error: eventoError } = await supabase
      .from('eventos')
      .select('id, nombre, precio_boleta, cliente_id')
      .eq('id', parseInt(evento_id))
      .single();

    if (eventoError || !evento) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    // Obtener el mp_access_token del organizador
    let mpAccessToken = null;
    if (evento.cliente_id) {
      const { data: owner } = await supabase
        .from('users')
        .select('mp_access_token')
        .eq('id', evento.cliente_id)
        .single();
      
      mpAccessToken = owner?.mp_access_token;
    }

    const requiresPayment = evento.precio_boleta > 0 && mpAccessToken;
    const paymentId = requiresPayment ? uuidv4() : null;
    const initialStatus = requiresPayment ? 'pendiente_pago' : 'no_presente';

    // Preparar el array para insertar
    const fecha_pago = new Date().toISOString();
    const toInsert = asistentes.map((b: any) => ({
      nombre: b.nombre,
      documento: b.documento,
      telefono,
      email,
      metodo_pago: requiresPayment ? 'MercadoPago' : 'Auto-Registro',
      monto: evento.precio_boleta || 0,
      fecha_pago,
      qr_token: generateQRToken(),
      estado: initialStatus,
      evento_id: parseInt(evento_id),
      payment_id: paymentId
    }));

    const { data: newAsistentes, error } = await supabase
      .from('asistentes')
      .insert(toInsert)
      .select();

    if (error) throw error;

    // Si requiere pago, generar preferencia en MercadoPago
    if (requiresPayment) {
      const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
      const preference = new Preference(client);
      
      const baseUrl = request.nextUrl.origin;

      const prefData = await preference.create({
        body: {
          items: [
            {
              id: evento.id.toString(),
              title: `Boleta para ${evento.nombre}`,
              quantity: asistentes.length,
              unit_price: Number(evento.precio_boleta),
              currency_id: 'COP',
            }
          ],
          payer: {
            email: email,
          },
          back_urls: {
            success: `${baseUrl}/pago/exito`,
            failure: `${baseUrl}/e/${evento.id}`,
            pending: `${baseUrl}/e/${evento.id}`
          },
          auto_return: 'approved',
          notification_url: `${baseUrl}/api/webhooks/mercadopago?evento_id=${evento.id}`,
          external_reference: paymentId,
          statement_descriptor: 'BANQUETE_SOFT'
        }
      });

      return NextResponse.json({ 
        success: true, 
        init_point: prefData.init_point, 
        asistentes: newAsistentes 
      }, { status: 201 });
    }

    return NextResponse.json({ success: true, asistentes: newAsistentes }, { status: 201 });
  } catch (error) {
    console.error('Error in public registration:', error);
    return NextResponse.json({ error: 'Error al procesar el registro' }, { status: 500 });
  }
}
