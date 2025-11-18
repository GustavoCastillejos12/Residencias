import React, { useState } from 'react';
import ApiService from '../services/api';

function RegistrarAlumno({ grupoId, onSuccess, onCancel }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registrandoHuella, setRegistrandoHuella] = useState(false);
  const [alumnoRegistrado, setAlumnoRegistrado] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name.trim()) {
      setError('El nombre del alumno es requerido');
      setLoading(false);
      return;
    }

    try {
      const response = await ApiService.createAlumno(grupoId, name.trim());
      setAlumnoRegistrado(response);
      setName('');
      
      // Automáticamente iniciar registro de huella
      setTimeout(() => {
        handleRegistrarHuella(response.user_id, response.name);
      }, 500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarHuella = async (alumnoId, alumnoName) => {
    if (!window.confirm(`¿Registrar huella para ${alumnoName}?\n\nColoca el dedo en el lector cuando se solicite.`)) {
      if (onSuccess) {
        onSuccess();
      }
      return;
    }

    setRegistrandoHuella(true);
    try {
      await ApiService.registrarHuella(alumnoId);
      alert(`✓ Alumno y huella registrados exitosamente`);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      alert(`Error al registrar huella: ${err.message}\n\nEl alumno fue registrado pero sin huella. Puedes registrarla después.`);
      if (onSuccess) {
        onSuccess();
      }
    } finally {
      setRegistrandoHuella(false);
      setAlumnoRegistrado(null);
    }
  };

  return (
    <div className="card registrar-form">
      <h3>Registro de Nuevo Alumno</h3>
      <p className="form-description">Ingrese el nombre completo del alumno. Posteriormente se registrará su huella digital mediante el dispositivo biométrico.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nombre Completo del Alumno *</label>
          <input
            id="name"
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ejemplo: Juan Pérez García"
            required
            disabled={loading || registrandoHuella}
          />
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {alumnoRegistrado && (
          <div className="alert alert-info">
            <strong>Alumno registrado:</strong> {alumnoRegistrado.name} ({alumnoRegistrado.user_id})
            <br />
            {registrandoHuella ? (
              <span>Registrando huella digital... Coloque el dedo en el lector.</span>
            ) : (
              <span>Proceda a registrar la huella digital del alumno.</span>
            )}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="button button-primary"
            disabled={loading || registrandoHuella}
          >
            {loading ? 'Registrando...' : registrandoHuella ? 'Registrando huella...' : 'Registrar Alumno'}
          </button>
          {onCancel && (
            <button
              type="button"
              className="button"
              onClick={onCancel}
              disabled={loading || registrandoHuella}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default RegistrarAlumno;
