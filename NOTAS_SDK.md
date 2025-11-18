# Notas sobre la Integración con el SDK One Touch

## ⚠️ Importante: Adaptación al SDK Real

Este código proporciona una estructura base para interactuar con el **SDK DigitalPersona One Touch** para el dispositivo U.are.U 4500. El SDK está ubicado en:
- **Ruta por defecto**: `C:\Program Files\DigitalPersona\One Touch SDK`

## 📚 Estructura del SDK One Touch

El SDK One Touch utiliza:
- **DPFPApi.dll** - API principal para adquisición de huellas
- **dpHFtrEx.dll** (o librería estática) - Feature Extraction (extracción de características)
- **dpHMatch.dll** (o librería estática) - Matching (comparación de huellas)

### Ubicación de las DLLs
- Las DLLs suelen estar en `C:\Windows\System32` después de la instalación
- Los headers y librerías están en `C:\Program Files\DigitalPersona\One Touch SDK\C-C++\`

## 🔧 Funciones que Requieren Adaptación

### 1. Captura de Huellas (`capture_fingerprint`)

El SDK One Touch usa un modelo basado en **mensajes de Windows** para notificaciones. La captura funciona así:

1. **Inicializar el SDK**: `DPFPInit()`
2. **Crear operación de adquisición**: `DPFPCreateAcquisition()`
3. **Iniciar captura**: `DPFPStartAcquisition()`
4. **Recibir notificaciones** a través de mensajes de Windows (WMUS_FP_NOTIFY)
5. **Procesar imagen** cuando se recibe `WN_COMPLETED`
6. **Extraer características** usando `FX_extractFeatures()`

**Nota importante**: El SDK One Touch requiere una ventana de Windows para recibir notificaciones. Para Python, esto puede ser complicado. Opciones:

#### Opción A: Usar una ventana oculta de Windows
```python
import ctypes
from ctypes import wintypes

# Crear ventana oculta para recibir mensajes
hwnd = ctypes.windll.user32.CreateWindowExW(
    0, "STATIC", None, 0, 0, 0, 0, 0, None, None, None, None
)

# Definir mensaje personalizado
WMUS_FP_NOTIFY = 0x8001  # O el valor que uses

# Crear operación de adquisición
operation_handle = c_void_p()
result = self.dpfpdd_dll.DPFPCreateAcquisition(
    2,  # DP_PRIORITY_NORMAL
    None,  # GUID_NULL
    4,  # DP_SAMPLE_TYPE_IMAGE
    hwnd,  # Ventana para notificaciones
    WMUS_FP_NOTIFY,  # Mensaje de Windows
    byref(operation_handle)
)
```

#### Opción B: Usar el SDK Java (más fácil desde Python)
El SDK incluye una versión Java que puede ser más fácil de usar desde Python mediante JNI o subprocess.

### 2. Extracción de Características

Después de obtener la imagen, necesitas extraer características:

```python
# Inicializar Feature Extraction
if self.dpfhtrex_dll:
    self.dpfhtrex_dll.FX_init()
    
    # Crear contexto
    fx_context = c_void_p()
    self.dpfhtrex_dll.FX_createContext(byref(fx_context))
    
    # Extraer características
    # FX_extractFeatures requiere la imagen y otros parámetros
    # Consulta dpFtrEx.h para la firma exacta
```

### 2. Funciones del SDK que Necesitas Verificar

Consulta la documentación de tu SDK para verificar los nombres exactos de las funciones:

#### dpfpdd.dll (Device Driver)
- `dpfpdd_create_context` - Crear contexto
- `dpfpdd_release_context` - Liberar contexto
- `dpfpdd_get_device_count` - Obtener número de dispositivos
- `dpfpdd_open_device` - Abrir dispositivo
- `dpfpdd_close_device` - Cerrar dispositivo
- `dpfpdd_start_capture` - Iniciar captura
- `dpfpdd_stop_capture` - Detener captura
- `dpfpdd_get_last_status` - Obtener último estado
- `dpfpdd_get_capture_data` - **Verificar si existe y su firma**

#### dpfj.dll (Fingerprint Java/API)
- `dpfj_create_fmd_from_raw` - Crear FMD desde datos raw
- `dpfj_compare_fmd` - Comparar dos FMDs
- `dpfj_get_fmd_size` - Obtener tamaño del FMD

### 3. Verificar Firmas de Funciones

Para verificar las firmas exactas de las funciones, puedes usar:

```python
import ctypes

# Cargar la DLL
dll = ctypes.CDLL("dpfpdd.dll", winmode=0)

# Listar funciones disponibles (si la DLL lo permite)
# O consulta la documentación del SDK
```

### 4. Callbacks para Captura Asíncrona

El SDK puede soportar captura asíncrona con callbacks. Ejemplo:

```python
# Definir tipo de callback
CAPTURE_CALLBACK = ctypes.WINFUNCTYPE(
    None,  # Retorno
    c_int,  # Status
    c_void_p  # User data
)

def capture_callback(status, user_data):
    """Callback llamado cuando cambia el estado de captura"""
    if status == DPFP_DD_PROCESS_COMPLETE:
        # Procesar captura completa
        pass

# Usar callback
callback_func = CAPTURE_CALLBACK(capture_callback)
result = self.dpfpdd_dll.dpfpdd_start_capture(
    0,
    self.device_handle,
    callback_func
)
```

## 📚 Recursos Útiles

1. **Documentación del SDK**
   - Busca en la carpeta de instalación del SDK
   - Generalmente incluye archivos `.h` (headers) con las definiciones

2. **Ejemplos del SDK**
   - El SDK suele incluir ejemplos en C/C++
   - Puedes usarlos como referencia para las llamadas a funciones

3. **Headers del SDK**
   - Archivos `.h` contienen las definiciones de funciones
   - Útiles para entender los tipos de datos y parámetros

## 🔍 Debugging

Para debuggear problemas con el SDK:

```python
# Habilitar logging detallado
import logging
logging.basicConfig(level=logging.DEBUG)

# Verificar códigos de retorno
result = self.dpfpdd_dll.dpfpdd_open_device(device_index, byref(handle))
if result != DPFP_DD_SUCCESS:
    print(f"Código de error: {result}")
    # Consulta la documentación para códigos de error específicos
```

## 📝 Formato de Templates

Los templates pueden estar en diferentes formatos:
- **ISO 19794-2 2005** (estándar internacional)
- **ANSI 378 2004** (estándar americano)
- **Formatos propietarios de DigitalPersona**

Asegúrate de usar el formato correcto en `dpfj_create_fmd_from_raw`.

## ✅ Checklist de Adaptación

- [ ] Verificar nombres exactos de funciones en tu versión del SDK
- [ ] Adaptar `capture_fingerprint` para obtener templates reales
- [ ] Verificar códigos de retorno y constantes del SDK
- [ ] Probar con el dispositivo físico
- [ ] Ajustar tamaños de buffers según el SDK
- [ ] Verificar formato de templates (ISO, ANSI, etc.)

---

**Nota**: Este código proporciona una base sólida, pero la integración final dependerá de la versión específica del SDK que tengas instalado.

