# Solución: "Lector de huellas no disponible"

## 🔍 Problema

WebAuthn (la API que usa el lector de huellas) **requiere un contexto seguro**:
- ✅ HTTPS (https://)
- ✅ localhost (http://localhost)
- ✅ 127.0.0.1 (http://127.0.0.1)
- ❌ **NO funciona con IPs normales** (http://192.168.x.x)

## ✅ Soluciones

### Opción 1: Usar localhost (Más fácil para desarrollo)

**En la computadora:**
1. Accede desde: `http://localhost:3000` (no uses la IP)
2. El teléfono puede acceder usando la IP, pero mejor usa la Opción 2

### Opción 2: Configurar HTTPS local (Recomendado)

#### Usando mkcert (Windows/Mac/Linux)

1. **Instala mkcert:**
   ```bash
   # Windows (con Chocolatey)
   choco install mkcert
   
   # Mac
   brew install mkcert
   
   # Linux
   # Descarga desde: https://github.com/FiloSottile/mkcert/releases
   ```

2. **Crea certificado local:**
   ```bash
   mkcert -install
   mkcert localhost 127.0.0.1 ::1 192.168.1.100
   # Reemplaza 192.168.1.100 con tu IP
   ```

3. **Modifica el frontend para usar HTTPS:**

   Crea `frontend/.env`:
   ```
   HTTPS=true
   SSL_CRT_FILE=../localhost+3.pem
   SSL_KEY_FILE=../localhost+3-key.pem
   ```

4. **Reinicia el frontend:**
   ```bash
   npm start
   ```

5. **Accede desde:** `https://localhost:3000` o `https://TU_IP:3000`

#### Usando ngrok (Más rápido, para pruebas)

1. **Instala ngrok:**
   - Descarga de: https://ngrok.com/download
   - O con Chocolatey: `choco install ngrok`

2. **Inicia el túnel:**
   ```bash
   ngrok http 3000
   ```

3. **Usa la URL HTTPS que te da ngrok:**
   - Ejemplo: `https://abc123.ngrok.io`
   - Esta URL funciona desde cualquier dispositivo

### Opción 3: Modificar el código para permitir IPs (NO RECOMENDADO)

Si realmente necesitas usar IPs sin HTTPS, puedes modificar la verificación, pero **WebAuthn puede no funcionar correctamente** en algunos navegadores.

## 🧪 Cómo verificar que funciona

1. Abre la consola del navegador (F12)
2. Ejecuta en la consola:
   ```javascript
   console.log('Secure Context:', window.isSecureContext);
   console.log('Protocol:', window.location.protocol);
   console.log('WebAuthn Available:', typeof PublicKeyCredential !== 'undefined');
   ```

3. Deberías ver:
   - `Secure Context: true`
   - `Protocol: https:` o `http:` (solo si es localhost)
   - `WebAuthn Available: true`

## 📱 Para usar desde el teléfono

### Opción A: Usar ngrok (Más fácil)

1. En computadora: `ngrok http 3000`
2. Copia la URL HTTPS (ejemplo: `https://abc123.ngrok.io`)
3. En teléfono: Abre esa URL en Chrome/Safari
4. ✅ WebAuthn funcionará porque es HTTPS

### Opción B: Configurar HTTPS local

1. Sigue los pasos de la Opción 2 arriba
2. En el teléfono, acepta el certificado (primera vez)
3. Accede a `https://TU_IP:3000`

## ⚠️ Notas importantes

- **Chrome/Safari en móviles** son más estrictos con WebAuthn
- **Firefox** puede ser más permisivo en desarrollo
- **Siempre prueba primero en localhost** antes de usar IPs
- **En producción**, siempre usa HTTPS real

## 🔧 Verificación rápida

Si ves este mensaje:
> "WebAuthn requiere HTTPS o localhost. Estás usando: http://192.168.1.100"

**Solución inmediata:**
1. En computadora: Accede a `http://localhost:3000`
2. O configura ngrok: `ngrok http 3000` y usa la URL HTTPS

## 💡 Consejo

Para desarrollo rápido, usa **ngrok**. Es la forma más fácil de tener HTTPS sin configuración compleja.

```bash
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend  
cd frontend
npm start

# Terminal 3 - ngrok
ngrok http 3000

# Usa la URL HTTPS de ngrok en tu teléfono
```
