# Sistema de Control de Asistencia con Huellas Digitales

Sistema completo de registro y control de asistencia para alumnos de escuela media superior utilizando lector de huellas digitales **DigitalPersona U.are.U 4500**.

## Estructura del Proyecto

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

##  Instalación y Configuración

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



##  Tecnologías Utilizadas

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

##  Licencia

Este proyecto está desarrollado para uso educativo en escuelas de nivel medio superior.

---

**Desarrollado para Sistema de Control de Asistencia - Escuela Media Superior**
