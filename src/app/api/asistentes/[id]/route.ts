import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// PATCH - Update asistente (e.g., change status)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id);
    const body = await request.json();
    const { estado } = body;

    if (estado !== 'presente' && estado !== 'no_presente') {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    const updateData: any = { estado, updated_at: new Date().toISOString() };

    if (estado === 'presente') {
      updateData.hora_ingreso = new Date().toISOString();
    } else {
      updateData.hora_ingreso = null;
    }

    const { data: updatedAsistente, error } = await supabase
      .from('asistentes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updatedAsistente);
  } catch (error) {
    console.error('Error updating asistente:', error);
    return NextResponse.json(
      { error: 'Error al actualizar asistente' },
      { status: 500 }
    );
  }
}

// DELETE - Delete asistente
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id);

    const { error } = await supabase
      .from('asistentes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asistente:', error);
    return NextResponse.json(
      { error: 'Error al eliminar asistente' },
      { status: 500 }
    );
  }
}
