"""
Módulo para interactuar con el lector de huellas digitales U.are.U 4500
Utiliza el SDK de DigitalPersona a través de ctypes
"""

import ctypes
import os
import sys
from ctypes import c_int, c_char_p, c_void_p, POINTER, Structure, byref
from typing import Optional, Tuple, List
import json
from datetime import datetime


# Constantes del SDK DigitalPersona
DPFP_DD_SUCCESS = 0
DPFP_DD_FAIL = 1

# Tipos de datos para templates
DPFP_FMD_FORMAT_ISO_19794_2_2005 = 0x0001
DPFP_FMD_FORMAT_ANSI_378_2004 = 0x0002
DPFP_FMD_FORMAT_DP_PRE_REG_FEATURES = 0x0003
DPFP_FMD_FORMAT_DP_REG_FEATURES = 0x0004
DPFP_FMD_FORMAT_DP_VER_FEATURES = 0x0005

# Estados de captura
DPFP_DD_PROCESS_COMPLETE = 0
DPFP_DD_PROCESS_FAILURE = 1
DPFP_DD_PROCESS_GOOD = 2
DPFP_DD_PROCESS_NOT_READY = 3


class FingerprintReader:
    """Clase para manejar el lector de huellas digitales U.are.U 4500"""
    
    def __init__(self, sdk_path: Optional[str] = None):
        """
        Inicializa el lector de huellas
        
        Args:
            sdk_path: Ruta al directorio del SDK (opcional, busca en ubicaciones comunes)
        """
        self.sdk_loaded = False
        self.device_handle = None
        self.dpfpdd_dll = None  # DPFPApi.dll
        self.dpfj_dll = None    # dpHMatch.dll (Matching)
        self.dpfhtrex_dll = None  # dpHFtrEx.dll (Feature Extraction)
        self.sdk_path = sdk_path or r"C:\Program Files\DigitalPersona\One Touch SDK"
        
        # Intentar cargar las DLLs del SDK
        self._load_sdk(sdk_path)
        
    def _load_sdk(self, sdk_path: Optional[str] = None):
        """Carga las DLLs del SDK de DigitalPersona One Touch"""
        # Rutas comunes donde puede estar el SDK
        common_paths = [
            sdk_path,
            r"C:\Program Files\DigitalPersona\One Touch SDK",
            r"C:\Windows\System32",
            r"C:\Program Files (x86)\DigitalPersona\One Touch SDK",
            r"C:\Program Files\DigitalPersona\Bin",
            r"C:\Program Files (x86)\DigitalPersona\Bin",
            os.path.dirname(os.path.abspath(__file__)),
        ]
        
        # Buscar DPFPApi.dll (API principal del One Touch SDK)
        # También buscamos las DLLs antiguas por compatibilidad
        for path in common_paths:
            if path is None:
                continue
            
            # Intentar cargar DPFPApi.dll (One Touch SDK)
            dpfpapi_path = os.path.join(path, "DPFPApi.dll")
            if not os.path.exists(dpfpapi_path):
                # Buscar en System32 si no está en la ruta especificada
                dpfpapi_path = os.path.join(r"C:\Windows\System32", "DPFPApi.dll")
            
            # También buscar las DLLs de Feature Extraction y Matching
            # Estas pueden estar como DLLs o como librerías estáticas
            dpfhtrex_path = None
            dphmatch_path = None
            
            # Buscar en System32 (ubicación más común)
            system32_path = r"C:\Windows\System32"
            if os.path.exists(os.path.join(system32_path, "dpHFtrEx.dll")):
                dpfhtrex_path = os.path.join(system32_path, "dpHFtrEx.dll")
            if os.path.exists(os.path.join(system32_path, "dpHMatch.dll")):
                dphmatch_path = os.path.join(system32_path, "dpHMatch.dll")
            
            # Si no están en System32, buscar en la ruta del SDK
            if not dpfhtrex_path and path:
                test_path = os.path.join(path, "dpHFtrEx.dll")
                if os.path.exists(test_path):
                    dpfhtrex_path = test_path
            if not dphmatch_path and path:
                test_path = os.path.join(path, "dpHMatch.dll")
                if os.path.exists(test_path):
                    dphmatch_path = test_path
            
            try:
                # Cargar DPFPApi.dll (API principal)
                if os.path.exists(dpfpapi_path):
                    self.dpfpdd_dll = ctypes.CDLL(dpfpapi_path, winmode=0)
                    print(f"✓ DPFPApi.dll cargado desde: {dpfpapi_path}")
                else:
                    # Intentar cargar desde System32
                    try:
                        self.dpfpdd_dll = ctypes.windll.DPFPApi
                        print("✓ DPFPApi.dll cargado desde System32")
                    except:
                        print("⚠ DPFPApi.dll no encontrada, intentando métodos alternativos...")
                        continue
                
                # Cargar Feature Extraction (si está disponible como DLL)
                if dpfhtrex_path:
                    self.dpfhtrex_dll = ctypes.CDLL(dpfhtrex_path, winmode=0)
                    print(f"✓ dpHFtrEx.dll cargado desde: {dpfhtrex_path}")
                else:
                    # Intentar cargar desde System32
                    try:
                        self.dpfhtrex_dll = ctypes.windll.dpHFtrEx
                        print("✓ dpHFtrEx.dll cargado desde System32")
                    except:
                        self.dpfhtrex_dll = None
                        print("⚠ dpHFtrEx.dll no encontrada (puede estar como librería estática)")
                
                # Cargar Matching (si está disponible como DLL)
                if dphmatch_path:
                    self.dpfj_dll = ctypes.CDLL(dphmatch_path, winmode=0)
                    print(f"✓ dpHMatch.dll cargado desde: {dphmatch_path}")
                else:
                    # Intentar cargar desde System32
                    try:
                        self.dpfj_dll = ctypes.windll.dpHMatch
                        print("✓ dpHMatch.dll cargado desde System32")
                    except:
                        self.dpfj_dll = None
                        print("⚠ dpHMatch.dll no encontrada (puede estar como librería estática)")
                
                self.sdk_loaded = True
                self._setup_dpfpdd_functions()
                if self.dpfhtrex_dll:
                    self._setup_fx_functions()
                if self.dpfj_dll:
                    self._setup_mc_functions()
                return
            except Exception as e:
                print(f"Error al cargar SDK desde {path}: {e}")
                continue
        
        print("⚠ Advertencia: No se encontraron las DLLs del SDK.")
        print("Por favor, asegúrate de que DPFPApi.dll esté instalada")
        print("Ruta del SDK proporcionada:", sdk_path or "No especificada")
    
    def _setup_dpfpdd_functions(self):
        """Configura las funciones de DPFPApi.dll (One Touch SDK)"""
        if not self.dpfpdd_dll:
            return
        
        try:
            # DPFPInit - Inicializar SDK
            self.dpfpdd_dll.DPFPInit.argtypes = []
            self.dpfpdd_dll.DPFPInit.restype = c_int  # HRESULT
            
            # DPFPTerm - Terminar SDK
            self.dpfpdd_dll.DPFPTerm.argtypes = []
            self.dpfpdd_dll.DPFPTerm.restype = None
            
            # DPFPEnumerateDevices - Enumerar dispositivos
            # GUID** es un puntero a un puntero a GUID (que es un array de 16 bytes)
            self.dpfpdd_dll.DPFPEnumerateDevices.argtypes = [
                POINTER(c_int),  # ULONG* puDevCount
                POINTER(c_void_p)  # GUID** ppDevUID (puntero a puntero)
            ]
            self.dpfpdd_dll.DPFPEnumerateDevices.restype = c_int
            
            # DPFPGetDeviceInfo - Obtener información del dispositivo
            # GUID es un puntero a 16 bytes
            self.dpfpdd_dll.DPFPGetDeviceInfo.argtypes = [
                POINTER(ctypes.c_byte * 16),  # REFGUID DevUID
                c_void_p  # DP_DEVICE_INFO* pDevInfo
            ]
            self.dpfpdd_dll.DPFPGetDeviceInfo.restype = c_int
            
            # DPFPBufferFree - Liberar memoria
            self.dpfpdd_dll.DPFPBufferFree.argtypes = [c_void_p]
            self.dpfpdd_dll.DPFPBufferFree.restype = None
            
            # DPFPCreateAcquisition - Crear operación de adquisición
            try:
                self.dpfpdd_dll.DPFPCreateAcquisition.argtypes = [
                    c_int,  # DP_ACQUISITION_PRIORITY
                    POINTER(ctypes.c_byte * 16),  # REFGUID DevUID (GUID_NULL = None)
                    c_int,  # ULONG uSampleType (DP_SAMPLE_TYPE_IMAGE = 4)
                    c_void_p,  # HWND hWnd (ventana para notificaciones)
                    c_int,  # ULONG uMsg (mensaje de Windows)
                    POINTER(c_void_p)  # HDPOPERATION* phOperation
                ]
                self.dpfpdd_dll.DPFPCreateAcquisition.restype = c_int
            except Exception as e:
                print(f"Advertencia: No se pudo configurar DPFPCreateAcquisition: {e}")
            
            # DPFPStartAcquisition
            try:
                self.dpfpdd_dll.DPFPStartAcquisition.argtypes = [c_void_p]  # HDPOPERATION
                self.dpfpdd_dll.DPFPStartAcquisition.restype = c_int
            except Exception as e:
                print(f"Advertencia: No se pudo configurar DPFPStartAcquisition: {e}")
            
            # DPFPStopAcquisition
            try:
                self.dpfpdd_dll.DPFPStopAcquisition.argtypes = [c_void_p]  # HDPOPERATION
                self.dpfpdd_dll.DPFPStopAcquisition.restype = c_int
            except Exception as e:
                print(f"Advertencia: No se pudo configurar DPFPStopAcquisition: {e}")
            
            # DPFPDestroyAcquisition
            try:
                self.dpfpdd_dll.DPFPDestroyAcquisition.argtypes = [c_void_p]  # HDPOPERATION
                self.dpfpdd_dll.DPFPDestroyAcquisition.restype = c_int
            except Exception as e:
                print(f"Advertencia: No se pudo configurar DPFPDestroyAcquisition: {e}")
        except Exception as e:
            print(f"Advertencia: No se pudieron configurar todas las funciones DPFPApi: {e}")
        
    def _setup_fx_functions(self):
        """Configura las funciones de Feature Extraction (dpHFtrEx)"""
        if not self.dpfhtrex_dll:
            return
        
        try:
            # FX_init
            self.dpfhtrex_dll.FX_init.argtypes = []
            self.dpfhtrex_dll.FX_init.restype = c_int
            
            # FX_terminate
            self.dpfhtrex_dll.FX_terminate.argtypes = []
            self.dpfhtrex_dll.FX_terminate.restype = c_int
            
            # FX_createContext
            self.dpfhtrex_dll.FX_createContext.argtypes = [POINTER(c_void_p)]
            self.dpfhtrex_dll.FX_createContext.restype = c_int
            
            # FX_closeContext
            self.dpfhtrex_dll.FX_closeContext.argtypes = [c_void_p]
            self.dpfhtrex_dll.FX_closeContext.restype = c_int
        except Exception as e:
            print(f"Advertencia: No se pudieron configurar todas las funciones FX: {e}")
    
    def _setup_mc_functions(self):
        """Configura las funciones de Matching (dpHMatch)"""
        if not self.dpfj_dll:
            return
        
        try:
            # MC_init
            self.dpfj_dll.MC_init.argtypes = []
            self.dpfj_dll.MC_init.restype = c_int
            
            # MC_terminate
            self.dpfj_dll.MC_terminate.argtypes = []
            self.dpfj_dll.MC_terminate.restype = c_int
            
            # MC_createContext
            self.dpfj_dll.MC_createContext.argtypes = [POINTER(c_void_p)]
            self.dpfj_dll.MC_createContext.restype = c_int
            
            # MC_closeContext
            self.dpfj_dll.MC_closeContext.argtypes = [c_void_p]
            self.dpfj_dll.MC_closeContext.restype = c_int
        except Exception as e:
            print(f"Advertencia: No se pudieron configurar todas las funciones MC: {e}")
        
    def is_sdk_loaded(self) -> bool:
        """Verifica si el SDK está cargado correctamente"""
        return self.sdk_loaded
    
    def get_device_count(self) -> int:
        """
        Obtiene el número de dispositivos conectados usando DPFPEnumerateDevices
        
        Returns:
            Número de dispositivos encontrados, o -1 si hay error
        """
        if not self.sdk_loaded:
            print("Error: SDK no cargado")
            return -1
        
        try:
            # Inicializar SDK si no está inicializado
            if not hasattr(self, '_sdk_initialized') or not self._sdk_initialized:
                result = self.dpfpdd_dll.DPFPInit()
                # S_OK = 0, S_FALSE = 1 (ya estaba inicializado, no es error)
                if result != 0 and result != 1:
                    print(f"Error al inicializar SDK: código {result}")
                    return -1
                self._sdk_initialized = True
            
            # Enumerar dispositivos
            dev_count = c_int(0)
            dev_uids_ptr = c_void_p()  # GUID** ppDevUID
            
            result = self.dpfpdd_dll.DPFPEnumerateDevices(
                byref(dev_count),
                byref(dev_uids_ptr)
            )
            
            if result == 0:  # S_OK
                count = dev_count.value
                
                # Liberar memoria si se asignó
                if dev_uids_ptr.value:
                    self.dpfpdd_dll.DPFPBufferFree(dev_uids_ptr.value)
                
                return count
            else:
                print(f"Error al enumerar dispositivos: código {result}")
                return -1
        except AttributeError as e:
            print(f"Error: Función no encontrada en el SDK. Verifica que DPFPApi.dll esté correctamente cargada: {e}")
            return -1
        except Exception as e:
            print(f"Error al obtener número de dispositivos: {e}")
            return -1
    
    def open_device(self, device_index: int = 0) -> bool:
        """
        Abre/prepara el dispositivo de huellas (SDK One Touch no requiere "abrir" explícitamente)
        
        Args:
            device_index: Índice del dispositivo (0 para el primero)
            
        Returns:
            True si el dispositivo está disponible, False en caso contrario
        """
        if not self.sdk_loaded:
            print("Error: SDK no cargado")
            return False
        
        try:
            # Inicializar SDK si no está inicializado
            if not hasattr(self, '_sdk_initialized') or not self._sdk_initialized:
                result = self.dpfpdd_dll.DPFPInit()
                # S_OK = 0, S_FALSE = 1 (ya estaba inicializado, no es error)
                if result != 0 and result != 1:
                    print(f"Error al inicializar SDK: código {result}")
                    return False
                self._sdk_initialized = True
            
            # Verificar que el dispositivo existe
            dev_count = self.get_device_count()
            if dev_count <= 0:
                print("No se encontraron dispositivos")
                return False
            
            if device_index >= dev_count:
                print(f"Índice de dispositivo inválido: {device_index} (dispositivos disponibles: {dev_count})")
                return False
            
            # En el SDK One Touch, no hay "abrir" dispositivo explícito
            # Se usa directamente en las operaciones de adquisición
            self.device_index = device_index
            print(f"✓ Dispositivo {device_index} listo para usar")
            return True
        except Exception as e:
            print(f"Error al preparar dispositivo: {e}")
            return False
    
    def close_device(self):
        """Cierra/termina el uso del dispositivo de huellas"""
        try:
            # En el SDK One Touch, terminamos el SDK
            if hasattr(self, '_sdk_initialized') and self._sdk_initialized:
                if self.dpfpdd_dll:
                    try:
                        self.dpfpdd_dll.DPFPTerm()
                    except:
                        pass  # Ignorar errores al terminar
                self._sdk_initialized = False
            
            self.device_handle = None
            if hasattr(self, 'device_index'):
                delattr(self, 'device_index')
            print("✓ Dispositivo cerrado")
        except Exception as e:
            print(f"Error al cerrar dispositivo: {e}")
    
    def capture_fingerprint(self, timeout: int = 20000, max_retries: int = 3) -> Optional[bytes]:
        """
        Captura una huella digital del dispositivo con reintentos automáticos
        
        NOTA: El SDK One Touch requiere mensajes de Windows para capturar huellas.
        Esta implementación crea una ventana oculta para recibir las notificaciones.
        
        Args:
            timeout: Tiempo máximo de espera en milisegundos por intento
            max_retries: Número máximo de reintentos en caso de fallo
            
        Returns:
            Template de la huella en formato FMD, o None si hay error
        """
        if not hasattr(self, 'device_index'):
            print("Error: Dispositivo no preparado. Llama a open_device() primero.")
            return None
        
        if not self.sdk_loaded:
            print("Error: SDK no cargado")
            return None
        
        # Intentar captura con reintentos
        for intento in range(max_retries):
            if intento > 0:
                print(f"Reintento {intento + 1} de {max_retries}...")
                import time
                time.sleep(1)  # Pequeña pausa entre reintentos
            
            resultado = self._capture_fingerprint_single(timeout)
            if resultado:
                return resultado
        
        print(f"Error: No se pudo capturar la huella después de {max_retries} intentos")
        return None
    
    def _capture_fingerprint_single(self, timeout: int = 20000) -> Optional[bytes]:
        """
        Intenta capturar una huella digital una sola vez
        
        Args:
            timeout: Tiempo máximo de espera en milisegundos
            
        Returns:
            Template de la huella en formato FMD, o None si hay error
        """
        print("Coloca tu dedo en el lector...")
        
        try:
            import ctypes.wintypes as wintypes
            
            # Definir constantes
            WN_COMPLETED = 0
            WN_ERROR = 1
            DP_PRIORITY_NORMAL = 2
            DP_SAMPLE_TYPE_IMAGE = 4
            
            # Crear una ventana oculta para recibir mensajes
            # Intentar con diferentes clases de ventana si falla
            hwnd = None
            window_classes = ["STATIC", "Message"]
            
            for wc in window_classes:
                try:
                    hwnd = ctypes.windll.user32.CreateWindowExW(
                        0,  # dwExStyle
                        wc,  # lpClassName
                        "FingerprintCapture",  # lpWindowName
                        0,  # dwStyle
                        0, 0, 0, 0,  # x, y, nWidth, nHeight
                        None,  # hWndParent
                        None,  # hMenu
                        None,  # hInstance
                        None  # lpParam
                    )
                    if hwnd:
                        break
                except:
                    continue
            
            if not hwnd:
                print("✗ Error: No se pudo crear ventana para recibir notificaciones")
                return None
            
            # Variable para almacenar el resultado
            self._capture_result = None
            self._capture_error = None
            self._capture_image_data = None
            
            # Registrar mensaje personalizado
            WMUS_FP_NOTIFY = ctypes.windll.user32.RegisterWindowMessageW("WMUS_FP_NOTIFY")
            if WMUS_FP_NOTIFY == 0:
                # Si falla, usar un valor por defecto
                WMUS_FP_NOTIFY = 0x8001
            
            # Crear operación de adquisición
            operation_handle = c_void_p()
            
            # GUID_NULL es un GUID con todos los bytes en 0
            guid_null = (ctypes.c_byte * 16)(*[0] * 16)
            
            result = self.dpfpdd_dll.DPFPCreateAcquisition(
                DP_PRIORITY_NORMAL,
                ctypes.byref(guid_null),  # GUID_NULL (todos ceros) para usar cualquier dispositivo
                DP_SAMPLE_TYPE_IMAGE,
                hwnd,  # Ventana para notificaciones
                WMUS_FP_NOTIFY,  # Mensaje de Windows
                byref(operation_handle)
            )
            
            if result != 0:  # S_OK = 0
                print(f"✗ Error al crear operación de adquisición: código {result}")
                ctypes.windll.user32.DestroyWindow(hwnd)
                return None
            
            # Iniciar adquisición
            result = self.dpfpdd_dll.DPFPStartAcquisition(operation_handle.value)
            if result != 0:
                print(f"✗ Error al iniciar adquisición: código {result}")
                self.dpfpdd_dll.DPFPDestroyAcquisition(operation_handle.value)
                ctypes.windll.user32.DestroyWindow(hwnd)
                return None
            
            print("✓ Esperando captura de huella...")
            
            # Procesar mensajes de Windows en un loop
            import time
            start_time = time.time()
            msg = wintypes.MSG()
            
            # Aumentar timeout para dar más tiempo al dispositivo
            timeout_extended = timeout * 1.5
            
            while (time.time() - start_time) * 1000 < timeout_extended:
                # Procesar mensajes de Windows
                # Usar GetMessage para bloquear y esperar mensajes
                bRet = ctypes.windll.user32.GetMessageW(
                    ctypes.byref(msg),
                    hwnd,  # Solo mensajes para esta ventana
                    0,
                    0
                )
                
                if bRet > 0:  # Mensaje recibido
                    if msg.message == WMUS_FP_NOTIFY:
                        if msg.wParam == WN_COMPLETED:
                            # Huella capturada exitosamente
                            # msg.lParam contiene un puntero a DATA_BLOB con la imagen
                            print("✓ Huella capturada correctamente")
                            
                            # Obtener los datos de la imagen
                            # DATA_BLOB tiene: cbData (ULONG) y pbData (BYTE*)
                            if msg.lParam:
                                try:
                                    # DATA_BLOB estructura: {ULONG cbData; BYTE* pbData;}
                                    # Leer cbData (primeros 4 bytes en x64, 4 bytes en x86)
                                    data_size = ctypes.cast(msg.lParam, POINTER(c_int)).contents.value
                                    
                                    # Leer pbData (siguiente 8 bytes en x64, 4 bytes en x86)
                                    if ctypes.sizeof(ctypes.c_void_p) == 8:  # 64-bit
                                        pb_data_ptr = ctypes.cast(
                                            msg.lParam + 8,
                                            POINTER(c_void_p)
                                        ).contents.value
                                    else:  # 32-bit
                                        pb_data_ptr = ctypes.cast(
                                            msg.lParam + 4,
                                            POINTER(c_void_p)
                                        ).contents.value
                                    
                                    # Leer los datos de la imagen
                                    if data_size > 0 and pb_data_ptr:
                                        data_array = (ctypes.c_byte * data_size).from_address(pb_data_ptr)
                                        image_data = bytes(data_array)
                                        self._capture_image_data = image_data
                                        
                                        # Liberar memoria del DATA_BLOB
                                        self.dpfpdd_dll.DPFPBufferFree(msg.lParam)
                                except Exception as e:
                                    print(f"⚠ Error al leer datos de imagen: {e}")
                                    # Liberar memoria de todos modos
                                    try:
                                        self.dpfpdd_dll.DPFPBufferFree(msg.lParam)
                                    except:
                                        pass
                            
                            self._capture_result = True
                            break
                        elif msg.wParam == WN_ERROR:
                            error_code = msg.lParam
                            print(f"✗ Error al capturar huella: código {error_code}")
                            self._capture_error = error_code
                            self._capture_result = False
                            break
                        elif msg.wParam == 5:  # WN_FINGER_TOUCHED
                            print("  Dedo detectado en el lector...")
                        elif msg.wParam == 6:  # WN_FINGER_GONE
                            print("  Dedo retirado del lector")
                        elif msg.wParam == 4:  # WN_SAMPLE_QUALITY
                            quality = msg.lParam
                            if quality == 2:  # DP_QUALITY_TOOLIGHT
                                print("  Advertencia: Imagen muy clara, presione más fuerte")
                            elif quality == 3:  # DP_QUALITY_TOODARK
                                print("  Advertencia: Imagen muy oscura, presione más suave")
                            elif quality == 4:  # DP_QUALITY_TOONOISY
                                print("  Advertencia: Imagen borrosa, limpie el sensor")
                    
                    # Traducir y despachar el mensaje
                    ctypes.windll.user32.TranslateMessage(ctypes.byref(msg))
                    ctypes.windll.user32.DispatchMessageW(ctypes.byref(msg))
                elif bRet == -1:  # Error
                    break
                else:  # WM_QUIT
                    break
            
            # Detener y destruir la operación
            try:
                self.dpfpdd_dll.DPFPStopAcquisition(operation_handle.value)
            except:
                pass
            
            try:
                self.dpfpdd_dll.DPFPDestroyAcquisition(operation_handle.value)
            except:
                pass
            
            try:
                ctypes.windll.user32.DestroyWindow(hwnd)
            except:
                pass
            
            if self._capture_result:
                if self._capture_image_data:
                    print(f"✓ Imagen capturada: {len(self._capture_image_data)} bytes")
                    # Por ahora retornamos los datos de la imagen
                    # TODO: Extraer características usando FX_extractFeatures
                    return self._capture_image_data
                else:
                    print("⚠ Imagen capturada pero sin datos")
                    return b"FINGERPRINT_TEMPLATE_PLACEHOLDER"
            elif self._capture_result is False:
                return None
            else:
                print("✗ Timeout al capturar huella")
                return None
            
        except Exception as e:
            print(f"✗ Error durante la captura: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def compare_templates(self, template1: bytes, template2: bytes) -> Tuple[bool, int]:
        """
        Compara dos templates de huellas
        
        Args:
            template1: Primer template
            template2: Segundo template
            
        Returns:
            Tupla (coincide, score) donde coincide es True si son similares
            y score es el valor de similitud (0-100)
        """
        if not self.sdk_loaded:
            return False, 0
        
        try:
            score = c_int()
            result = self.dpfj_dll.dpfj_compare_fmd(
                template1, len(template1),
                template2, len(template2),
                byref(score)
            )
            
            if result == DPFP_DD_SUCCESS:
                # Score típicamente va de 0 a 100, umbral común es 40-50
                match = score.value >= 40
                return match, score.value
            return False, 0
        except Exception as e:
            print(f"Error al comparar templates: {e}")
            return False, 0
    
    def __enter__(self):
        """Context manager entry"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close_device()


class FingerprintDatabase:
    """Clase para gestionar una base de datos de huellas"""
    
    def __init__(self, db_file: str = "fingerprints.json"):
        """
        Inicializa la base de datos
        
        Args:
            db_file: Archivo JSON donde se almacenan las huellas
        """
        self.db_file = db_file
        self.fingerprints = {}
        self.load_database()
    
    def load_database(self):
        """Carga la base de datos desde el archivo"""
        if os.path.exists(self.db_file):
            try:
                with open(self.db_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Convertir los templates de base64 a bytes
                    for user_id, user_data in data.items():
                        if 'template' in user_data:
                            import base64
                            user_data['template'] = base64.b64decode(user_data['template'])
                    self.fingerprints = data
                print(f"✓ Base de datos cargada: {len(self.fingerprints)} huellas registradas")
            except Exception as e:
                print(f"Error al cargar base de datos: {e}")
                self.fingerprints = {}
        else:
            self.fingerprints = {}
    
    def save_database(self):
        """Guarda la base de datos en el archivo"""
        try:
            # Convertir templates a base64 para JSON
            data_to_save = {}
            import base64
            for user_id, user_data in self.fingerprints.items():
                data_to_save[user_id] = user_data.copy()
                if 'template' in data_to_save[user_id]:
                    data_to_save[user_id]['template'] = base64.b64encode(
                        data_to_save[user_id]['template']
                    ).decode('utf-8')
            
            with open(self.db_file, 'w', encoding='utf-8') as f:
                json.dump(data_to_save, f, indent=2, ensure_ascii=False)
            print(f"✓ Base de datos guardada")
        except Exception as e:
            print(f"Error al guardar base de datos: {e}")
    
    def add_fingerprint(self, user_id: str, template: bytes, name: str = ""):
        """
        Añade una huella a la base de datos
        
        Args:
            user_id: ID único del usuario
            template: Template de la huella
            name: Nombre del usuario (opcional)
        """
        self.fingerprints[user_id] = {
            'name': name,
            'template': template,
            'registered_at': datetime.now().isoformat()
        }
        self.save_database()
        print(f"✓ Huella registrada para usuario: {user_id} ({name})")
    
    def identify_fingerprint(self, template: bytes, threshold: int = 40) -> Optional[str]:
        """
        Identifica una huella comparándola con todas las de la base de datos
        
        Args:
            template: Template de la huella a identificar
            threshold: Umbral de similitud mínimo
            
        Returns:
            ID del usuario si se encuentra una coincidencia, None en caso contrario
        """
        reader = FingerprintReader()
        if not reader.is_sdk_loaded():
            return None
        
        best_match = None
        best_score = 0
        
        for user_id, user_data in self.fingerprints.items():
            stored_template = user_data['template']
            match, score = reader.compare_templates(template, stored_template)
            
            if match and score > best_score:
                best_score = score
                best_match = user_id
        
        if best_match and best_score >= threshold:
            return best_match
        return None
    
    def verify_fingerprint(self, user_id: str, template: bytes, threshold: int = 40) -> Tuple[bool, int]:
        """
        Verifica una huella contra una específica (1:1)
        
        Args:
            user_id: ID del usuario a verificar
            template: Template de la huella a verificar
            threshold: Umbral de similitud mínimo
            
        Returns:
            Tupla (coincide, score)
        """
        if user_id not in self.fingerprints:
            return False, 0
        
        reader = FingerprintReader()
        if not reader.is_sdk_loaded():
            return False, 0
        
        stored_template = self.fingerprints[user_id]['template']
        match, score = reader.compare_templates(template, stored_template)
        
        return (match and score >= threshold, score)
    
    def list_users(self) -> List[dict]:
        """Lista todos los usuarios registrados"""
        return [
            {
                'user_id': user_id,
                'name': data.get('name', 'Sin nombre'),
                'registered_at': data.get('registered_at', 'Desconocido')
            }
            for user_id, data in self.fingerprints.items()
        ]
    
    def delete_user(self, user_id: str) -> bool:
        """
        Elimina un usuario de la base de datos
        
        Args:
            user_id: ID del usuario a eliminar
            
        Returns:
            True si se eliminó, False si no existe
        """
        if user_id in self.fingerprints:
            del self.fingerprints[user_id]
            self.save_database()
            print(f"✓ Usuario {user_id} eliminado")
            return True
        print(f"✗ Usuario {user_id} no encontrado")
        return False



