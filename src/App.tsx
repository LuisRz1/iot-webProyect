import { Lightbulb, Thermometer, Lock, Volume2, Users, History, DoorOpen, AlertCircle, X, UserCheck, RotateCcw, LogIn, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

// FIREBASE CONFIG
const FIREBASE_URL = "https://iot-smarty-default-rtdb.firebaseio.com/";

// Credenciales de acceso
const CREDENTIALS = {
  email: 'iot@gmail.com',
  password: '12345678.'
};

function App() {
  // Estados de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Estados
  const [zonas, setZonas] = useState({
    zona1: { nombre: 'Zone 1', state: false },
    zona2: { nombre: 'Zone 2', state: false },
    zona3: { nombre: 'Zone 3', state: false },
    zona4: { nombre: 'Private Zone', state: false }
  });

  const [puertas, setPuertas] = useState({
    principalServo1: 'closed',
    principalServo2: 'closed',
    zonaPrivada: 'closed',
    forceOpen: false
  });

  const [buzzer, setBuzzer] = useState(false);
  const [sensores, setSensores] = useState({ temperature: 0, humidity: 0 });
  const [empleados, setEmpleados] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [activeTab, setActiveTab] = useState('empleados');
  const [loading, setLoading] = useState(true);
  const [modalEmpleado, setModalEmpleado] = useState(null);

  // Función para hacer requests a Firebase
  const firebasePut = async (path, value) => {
    try {
      const response = await fetch(`${FIREBASE_URL}${path}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value)
      });
      return response.ok;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const firebaseGet = async (path) => {
    try {
      const response = await fetch(`${FIREBASE_URL}${path}.json`);
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    // Verificar si ya está autenticado (localStorage)
    const authStatus = localStorage.getItem('smarty-auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        // Cargar zonas
        const zonasData = await firebaseGet('zonas');
        if (zonasData) {
          setZonas({
            zona1: { nombre: zonasData.zona1?.nombre || 'Zone 1', state: zonasData.zona1?.led?.state || false },
            zona2: { nombre: zonasData.zona2?.nombre || 'Zone 2', state: zonasData.zona2?.led?.state || false },
            zona3: { nombre: zonasData.zona3?.nombre || 'Zone 3', state: zonasData.zona3?.led?.state || false },
            zona4: { nombre: zonasData.zona4?.nombre || 'Private Zone', state: zonasData.zona4?.led?.state || false }
          });
        }

        // Cargar puertas
        const puertasData = await firebaseGet('puertas');
        if (puertasData) {
          setPuertas({
            principalServo1: puertasData.principal?.servo1?.state || 'closed',
            principalServo2: puertasData.principal?.servo2?.state || 'closed',
            zonaPrivada: puertasData.zona_privada?.state || 'closed',
            forceOpen: puertasData.zona_privada?.force_open || false
          });
          setBuzzer(puertasData.zona_privada?.buzzer?.active || false);
        }

        // Cargar sensores
        const sensoresData = await firebaseGet('sensores');
        if (sensoresData) {
          setSensores({
            temperature: sensoresData.temperature || 0,
            humidity: sensoresData.humidity || 0
          });
        }

        // Cargar empleados
        const empleadosData = await firebaseGet('empleados');
        if (empleadosData) {
          const empArray = Object.keys(empleadosData).map(key => ({
            uid: key,
            nombre: empleadosData[key].nombre || 'Sin nombre',
            acceso_zona_privada: empleadosData[key].acceso_zona_privada || false,
            asistencia: {
              total: empleadosData[key].asistencia?.total || 0
            }
          }));
          setEmpleados(empArray);
        }

        // Cargar historial (últimos 15)
        const historialData = await firebaseGet('historial');
        if (historialData) {
          const histArray = Object.keys(historialData).map(key => ({
            id: key,
            ...historialData[key]
          })).reverse().slice(0, 15);
          setHistorial(histArray);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setLoading(false);
      }
    };

    loadData();

    // Actualizar cada 3 segundos
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Manejar login
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (loginEmail === CREDENTIALS.email && loginPassword === CREDENTIALS.password) {
      setIsAuthenticated(true);
      localStorage.setItem('smarty-auth', 'true');
      setLoginEmail('');
      setLoginPassword('');
    } else {
      setLoginError('Credenciales incorrectas');
    }
  };

  // Manejar logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('smarty-auth');
  };

  // Toggle luz de zona
  const toggleZona = async (zonaKey) => {
    const newState = !zonas[zonaKey].state;
    await firebasePut(`zonas/${zonaKey}/led/state`, newState);
    setZonas(prev => ({
      ...prev,
      [zonaKey]: { ...prev[zonaKey], state: newState }
    }));
  };

  // Controlar puertas
  const controlarPuerta = async (tipo, accion) => {
    if (tipo === 'principal') {
      await firebasePut('puertas/principal/servo1/state', accion);
      await firebasePut('puertas/principal/servo2/state', accion);
    } else if (tipo === 'privada') {
      const newForceOpen = !puertas.forceOpen;
      await firebasePut('puertas/zona_privada/force_open', newForceOpen);
      await firebasePut('puertas/zona_privada/state', newForceOpen ? 'open' : 'closed');
    }
  };

  // Controlar buzzer
  const toggleBuzzer = async () => {
    const newState = !buzzer;
    await firebasePut('puertas/zona_privada/buzzer/active', newState);
    setBuzzer(newState);
  };

  // Cambiar acceso empleado
  const toggleAccesoEmpleado = async (empleado) => {
    const newAccess = !empleado.acceso_zona_privada;
    await firebasePut(`empleados/${empleado.uid}/acceso_zona_privada`, newAccess);
    setEmpleados(prev => prev.map(emp =>
        emp.uid === empleado.uid ? { ...emp, acceso_zona_privada: newAccess } : emp
    ));
    setModalEmpleado(null);
  };

  // Resetear asistencias
  const resetearAsistencias = async (empleado) => {
    await firebasePut(`empleados/${empleado.uid}/asistencia/total`, 0);
    setEmpleados(prev => prev.map(emp =>
        emp.uid === empleado.uid ? { ...emp, asistencia: { total: 0 } } : emp
    ));
    setModalEmpleado(null);
  };

  // Pantalla de Login
  if (!isAuthenticated) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
            <div className="text-center mb-8">
              <div className="bg-purple-500/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-purple-300" size={40} />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">Smarty IoT</h1>
              <p className="text-white/70">Sistema de Control de Accesos</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm font-semibold mb-2">
                  Correo Electrónico
                </label>
                <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="usuario@ejemplo.com"
                    required
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-semibold mb-2">
                  Contraseña
                </label>
                <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="••••••••"
                    required
                />
              </div>

              {loginError && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                    {loginError}
                  </div>
              )}

              <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-6"
              >
                <LogIn size={20} />
                Iniciar Sesión
              </button>
            </form>

            <div className="mt-6 text-center text-white/40 text-sm">
              Acceso seguro al sistema IoT
            </div>
          </div>
        </div>
    );
  }

  if (loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-white text-2xl animate-pulse">Cargando sistema...</div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">Smarty IoT</h1>
              <p className="text-xl text-white/70">Sistema de Control de Accesos</p>
            </div>
            <button
                onClick={handleLogout}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 border border-red-500/30"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'luces', label: ' Luces' },
              { id: 'puertas', label: ' Puertas' },
              { id: 'sensores', label: ' Sensores' },
              { id: 'empleados', label: ' Empleados' },
              { id: 'historial', label: ' Historial' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                        activeTab === tab.id
                            ? 'bg-white text-purple-900'
                            : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                  {tab.label}
                </button>
            ))}
          </div>

          {/* LUCES */}
          {activeTab === 'luces' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(zonas).map((key, index) => (
                    <div
                        key={key}
                        className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer"
                        onClick={() => toggleZona(key)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            index === 0 ? 'bg-blue-500/30' :
                                index === 1 ? 'bg-amber-500/30' :
                                    index === 2 ? 'bg-green-500/30' : 'bg-purple-500/30'
                        }`}>
                          <Lightbulb className={`${
                              index === 0 ? 'text-blue-300' :
                                  index === 1 ? 'text-amber-300' :
                                      index === 2 ? 'text-green-300' : 'text-purple-300'
                          }`} size={24} />
                        </div>
                        <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleZona(key);
                            }}
                            className={`relative w-14 h-8 rounded-full transition-all ${
                                zonas[key].state ? 'bg-green-500' : 'bg-white/20'
                            }`}
                        >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                              zonas[key].state ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                      <h3 className="text-white text-lg font-semibold mb-1">{zonas[key].nombre}</h3>
                      <p className="text-white/60 text-sm">{zonas[key].state ? '✓ Encendida' : '✗ Apagada'}</p>
                    </div>
                ))}
              </div>
          )}

          {/* PUERTAS */}
          {activeTab === 'puertas' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Puerta Principal */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <DoorOpen className="text-blue-300" size={32} />
                    <h3 className="text-white text-xl font-semibold">Puerta Principal</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-white">
                      <span>Servo 1:</span>
                      <span className={`font-bold ${puertas.principalServo1 === 'open' ? 'text-green-400' : 'text-red-400'}`}>
                    {puertas.principalServo1 === 'open' ? ' ABIERTO' : ' CERRADO'}
                  </span>
                    </div>
                    <div className="flex items-center justify-between text-white">
                      <span>Servo 2:</span>
                      <span className={`font-bold ${puertas.principalServo2 === 'open' ? 'text-green-400' : 'text-red-400'}`}>
                    {puertas.principalServo2 === 'open' ? ' ABIERTO' : ' CERRADO'}
                  </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                          onClick={() => controlarPuerta('principal', 'open')}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-all"
                      >
                        Abrir
                      </button>
                      <button
                          onClick={() => controlarPuerta('principal', 'closed')}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-all"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Zona Privada */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Lock className="text-purple-300" size={32} />
                    <h3 className="text-white text-xl font-semibold">Zona Privada</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-white">
                      <span>Estado:</span>
                      <span className={`font-bold ${puertas.zonaPrivada === 'open' ? 'text-green-400' : 'text-red-400'}`}>
                    {puertas.zonaPrivada === 'open' ? ' ABIERTA' : ' CERRADA'}
                  </span>
                    </div>
                    <button
                        onClick={() => controlarPuerta('privada')}
                        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
                            puertas.forceOpen
                                ? 'bg-green-500/30 text-green-200 border-2 border-green-500/50 hover:bg-green-500/40'
                                : 'bg-red-500/30 text-red-200 border-2 border-red-500/50 hover:bg-red-500/40'
                        }`}
                    >
                      {puertas.forceOpen ? '✓ Apertura Forzada Activa' : '✗ Apertura Forzada Inactiva'}
                    </button>
                  </div>
                </div>

                {/* Buzzer */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Volume2 className="text-red-300" size={32} />
                    <h3 className="text-white text-xl font-semibold">Buzzer</h3>
                  </div>
                  <div className="flex items-center justify-between text-white mb-4">
                    <span>Estado:</span>
                    <span className={`font-bold ${buzzer ? 'text-red-400' : 'text-green-400'}`}>
                  {buzzer ? '🔊 SONANDO' : ' SILENCIOSO'}
                </span>
                  </div>
                  <button
                      onClick={toggleBuzzer}
                      className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
                          buzzer
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                  >
                    {buzzer ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
          )}

          {/* SENSORES */}
          {activeTab === 'sensores' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                  <div className="flex items-center justify-center mb-6">
                    <Thermometer className="text-orange-300" size={48} />
                  </div>
                  <div className="text-center">
                    <div className="text-6xl font-bold text-white mb-2">
                      {sensores.temperature.toFixed(1)}°C
                    </div>
                    <div className="text-xl text-white/70">Temperatura</div>
                    <div className="mt-4 text-white/50 text-sm">
                      {sensores.temperature < 20 ? ' Fresco' :
                          sensores.temperature < 26 ? ' Óptimo' : ' Cálido'}
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                  <div className="flex items-center justify-center mb-6">
                    <AlertCircle className="text-cyan-300" size={48} />
                  </div>
                  <div className="text-center">
                    <div className="text-6xl font-bold text-white mb-2">
                      {sensores.humidity.toFixed(1)}%
                    </div>
                    <div className="text-xl text-white/70">Humedad</div>
                    <div className="mt-4 text-white/50 text-sm">
                      {sensores.humidity < 40 ? ' Seco' :
                          sensores.humidity < 60 ? 'Óptimo' : ' Húmedo'}
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* EMPLEADOS */}
          {activeTab === 'empleados' && (
              <div>
                {empleados.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
                      <Users className="text-white/50 mx-auto mb-4" size={64} />
                      <p className="text-white/70 text-xl">No hay empleados registrados</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {empleados.map(emp => (
                          <div
                              key={emp.uid}
                              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer"
                              onClick={() => setModalEmpleado(emp)}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-white text-xl font-semibold">{emp.nombre}</h3>
                                <p className="text-white/50 text-sm">{emp.uid}</p>
                              </div>
                              <Users className="text-blue-300" size={24} />
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-white/70">
                                <span>Asistencias:</span>
                                <span className="font-bold text-white">{emp.asistencia?.total || 0}</span>
                              </div>
                              <div className="flex justify-between text-white/70">
                                <span>Acceso Privado:</span>
                                <span className={`font-bold ${emp.acceso_zona_privada ? 'text-green-400' : 'text-red-400'}`}>
                          {emp.acceso_zona_privada ? '✓ SÍ' : '✗ NO'}
                        </span>
                              </div>
                            </div>
                            <div className="text-center text-white/50 text-sm">
                              Click para gestionar
                            </div>
                          </div>
                      ))}
                    </div>
                )}
              </div>
          )}

          {/* HISTORIAL */}
          {activeTab === 'historial' && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-white text-2xl font-semibold mb-6">Últimas Actividades</h3>
                {historial.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="text-white/50 mx-auto mb-4" size={64} />
                      <p className="text-white/70 text-xl">No hay actividades registradas</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {historial.map((item) => (
                          <div key={item.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-white font-semibold">{item.accion}</p>
                                <p className="text-white/50 text-sm mt-1">{item.usuario}</p>
                              </div>
                              <span className="text-white/40 text-xs whitespace-nowrap ml-4">{item.timestamp}</span>
                            </div>
                          </div>
                      ))}
                    </div>
                )}
              </div>
          )}
        </div>

        {/* MODAL EMPLEADO */}
        {modalEmpleado && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setModalEmpleado(null)}>
              <div className="bg-gradient-to-br from-slate-800 to-purple-900 rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-white text-2xl font-bold">{modalEmpleado.nombre}</h3>
                    <p className="text-white/50 text-sm">{modalEmpleado.uid}</p>
                  </div>
                  <button
                      onClick={() => setModalEmpleado(null)}
                      className="text-white/50 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Asistencias Totales:</span>
                      <span className="text-white font-bold text-xl">{modalEmpleado.asistencia?.total || 0}</span>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Acceso Zona Privada:</span>
                      <span className={`font-bold text-lg ${modalEmpleado.acceso_zona_privada ? 'text-green-400' : 'text-red-400'}`}>
                    {modalEmpleado.acceso_zona_privada ? '✓ PERMITIDO' : '✗ DENEGADO'}
                  </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                      onClick={() => toggleAccesoEmpleado(modalEmpleado)}
                      className={`w-full py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                          modalEmpleado.acceso_zona_privada
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                  >
                    <UserCheck size={20} />
                    {modalEmpleado.acceso_zona_privada ? 'Revocar Acceso Privado' : 'Conceder Acceso Privado'}
                  </button>
                  <button
                      onClick={() => resetearAsistencias(modalEmpleado)}
                      className="w-full py-4 rounded-lg font-semibold text-lg bg-yellow-500 hover:bg-yellow-600 text-white flex items-center justify-center gap-2 transition-all"
                  >
                    <RotateCcw size={20} />
                    Resetear Asistencias
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}

export default App;