import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ qrToken: string }> | { qrToken: string } }
) {
  try {
    const resolvedParams = await context.params;
    const qrToken = resolvedParams.qrToken;

    if (!qrToken) {
      return NextResponse.json(
        { error: 'Token QR no proporcionado' },
        { status: 400 }
      );
    }

    const { data: asistente, error } = await supabase
      .from('asistentes')
      .select('*')
      .eq('qr_token', qrToken)
      .single();

    if (error || !asistente) {
      return NextResponse.json(
        { error: 'QR no encontrado' },
        { status: 404 }
      );
    }

    const response = NextResponse.json(asistente);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('Error fetching asistente by QR:', error);
    return NextResponse.json(
      { error: 'Error al buscar asistente' },
      { status: 500 }
    );
  }
}
