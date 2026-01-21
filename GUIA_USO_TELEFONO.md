# Guía: Cómo usar el sistema desde tu teléfono móvil

## 📱 Configuración Inicial

### Paso 1: Encontrar la IP de tu computadora

**Windows:**
1. Abre PowerShell o CMD
2. Escribe: `ipconfig`
3. Busca "IPv4 Address" (ejemplo: `192.168.1.100`)

**Mac:**
1. Abre Terminal
2. Escribe: `ifconfig | grep "inet "`
3. Busca la IP que empieza con `192.168.` o `10.0.`

**Linux:**
1. Abre Terminal
2. Escribe: `hostname -I` o `ip addr`

### Paso 2: Iniciar el servidor backend

En la computadora, abre una terminal:

```bash
cd backend
python app.py
```

Deberías ver:
```
Iniciando servidor en http://localhost:5000
```

### Paso 3: Iniciar el frontend

En otra terminal de la computadora:

```bash
cd frontend
npm start
```

Deberías ver:
```
Compiled successfully!
Local: http://localhost:3000
```

### Paso 4: Configurar para acceso desde red local

El frontend por defecto solo acepta conexiones desde `localhost`. Para permitir acceso desde tu teléfono:

**Opción A: Usar variable de entorno (Recomendado)**

En Windows PowerShell:
```powershell
$env:HOST='0.0.0.0'
npm start
```

En Mac/Linux:
```bash
HOST=0.0.0.0 npm start
```

**Opción B: Modificar package.json**

Agrega en `frontend/package.json`:
```json
"scripts": {
  "start": "HOST=0.0.0.0 react-scripts start"
}
```

### Paso 5: Conectar el teléfono

1. **Asegúrate de que el teléfono y la computadora estén en la misma red WiFi**

2. **En el teléfono, abre el navegador** (Chrome, Safari, Firefox)

3. **Ve a la dirección:**
   ```
   http://TU_IP_COMPUTADORA:3000
   ```
   
   Ejemplo: `http://192.168.1.100:3000`

4. **Si aparece un error de conexión:**
   - Verifica que ambos dispositivos estén en la misma WiFi
   - Verifica que el firewall de Windows no esté bloqueando el puerto 3000
   - Intenta desactivar temporalmente el firewall para probar

## 🔐 Usar el Lector de Huellas

### Registro de Huella

1. En el teléfono, ve a la aplicación web
2. Navega a: Grupos → Selecciona grupo → Ver Alumnos
3. Haz clic en "Registrar Huella" para un alumno
4. Aparecerá un diálogo del sistema: **"Usa tu huella digital"**
5. Coloca el dedo en el lector del teléfono
6. ¡Listo! La huella queda registrada

### Verificación de Asistencia

1. Ve a la pestaña "Registro Rápido" o "Pasar Lista"
2. Selecciona el grupo
3. Haz clic en "Iniciar Captura de Huella"
4. Aparecerá el diálogo: **"Usa tu huella digital"**
5. El alumno coloca el dedo
6. El sistema identifica automáticamente y registra la asistencia

## ⚠️ Solución de Problemas

### "No se puede conectar al servidor"

- Verifica que el backend esté corriendo (`python app.py`)
- Verifica que ambos dispositivos estén en la misma red
- Verifica la IP de la computadora
- Intenta `ping IP_COMPUTADORA` desde el teléfono (si tienes una app de red)

### "WebAuthn no está disponible"

- Asegúrate de usar un navegador moderno (Chrome, Safari, Firefox)
- Verifica que el dispositivo tenga lector de huellas
- Asegúrate de estar usando HTTPS o localhost (localhost funciona en desarrollo)

### "El navegador no muestra el diálogo de huella"

- Verifica los permisos del navegador para usar biométricos
- Intenta cerrar y abrir el navegador
- Verifica que el lector de huellas del teléfono funcione (prueba desbloqueando el teléfono)

### Firewall bloqueando conexiones

**Windows:**
1. Ve a "Firewall de Windows Defender"
2. Configuración avanzada
3. Reglas de entrada → Nueva regla
4. Puerto → TCP → 3000 y 5000 → Permitir conexión

**Mac:**
- Sistema → Seguridad → Firewall → Opciones
- Permite conexiones entrantes para Node y Python

## 📋 Resumen Rápido

```
1. Computadora y teléfono en misma WiFi ✅
2. Backend corriendo en computadora (puerto 5000) ✅
3. Frontend corriendo con HOST=0.0.0.0 (puerto 3000) ✅
4. Teléfono accede a: http://IP_COMPUTADORA:3000 ✅
5. Usa el lector de huellas del teléfono ✅
```

## 🎯 Ejemplo Práctico

**Escenario:** Computadora con IP `192.168.1.100`

1. **En computadora:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   python app.py
   
   # Terminal 2 - Frontend
   cd frontend
   HOST=0.0.0.0 npm start
   ```

2. **En teléfono:**
   - Abre Chrome/Safari
   - Ve a: `http://192.168.1.100:3000`
   - ¡Usa la aplicación normalmente!

3. **Para registrar huella:**
   - El navegador del teléfono mostrará automáticamente el diálogo del sistema
   - Usa el lector de huellas del teléfono
   - ¡Funciona!

## 💡 Consejos

- **Mantén ambos dispositivos cerca** para mejor conexión WiFi
- **Usa el teléfono en modo horizontal** para mejor experiencia
- **Guarda la IP de la computadora** para acceso rápido
- **Considera usar un nombre de dominio local** (avanzado) para no recordar IPs
