# 📋 Sistema de Control de Asistencia con Huellas Digitales

Sistema completo de registro y control de asistencia para alumnos de escuela media superior utilizando lector de huellas digitales **DigitalPersona U.are.U 4500**.

## 🎯 Características Principales

- ✅ **Registro de Grupos**: Gestión de grupos con carrera técnica asociada
- ✅ **Registro de Alumnos**: Registro individual con nombre y huella digital
- ✅ **Sistema de Respaldo**: Registro manual de alumnos sin huella
- ✅ **Pasar Lista**: Sistema estructurado de verificación de asistencia por grupo
- ✅ **Registro Rápido**: Identificación automática mediante huella digital
- ✅ **Estadísticas**: Visualización de datos y reportes
- ✅ **Exportación a Excel**: Descarga de listas de asistencia en formato Excel

## 📁 Estructura del Proyecto

```
proyecto/
├── backend/                    # Backend API en Python (Flask)
│   ├── app.py                 # Aplicación Flask principal
│   ├── fingerprint_reader.py # Módulo de integración con SDK DigitalPersona
│   ├── requirements.txt       # Dependencias Python
│   ├── alumnos.json          # Base de datos de alumnos (se crea automáticamente)
│   └── grupos.json            # Base de datos de grupos (se crea automáticamente)
│
├── frontend/                  # Frontend en React
│   ├── src/
│   │   ├── App.js            # Componente principal
│   │   ├── components/       # Componentes React
│   │   │   ├── GruposView.js
│   │   │   ├── GrupoDetail.js
│   │   │   ├── RegistrarGrupo.js
│   │   │   ├── RegistrarAlumno.js
│   │   │   ├── VerificarAsistencia.js
│   │   │   ├── PasarLista.js
│   │   │   ├── RegistroRapido.js
│   │   │   └── Estadisticas.js
│   │   └── services/
│   │       └── api.js        # Servicio de comunicación con API
│   └── package.json          # Dependencias Node.js
│
├── .gitignore                 # Archivos ignorados por Git
├── README.md                  # Este archivo
└── NOTAS_SDK.md              # Notas sobre la integración con el SDK
```

## 🚀 Instalación y Configuración

### Requisitos Previos

1. **SDK de DigitalPersona One Touch instalado**
   - Ruta por defecto: `C:\Program Files\DigitalPersona\One Touch SDK`
   - DLLs deben estar en `C:\Windows\System32`

2. **Python 3.7 o superior** para el backend

3. **Node.js 14+ y npm** para el frontend

4. **Dispositivo DigitalPersona U.are.U 4500** conectado y funcionando

### Backend

1. **Navega a la carpeta backend**
   ```bash
   cd backend
   ```

2. **Crea un entorno virtual (recomendado)**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Instala las dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configura la ruta del SDK (si es necesario)**
   
   Edita `app.py` y ajusta la variable `SDK_PATH` si tu SDK está en otra ubicación:
   ```python
   SDK_PATH = r"C:\Program Files\DigitalPersona\One Touch SDK"
   ```

5. **Inicia el servidor**
   ```bash
   python app.py
   ```
   
   El servidor estará disponible en `http://localhost:5000`

### Frontend

1. **Navega a la carpeta frontend**
   ```bash
   cd frontend
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo**
   ```bash
   npm start
   ```
   
   La aplicación se abrirá automáticamente en `http://localhost:3000`

## 📖 Uso del Sistema

### 1. Registro de Grupos

1. Ve a la pestaña **"Grupos"**
2. Haz clic en **"Registrar Nuevo Grupo"**
3. Ingresa el nombre del grupo y la carrera técnica
4. Guarda el grupo

### 2. Registro de Alumnos

1. Selecciona un grupo de la lista
2. Haz clic en **"Ver Alumnos"**
3. Haz clic en **"Registrar Nuevo Alumno"**
4. Ingresa el nombre completo del alumno
5. El sistema intentará capturar la huella automáticamente
6. Si falla la captura, el alumno se registra sin huella (sistema de respaldo)

### 3. Pasar Lista

1. Ve a la pestaña **"Pasar Lista"**
2. Selecciona el grupo
3. El sistema mostrará los alumnos en orden alfabético
4. Para cada alumno:
   - Si tiene huella: Haz clic en **"Verificar con Huella Digital"**
   - Si no tiene huella: Haz clic en **"Registrar Asistencia Manual"**
5. Usa el botón **"Siguiente"** para avanzar al siguiente alumno

### 4. Registro Rápido

1. Ve a la pestaña **"Registro Rápido"**
2. Selecciona el grupo
3. Haz clic en **"Iniciar Captura de Huella"**
4. Coloca el dedo en el lector
5. El sistema identificará automáticamente al alumno y registrará la asistencia

### 5. Estadísticas y Reportes

1. Ve a la pestaña **"Estadísticas"**
2. Visualiza las estadísticas generales y por grupo
3. Descarga reportes en Excel:
   - **"Descargar Excel (Todos)"**: Reporte completo de todos los grupos
   - **"Excel"** (por grupo): Reporte específico de un grupo

## 📡 API Endpoints

