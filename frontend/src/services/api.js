// Servicio API para comunicarse con el backend
const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  // Health check
  async getHealth() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json();
  }

  // Estado del dispositivo
  async getDeviceStatus() {
    const response = await fetch(`${API_BASE_URL}/dispositivo/estado`);
    return await response.json();
  }

  // ==================== GRUPOS ====================
  
  async getGrupos() {
    const response = await fetch(`${API_BASE_URL}/grupos`);
    return await response.json();
  }

  async getGrupo(grupoId) {
    const response = await fetch(`${API_BASE_URL}/grupos/${grupoId}`);
    if (!response.ok) {
      throw new Error('Grupo no encontrado');
    }
    return await response.json();
  }

  async createGrupo(nombre, carreraTecnica) {
    const response = await fetch(`${API_BASE_URL}/grupos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: nombre,
        carrera_tecnica: carreraTecnica
      })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear grupo');
    }
    return await response.json();
  }

  async deleteGrupo(grupoId) {
    const response = await fetch(`${API_BASE_URL}/grupos/${grupoId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar grupo');
    }
    return await response.json();
  }

  // ==================== ALUMNOS ====================

  async getAlumnosGrupo(grupoId) {
    const response = await fetch(`${API_BASE_URL}/grupos/${grupoId}/alumnos`);
    if (!response.ok) {
      throw new Error('Error al obtener alumnos');
    }
    return await response.json();
  }

  async createAlumno(grupoId, name) {
    const response = await fetch(`${API_BASE_URL}/grupos/${grupoId}/alumnos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name
      })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar alumno');
    }
    return await response.json();
  }

  async registrarHuella(alumnoId) {
    const response = await fetch(`${API_BASE_URL}/alumnos/${alumnoId}/huella`, {
      method: 'POST'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar huella');
    }
    return await response.json();
  }

  async deleteAlumno(alumnoId) {
    const response = await fetch(`${API_BASE_URL}/alumnos/${alumnoId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar alumno');
    }
    return await response.json();
  }

  async getAsistencias(alumnoId) {
    const response = await fetch(`${API_BASE_URL}/alumnos/${alumnoId}/asistencias`);
    if (!response.ok) {
      throw new Error('Error al obtener asistencias');
    }
    return await response.json();
  }

  async registrarAsistenciaManual(alumnoId) {
    const response = await fetch(`${API_BASE_URL}/alumnos/${alumnoId}/asistencias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tipo: 'manual'
      })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar asistencia manual');
    }
    return await response.json();
  }

  // ==================== ASISTENCIA ====================

  async verificarAsistencia(grupoId = null) {
    const response = await fetch(`${API_BASE_URL}/asistencia/verificar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(grupoId ? { grupo_id: grupoId } : {})
    });
    if (!response.ok) {
      const error = await response.json();
      const errorObj = new Error(error.error || 'Error al verificar asistencia');
      errorObj.errorData = error; // Guardar datos del error para acceso en el componente
      throw errorObj;
    }
    return await response.json();
  }

  // ==================== ESTADÍSTICAS ====================

  async getEstadisticas() {
    const response = await fetch(`${API_BASE_URL}/estadisticas`);
    return await response.json();
  }

  async descargarExcelAsistencias(grupoId = null) {
    const url = grupoId 
      ? `${API_BASE_URL}/estadisticas/descargar-excel?grupo_id=${grupoId}`
      : `${API_BASE_URL}/estadisticas/descargar-excel`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error al descargar el archivo Excel');
    }
    
    // Obtener el nombre del archivo del header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'asistencias.xlsx';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Crear blob y descargar
    const blob = await response.blob();
    const url_blob = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url_blob;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url_blob);
    
    return filename;
  }
}

export default new ApiService();
