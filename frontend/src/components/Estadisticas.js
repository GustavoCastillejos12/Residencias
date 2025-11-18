import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

function Estadisticas() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getEstadisticas();
      setStats(response);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarExcel = async (grupoId = null) => {
    try {
      setDescargando(true);
      await ApiService.descargarExcelAsistencias(grupoId);
      setError(null);
    } catch (err) {
      setError(`Error al descargar Excel: ${err.message}`);
    } finally {
      setDescargando(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando estadísticas...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h2>Estadísticas del Sistema</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="button button-primary" 
            onClick={() => handleDescargarExcel()}
            disabled={descargando}
            style={{ backgroundColor: '#27ae60' }}
          >
            {descargando ? 'Descargando...' : '📥 Descargar Excel (Todos)'}
          </button>
          <button className="button button-primary" onClick={loadStats}>
          Actualizar
        </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #34495e' }}>
          <h3 style={{ color: '#2c3e50', fontSize: '2.5em', margin: '10px 0', fontWeight: '600' }}>
            {stats.total_grupos || 0}
          </h3>
          <p style={{ fontSize: '1em', fontWeight: '500', color: '#5a6c7d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total de Grupos</p>
        </div>

        <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #34495e' }}>
          <h3 style={{ color: '#2c3e50', fontSize: '2.5em', margin: '10px 0', fontWeight: '600' }}>
            {stats.total_alumnos}
          </h3>
          <p style={{ fontSize: '1em', fontWeight: '500', color: '#5a6c7d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total de Alumnos</p>
        </div>

        <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #27ae60' }}>
          <h3 style={{ color: '#27ae60', fontSize: '2.5em', margin: '10px 0', fontWeight: '600' }}>
            {stats.alumnos_con_huella}
          </h3>
          <p style={{ fontSize: '1em', fontWeight: '500', color: '#5a6c7d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Con Huella Registrada</p>
        </div>

        <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #e67e22' }}>
          <h3 style={{ color: '#e67e22', fontSize: '2.5em', margin: '10px 0', fontWeight: '600' }}>
            {stats.alumnos_sin_huella}
          </h3>
          <p style={{ fontSize: '1em', fontWeight: '500', color: '#5a6c7d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sin Huella</p>
        </div>

        <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #3498db' }}>
          <h3 style={{ color: '#3498db', fontSize: '2.5em', margin: '10px 0', fontWeight: '600' }}>
            {stats.total_asistencias}
          </h3>
          <p style={{ fontSize: '1em', fontWeight: '500', color: '#5a6c7d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Asistencias</p>
        </div>
      </div>

      {stats.estadisticas_grupos && Object.keys(stats.estadisticas_grupos).length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Estadísticas por Grupo</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Carrera Técnica</th>
                  <th>Total Alumnos</th>
                  <th>Con Huella</th>
                  <th>Sin Huella</th>
                  <th>Total Asistencias</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.estadisticas_grupos).map(([grupoId, grupoStats]) => (
                  <tr key={grupoId}>
                    <td><strong>{grupoStats.nombre}</strong></td>
                    <td>{grupoStats.carrera_tecnica || 'N/A'}</td>
                    <td>{grupoStats.total_alumnos}</td>
                    <td><span className="badge badge-success">{grupoStats.alumnos_con_huella}</span></td>
                    <td><span className="badge badge-warning">{grupoStats.total_alumnos - grupoStats.alumnos_con_huella}</span></td>
                    <td>{grupoStats.total_asistencias}</td>
                    <td>
                      <button
                        className="button"
                        onClick={() => handleDescargarExcel(grupoId)}
                        disabled={descargando}
                        style={{ 
                          padding: '5px 15px',
                          fontSize: '0.9em',
                          backgroundColor: '#27ae60',
                          color: 'white',
                          border: 'none'
                        }}
                        title="Descargar Excel de asistencias de este grupo"
                      >
                        📥 Excel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {Object.keys(stats.asistencias_por_fecha || {}).length > 0 && (
        <div className="card">
          <h3>Asistencias por Fecha</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Asistencias</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.asistencias_por_fecha)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([fecha, count]) => (
                    <tr key={fecha}>
                      <td>{fecha}</td>
                      <td><strong>{count}</strong></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Estadisticas;
