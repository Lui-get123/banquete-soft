import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/api-auth';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

async function aprobarPagoHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const id = params.id;

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { boletasBase64 } = body;

    // Verificar que el asistente pertenezca a un evento del usuario (si no es superadmin)
    const { data: asistente, error: fetchError } = await supabase
      .from('asistentes')
      .select('*, eventos(cliente_id, nombre)')
      .eq('id', id)
      .single();

    if (fetchError || !asistente) {
      return NextResponse.json({ error: 'Asistente no encontrado' }, { status: 404 });
    }

    if (userRole !== 'superadmin' && asistente.eventos?.cliente_id !== parseInt(userId)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Actualizar estado a no_presente
    const { error: updateError } = await supabase
      .from('asistentes')
      .update({ estado: 'no_presente' })
      .eq('id', id);

    if (updateError) throw updateError;

    // Si pasaron la imagen base64, enviamos el correo
    if (boletasBase64 && boletasBase64.length > 0 && asistente.email) {
      // Buscar credenciales de correo del cliente dueño del evento
      let emailUser: string | null = null;
      let emailPass: string | null = null;

      if (asistente.eventos?.cliente_id) {
        const { data: clienteData } = await supabase
          .from('users')
          .select('email_user, email_pass')
          .eq('id', asistente.eventos.cliente_id)
          .single();

        if (clienteData?.email_user && clienteData?.email_pass) {
          emailUser = clienteData.email_user;
          emailPass = clienteData.email_pass;
        }
      }

      if (!emailUser || !emailPass) {
        // No enviar correo si el cliente no tiene configurado su email
        return NextResponse.json({ success: true, warning: 'Pago aprobado pero no se envió correo: el cliente no ha configurado su correo Gmail.' });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      const attachments = boletasBase64.map((b64: string, index: number) => {
        const base64Data = b64.includes('base64,') ? b64.split('base64,')[1] : b64;
        return {
          filename: `boleta_${asistente.nombre.replace(/\s+/g, '_')}_${index + 1}.jpeg`,
          content: base64Data,
          encoding: 'base64',
        };
      });

      const mailOptions = {
        from: `"Eventix" <${emailUser}>`,
        to: asistente.email,
        subject: `¡Pago Aprobado! Tu boleta para ${asistente.eventos?.nombre}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1F2937; background-color: #FFFFFF; padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB;">
            <h1 style="color: #047857; text-align: center; border-bottom: 2px solid #D1FAE5; padding-bottom: 10px;">¡Pago Aprobado!</h1>
            <p style="font-size: 16px;">Hola <strong>${asistente.nombre}</strong>,</p>
            <p style="font-size: 16px;">El organizador ha verificado tu pago exitosamente.</p>
            <p style="font-size: 16px; background-color: #F0FDF4; padding: 15px; border-radius: 8px; border: 1px solid #D1FAE5;">Adjunto a este correo encontrarás tu boleta oficial para <strong>${asistente.eventos?.nombre}</strong>. Por favor preséntala en la entrada (puedes mostrarla desde tu celular).</p>
            <br/>
            <p style="font-size: 16px; text-align: center; color: #059669; font-weight: 600;">¡Te esperamos!</p>
          </div>
        `,
        attachments
      };

      await transporter.sendMail(mailOptions);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving pago:', error);
    return NextResponse.json({ error: 'Error al aprobar pago' }, { status: 500 });
  }
}

export const POST = withAuth(aprobarPagoHandler);
