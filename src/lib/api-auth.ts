import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';
import { supabase } from './supabase';

type ApiHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse>;

export function withAuth(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'No autorizado. Token no proporcionado.' }, { status: 401 });
      }
      
      const token = authHeader.split(' ')[1];
      const user = verifyToken(token);
      
      if (!user) {
        return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 401 });
      }

      if (user.role === 'cliente' && user.status === 'pending') {
        return NextResponse.json({ error: 'Cuenta pendiente de aprobación.' }, { status: 403 });
      }

      req.headers.set('x-user-id', user.id.toString());
      req.headers.set('x-user-role', user.role);

      return handler(req, ...args);
    } catch (error) {
      console.error('API Auth Error:', error);
      return NextResponse.json({ error: 'Error de autenticación interna.' }, { status: 500 });
    }
  };
}

export async function checkEventOwnership(req: NextRequest, eventoId: string | number): Promise<boolean> {
  try {
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    
    if (userRole === 'superadmin') return true;
    if (!userId || !eventoId) return false;

    const { data, error } = await supabase
      .from('eventos')
      .select('cliente_id')
      .eq('id', parseInt(eventoId.toString()))
      .single();

    if (error || !data) return false;
    
    return data.cliente_id === parseInt(userId);
  } catch (error) {
    console.error('Error in checkEventOwnership:', error);
    return false;
  }
}
