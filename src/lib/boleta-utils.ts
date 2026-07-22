import QRCode from 'qrcode';

export const generarImagenBoleta = async (asistente: any): Promise<string> => {
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, asistente.qr_token, {
    width: 200,
    margin: 1,
    color: {
      dark: '#5B2333',  
      light: '#00000000', 
    },
  }).catch(() => {});

  let qrImg = qrCanvas;
  if (qrCanvas.width <= 1) {
    const fallbackUrl = await QRCode.toDataURL(asistente.qr_token);
    const img = new Image();
    img.src = fallbackUrl;
    await new Promise((resolve) => { img.onload = resolve; });
    qrImg = img as any;
  }

  const templateImg = new Image();
  templateImg.src = '/boleta.jpeg';
  
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

  const qrSize = Math.round(canvas.width * 0.18);
  const marginX = Math.round(canvas.width * 0.12);
  const marginY = Math.round(canvas.height * 0.08);
  const qrX = canvas.width - qrSize - marginX;
  const qrY = marginY;

  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  const fontSize = Math.max(13, Math.round(canvas.width * 0.025));
  ctx.textAlign = 'center';
  const textCenterX = qrX + qrSize / 2;

  ctx.fillStyle = '#5B2333'; 
  ctx.font = `bold ${fontSize}px Georgia, serif`;
  const nameY = qrY + qrSize + fontSize + 6;

  const displayName = asistente.nombre.length > 22
    ? asistente.nombre.substring(0, 20) + '...'
    : asistente.nombre;
  ctx.fillText(displayName, textCenterX, nameY);

  return canvas.toDataURL('image/jpeg', 0.92);
};
