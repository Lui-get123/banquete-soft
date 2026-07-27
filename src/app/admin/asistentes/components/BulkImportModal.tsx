'use client';

import { useState, useRef } from 'react';
import ExcelJS from 'exceljs';
import { apiFetch } from '@/lib/api';
import { generarImagenBoleta } from '@/lib/boleta-utils';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoSend, setAutoSend] = useState(false);
  const [progressText, setProgressText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setPreviewData([]);
    setIsProcessing(false);
    setProgressText('');
    setAutoSend(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla');

    worksheet.columns = [
      { header: 'Nombre Completo', key: 'nombre', width: 30 },
      { header: 'Documento', key: 'documento', width: 20 },
      { header: 'Telefono', key: 'telefono', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'MetodoPago (efectivo/transferencia)', key: 'metodo_pago', width: 35 },
      { header: 'MontoPagado', key: 'monto', width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF5B2333' }
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });

    worksheet.addRow({
      nombre: 'Juan Perez',
      documento: '1234567890',
      telefono: '3001234567',
      email: 'juan@example.com',
      metodo_pago: 'transferencia',
      monto: 50000
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Plantilla_Asistentes.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setProgressText('Leyendo archivo...');

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.worksheets[0];
      const parsedData: any[] = [];
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const getCellValue = (colIndex: number) => {
          const cell = row.getCell(colIndex);
          return cell ? cell.value?.toString().trim() || '' : '';
        };

        const nombre = getCellValue(1);
        if (!nombre) return; // Skip empty rows
        
        parsedData.push({
          nombre,
          documento: getCellValue(2),
          telefono: getCellValue(3),
          email: getCellValue(4),
          metodo_pago: getCellValue(5) || 'transferencia',
          monto: parseFloat(getCellValue(6)) || 0,
          error: !nombre || !getCellValue(2) ? 'Falta nombre o documento' : null
        });
      });

      setPreviewData(parsedData);
    } catch (err) {
      console.error(err);
      alert('Error al leer el archivo Excel. Asegúrate de usar el formato correcto.');
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const handleImport = async () => {
    const hasErrors = previewData.some(d => d.error);
    if (hasErrors) {
      alert('Por favor corrige las filas con errores antes de continuar.');
      return;
    }

    if (previewData.length === 0) {
      alert('No hay datos para importar.');
      return;
    }

    setIsProcessing(true);
    setProgressText('Guardando asistentes en la base de datos...');

    try {
      // 1. Guardar en Base de Datos (Bulk)
      const res = await apiFetch('/api/asistentes/bulk', {
        method: 'POST',
        body: JSON.stringify({ asistentes: previewData })
      });

      if (!res.ok) {
        throw new Error('Error en el servidor al guardar asistentes');
      }

      const creados = await res.json();
      
      // 2. Si Auto-Send está activado, enviar boletas
      if (autoSend) {
        const asistentesConEmail = creados.filter((a: any) => a.email && a.email.includes('@'));
        
        for (let i = 0; i < asistentesConEmail.length; i++) {
          const a = asistentesConEmail[i];
          setProgressText(`Generando y enviando boleta ${i + 1} de ${asistentesConEmail.length}...`);
          
          try {
            const base64 = await generarImagenBoleta(a);
            await apiFetch('/api/enviar-boletas', {
              method: 'POST',
              body: JSON.stringify({
                email: a.email,
                boletasBase64: [base64]
              })
            });
          } catch (err) {
            console.error(`Error enviando a ${a.email}:`, err);
          }
        }
        alert('¡Importación y envío automático completados!');
      } else {
        alert('¡Asistentes importados exitosamente!');
      }

      resetState();
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error en la importación.');
      setIsProcessing(false);
      setProgressText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-warm-900">Importar desde Excel</h2>
          <button onClick={() => { resetState(); onClose(); }} className="text-warm-400 hover:text-warm-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!file && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-warm-300 rounded-xl p-12 bg-warm-50">
            <svg className="w-16 h-16 text-warm-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-warm-600 mb-6 text-center max-w-md">
              Sube tu archivo de Excel (.xlsx) con los datos de los invitados. Si no tienes el formato, descarga nuestra plantilla.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={downloadTemplate}
                className="bg-white border border-warm-300 hover:bg-warm-50 text-warm-700 font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Descargar Plantilla
              </button>
              <label className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors shadow-sm">
                Seleccionar Archivo
                <input 
                  type="file" 
                  accept=".xlsx" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        )}

        {file && previewData.length > 0 && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-warm-900">Vista Previa ({previewData.length} registros)</h3>
              <label className="flex items-center gap-2 text-sm font-medium text-warm-700 bg-warm-100 px-3 py-2 rounded-lg cursor-pointer hover:bg-warm-200 transition-colors">
                <input 
                  type="checkbox" 
                  checked={autoSend}
                  onChange={(e) => setAutoSend(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-warm-300 focus:ring-primary-600"
                />
                Enviar boletas automáticamente (a los que tienen correo)
              </label>
            </div>
            
            <div className="flex-1 overflow-auto border border-warm-200 rounded-xl">
              <table className="min-w-full divide-y divide-warm-200">
                <thead className="bg-warm-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-warm-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-warm-500 uppercase tracking-wider">Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-warm-500 uppercase tracking-wider">Teléfono / Email</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-warm-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-warm-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-warm-200">
                  {previewData.map((d, i) => (
                    <tr key={i} className={d.error ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-warm-900">{d.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-warm-500">{d.documento}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-warm-500">
                        <div>{d.telefono}</div>
                        <div className="text-xs text-warm-400">{d.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-warm-900">${d.monto}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {d.error ? (
                          <span className="text-red-600 font-bold text-xs">{d.error}</span>
                        ) : (
                          <span className="text-success-600 font-bold text-xs">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col items-center border-t border-warm-200 pt-6">
              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                  <p className="text-warm-600 font-medium">{progressText}</p>
                </div>
              ) : (
                <div className="flex gap-4 w-full justify-end">
                  <button 
                    onClick={resetState}
                    className="px-6 py-2 border border-warm-300 rounded-lg text-warm-700 font-bold hover:bg-warm-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleImport}
                    disabled={previewData.some(d => d.error)}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmar e Importar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
