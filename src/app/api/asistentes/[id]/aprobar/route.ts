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
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('El servidor no tiene configuradas las credenciales de correo');
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
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
        from: `"Banquete Soft" <${process.env.EMAIL_USER}>`,
        to: asistente.email,
        subject: `¡Pago Aprobado! Tu boleta para ${asistente.eventos?.nombre}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #4A4036; background-color: #FDFBF7; padding: 20px; border-radius: 12px; border: 1px solid #EBE4D8;">
            <h1 style="color: #5B2333; text-align: center; border-bottom: 2px solid #EBE4D8; padding-bottom: 10px;">¡Pago Aprobado!</h1>
            <p style="font-size: 16px;">Hola <strong>${asistente.nombre}</strong>,</p>
            <p style="font-size: 16px;">El organizador ha verificado tu pago exitosamente.</p>
            <p style="font-size: 16px; background-color: #F5F0E8; padding: 15px; border-radius: 8px;">Adjunto a este correo encontrarás tu boleta oficial para <strong>${asistente.eventos?.nombre}</strong>. Por favor preséntala en la entrada (puedes mostrarla desde tu celular).</p>
            <br/>
            <p style="font-size: 16px; text-align: center; color: #8C7B68;">¡Te esperamos!</p>
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
