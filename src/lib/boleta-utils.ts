import QRCode from 'qrcode';

export interface BoletaConfig {
  bg_url: string;
  qr_x: number; // percentage 0 to 1
  qr_y: number; // percentage 0 to 1
  qr_size: number; // percentage of width (e.g. 0.18)
  name_x: number; // percentage 0 to 1
  name_y: number; // percentage 0 to 1
  name_color: string;
}

export const generarImagenBoleta = async (asistente: any, previewConfig?: BoletaConfig | null): Promise<string> => {
  let config = previewConfig;

  // Si no hay previewConfig, intentamos descargarla de la API pública
  if (!config && asistente.evento_id) {
    try {
      const res = await fetch(`/api/public/boleta-config/${asistente.evento_id}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.bg_url) {
          config = data;
        }
      }
    } catch (e) {
      console.warn('Error fetching custom boleta config:', e);
    }
  }

  // Valores por defecto
  const defaultConfig: BoletaConfig = {
    bg_url: '/boleta.jpeg',
    qr_x: 0.7, 
    qr_y: 0.08,
    qr_size: 0.18,
    name_x: 0.79, // centro del QR (0.7 + 0.18/2)
    name_y: 0.28,
    name_color: '#5B2333'
  };

  const finalConfig = config || defaultConfig;

  // 1. Generar QR
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, asistente.qr_token || 'PREVIEW', {
    width: 200,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff00', 
    },
  }).catch(() => {});

  let qrImg = qrCanvas;
  if (qrCanvas.width <= 1) {
    const fallbackUrl = await QRCode.toDataURL(asistente.qr_token || 'PREVIEW');
    const img = new Image();
    img.src = fallbackUrl;
    await new Promise((resolve) => { img.onload = resolve; });
    qrImg = img as any;
  }

  // 2. Cargar Fondo
  const templateImg = new Image();
  templateImg.crossOrigin = "Anonymous"; // Importante para Base64/URLs externas
  templateImg.src = finalConfig.bg_url;
  
  await new Promise((resolve) => {
    templateImg.onload = resolve;
    templateImg.onerror = () => resolve(null);
  });

  const canvas = document.createElement('canvas');
  canvas.width = templateImg.width || 800;
  canvas.height = templateImg.height || 1200;
  const ctx = canvas.getContext('2d')!;

  if (templateImg.width) {
    ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#F5F0E8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 3. Dibujar QR
  const qrSizePx = Math.round(canvas.width * finalConfig.qr_size);
  const qrXPx = Math.round(canvas.width * finalConfig.qr_x);
  const qrYPx = Math.round(canvas.height * finalConfig.qr_y);

  ctx.drawImage(qrImg, qrXPx, qrYPx, qrSizePx, qrSizePx);

  // 4. Dibujar Nombre
  const fontSize = Math.max(13, Math.round(canvas.width * 0.025));
  ctx.textAlign = 'center';
  
  const textCenterX = Math.round(canvas.width * finalConfig.name_x);
  const textCenterY = Math.round(canvas.height * finalConfig.name_y);

  ctx.fillStyle = finalConfig.name_color; 
  ctx.font = `bold ${fontSize}px Georgia, serif`;

  const displayName = asistente.nombre.length > 22
    ? asistente.nombre.substring(0, 20) + '...'
    : asistente.nombre;
    
  ctx.fillText(displayName, textCenterX, textCenterY);

  return canvas.toDataURL('image/jpeg', 0.92);
};
