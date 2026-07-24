import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

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
