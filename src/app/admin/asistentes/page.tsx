'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

export default function AsistentesPage() {
  const router = useRouter();
  const [asistentes, setAsistentes] = useState<any[]>([]);
  const [filteredAsistentes, setFilteredAsistentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    recaudado: 0,
    presentes: 0,
    ausentes: 0,
    transferencia: 0,
    efectivo: 0,
  });
  const [filters, setFilters] = useState({
    estado: '',
    metodo_pago: '',
    search: '',
  });

  useEffect(() => {
    fetchAsistentes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [asistentes, filters]);

  const fetchAsistentes = async () => {
    try {
      const response = await fetch('/api/asistentes');
      const data = await response.json();
      setAsistentes(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error fetching asistentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: any[]) => {
    setStats({
      total: data.length,
      recaudado: data.reduce((sum, a) => sum + a.monto, 0),
      presentes: data.filter(a => a.estado === 'presente').length,
      ausentes: data.filter(a => a.estado === 'no_presente').length,
      transferencia: data.filter(a => a.metodo_pago === 'transferencia').length,
      efectivo: data.filter(a => a.metodo_pago === 'efectivo').length,
    });
  };

  const applyFilters = () => {
    let filtered = asistentes;

    if (filters.estado) {
      filtered = filtered.filter(a => a.estado === filters.estado);
    }

    if (filters.metodo_pago) {
      filtered = filtered.filter(a => a.metodo_pago === filters.metodo_pago);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(a =>
        a.nombre.toLowerCase().includes(search) ||
        a.documento.includes(search)
      );
    }

    setFilteredAsistentes(filtered);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;

    try {
      const response = await fetch(`/api/asistentes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar asistente');
      }

      await fetchAsistentes();
    } catch (error) {
      console.error('Error deleting asistente:', error);
      alert('Error al eliminar asistente');
    }
  };

  const handleExportExcel = async () => {

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Asistentes');

    // Headers
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

    // Estilo de la cabecera
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF5B2333' } // Vinotinto
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true,
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: {style:'thin'},
        left: {style:'thin'},
        bottom: {style:'thin'},
        right: {style:'thin'}
      };
    });
    headerRow.height = 30;

    // Agregar filas
    filteredAsistentes.forEach(a => {
      worksheet.addRow({
        nombre: a.nombre,
        documento: a.documento,
        telefono: a.telefono,
        email: a.email || '',
        metodo_pago: a.metodo_pago.charAt(0).toUpperCase() + a.metodo_pago.slice(1),
        monto: a.monto,
        estado: a.estado === 'presente' ? 'Presente' : 'No Presente',
        fecha_pago: formatDate(a.fecha_pago),
        hora_ingreso: a.hora_ingreso ? formatDate(a.hora_ingreso) : '',
      });
    });

    // Dar formato de moneda a la columna de monto
    worksheet.getColumn('monto').numFmt = '"$"#,##0.00;[Red]\\-"$"#,##0.00';
    
    // Auto-filtro
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: filteredAsistentes.length + 1, column: 9 }
    };

    // Guardar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'BanqueteSoft_Asistentes.xlsx');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Colores de la marca
    const brandColor: [number, number, number] = [91, 35, 51]; // #5B2333

    // Título Principal
    doc.setFontSize(22);
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text('Reporte Oficial de Asistentes', 14, 20);
    
    // Subtítulo / Fecha
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 28);

    // Caja de Resumen
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(245, 240, 232); // #F5F0E8
    doc.roundedRect(14, 32, 182, 22, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    
    doc.text(`Total Registrados:`, 18, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`${stats.total}`, 55, 40);

    doc.setFont('helvetica', 'bold');
    doc.text(`Recaudado:`, 80, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`${formatCurrency(stats.recaudado)}`, 105, 40);

    doc.setFont('helvetica', 'bold');
    doc.text(`Presentes:`, 145, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`${stats.presentes}`, 168, 40);

    doc.setFont('helvetica', 'bold');
    doc.text(`Ausentes:`, 18, 48);
    doc.setFont('helvetica', 'normal');
    doc.text(`${stats.ausentes}`, 40, 48);

    // Preparar Datos para la Tabla
    const tableData = filteredAsistentes.map(a => [
      a.nombre,
      a.documento,
      a.telefono,
      a.metodo_pago.charAt(0).toUpperCase() + a.metodo_pago.slice(1),
      formatCurrency(a.monto),
      a.estado === 'presente' ? 'Presente' : 'No Presente',
    ]);

    // Tabla Estilizada
    autoTable(doc, {
      head: [['Nombre', 'Documento', 'Teléfono', 'Método', 'Monto', 'Estado']],
      body: tableData,
      startY: 62,
      theme: 'striped',
      headStyles: {
        fillColor: brandColor,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: [253, 251, 247] as [number, number, number] // Un tono crema muy claro #FDFBF7
      },
      columnStyles: {
        4: { halign: 'right' }, // Monto alineado a la derecha
        5: { halign: 'center' } // Estado alineado al centro
      }
    });

    // Guardar Documento
    doc.save('BanqueteSoft_Reporte_Asistentes.pdf');
  };

  const paymentTotal = stats.transferencia + stats.efectivo;
  const transferenciaPct = paymentTotal > 0 ? (stats.transferencia / paymentTotal) * 100 : 50;

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-warm-500 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Nav */}
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
              <h1 className="text-xl font-display font-bold text-primary-700">Administración</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Registrados */}
          <div className="card animate-fadeInUp">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warm-500">Total Registrados</p>
                <p className="text-3xl font-bold text-warm-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Recaudado */}
          <div className="card animate-fadeInUp-delay-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warm-500">Total Recaudado</p>
                <p className="text-3xl font-bold text-warm-900 mt-1">{formatCurrency(stats.recaudado)}</p>
              </div>
              <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Presentes */}
          <div className="card animate-fadeInUp-delay-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warm-500">Presentes</p>
                <p className="text-3xl font-bold text-success-600 mt-1">{stats.presentes}</p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Ausentes */}
          <div className="card animate-fadeInUp-delay-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warm-500">Ausentes</p>
                <p className="text-3xl font-bold text-warm-600 mt-1">{stats.ausentes}</p>
              </div>
              <div className="w-12 h-12 bg-warm-200 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card animate-fadeInUp-delay-1">
            <h3 className="text-lg font-display font-semibold text-warm-900 mb-4">Desglose por Método de Pago</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-warm-600">Transferencia</span>
                <span className="font-semibold text-warm-900">{stats.transferencia}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-warm-600">Efectivo</span>
                <span className="font-semibold text-warm-900">{stats.efectivo}</span>
              </div>
              {/* Visual proportion bar */}
              <div className="pt-2">
                <div className="flex h-3 rounded-full overflow-hidden bg-warm-100">
                  <div
                    className="bg-primary-500 transition-all duration-500"
                    style={{ width: `${transferenciaPct}%` }}
                  />
                  <div
                    className="bg-accent-500 transition-all duration-500"
                    style={{ width: `${100 - transferenciaPct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-warm-500">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary-500"></span>
                    Transferencia
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent-500"></span>
                    Efectivo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6 animate-fadeInUp-delay-2">
          <h3 className="text-lg font-display font-semibold text-warm-900 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label-field">Estado</label>
              <select
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                className="input-field"
              >
                <option value="">Todos</option>
                <option value="presente">Presente</option>
                <option value="no_presente">No Presente</option>
              </select>
            </div>

            <div>
              <label className="label-field">Método de Pago</label>
              <select
                value={filters.metodo_pago}
                onChange={(e) => setFilters({ ...filters, metodo_pago: e.target.value })}
                className="input-field"
              >
                <option value="">Todos</option>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>

            <div>
              <label className="label-field">Buscar</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input-field"
                placeholder="Nombre o documento"
              />
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={handleExportExcel}
                className="flex-1 btn-success"
              >
                Exportar Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 btn-accent"
              >
                Exportar PDF
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0 animate-fadeInUp-delay-3">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-warm-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">Documento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">Método</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">Fecha Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-warm-100">
                {filteredAsistentes.map((asistente, index) => (
                  <tr
                    key={asistente.id}
                    className={`hover:bg-warm-50 transition-colors ${index % 2 === 1 ? 'bg-warm-50/50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-warm-900">{asistente.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-warm-600">{asistente.documento}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-warm-600">{asistente.telefono}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-warm-600 capitalize">{asistente.metodo_pago}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-warm-900">{formatCurrency(asistente.monto)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`stat-badge ${
                        asistente.estado === 'presente'
                          ? 'bg-success-100 text-success-700'
                          : 'bg-warm-200 text-warm-600'
                      }`}>
                        {asistente.estado === 'presente' ? 'Presente' : 'No Presente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-warm-600">{formatDate(asistente.fecha_pago)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(asistente.id)}
                        className="text-danger-500 hover:text-danger-700 transition-colors hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAsistentes.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-warm-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-warm-500 font-medium">No se encontraron asistentes</p>
              <p className="text-warm-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
