import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, boletasBase64, customMessage, evento_id } = await request.json();

    if (!email || !boletasBase64 || !Array.isArray(boletasBase64) || boletasBase64.length === 0) {
      return NextResponse.json(
        { error: 'Email y boletas son requeridos' },
        { status: 400 }
      );
    }

    let emailUser = process.env.EMAIL_USER;
    let emailPass = process.env.EMAIL_PASS;

    if (evento_id) {
      const { data: evento, error: eventError } = await supabase
        .from('eventos')
        .select('cliente_id')
        .eq('id', evento_id)
        .single();

      if (!eventError && evento && evento.cliente_id) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('email_user, email_pass')
          .eq('id', evento.cliente_id)
          .single();

        if (!userError && user && user.email_user && user.email_pass) {
          emailUser = user.email_user;
          emailPass = user.email_pass;
        }
      }
    }

    if (!emailUser || !emailPass) {
      return NextResponse.json(
        { error: 'El servidor no tiene configuradas las credenciales de correo' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const attachments = boletasBase64.map((base64String: string, index: number) => {
      const base64Data = base64String.includes('base64,') 
        ? base64String.split('base64,')[1] 
        : base64String;
      
      return {
        filename: `boleta-${index + 1}.jpeg`,
        content: base64Data,
        encoding: 'base64',
      };
    });

    const mailOptions = {
      from: `"Eventix" <${emailUser}>`,
      to: email,
      subject: '¡Tus Boletas para el Evento!',
      text: customMessage || 'Adjuntamos las boletas que has generado. Por favor, preséntalas en la entrada del evento.',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #4A4036; background-color: #FDFBF7; padding: 20px; border-radius: 12px; border: 1px solid #EBE4D8;">
          <h1 style="color: #5B2333; text-align: center; border-bottom: 2px solid #EBE4D8; padding-bottom: 10px;">¡Tu Registro fue Exitoso!</h1>
          <p style="font-size: 16px;">Hola,</p>
          <p style="font-size: 16px;">${customMessage || 'Gracias por confirmar tu asistencia. Adjunto a este correo encontrarás tus boletas para el evento.'}</p>
          <p style="font-size: 16px; background-color: #F5F0E8; padding: 15px; border-radius: 8px;">Por favor, descarga las imágenes adjuntas o muestra este correo directamente en la entrada. Cada boleta contiene un código QR único que será escaneado.</p>
          <br/>
          <p style="font-size: 16px; text-align: center; color: #8C7B68;">¡Nos vemos pronto!</p>
        </div>
      `,
      attachments,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Correos enviados correctamente' });
  } catch (error) {
    console.error('Error enviando correos publicos:', error);
    return NextResponse.json(
      { error: 'Error al enviar los correos. Verifica la configuración de Gmail.' },
      { status: 500 }
    );
  }
}
