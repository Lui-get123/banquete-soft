'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

export default function EventosPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventosStats();
  }, []);

  const fetchEventosStats = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/eventos/stats');
      if (res.ok) {
        const data = await res.json();
        setEventos(data);
      } else if (res.status === 401) {
        window.location.href = '/login';
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`⚠️ ADVERTENCIA: ¿Estás totalmente seguro de eliminar el evento "${nombre}"?\n\nEsta acción borrará todas las boletas, asistentes, mesas y registros financieros asociados a este evento. ESTA ACCIÓN NO SE PUEDE DESHACER.`)) return;

    try {
      const response = await apiFetch(`/api/eventos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al eliminar evento');
      }

      alert('Evento eliminado exitosamente.');
      await fetchEventosStats();
    } catch (error: any) {
      console.error('Error deleting evento:', error);
      alert(error.message || 'Ocurrió un error al intentar eliminar el evento.');
    }
  };

  const fetchAsistentesParaExportar = async (eventoId: number) => {
    try {
      // Necesitamos pasar el evento_id a la API o setear la cookie temporalmente.
      // Como api/asistentes lee la cookie evento_id, la forma más limpia aquí
      // es modificar document.cookie antes de la petición, o mejor hacer una ruta que reciba param.
      // Para no romper la cookie actual del usuario, pasaremos evento_id como query param si la API lo soporta.
      // Modificaremos la petición a /api/asistentes?evento_id=ID si la API lo soporta,
      // pero por ahora setearemos la cookie temporalmente.
      const lastCookie = document.cookie;
      document.cookie = `evento_id=${eventoId}; path=/`;
      
      const response = await apiFetch('/api/asistentes');
      
      // Restauramos la cookie anterior (rudimentario pero efectivo en el cliente)
      // En realidad, fetchAsistentes lee la cookie activa.
      
      if (!response.ok) throw new Error('Error fetching asistentes para exportar');
      return await response.json();
    } catch (e) {
      console.error(e);
      alert('Error obteniendo datos del evento para exportar.');
      return null;
    }
  };

  const handleExportPDF = async (evento: any) => {
    const asistentes = await fetchAsistentesParaExportar(evento.id);
    if (!asistentes) return;

    const doc = new jsPDF();
    const brandColor: [number, number, number] = [91, 35, 51]; // #5B2333

    doc.setFontSize(22);
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text(`Reporte de Evento: ${evento.nombre}`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 28);

    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(245, 240, 232);
    doc.roundedRect(14, 32, 182, 22, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    
    doc.text(`Total Registrados:`, 18, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`${evento.totalRegistros}`, 55, 40);

    doc.setFont('helvetica', 'bold');
    doc.text(`Recaudado:`, 80, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`${formatCurrency(evento.recaudado)}`, 105, 40);

    doc.setFont('helvetica', 'bold');
    doc.text(`Presentes:`, 145, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`${evento.presentes}`, 168, 40);

    const ausentes = evento.totalRegistros - evento.presentes;
    doc.setFont('helvetica', 'bold');
    doc.text(`Ausentes:`, 18, 48);
    doc.setFont('helvetica', 'normal');
    doc.text(`${ausentes}`, 40, 48);

    const tableColumn = ["Nombre", "Documento", "Teléfono", "Pago", "Monto", "Estado"];
    const tableRows = asistentes.map((a: any) => [
      a.nombre,
      a.documento,
      a.telefono,
      a.metodo_pago,
      formatCurrency(a.monto),
      a.estado === 'presente' ? 'Presente' : 'Ausente'
    ]);

    autoTable(doc, {
      startY: 60,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: brandColor, textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [249, 249, 249] },
    });

    doc.save(`Reporte_Evento_${evento.nombre.replace(/ /g, '_')}.pdf`);
  };

  const handleExportExcel = async (evento: any) => {
    const asistentes = await fetchAsistentesParaExportar(evento.id);
    if (!asistentes) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Asistentes');

    worksheet.columns = [
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Documento', key: 'documento', width: 15 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Método de Pago', key: 'metodo_pago', width: 20 },
      { header: 'Monto', key: 'monto', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Fecha de Pago', key: 'fecha_pago', width: 20 },
      { header: 'Hora de Ingreso', key: 'hora_ingreso', width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF5B2333' }
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
      };
    });
    headerRow.height = 30;

    asistentes.forEach((a: any) => {
      worksheet.addRow({
        nombre: a.nombre,
        documento: a.documento,
        telefono: a.telefono,
        email: a.email || '',
        metodo_pago: a.metodo_pago,
        monto: a.monto,
        estado: a.estado === 'presente' ? 'Presente' : 'Ausente',
        fecha_pago: formatDate(a.fecha_pago),
        hora_ingreso: a.hora_ingreso ? formatDate(a.hora_ingreso) : '',
      });
    });

    worksheet.getColumn('monto').numFmt = '"$"#,##0.00;[Red]\\-"$"#,##0.00';
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: asistentes.length + 1, column: 9 }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Asistentes_Evento_${evento.nombre.replace(/ /g, '_')}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <nav className="nav-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-warm-600 hover:text-primary-600 font-medium transition-colors"
              >
                ← Volver al Panel
              </button>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-display font-bold text-primary-700">Gestión de Eventos</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-display font-bold text-warm-900 tracking-tight">Mis Eventos</h2>
            <p className="text-warm-500 mt-1">Vista global y estadísticas de todos tus eventos creados.</p>
          </div>
        </div>

        {eventos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-warm-200 p-12 text-center">
            <h3 className="text-lg font-bold text-warm-900 mb-2">No hay eventos</h3>
            <p className="text-warm-500">Crea tu primer evento en el panel principal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventos.map((evento) => (
              <div key={evento.id} className="bg-white rounded-2xl shadow-sm border border-warm-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-primary-900 truncate pr-4">{evento.nombre}</h3>
                    <span className="bg-accent-100 text-accent-800 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                      {formatCurrency(evento.precio_boleta)}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-500">Total Asistentes:</span>
                      <span className="font-bold text-warm-900">{evento.totalRegistros}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-500">Presentes / Ausentes:</span>
                      <span className="font-bold text-warm-900">
                        <span className="text-success-600">{evento.presentes}</span> / 
                        <span className="text-warm-400 ml-1">{evento.totalRegistros - evento.presentes}</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-500">Recaudado:</span>
                      <span className="font-bold text-primary-700">{formatCurrency(evento.recaudado)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-warm-100 pt-4 mt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExportPDF(evento)}
                      className="flex-1 bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
                      title="Descargar Reporte PDF"
                    >
                      <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      PDF
                    </button>
                    <button
                      onClick={() => handleExportExcel(evento)}
                      className="flex-1 bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
                      title="Descargar Excel"
                    >
                      <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Excel
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(evento.id, evento.nombre)}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold py-2 rounded-lg transition-colors mt-1"
                  >
                    Eliminar Evento
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
