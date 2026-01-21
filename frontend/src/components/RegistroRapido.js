import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import WebAuthnService from '../services/webauthn';

function RegistroRapido() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [intentos, setIntentos] = useState(0);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [loadingGrupos, setLoadingGrupos] = useState(true);

  useEffect(() => {
    checkDeviceStatus();
    loadGrupos();
  }, []);

  const checkDeviceStatus = async () => {
    try {
      const status = await ApiService.getDeviceStatus();
      setDeviceStatus(status);
    } catch (err) {
      console.error('Error al verificar dispositivo:', err);
    }
  };

  const loadGrupos = async () => {
    try {
      setLoadingGrupos(true);
      const response = await ApiService.getGrupos();
      setGrupos(response.grupos || []);
    } catch (err) {
      console.error('Error al cargar grupos:', err);
      setError('Error al cargar grupos. Por favor, recargue la página.');
    } finally {
      setLoadingGrupos(false);
    }
  };

  const handleSeleccionarGrupo = (e) => {
    const grupoId = e.target.value;
    if (grupoId) {
      const grupo = grupos.find(g => g.grupo_id === grupoId);
      setGrupoSeleccionado(grupo);
      // Limpiar resultados anteriores al cambiar de grupo
      setResult(null);
      setError(null);
      setIntentos(0);
    } else {
      setGrupoSeleccionado(null);
    }
  };

  const handleCapturarHuella = async () => {
    // Validar que se haya seleccionado un grupo
    if (!grupoSeleccionado) {
      setError('Por favor, seleccione un grupo antes de capturar la huella.');
      return;
    }

    // Verificar disponibilidad de WebAuthn (pero permitir intentar de todos modos)
    const availability = await WebAuthnService.checkAuthenticatorAvailability();
    if (!availability.available && !WebAuthnService.isAvailable()) {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      let errorMsg = 'El lector de huellas no está disponible. ';
      
      if (protocol !== 'https:' && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        errorMsg += 'WebAuthn requiere HTTPS o localhost. ';
        errorMsg += `Estás usando: ${protocol}//${hostname}. `;
        errorMsg += 'Intenta acceder desde localhost o configura HTTPS.';
      } else {
        errorMsg += availability.reason || 'Usa un dispositivo móvil con lector de huellas.';
      }
      
      setError(errorMsg);
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    setIntentos(prev => prev + 1);

    try {
      // Obtener challenge del servidor
      const challengeData = await ApiService.obtenerChallengeVerificacion(grupoSeleccionado.grupo_id);
      
      // Verificar credencial usando WebAuthn
      const credentialData = await WebAuthnService.verifyCredential(
        challengeData.challenge,
        challengeData.allowed_credentials
      );
      
      // Enviar verificación al servidor (identifica automáticamente al alumno)
      const response = await ApiService.verificarAsistencia(grupoSeleccionado.grupo_id, {
        credential_id: credentialData.credential_id
      });
      
      if (response.encontrado) {
        setResult({
          success: true,
          alumno: response.alumno,
          asistencia: response.asistencia
        });
        
        // Limpiar después de 5 segundos para permitir siguiente captura
        setTimeout(() => {
          setResult(null);
          setIntentos(0);
        }, 5000);
      } else {
        setError(response.message || 'Huella no reconocida');
        setResult(null);
      }
    } catch (err) {
      // Manejar errores del backend
      let errorMessage = err.message;
      let sugerencias = null;
      
      // Si el error tiene información adicional
      if (err.errorData) {
        errorMessage = err.errorData.error || errorMessage;
        sugerencias = err.errorData.sugerencias;
      }
      
      if (sugerencias) {
        setError({
          message: errorMessage,
          sugerencias: sugerencias
        });
      } else {
        setError(errorMessage);
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReintentar = () => {
    setError(null);
    setResult(null);
    handleCapturarHuella();
  };

  return (
    <div className="card">
      <h2>Registro Rápido de Asistencia</h2>
      <p className="form-description" style={{ marginBottom: '25px' }}>
        Seleccione el grupo y coloque el dedo en el lector de huellas digitales. El sistema identificará automáticamente al alumno y registrará su asistencia.
      </p>

      {/* Selector de Grupo */}
      <div style={{ marginBottom: '25px' }}>
        <label htmlFor="grupo-select" style={{ 
          display: 'block', 
          marginBottom: '10px', 
          fontWeight: 'bold',
          color: '#2c3e50'
        }}>
          Seleccionar Grupo <span style={{ color: '#e74c3c' }}>*</span>
        </label>
        {loadingGrupos ? (
          <div className="alert alert-info">
            Cargando grupos...
          </div>
        ) : (
          <select
            id="grupo-select"
            value={grupoSeleccionado ? grupoSeleccionado.grupo_id : ''}
            onChange={handleSeleccionarGrupo}
            className="form-select"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1em',
              border: '1px solid #bdc3c7',
              borderRadius: '4px',
              backgroundColor: '#fff',
              color: '#2c3e50'
            }}
          >
            <option value="">-- Seleccione un grupo --</option>
            {grupos.map(grupo => (
              <option key={grupo.grupo_id} value={grupo.grupo_id}>
                {grupo.nombre} {grupo.carrera_tecnica ? `- ${grupo.carrera_tecnica}` : ''}
              </option>
            ))}
          </select>
        )}
        {grupoSeleccionado && (
          <div className="alert alert-info" style={{ marginTop: '10px' }}>
            <strong>Grupo seleccionado:</strong> {grupoSeleccionado.nombre}
            {grupoSeleccionado.carrera_tecnica && (
              <span> - {grupoSeleccionado.carrera_tecnica}</span>
            )}
          </div>
        )}
      </div>

      {deviceStatus && (
        <div style={{ marginBottom: '20px' }}>
          {deviceStatus.dispositivo_disponible ? (
            <div className="alert alert-info">
              <strong>Estado del Dispositivo:</strong> Conectado y listo para capturar huellas.
            </div>
          ) : (
            <div className="alert alert-error">
              <strong>Advertencia:</strong> El dispositivo no está disponible. Verifique la conexión.
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button
          className="button button-primary button-large"
          onClick={handleCapturarHuella}
          disabled={loading || !grupoSeleccionado || (deviceStatus && !deviceStatus.dispositivo_disponible)}
          style={{ 
            minWidth: '300px', 
            padding: '20px 40px',
            fontSize: '1.2em',
            opacity: (!grupoSeleccionado || (deviceStatus && !deviceStatus.dispositivo_disponible)) ? 0.6 : 1
          }}
        >
          {loading ? 'Capturando huella...' : 'Iniciar Captura de Huella'}
        </button>
        {!grupoSeleccionado && (
          <p style={{ marginTop: '10px', color: '#e74c3c', fontSize: '0.9em' }}>
            * Debe seleccionar un grupo para continuar
          </p>
        )}

        {intentos > 0 && !loading && (
          <p style={{ marginTop: '15px', color: '#7f8c8d', fontSize: '0.9em' }}>
            Intentos: {intentos}
          </p>
        )}
      </div>

      {loading && (
        <div className="alert alert-info" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2em', marginBottom: '10px' }}>⏳</div>
          <strong>Esperando captura de huella...</strong>
          <p style={{ marginTop: '10px', marginBottom: '0' }}>
            Por favor, coloque el dedo en el lector de huellas digitales.
            <br />
            Mantenga el dedo firme y limpio sobre el sensor.
          </p>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <h3 style={{ marginBottom: '15px', color: '#721c24' }}>Error en la Captura</h3>
          <p style={{ marginBottom: '15px' }}>
            {typeof error === 'object' ? error.message : error}
          </p>
          <div style={{ marginTop: '15px' }}>
            <strong>Recomendaciones:</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              {typeof error === 'object' && error.sugerencias ? (
                error.sugerencias.map((sug, idx) => (
                  <li key={idx}>{sug}</li>
                ))
              ) : (
                <>
                  <li>El dedo no está correctamente posicionado</li>
                  <li>El sensor está sucio o húmedo</li>
                  <li>El alumno no está registrado en el sistema</li>
                  <li>La huella no coincide con los registros</li>
                  <li>Intente limpiar el sensor y el dedo</li>
                  <li>Presione el dedo firmemente sobre el sensor</li>
                </>
              )}
            </ul>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              className="button button-primary"
              onClick={handleReintentar}
            >
              Reintentar Captura
            </button>
            <button
              className="button"
              onClick={() => {
                setError(null);
                setIntentos(0);
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {result && result.success && (
        <div className="alert alert-success">
          <h3 style={{ marginBottom: '15px', color: '#155724' }}>✓ Asistencia Registrada Exitosamente</h3>
          <div className="asistencia-details">
            <p><strong>Alumno:</strong> {result.alumno.name}</p>
            <p><strong>ID de Alumno:</strong> {result.alumno.user_id}</p>
            <p><strong>Grupo:</strong> {result.alumno.grupo_id || 'No asignado'}</p>
            <p><strong>Fecha:</strong> {result.asistencia.fecha}</p>
            <p><strong>Hora de Registro:</strong> {result.asistencia.hora}</p>
          </div>
          <p style={{ marginTop: '20px', marginBottom: '0', color: '#155724', fontStyle: 'italic' }}>
            Puede continuar con el siguiente alumno.
          </p>
        </div>
      )}

      {!loading && !error && !result && grupoSeleccionado && (
        <div className="alert alert-info" style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '0' }}>
            <strong>Instrucciones:</strong> Haga clic en el botón para iniciar la captura de huella.
            <br />
            El sistema identificará automáticamente al alumno del grupo seleccionado y registrará su asistencia.
          </p>
        </div>
      )}

      {!loading && !error && !result && !grupoSeleccionado && (
        <div className="alert alert-info" style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '0' }}>
            <strong>Paso 1:</strong> Seleccione un grupo de la lista desplegable.
            <br />
            <strong>Paso 2:</strong> Haga clic en el botón para iniciar la captura de huella.
          </p>
        </div>
      )}
    </div>
  );
}

export default RegistroRapido;