### Grupos
- `GET /api/grupos` - Listar todos los grupos
- `POST /api/grupos` - Crear nuevo grupo
- `GET /api/grupos/<grupo_id>` - Obtener detalles de un grupo
- `DELETE /api/grupos/<grupo_id>` - Eliminar grupo
- `GET /api/grupos/<grupo_id>/alumnos` - Listar alumnos de un grupo
- `POST /api/grupos/<grupo_id>/alumnos` - Registrar alumno en grupo

### Alumnos
- `GET /api/alumnos` - Listar todos los alumnos (opcional: `?grupo_id=<id>`)
- `POST /api/alumnos/<alumno_id>/huella` - Registrar/actualizar huella
- `DELETE /api/alumnos/<alumno_id>` - Eliminar alumno
- `GET /api/alumnos/<alumno_id>/asistencias` - Obtener historial de asistencias
- `POST /api/alumnos/<alumno_id>/asistencias` - Registrar asistencia manual

### Asistencia
- `POST /api/asistencia/verificar` - Verificar asistencia mediante huella
  - Body: `{ "grupo_id": "GRP-001" }` (opcional)

### Estadísticas
- `GET /api/estadisticas` - Obtener estadísticas del sistema
- `GET /api/estadisticas/descargar-excel?grupo_id=<id>` - Descargar Excel de asistencias

### Sistema
- `GET /api/health` - Estado del sistema
- `GET /api/dispositivo/estado` - Estado del dispositivo de huellas

## 📊 Formato del Excel

El archivo Excel descargado contiene:

- **Fila 1**: Título con el nombre del grupo
- **Fila 2**: Encabezados (Alumno, Fechas...)
- **Filas siguientes**: 
  - Columna A: Nombre del alumno (ordenado alfabéticamente)
  - Columnas siguientes: Una por cada fecha
  - Marcadores:
    - `*` = Asistió (fondo verde)
    - `/` = No asistió (fondo rojo)

## 🔧 Configuración Avanzada

### Cambiar el Puerto del Backend

Edita `backend/app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5000)  # Cambia 5000 por el puerto deseado
```

### Cambiar la URL del API en el Frontend

Edita `frontend/src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';  // Cambia la URL si es necesario
```

## 🐛 Solución de Problemas

### Backend no inicia

- Verifica que Python esté instalado: `python --version`
- Verifica que las dependencias estén instaladas: `pip list`
- Verifica que el SDK esté en la ruta correcta
- Revisa los logs en la consola para errores específicos

### Frontend no inicia

- Verifica que Node.js esté instalado: `node --version`
- Ejecuta `npm install` en la carpeta frontend
- Verifica que el puerto 3000 esté disponible
- Elimina `node_modules` y `package-lock.json` y vuelve a instalar

### Dispositivo no detectado

- Verifica que el dispositivo esté conectado por USB
- Verifica que los drivers estén instalados
- Reinicia el dispositivo si es necesario
- Verifica que el SDK esté correctamente instalado
- Revisa el estado en la pestaña de estadísticas

### Error al capturar huella

- Asegúrate de que el dedo esté limpio y seco
- Coloca el dedo firmemente sobre el sensor
- Limpia el sensor si está sucio
- Intenta con otro dedo
- El sistema tiene reintentos automáticos (3 intentos)

### Error al generar Excel

- Verifica que `openpyxl` esté instalado: `pip install openpyxl`
- Verifica que haya datos de asistencia registrados
- Revisa los logs del backend para errores específicos

## 📝 Notas Importantes

- Las huellas se almacenan en formato base64 en `backend/alumnos.json`
- Los grupos se almacenan en `backend/grupos.json`
- Para producción, considera usar una base de datos real (PostgreSQL, MySQL, etc.)
- El sistema requiere Windows para funcionar con el SDK de DigitalPersona
- Las asistencias se registran con fecha y hora automáticamente

## 🛠️ Tecnologías Utilizadas

### Backend
- **Python 3.7+**
- **Flask** - Framework web
- **flask-cors** - Manejo de CORS
- **openpyxl** - Generación de archivos Excel
- **ctypes** - Integración con SDK DigitalPersona

### Frontend
- **React 19**
- **JavaScript (ES6+)**
- **CSS3** - Estilos personalizados

### Hardware
- **DigitalPersona U.are.U 4500** - Lector de huellas digitales
- **DigitalPersona One Touch SDK** - SDK oficial

## 📄 Licencia

Este proyecto está desarrollado para uso educativo en escuelas de nivel medio superior.

## 👨‍💻 Desarrollo

Sistema desarrollado para el control de asistencia mediante huellas digitales en escuelas de nivel medio superior.

### Características de Seguridad

- Validación de grupo antes de registrar asistencia
- Verificación de pertenencia del alumno al grupo
- Sistema de respaldo para alumnos sin huella
- Registro de fecha y hora de cada asistencia

### Mejoras Futuras

- [ ] Base de datos real (PostgreSQL/MySQL)
- [ ] Autenticación de usuarios
- [ ] Reportes avanzados con gráficos
- [ ] Exportación a PDF
- [ ] Notificaciones por email
- [ ] Aplicación móvil

## 📞 Soporte

Para problemas o preguntas:
1. Revisa la sección de [Solución de Problemas](#-solución-de-problemas)
2. Consulta `NOTAS_SDK.md` para información sobre la integración con el SDK
3. Revisa los logs del backend y frontend para errores específicos

---

**Desarrollado para Sistema de Control de Asistencia - Escuela Media Superior**
