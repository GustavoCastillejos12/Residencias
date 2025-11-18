import React, { useState } from 'react';
import ApiService from '../services/api';

function RegistrarGrupo({ onSuccess, onCancel }) {
  const [nombre, setNombre] = useState('');
  const [carreraTecnica, setCarreraTecnica] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!nombre.trim()) {
      setError('El nombre del grupo es requerido');
      setLoading(false);
      return;
    }

    try {
      await ApiService.createGrupo(nombre.trim(), carreraTecnica.trim());
      setNombre('');
      setCarreraTecnica('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card registrar-form">
      <h3>Registro de Nuevo Grupo</h3>
      <p className="form-description">Complete los datos del grupo para comenzar el registro de alumnos.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombre">Nombre del Grupo *</label>
          <input
            id="nombre"
            type="text"
            className="input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ejemplo: 3° A, 4° B, 5° C"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="carrera">Carrera Técnica</label>
          <input
            id="carrera"
            type="text"
            className="input"
            value={carreraTecnica}
            onChange={(e) => setCarreraTecnica(e.target.value)}
            placeholder="Ejemplo: Informática, Contabilidad, Administración"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="button button-primary"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrar Grupo'}
          </button>
          {onCancel && (
            <button
              type="button"
              className="button"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default RegistrarGrupo;

