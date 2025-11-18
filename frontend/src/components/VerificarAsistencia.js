import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import PasarLista from './PasarLista';

function VerificarAsistencia({ selectedGrupo }) {
  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modoPasarLista, setModoPasarLista] = useState(false);

  useEffect(() => {
    loadGrupos();
  }, []);

  const loadGrupos = async () => {
    try {
      const response = await ApiService.getGrupos();
      setGrupos(response.grupos || []);
    } catch (err) {
      console.error('Error al cargar grupos:', err);
    }
  };

  const handleSeleccionarGrupo = async (grupoId) => {
    if (!grupoId) {
      setGrupoSeleccionado(null);
      setAlumnos([]);
      setModoPasarLista(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.getAlumnosGrupo(grupoId);
      const grupo = grupos.find(g => g.grupo_id === grupoId);
      
      // Ordenar alumnos alfabéticamente
      const alumnosOrdenados = (response.alumnos || []).sort((a, b) => 
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
      );

      setAlumnos(alumnosOrdenados);
      setGrupoSeleccionado(grupo);
      setModoPasarLista(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarLista = () => {
    setModoPasarLista(false);
    setGrupoSeleccionado(null);
    setAlumnos([]);
  };

  if (modoPasarLista && alumnos.length > 0) {
    return (
      <PasarLista
        grupo={grupoSeleccionado}
        alumnos={alumnos}
        onFinalizar={handleFinalizarLista}
        onCambiarGrupo={() => {
          setModoPasarLista(false);
          setGrupoSeleccionado(null);
          setAlumnos([]);
        }}
      />
    );
  }

  return (
    <div className="card">
      <h2>Registro de Asistencia</h2>
      <p className="form-description" style={{ marginBottom: '25px' }}>
        Seleccione el grupo para iniciar el proceso de registro de asistencia.
      </p>

      {grupos.length === 0 ? (
        <div className="alert alert-info">
          No hay grupos registrados. Debe crear al menos un grupo antes de pasar lista.
        </div>
      ) : (
        <div className="form-group" style={{ marginBottom: '25px' }}>
          <label htmlFor="grupo-select">Seleccionar Grupo *</label>
          <select
            id="grupo-select"
            className="input"
            value={grupoSeleccionado?.grupo_id || ''}
            onChange={(e) => handleSeleccionarGrupo(e.target.value || null)}
            disabled={loading}
          >
            <option value="">-- Seleccione un grupo --</option>
            {grupos.map(grupo => (
              <option key={grupo.grupo_id} value={grupo.grupo_id}>
                {grupo.nombre} - {grupo.carrera_tecnica || 'Sin carrera técnica'}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && (
        <div className="alert alert-info">
          Cargando alumnos del grupo...
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {grupoSeleccionado && alumnos.length === 0 && !loading && (
        <div className="alert alert-info">
          Este grupo no tiene alumnos registrados. Registre alumnos antes de pasar lista.
        </div>
      )}
    </div>
  );
}

export default VerificarAsistencia;
