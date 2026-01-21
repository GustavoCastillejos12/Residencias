import React, { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/api';
import WebAuthnService from '../services/webauthn';
import RegistrarAlumno from './RegistrarAlumno';

function GrupoDetail({ grupo, onBack, onRefresh }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRegistrar, setShowRegistrar] = useState(false);
  const [registrandoHuella, setRegistrandoHuella] = useState(null);

  const loadAlumnos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAlumnosGrupo(grupo.grupo_id);
      setAlumnos(response.alumnos || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [grupo.grupo_id]);

  useEffect(() => {
    loadAlumnos();
  }, [loadAlumnos]);

  const handleRegistrarHuella = async (alumnoId, alumnoName) => {
    // Verificar disponibilidad de WebAuthn
    const availability = await WebAuthnService.checkAuthenticatorAvailability();
    if (!availability.available && !WebAuthnService.isAvailable()) {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      let errorMsg = 'El lector de huellas no está disponible.\n\n';
      
      if (protocol !== 'https:' && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        errorMsg += 'WebAuthn requiere HTTPS o localhost para funcionar.\n';
        errorMsg += `Estás usando: ${protocol}//${hostname}\n\n`;
        errorMsg += 'Solución: Accede desde localhost o configura HTTPS.';
      } else {
        errorMsg += availability.reason || 'Usa un dispositivo móvil con lector de huellas.';
      }
      
      alert(errorMsg);
      return;
    }

    if (!window.confirm(`¿Registrar huella para ${alumnoName}?\n\nUsa el lector de huellas de tu dispositivo móvil cuando se solicite.`)) {
      return;
    }

    setRegistrandoHuella(alumnoId);
    try {
      // Obtener challenge del servidor
      const challengeData = await ApiService.obtenerChallengeRegistro(alumnoId);
      
      // Registrar credencial usando WebAuthn
      const credentialData = await WebAuthnService.registerCredential(
        alumnoId,
        challengeData.user_name,
        challengeData.challenge
      );
      
      // Enviar credencial al servidor
      await ApiService.registrarHuella(alumnoId, {
        credential_id: credentialData.credential_id,
        public_key: credentialData.public_key
      });
      
      alert(`✓ Huella registrada exitosamente para ${alumnoName}`);
      loadAlumnos();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setRegistrandoHuella(null);
    }
  };

  const handleDelete = async (alumnoId, alumnoName) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${alumnoName}?`)) {
      return;
    }

    try {
      await ApiService.deleteAlumno(alumnoId);
      alert('Alumno eliminado exitosamente');
      loadAlumnos();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAlumnoCreated = () => {
    setShowRegistrar(false);
    loadAlumnos();
  };

  if (loading) {
    return <div className="loading">Cargando alumnos...</div>;
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <button className="button" onClick={onBack} style={{ marginRight: '15px', marginBottom: '10px' }}>
            ← Volver a Grupos
          </button>
          <h2>{grupo.nombre}</h2>
          <p className="grupo-subtitle">{grupo.carrera_tecnica || 'Carrera técnica no especificada'}</p>
        </div>
        <button 
          className="button button-primary"
          onClick={() => setShowRegistrar(!showRegistrar)}
        >
          {showRegistrar ? 'Cancelar' : 'Registrar Alumno'}
        </button>
      </div>

      {showRegistrar && (
        <RegistrarAlumno 
          grupoId={grupo.grupo_id}
          onSuccess={handleAlumnoCreated}
          onCancel={() => setShowRegistrar(false)}
        />
      )}

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="alumnos-header">
        <h3>Lista de Alumnos ({alumnos.length})</h3>
        <button className="button" onClick={loadAlumnos}>
          Actualizar
        </button>
      </div>

      {alumnos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No hay alumnos registrados</h3>
          <p>Comience registrando el primer alumno del grupo</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre Completo</th>
                <th>ID</th>
                <th>Estado Huella</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((alumno, index) => (
                <tr key={alumno.user_id}>
                  <td>{index + 1}</td>
                  <td className="nombre-cell">
                    <strong>{alumno.name}</strong>
                  </td>
                  <td>{alumno.user_id}</td>
                  <td>
                    {alumno.tiene_huella ? (
                      <span className="badge badge-success">Registrada</span>
                    ) : (
                      <span className="badge badge-warning">Pendiente</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="button button-success"
                        onClick={() => handleRegistrarHuella(alumno.user_id, alumno.name)}
                        disabled={registrandoHuella === alumno.user_id}
                        title="Registrar o actualizar huella digital"
                      >
                        {registrandoHuella === alumno.user_id ? 'Capturando...' : 'Registrar Huella'}
                      </button>
                      <button
                        className="button button-danger"
                        onClick={() => handleDelete(alumno.user_id, alumno.name)}
                        title="Eliminar alumno"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GrupoDetail;

