import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { generarImagenBoleta } from '@/lib/boleta-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const evento_id = url.searchParams.get('evento_id');
    const type = url.searchParams.get('type') || url.searchParams.get('topic');
    const dataId = url.searchParams.get('data.id');

    // MercadoPago a veces manda el body en JSON
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body vacío
    }

    const paymentIdStr = dataId || body?.data?.id;
    const paymentType = type || body?.type || body?.topic;

    if (paymentType !== 'payment' || !paymentIdStr || !evento_id) {
      return NextResponse.json({ success: true }, { status: 200 }); // Ignorar notificaciones que no sean pagos
    }

    // 1. Obtener el cliente_id y su token
    const { data: evento } = await supabase
      .from('eventos')
      .select('cliente_id')
      .eq('id', parseInt(evento_id))
      .single();

    if (!evento?.cliente_id) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('mp_access_token')
      .eq('id', evento.cliente_id)
      .single();

    if (!user?.mp_access_token) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // 2. Consultar el estado del pago en MercadoPago
    const client = new MercadoPagoConfig({ accessToken: user.mp_access_token });
    const paymentApi = new Payment(client);
    
    const payment = await paymentApi.get({ id: paymentIdStr });

    // 3. Si el pago fue aprobado, actualizar los asistentes
    if (payment.status === 'approved' && payment.external_reference) {
      const paymentRef = payment.external_reference;

      // Buscar si ya fueron actualizados para evitar re-enviar correos si MP manda doble webhook
      const { data: checkAsistentes } = await supabase
        .from('asistentes')
        .select('id, estado')
        .eq('payment_id', paymentRef);

      if (!checkAsistentes || checkAsistentes.length === 0) {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Si el primero ya está pagado (no_presente), ignorar
      if (checkAsistentes[0].estado === 'no_presente' || checkAsistentes[0].estado === 'presente') {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Actualizar a "no_presente" (pagado y listo)
      const { data: updatedAsistentes, error: updateError } = await supabase
        .from('asistentes')
        .update({ estado: 'no_presente', metodo_pago: 'MercadoPago', comprobante: paymentIdStr.toString() })
        .eq('payment_id', paymentRef)
        .select();

      if (updateError || !updatedAsistentes || updatedAsistentes.length === 0) {
        throw updateError;
      }

      // 4. Generar boletas y enviar correo
      const email = updatedAsistentes[0].email;
      if (email) {
        const baseUrl = request.nextUrl.origin;
        const boletasBase64 = await Promise.all(
          updatedAsistentes.map(asistente => generarImagenBoleta(asistente))
        );

        // Llamar a nuestra API de correos (internamente usando fetch)
        await fetch(`${baseUrl}/api/public/enviar-boletas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, boletasBase64 })
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in MercadoPago Webhook:', error);
    // MercadoPago requiere siempre 200 o 201 para dejar de reintentar
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
