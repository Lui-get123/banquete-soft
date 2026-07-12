# Sistema de Gestión de Acceso - Banquetes y Eventos

Sistema completo para el control de acceso y gestión de pagos en eventos, con generación de códigos QR y validación en tiempo real.

## 🚀 Características

- **Registro de Pagos**: Formulario completo para registrar asistentes con generación automática de códigos QR
- **Escáner QR**: Validación de entrada usando la cámara del dispositivo con feedback visual inmediato
- **Dashboard Administrativo**: Panel con estadísticas en tiempo real y listado filtrable de asistentes
- **Exportación de Datos**: Generación de reportes en Excel y PDF
- **Autenticación**: Sistema de login seguro para personal autorizado
- **Base de Datos Local**: SQLite para almacenamiento persistente sin necesidad de servidor externo

## 📋 Requisitos Previos

- Node.js 18.x o superior
- npm o yarn

## 🛠️ Instalación

1. Clonar o navegar al directorio del proyecto
2. Instalar las dependencias:

```bash
npm install
```

3. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

4. Abrir el navegador en `http://localhost:3000`

## 🔑 Credenciales por Defecto

- **Usuario**: `admin`
- **Contraseña**: `admin123`

⚠️ **Importante**: Cambia estas credenciales en producción modificando el archivo `src/lib/db.ts`

## 📁 Estructura del Proyecto

```
banquete_soft/
├── src/
│   ├── app/
│   │   ├── api/              # Endpoints de la API
│   │   │   ├── auth/        # Autenticación
│   │   │   └── asistentes/  # CRUD de asistentes
│   │   ├── dashboard/       # Panel principal
│   │   ├── registro/        # Registro de pagos
│   │   ├── escaner/         # Escáner QR
│   │   ├── admin/           # Panel administrativo
│   │   └── login/           # Página de login
│   ├── lib/
│   │   ├── db.ts           # Configuración de base de datos
│   │   ├── auth.ts         # Funciones de autenticación
│   │   └── utils.ts        # Utilidades
│   ├── app/
│   │   ├── layout.tsx      # Layout principal
│   │   ├── page.tsx        # Página de inicio
│   │   └── globals.css     # Estilos globales
├── data/                   # Base de datos SQLite (se crea automáticamente)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🎯 Uso del Sistema

### 1. Registrar un Nuevo Asistente

1. Inicia sesión con las credenciales de administrador
2. Navega a **"Registrar Pago"**
3. Completa el formulario con los datos del asistente:
   - Nombre completo
   - Documento de identidad
   - Teléfono/WhatsApp
   - Correo electrónico (opcional)
   - Método de pago (Transferencia/Efectivo)
   - Monto pagado (por defecto $60.000 COP)
4. Al guardar, se generará automáticamente un código QR
5. Descarga o comparte el QR con el asistente

### 2. Validar Entrada con Escáner QR

1. Navega a **"Escáner QR"**
2. La cámara se activará automáticamente
3. Apunta la cámara hacia el código QR del asistente
4. El sistema mostrará la información del asistente:
   - Nombre y documento
   - Monto y método de pago
   - Estado actual
5. Usa el botón para marcar como "Presente" o "No Presente"
6. El sistema registrará la hora de ingreso automáticamente

### 3. Administrar Asistentes

1. Navega a **"Administración"**
2. Visualiza las estadísticas en tiempo real:
   - Total de registrados
   - Total recaudado
   - Presentes vs Ausentes
   - Desglose por método de pago
3. Usa los filtros para buscar asistentes específicos
4. Exporta los datos a Excel o PDF
5. Elimina registros si es necesario

## 🎨 Características de Diseño

- **Interfaz Moderna**: Diseño limpio con TailwindCSS
- **Responsive**: Funciona en desktop, tablet y móvil
- **Feedback Visual**: Colores intuitivos (verde = presente, gris = no presente)
- **Accesibilidad**: Alto contraste y botones grandes para uso rápido
- **Animaciones**: Transiciones suaves para mejor experiencia de usuario

## 🔧 Configuración

### Cambiar el Monto por Defecto

Edita el valor en `src/app/registro/page.tsx`:

```typescript
const [formData, setFormData] = useState({
  // ...
  monto: 60000, // Cambia este valor
  // ...
});
```

### Cambiar Credenciales de Admin

Edita `src/lib/db.ts`:

```typescript
const hashedPassword = bcrypt.hashSync('tu-nueva-contraseña', 10);
db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
  .run('tu-nuevo-usuario', hashedPassword, 'admin');
```

### Cambiar Secret de JWT

Edita `src/lib/auth.ts`:

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'tu-nuevo-secret-seguro';
```

## 📦 Tecnologías Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **Estilos**: TailwindCSS
- **Base de Datos**: lowdb (JSON-based - sin dependencias externas)
- **QR**: qrcode (generación), html5-qrcode (escaneo)
- **Exportación**: xlsx (Excel), jsPDF (PDF)
- **Autenticación**: bcryptjs, jsonwebtoken

## 🚀 Despliegue

### Para Producción

1. Construye la aplicación:

```bash
npm run build
```

2. Inicia el servidor de producción:

```bash
npm start
```

3. Asegúrate de:
   - Cambiar las credenciales por defecto
   - Usar un JWT_SECRET seguro
   - Configurar variables de entorno
   - Hacer backup regular de la base de datos

## 📝 Notas Importantes

- La base de datos SQLite se crea automáticamente en la carpeta `data/`
- Los códigos QR contienen un token único que referencia al registro en la base de datos
- El sistema requiere HTTPS para acceder a la cámara en producción
- Los datos se almacenan localmente, asegúrate de hacer backups

## 🐛 Solución de Problemas

### La cámara no funciona
- Asegúrate de estar usando HTTPS o localhost
- Verifica los permisos de la cámara en el navegador
- Algunos navegadores bloquean la cámara en iframes

### Error al instalar dependencias
- Asegúrate de tener Node.js 18+ instalado
- Intenta borrar `node_modules` y `package-lock.json` y reinstalar
- Este proyecto usa sql.js que no requiere herramientas de compilación nativas

### La base de datos no se crea
- Verifica permisos de escritura en la carpeta del proyecto
- Asegúrate de que la carpeta `data/` pueda ser creada
- lowdb usa archivos JSON, no requiere conexión a internet

## 📄 Licencia

Este proyecto fue desarrollado para gestión de eventos. Uso libre y modificable según necesidades.

## 👨‍💻 Soporte

Para problemas o sugerencias, contacta al equipo de desarrollo.
