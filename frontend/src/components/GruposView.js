import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import RegistrarGrupo from './RegistrarGrupo';

function GruposView({ onGrupoSelect }) {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRegistrar, setShowRegistrar] = useState(false);

  useEffect(() => {
    loadGrupos();
  }, []);

  const loadGrupos = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getGrupos();
      setGrupos(response.grupos || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (grupoId, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar el grupo "${nombre}"?`)) {
      return;
    }

    try {
      await ApiService.deleteGrupo(grupoId);
      alert('Grupo eliminado exitosamente');
      loadGrupos();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleGrupoCreated = () => {
    setShowRegistrar(false);
    loadGrupos();
  };

  if (loading) {
    return <div className="loading">Cargando grupos...</div>;
  }

  return (
    <div>
      <div className="section-header">
        <h2>Gestión de Grupos</h2>
        <button 
          className="button button-primary"
          onClick={() => setShowRegistrar(!showRegistrar)}
        >
          {showRegistrar ? 'Cancelar' : 'Registrar Nuevo Grupo'}
        </button>
      </div>

      {showRegistrar && (
        <RegistrarGrupo 
          onSuccess={handleGrupoCreated}
          onCancel={() => setShowRegistrar(false)}
        />
      )}

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {grupos.length === 0 && !showRegistrar ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No hay grupos registrados</h3>
          <p>Comience registrando su primer grupo</p>
          <button 
            className="button button-primary"
            onClick={() => setShowRegistrar(true)}
          >
            Registrar Primer Grupo
          </button>
        </div>
      ) : (
        <div className="grupos-grid">
          {grupos.map(grupo => (
            <div key={grupo.grupo_id} className="grupo-card">
              <div className="grupo-card-header">
                <h3>{grupo.nombre}</h3>
                <span className="grupo-id">{grupo.grupo_id}</span>
              </div>
              
              <div className="grupo-card-body">
                <div className="grupo-info">
                  <span className="info-label">Carrera Técnica:</span>
                  <span className="info-value">{grupo.carrera_tecnica || 'No especificada'}</span>
                </div>
                
                <div className="grupo-info">
                  <span className="info-label">Alumnos:</span>
                  <span className="info-value">{grupo.total_alumnos}</span>
                </div>
              </div>

              <div className="grupo-card-actions">
                <button
                  className="button button-primary"
                  onClick={() => onGrupoSelect(grupo)}
                >
                  Ver Alumnos
                </button>
                <button
                  className="button button-danger"
                  onClick={() => handleDelete(grupo.grupo_id, grupo.nombre)}
                  disabled={grupo.total_alumnos > 0}
                  title={grupo.total_alumnos > 0 ? 'No se puede eliminar un grupo con alumnos' : ''}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GruposView;

