import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

function PasarLista({ grupo, alumnos, onFinalizar, onCambiarGrupo }) {
  const [indiceActual, setIndiceActual] = useState(0);
  const [asistenciasRegistradas, setAsistenciasRegistradas] = useState(new Set());
  const [capturandoHuella, setCapturandoHuella] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const alumnoActual = alumnos[indiceActual];
  const totalAlumnos = alumnos.length;
  const alumnosConAsistencia = asistenciasRegistradas.size;
  const progreso = ((indiceActual + 1) / totalAlumnos) * 100;

  useEffect(() => {
    // Verificar si el alumno actual ya tiene asistencia registrada
    if (alumnoActual && asistenciasRegistradas.has(alumnoActual.user_id)) {
      setMensaje({ tipo: 'info', texto: 'Este alumno ya tiene asistencia registrada' });
    } else {
      setMensaje(null);
    }
  }, [indiceActual, alumnoActual, asistenciasRegistradas]);

  const handleVerificarHuella = async () => {
    if (!alumnoActual) return;

    setCapturandoHuella(true);
    setError(null);
    setMensaje(null);

    try {
      const response = await ApiService.verificarAsistencia(grupo.grupo_id);
      
      if (response.encontrado) {
        if (response.alumno.user_id === alumnoActual.user_id) {
          setAsistenciasRegistradas(prev => new Set([...prev, alumnoActual.user_id]));
          setMensaje({ 
            tipo: 'success', 
            texto: `Asistencia registrada: ${response.alumno.name}` 
          });
          
          // Avanzar automáticamente después de 1.5 segundos
          setTimeout(() => {
            handleSiguiente();
          }, 1500);
        } else {
          setError(`La huella corresponde a otro alumno: ${response.alumno.name}`);
        }
      } else {
        setError('Huella no reconocida. Verifique que el alumno esté registrado correctamente.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCapturandoHuella(false);
    }
  };

  const handleAsistenciaManual = async () => {
    if (!alumnoActual) return;

    if (window.confirm(`¿Registrar asistencia manual para ${alumnoActual.name}?`)) {
      try {
        await ApiService.registrarAsistenciaManual(alumnoActual.user_id);
        
        setAsistenciasRegistradas(prev => new Set([...prev, alumnoActual.user_id]));
        setMensaje({ 
          tipo: 'success', 
          texto: `Asistencia manual registrada: ${alumnoActual.name}` 
        });
        
        setTimeout(() => {
          handleSiguiente();
        }, 1500);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleSiguiente = () => {
    if (indiceActual < totalAlumnos - 1) {
      setIndiceActual(indiceActual + 1);
      setError(null);
      setMensaje(null);
    }
  };

  const handleAnterior = () => {
    if (indiceActual > 0) {
      setIndiceActual(indiceActual - 1);
      setError(null);
      setMensaje(null);
    }
  };

  const handleFinalizar = () => {
    if (window.confirm(`¿Finalizar el registro de asistencia?\n\nAlumnos con asistencia: ${alumnosConAsistencia} de ${totalAlumnos}`)) {
      onFinalizar();
    }
  };

  if (!alumnoActual) {
    return (
      <div className="card">
        <div className="alert alert-info">
          No hay alumnos en este grupo.
        </div>
      </div>
    );
  }

  const tieneHuella = alumnoActual.tiene_huella;
  const yaTieneAsistencia = asistenciasRegistradas.has(alumnoActual.user_id);

  return (
    <div>
      <div className="section-header">
        <div>
          <button className="button" onClick={onCambiarGrupo} style={{ marginRight: '15px', marginBottom: '10px' }}>
            ← Cambiar Grupo
          </button>
          <h2>Pasar Lista - {grupo.nombre}</h2>
          <p className="grupo-subtitle">{grupo.carrera_tecnica || 'Carrera técnica no especificada'}</p>
        </div>
        <button className="button button-primary" onClick={handleFinalizar}>
          Finalizar Lista
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="card" style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontWeight: '600', color: '#2c3e50' }}>
            Alumno {indiceActual + 1} de {totalAlumnos}
          </span>
          <span style={{ fontWeight: '600', color: '#27ae60' }}>
            Asistencias: {alumnosConAsistencia} / {totalAlumnos}
          </span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '8px', 
          background: '#e0e0e0', 
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progreso}%`,
            height: '100%',
            background: '#27ae60',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      </div>

      {/* Selector de alumno */}
      <div className="card" style={{ marginBottom: '25px' }}>
        <div className="form-group">
          <label>Alumno Actual</label>
          <select
            className="input"
            value={indiceActual}
            onChange={(e) => {
              setIndiceActual(parseInt(e.target.value));
              setError(null);
              setMensaje(null);
            }}
          >
            {alumnos.map((alumno, index) => (
              <option key={alumno.user_id} value={index}>
                {index + 1}. {alumno.name} {alumno.tiene_huella ? '(Con huella)' : '(Sin huella)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjeta del alumno actual */}
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.8em', color: '#2c3e50', marginBottom: '10px' }}>
            {alumnoActual.name}
          </h3>
          <p style={{ color: '#7f8c8d', fontSize: '1em' }}>
            ID: {alumnoActual.user_id}
          </p>
        </div>

        {yaTieneAsistencia ? (
          <div className="alert alert-success" style={{ marginBottom: '25px' }}>
            <strong>Asistencia ya registrada</strong>
            <p style={{ marginTop: '10px', marginBottom: '0' }}>
              Este alumno ya tiene asistencia registrada en esta sesión.
            </p>
          </div>
        ) : (
          <>
            {tieneHuella ? (
              <div>
                <p style={{ marginBottom: '20px', color: '#5a6c7d', fontSize: '1.05em' }}>
                  El alumno tiene huella registrada. Coloque el dedo en el lector para verificar.
                </p>
                <button
                  className="button button-primary button-large"
                  onClick={handleVerificarHuella}
                  disabled={capturandoHuella}
                  style={{ minWidth: '250px', marginBottom: '20px' }}
                >
                  {capturandoHuella ? 'Capturando huella...' : 'Verificar con Huella Digital'}
                </button>
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                  <p style={{ color: '#7f8c8d', fontSize: '0.9em', marginBottom: '15px' }}>
                    O registre la asistencia manualmente:
                  </p>
                  <button
                    className="button button-success"
                    onClick={handleAsistenciaManual}
                    disabled={capturandoHuella}
                  >
                    Registrar Asistencia Manual
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="alert alert-info" style={{ marginBottom: '25px' }}>
                  <strong>Alumno sin huella registrada</strong>
                  <p style={{ marginTop: '10px', marginBottom: '0' }}>
                    Este alumno no tiene huella digital registrada. Verifique la asistencia manualmente.
                  </p>
                </div>
                <button
                  className="button button-success button-large"
                  onClick={handleAsistenciaManual}
                  style={{ minWidth: '250px' }}
                >
                  Registrar Asistencia Manual
                </button>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginTop: '25px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {mensaje && (
          <div className={`alert alert-${mensaje.tipo}`} style={{ marginTop: '25px' }}>
            {mensaje.texto}
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          <button
            className="button"
            onClick={handleAnterior}
            disabled={indiceActual === 0}
            style={{ flex: 1 }}
          >
            ← Anterior
          </button>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '0 20px',
            color: '#5a6c7d',
            fontWeight: '500'
          }}>
            {indiceActual + 1} / {totalAlumnos}
          </div>

          <button
            className="button button-primary"
            onClick={handleSiguiente}
            disabled={indiceActual === totalAlumnos - 1}
            style={{ flex: 1 }}
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}

export default PasarLista;

