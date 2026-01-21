import React, { useState, useEffect } from 'react';
import './App.css';
import ApiService from './services/api';
import GruposView from './components/GruposView';
import GrupoDetail from './components/GrupoDetail';
import VerificarAsistencia from './components/VerificarAsistencia';
import RegistroRapido from './components/RegistroRapido';
import Estadisticas from './components/Estadisticas';

function App() {
  const [activeTab, setActiveTab] = useState('grupos');
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDeviceStatus();
  }, []);

  const checkDeviceStatus = async () => {
    try {
      const status = await ApiService.getDeviceStatus();
      setDeviceStatus(status);
    } catch (error) {
      console.error('Error al verificar dispositivo:', error);
      setDeviceStatus({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGrupoSelect = (grupo) => {
    setSelectedGrupo(grupo);
    setActiveTab('grupo-detail');
  };

  const handleBackToGrupos = () => {
    setSelectedGrupo(null);
    setActiveTab('grupos');
  };

  const tabs = [
    { id: 'grupos', label: 'Grupos', icon: '📚' },
    { id: 'verificar', label: 'Pasar Lista', icon: '✓' },
    { id: 'rapido', label: 'Registro Rápido', icon: '⚡' },
    { id: 'estadisticas', label: 'Estadísticas', icon: '📊' }
  ];

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div>
            <h1>Sistema de Control de Asistencia</h1>
            <p className="subtitle">Escuela Media Superior - Registro mediante Huellas Digitales (WebAuthn)</p>
          </div>
          
          {deviceStatus && (
            <div className={`device-status ${deviceStatus.dispositivo_disponible ? 'online' : 'offline'}`}>
              {deviceStatus.dispositivo_disponible ? (
                <span>✓ Dispositivo Conectado</span>
              ) : (
                <span>✗ Dispositivo No Disponible</span>
              )}
            </div>
          )}
        </div>
      </header>

      {selectedGrupo && activeTab === 'grupo-detail' ? (
        <GrupoDetail 
          grupo={selectedGrupo} 
          onBack={handleBackToGrupos}
          onRefresh={checkDeviceStatus}
        />
      ) : (
        <>
          <nav className="tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <main className="main-content">
            {loading ? (
              <div className="loading">Cargando...</div>
            ) : (
              <>
                {activeTab === 'grupos' && (
                  <GruposView onGrupoSelect={handleGrupoSelect} />
                )}
                {activeTab === 'verificar' && (
                  <VerificarAsistencia selectedGrupo={selectedGrupo} />
                )}
                {activeTab === 'rapido' && (
                  <RegistroRapido />
                )}
                {activeTab === 'estadisticas' && (
                  <Estadisticas />
                )}
              </>
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
