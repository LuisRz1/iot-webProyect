import {
  Lightbulb,
  Thermometer,
  Lock,
  Volume2,
  Users,
  History,
  DoorOpen,
  AlertCircle,
  X,
  UserCheck,
  RotateCcw,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';

// FIREBASE CONFIG
const FIREBASE_URL = "https://iot-smarty-default-rtdb.firebaseio.com/";

// Credenciales de acceso
const CREDENTIALS = {
  email: 'iot@gmail.com',
  password: '12345678.'
};

// UIDs disponibles para asignar
const UIDS_DISPONIBLES = ['UID_1', 'UID_2', 'UID_3', 'UID_4', 'UID_5', 'UID_6'];

function App() {
  // Estados de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Estados principales
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
  const [empleados, setEmpleados] = useState([]);              // activos
  const [empleadosEliminados, setEmpleadosEliminados] = useState([]); // eliminados (histórico)
  const [historial, setHistorial] = useState([]);
  const [activeTab, setActiveTab] = useState('empleados');
  const [loading, setLoading] = useState(true);

  // Modales
  const [modalEmpleado, setModalEmpleado] = useState(null); // detalle rápido
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);     // contiene uid
  const [modalEliminar, setModalEliminar] = useState(null); // contiene uid
  const [modalHistorialAsistencias, setModalHistorialAsistencias] = useState(null); // contiene objeto empleado (activo o eliminado)

  // Modal para asistencias por día (vista calendario)
  const [selectedDateAttendance, setSelectedDateAttendance] = useState(null);

  // Navegación de mes en la vista calendario
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  // Estados para formularios de empleado
  const [formNombre, setFormNombre] = useState('');
  const [formAcceso, setFormAcceso] = useState(false);
  const [formUid, setFormUid] = useState(''); // UID seleccionado en el modal de creación

  // Helpers Firebase
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

  const firebaseDelete = async (path) => {
    try {
      const response = await fetch(`${FIREBASE_URL}${path}.json`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  // Cargar status de login
  useEffect(() => {
    const authStatus = localStorage.getItem('smarty-auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Cargar datos del sistema cuando hay sesión
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        const zonasData = await firebaseGet('zonas');
        if (zonasData) {
          setZonas({
            zona1: { nombre: zonasData.zona1?.nombre || 'Zone 1', state: zonasData.zona1?.led?.state || false },
            zona2: { nombre: zonasData.zona2?.nombre || 'Zone 2', state: zonasData.zona2?.led?.state || false },
            zona3: { nombre: zonasData.zona3?.nombre || 'Zone 3', state: zonasData.zona3?.led?.state || false },
            zona4: { nombre: zonasData.zona4?.nombre || 'Private Zone', state: zonasData.zona4?.led?.state || false }
          });
        }

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

        const sensoresData = await firebaseGet('sensores');
        if (sensoresData) {
          setSensores({
            temperature: sensoresData.temperature || 0,
            humidity: sensoresData.humidity || 0
          });
        }

        const empleadosData = await firebaseGet('empleados');
        if (empleadosData) {
          const empArray = Object.keys(empleadosData).map(key => ({
            uid: key,
            nombre: empleadosData[key].nombre || 'Sin nombre',
            acceso_zona_privada: empleadosData[key].acceso_zona_privada || false,
            asistencia: {
              total: empleadosData[key].asistencia?.total || 0,
              por_dia: empleadosData[key].asistencia?.por_dia || {}
            }
          }));
          setEmpleados(empArray);
        } else {
          setEmpleados([]);
        }

        // Cargar empleados eliminados (históricos)
        const empleadosEliminadosData = await firebaseGet('empleados_eliminados');
        if (empleadosEliminadosData) {
          const empElimArray = Object.keys(empleadosEliminadosData).map(key => ({
            uid: key,
            nombre: empleadosEliminadosData[key].nombre || 'Sin nombre',
            acceso_zona_privada: empleadosEliminadosData[key].acceso_zona_privada || false,
            asistencia: {
              total: empleadosEliminadosData[key].asistencia?.total || 0,
              por_dia: empleadosEliminadosData[key].asistencia?.por_dia || {}
            }
          }));
          setEmpleadosEliminados(empElimArray);
        } else {
          setEmpleadosEliminados([]);
        }

        const historialData = await firebaseGet('historial');
        if (historialData) {
          const histArray = Object.keys(historialData)
              .map(key => ({
                id: key,
                ...historialData[key]
              }))
              .reverse()
              .slice(0, 15);
          setHistorial(histArray);
        } else {
          setHistorial([]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Login
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

  // Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('smarty-auth');
  };

  // Crear empleado con UID seleccionado
  const crearEmpleado = async () => {
    if (!formNombre.trim()) {
      alert('Por favor ingresa un nombre');
      return;
    }

    if (!formUid) {
      alert('Por favor selecciona un UID disponible');
      return;
    }

    // Validar que el UID no esté en uso por un empleado activo
    const uidsUsados = empleados.map(e => e.uid);
    if (uidsUsados.includes(formUid)) {
      alert('El UID seleccionado ya está en uso');
      return;
    }

    const nuevoEmpleado = {
      nombre: formNombre.trim(),
      acceso_zona_privada: formAcceso,
      asistencia: {
        total: 0,
        por_dia: {}
      }
    };

    const ok = await firebasePut(`empleados/${formUid}`, nuevoEmpleado);
    if (!ok) {
      alert('Error creando empleado');
      return;
    }

    setModalCrear(false);
    setFormNombre('');
    setFormAcceso(false);
    setFormUid('');
  };

  // Editar empleado (no cambiamos UID, solo nombre y acceso)
  const editarEmpleado = async (uid) => {
    if (!formNombre.trim()) {
      alert('Por favor ingresa un nombre');
      return;
    }

    const empleadoActual = empleados.find(e => e.uid === uid);
    if (!empleadoActual) return;

    const empleadoActualizado = {
      nombre: formNombre.trim(),
      acceso_zona_privada: formAcceso,
      asistencia: empleadoActual.asistencia || { total: 0, por_dia: {} }
    };

    const ok = await firebasePut(`empleados/${uid}`, empleadoActualizado);
    if (!ok) {
      alert('Error actualizando empleado');
      return;
    }

    setModalEditar(null);
    setFormNombre('');
    setFormAcceso(false);
  };

  // Eliminar empleado SIN borrar su historial de asistencias:
  // se mueve a /empleados_eliminados/UID y luego se borra de /empleados/UID
  const eliminarEmpleado = async (uid) => {
    const empleado = empleados.find(e => e.uid === uid);

    if (empleado) {
      await firebasePut(`empleados_eliminados/${uid}`, {
        nombre: empleado.nombre,
        acceso_zona_privada: empleado.acceso_zona_privada,
        asistencia: empleado.asistencia || { total: 0, por_dia: {} }
      });
    }

    const ok = await firebaseDelete(`empleados/${uid}`);
    if (!ok) {
      alert('Error eliminando empleado');
      return;
    }

    setModalEliminar(null);
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

  // Registrar una asistencia (manual desde el panel, además de la que manda Arduino)
  const registrarAsistencia = async (uid) => {
    const empleado = empleados.find(e => e.uid === uid);
    if (!empleado) return;

    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const hora = ahora.toTimeString().slice(0, 5);  // "HH:MM"

    const asistenciaActual = empleado.asistencia || { total: 0, por_dia: {} };
    const porDiaActual = asistenciaActual.por_dia || {};
    const datosDia = porDiaActual[fecha] || { cantidad: 0, horas: [] };

    const nuevaAsistencia = {
      total: (asistenciaActual.total || 0) + 1,
      por_dia: {
        ...porDiaActual,
        [fecha]: {
          cantidad: (datosDia.cantidad || 0) + 1,
          horas: [...(datosDia.horas || []), hora]
        }
      }
    };

    const ok = await firebasePut(`empleados/${uid}/asistencia`, nuevaAsistencia);
    if (!ok) {
      alert('Error registrando asistencia');
      return;
    }

    // Actualizar estado local
    setEmpleados(prev =>
        prev.map(e =>
            e.uid === uid ? { ...e, asistencia: nuevaAsistencia } : e
        )
    );

    // Si el modal de historial está abierto para este empleado, actualizarlo también
    setModalHistorialAsistencias(prev =>
        prev && prev.uid === uid
            ? { ...prev, asistencia: nuevaAsistencia }
            : prev
    );
  };

  // Resetear asistencias totales de un empleado (activo o eliminado)
  const resetearAsistencias = async (empleado) => {
    if (!empleado) return;

    const isDeleted = !empleados.some(e => e.uid === empleado.uid);
    const basePath = isDeleted ? 'empleados_eliminados' : 'empleados';

    await firebasePut(`${basePath}/${empleado.uid}/asistencia/total`, 0);

    if (isDeleted) {
      setEmpleadosEliminados(prev =>
          prev.map(e =>
              e.uid === empleado.uid
                  ? {
                    ...e,
                    asistencia: {
                      ...(e.asistencia || {}),
                      total: 0
                    }
                  }
                  : e
          )
      );
    } else {
      setEmpleados(prev =>
          prev.map(e =>
              e.uid === empleado.uid
                  ? {
                    ...e,
                    asistencia: {
                      ...(e.asistencia || {}),
                      total: 0
                    }
                  }
                  : e
          )
      );
    }

    setModalHistorialAsistencias(prev =>
        prev && prev.uid === empleado.uid
            ? {
              ...prev,
              asistencia: {
                ...(prev.asistencia || {}),
                total: 0
              }
            }
            : prev
    );
  };

  // Construir mapa global de asistencias por día (activos + eliminados)
  const buildMapaAsistencias = () => {
    const mapa = {};
    const todos = [...empleados, ...empleadosEliminados];

    todos.forEach(emp => {
      const porDia = emp.asistencia?.por_dia || {};
      const esEliminado = empleadosEliminados.some(e => e.uid === emp.uid);

      Object.entries(porDia).forEach(([fecha, datos]) => {
        const cantidad = datos.cantidad || 0;
        const horas = datos.horas || [];

        if (!mapa[fecha]) {
          mapa[fecha] = {
            total: 0,
            registros: []
          };
        }

        mapa[fecha].total += cantidad;
        mapa[fecha].registros.push({
          uid: emp.uid,
          nombre: emp.nombre,
          cantidad,
          horas,
          eliminado: esEliminado
        });
      });
    });

    return mapa;
  };

  const mapaAsistencias = buildMapaAsistencias();

  // PANTALLA LOGIN
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

  // PANTALLA CARGANDO
  if (loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-white text-2xl animate-pulse">Cargando sistema...</div>
        </div>
    );
  }

  // Datos para calendario
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startingWeekday = firstDay.getDay(); // 0=Domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells = [];
  for (let i = 0; i < startingWeekday; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const cambiarMes = (delta) => {
    const nuevaFecha = new Date(year, month + delta, 1);
    setCurrentMonth(nuevaFecha);
  };

  const formatFechaKey = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // DASHBOARD
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
              { id: 'sensores', label: '️ Sensores' },
              { id: 'empleados', label: ' Empleados' },
              { id: 'eliminados', label: '️ Eliminados' },
              { id: 'asistencias', label: 'Asistencias' },
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
                        <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                index === 0
                                    ? 'bg-blue-500/30'
                                    : index === 1
                                        ? 'bg-amber-500/30'
                                        : index === 2
                                            ? 'bg-green-500/30'
                                            : 'bg-purple-500/30'
                            }`}
                        >
                          <Lightbulb
                              className={`${
                                  index === 0
                                      ? 'text-blue-300'
                                      : index === 1
                                          ? 'text-amber-300'
                                          : index === 2
                                              ? 'text-green-300'
                                              : 'text-purple-300'
                              }`}
                              size={24}
                          />
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
                          <div
                              className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                                  zonas[key].state ? 'translate-x-7' : 'translate-x-1'
                              }`}
                          />
                        </button>
                      </div>
                      <h3 className="text-white text-lg font-semibold mb-1">
                        {zonas[key].nombre}
                      </h3>
                      <p className="text-white/60 text-sm">
                        {zonas[key].state ? '✓ Encendida' : '✗ Apagada'}
                      </p>
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
                      <span
                          className={`font-bold ${
                              puertas.principalServo1 === 'open'
                                  ? 'text-green-400'
                                  : 'text-red-400'
                          }`}
                      >
                    {puertas.principalServo1 === 'open'
                        ? ' ABIERTO'
                        : ' CERRADO'}
                  </span>
                    </div>
                    <div className="flex items-center justify-between text-white">
                      <span>Servo 2:</span>
                      <span
                          className={`font-bold ${
                              puertas.principalServo2 === 'open'
                                  ? 'text-green-400'
                                  : 'text-red-400'
                          }`}
                      >
                    {puertas.principalServo2 === 'open'
                        ? ' ABIERTO'
                        : ' CERRADO'}
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
                      <span
                          className={`font-bold ${
                              puertas.zonaPrivada === 'open'
                                  ? 'text-green-400'
                                  : 'text-red-400'
                          }`}
                      >
                    {puertas.zonaPrivada === 'open'
                        ? ' ABIERTA'
                        : ' CERRADA'}
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
                      {puertas.forceOpen
                          ? '✓ Apertura Forzada Activa'
                          : '✗ Apertura Forzada Inactiva'}
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
                    <span
                        className={`font-bold ${
                            buzzer ? 'text-red-400' : 'text-green-400'
                        }`}
                    >
                  {buzzer ? 'SONANDO' : ' SILENCIOSO'}
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
                      {sensores.temperature < 20
                          ? 'Fresco'
                          : sensores.temperature < 26
                              ? ' Óptimo'
                              : ' Cálido'}
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
                      {sensores.humidity < 40
                          ? '️ Seco'
                          : sensores.humidity < 60
                              ? ' Óptimo'
                              : ' Húmedo'}
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* EMPLEADOS (ACTIVOS) */}
          {activeTab === 'empleados' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-white text-2xl font-bold">
                      Gestión de Empleados
                    </h2>
                    <p className="text-white/60 text-sm">
                      {empleados.length}/6 empleados registrados
                    </p>
                  </div>
                  <button
                      onClick={() => {
                        if (empleados.length >= UIDS_DISPONIBLES.length) {
                          alert('Máximo de empleados alcanzado');
                          return;
                        }
                        // Preseleccionamos el primer UID disponible
                        const availableUids = UIDS_DISPONIBLES.filter(
                            (uid) => !empleados.some((e) => e.uid === uid)
                        );
                        setFormUid(availableUids[0] || '');
                        setFormNombre('');
                        setFormAcceso(false);
                        setModalCrear(true);
                      }}
                      disabled={empleados.length >= UIDS_DISPONIBLES.length}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                          empleados.length >= UIDS_DISPONIBLES.length
                              ? 'bg-gray-500/30 text-gray-400 cursor-not-allowed'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                  >
                    <Plus size={20} />
                    Nuevo Empleado
                  </button>
                </div>

                {empleados.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
                      <Users className="text-white/50 mx-auto mb-4" size={64} />
                      <p className="text-white/70 text-xl mb-4">
                        No hay empleados registrados
                      </p>
                      <button
                          onClick={() => {
                            const availableUids = UIDS_DISPONIBLES.filter(
                                (uid) => !empleados.some((e) => e.uid === uid)
                            );
                            setFormUid(availableUids[0] || '');
                            setFormNombre('');
                            setFormAcceso(false);
                            setModalCrear(true);
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all inline-flex items-center gap-2"
                      >
                        <Plus size={20} />
                        Crear Primer Empleado
                      </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {empleados.map((emp) => (
                          <div
                              key={emp.uid}
                              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer"
                              onClick={() => setModalEmpleado(emp)}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-white text-xl font-semibold">
                                  {emp.nombre}
                                </h3>
                                <p className="text-white/50 text-sm">{emp.uid}</p>
                              </div>
                              <Users className="text-blue-300" size={24} />
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-white/70">
                                <span>Asistencias:</span>
                                <span className="font-bold text-white">
                          {emp.asistencia?.total || 0}
                        </span>
                              </div>
                              <div className="flex justify-between text-white/70">
                                <span>Acceso Privado:</span>
                                <span
                                    className={`font-bold ${
                                        emp.acceso_zona_privada
                                            ? 'text-green-400'
                                            : 'text-red-400'
                                    }`}
                                >
                          {emp.acceso_zona_privada ? '✓ SÍ' : '✗ NO'}
                        </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setModalHistorialAsistencias(emp);
                                  }}
                                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 p-2 rounded-lg transition-all border border-blue-500/30"
                                  title="Ver historial"
                              >
                                <Calendar size={18} className="mx-auto" />
                              </button>
                              <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormNombre(emp.nombre);
                                    setFormAcceso(emp.acceso_zona_privada);
                                    setModalEditar(emp.uid);
                                  }}
                                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 p-2 rounded-lg transition-all border border-amber-500/30"
                                  title="Editar"
                              >
                                <Edit size={18} className="mx-auto" />
                              </button>
                              <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setModalEliminar(emp.uid);
                                  }}
                                  className="bg-red-500/20 hover:bg-red-500/30 text-red-200 p-2 rounded-lg transition-all border border-red-500/30"
                                  title="Eliminar"
                              >
                                <Trash2 size={18} className="mx-auto" />
                              </button>
                            </div>

                            {/* Botón para registrar asistencia ahora */}
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  registrarAsistencia(emp.uid);
                                }}
                                className="mt-3 w-full bg-green-500/20 hover:bg-green-500/30 text-green-200 py-2 rounded-lg text-sm font-semibold border border-green-500/40 flex items-center justify-center gap-2"
                            >
                              <UserCheck size={16} />
                              Registrar asistencia ahora
                            </button>
                          </div>
                      ))}
                    </div>
                )}
              </div>
          )}

          {/* EMPLEADOS ELIMINADOS (HISTÓRICO) */}
          {activeTab === 'eliminados' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-white text-2xl font-bold">
                      Empleados Eliminados
                    </h2>
                    <p className="text-white/60 text-sm">
                      Historial de asistencias de empleados ya eliminados
                    </p>
                  </div>
                </div>

                {empleadosEliminados.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
                      <Users className="text-white/50 mx-auto mb-4" size={64} />
                      <p className="text-white/70 text-xl">
                        No hay empleados eliminados con historial
                      </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {empleadosEliminados.map((emp) => (
                          <div
                              key={emp.uid}
                              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-red-500/40 hover:bg-white/15 transition-all cursor-pointer"
                              onClick={() => setModalHistorialAsistencias(emp)}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-white text-xl font-semibold flex items-center gap-2">
                                  {emp.nombre}
                                  <span className="text-xs bg-red-500/30 text-red-200 px-2 py-0.5 rounded-full border border-red-500/60">
                            ELIMINADO
                          </span>
                                </h3>
                                <p className="text-white/50 text-sm">{emp.uid}</p>
                              </div>
                              <Users className="text-red-300" size={24} />
                            </div>
                            <div className="space-y-2 mb-2">
                              <div className="flex justify-between text-white/70">
                                <span>Asistencias:</span>
                                <span className="font-bold text-white">
                          {emp.asistencia?.total || 0}
                        </span>
                              </div>
                            </div>
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setModalHistorialAsistencias(emp);
                                }}
                                className="mt-3 w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 py-2 rounded-lg text-sm font-semibold border border-blue-500/40 flex items-center justify-center gap-2"
                            >
                              <Calendar size={16} />
                              Ver historial de asistencias
                            </button>
                          </div>
                      ))}
                    </div>
                )}
              </div>
          )}

          {/* ASISTENCIAS (VISTA GENERAL TIPO CALENDARIO) */}
          {activeTab === 'asistencias' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-white text-2xl font-bold flex items-center gap-2">
                      <Calendar size={24} />
                      Asistencias por calendario
                    </h2>
                    <p className="text-white/60 text-sm">
                      Vista general de todos los registros de asistencia (activos y eliminados)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg border border-white/20">
                    <button
                        onClick={() => cambiarMes(-1)}
                        className="p-1 rounded-full hover:bg-white/20 text-white"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <span className="text-white font-semibold">
                  {monthNames[month]} {year}
                </span>
                    <button
                        onClick={() => cambiarMes(1)}
                        className="p-1 rounded-full hover:bg-white/20 text-white"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                {/* Leyenda */}
                <div className="mb-4 flex items-center gap-4 text-xs text-white/60">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-400/70 border border-emerald-300/80" />
                    <span>Día con asistencias</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-400/10 border border-emerald-300/30" />
                    <span>Suma total del día</span>
                  </div>
                </div>

                {/* Cabecera de días de la semana */}
                <div className="grid grid-cols-7 text-center text-white/60 text-xs mb-2">
                  {weekDays.map((d) => (
                      <div key={d} className="py-1">
                        {d}
                      </div>
                  ))}
                </div>

                {/* Calendario */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="grid grid-cols-7 gap-1">
                    {calendarCells.map((day, idx) => {
                      if (day === null) {
                        return <div key={idx} className="h-16" />;
                      }

                      const fechaKey = formatFechaKey(year, month, day);
                      const infoDia = mapaAsistencias[fechaKey];

                      const hasAsistencias = !!infoDia;

                      return (
                          <button
                              key={idx}
                              disabled={!hasAsistencias}
                              onClick={() => {
                                if (hasAsistencias) {
                                  setSelectedDateAttendance({
                                    fecha: fechaKey,
                                    ...infoDia
                                  });
                                }
                              }}
                              className={`h-16 rounded-xl border flex flex-col items-center justify-between p-1 text-xs transition-all ${
                                  hasAsistencias
                                      ? 'border-emerald-400/70 bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer'
                                      : 'border-white/10 bg-white/0 text-white/40 cursor-default'
                              }`}
                          >
                            <div className="w-full flex justify-between items-center">
                        <span className="text-white text-sm font-semibold">
                          {day}
                        </span>
                            </div>
                            {hasAsistencias && (
                                <div className="w-full flex flex-col items-center">
                          <span className="text-emerald-300 text-[10px] font-semibold">
                            {infoDia.total} {infoDia.total === 1 ? 'pase' : 'pases'}
                          </span>
                                  <span className="mt-1 inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-100 border border-emerald-400/40">
                            <Users size={10} />
                                    {infoDia.registros.length} persona
                                    {infoDia.registros.length !== 1 && 's'}
                          </span>
                                </div>
                            )}
                          </button>
                      );
                    })}
                  </div>
                </div>

                {/* Resumen debajo (opcional, por si no usan el modal) */}
                <div className="mt-6">
                  <h3 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                    <History size={18} />
                    Días con asistencias en este mes
                  </h3>
                  {Object.keys(mapaAsistencias).filter((fecha) => {
                    const [y, m, d] = fecha.split('-').map(Number);
                    return y === year && m - 1 === month;
                  }).length === 0 ? (
                      <p className="text-white/50 text-sm">
                        No hay asistencias registradas en este mes.
                      </p>
                  ) : (
                      <div className="space-y-2">
                        {Object.entries(mapaAsistencias)
                            .filter(([fecha]) => {
                              const [y, m] = fecha.split('-').map(Number);
                              return y === year && m - 1 === month;
                            })
                            .sort((a, b) => a[0].localeCompare(b[0]))
                            .map(([fecha, datos]) => (
                                <div
                                    key={fecha}
                                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center justify-between text-sm text-white/80"
                                >
                                  <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-blue-300" />
                                    <span className="font-semibold">{fecha}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs">
                          <span className="text-emerald-300">
                            {datos.total} {datos.total === 1 ? 'pase' : 'pases'}
                          </span>
                                    <span className="text-white/60">
                            {datos.registros.length} persona
                                      {datos.registros.length !== 1 && 's'}
                          </span>
                                  </div>
                                </div>
                            ))}
                      </div>
                  )}
                </div>
              </div>
          )}

          {/* HISTORIAL GENERAL */}
          {activeTab === 'historial' && (
              <div>
                <h2 className="text-white text-2xl font-bold mb-6">
                  Historial de Actividad
                </h2>
                {historial.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
                      <History className="text-white/50 mx-auto mb-4" size={64} />
                      <p className="text-white/70 text-xl">No hay actividad registrada</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                      {historial.map((item) => (
                          <div
                              key={item.id}
                              className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20 flex items-start gap-4"
                          >
                            <History
                                className="text-blue-300 flex-shrink-0 mt-1"
                                size={20}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium break-words">
                                {item.accion}
                              </p>
                              <p className="text-white/50 text-sm">{item.timestamp}</p>
                            </div>
                          </div>
                      ))}
                    </div>
                )}
              </div>
          )}
        </div>

        {/* MODAL CREAR EMPLEADO */}
        {modalCrear && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-gradient-to-br from-slate-800 to-purple-900 rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-2xl font-bold">Nuevo Empleado</h3>
                  <button
                      onClick={() => {
                        setModalCrear(false);
                        setFormNombre('');
                        setFormAcceso(false);
                        setFormUid('');
                      }}
                      className="text-white/70 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm font-semibold mb-2">
                      Nombre Completo
                    </label>
                    <input
                        type="text"
                        value={formNombre}
                        onChange={(e) => setFormNombre(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                        placeholder="Ej: Juan Pérez"
                        maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm font-semibold mb-2">
                      UID / RFID asignado
                    </label>
                    {(() => {
                      const availableUids = UIDS_DISPONIBLES.filter(
                          (uid) => !empleados.some((e) => e.uid === uid)
                      );
                      return (
                          <select
                              value={formUid}
                              onChange={(e) => setFormUid(e.target.value)}
                              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                          >
                            <option value="">Seleccione un UID disponible</option>
                            {availableUids.map((uid) => (
                                <option key={uid} value={uid}>
                                  {uid}
                                </option>
                            ))}
                          </select>
                      );
                    })()}
                  </div>

                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/20">
                    <div>
                      <p className="text-white font-semibold">Acceso Zona Privada</p>
                      <p className="text-white/50 text-sm">
                        Permite el ingreso a la zona privada
                      </p>
                    </div>
                    <button
                        onClick={() => setFormAcceso(!formAcceso)}
                        className={`relative w-14 h-8 rounded-full transition-all ${
                            formAcceso ? 'bg-green-500' : 'bg-white/20'
                        }`}
                    >
                      <div
                          className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                              formAcceso ? 'translate-x-7' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                        onClick={() => {
                          setModalCrear(false);
                          setFormNombre('');
                          setFormAcceso(false);
                          setFormUid('');
                        }}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-semibold transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                        onClick={crearEmpleado}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-all"
                    >
                      Crear
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* MODAL EDITAR EMPLEADO */}
        {modalEditar && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-gradient-to-br from-slate-800 to-purple-900 rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-2xl font-bold">Editar Empleado</h3>
                  <button
                      onClick={() => {
                        setModalEditar(null);
                        setFormNombre('');
                        setFormAcceso(false);
                      }}
                      className="text-white/70 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm font-semibold mb-2">
                      Nombre Completo
                    </label>
                    <input
                        type="text"
                        value={formNombre}
                        onChange={(e) => setFormNombre(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                        placeholder="Ej: Juan Pérez"
                        maxLength={50}
                    />
                  </div>

                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/20">
                    <div>
                      <p className="text-white font-semibold">Acceso Zona Privada</p>
                      <p className="text-white/50 text-sm">
                        Permite el ingreso a la zona privada
                      </p>
                    </div>
                    <button
                        onClick={() => setFormAcceso(!formAcceso)}
                        className={`relative w-14 h-8 rounded-full transition-all ${
                            formAcceso ? 'bg-green-500' : 'bg-white/20'
                        }`}
                    >
                      <div
                          className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                              formAcceso ? 'translate-x-7' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                        onClick={() => {
                          setModalEditar(null);
                          setFormNombre('');
                          setFormAcceso(false);
                        }}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-semibold transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                        onClick={() => editarEmpleado(modalEditar)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-all"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* MODAL ELIMINAR EMPLEADO */}
        {modalEliminar && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-gradient-to-br from-slate-800 to-red-900 rounded-2xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-2xl font-bold">Eliminar Empleado</h3>
                  <button
                      onClick={() => setModalEliminar(null)}
                      className="text-white/70 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
                    <AlertCircle className="text-red-300 mb-2" size={32} />
                    <p className="text-red-200 font-semibold mb-1">¿Estás seguro?</p>
                    <p className="text-red-200/70 text-sm">
                      Esta acción eliminará al empleado del sistema, pero su historial
                      de asistencias se conservará en la base de datos.
                    </p>
                  </div>

                  <div className="text-white/70 text-sm">
                    <p className="mb-1">
                      Empleado:{' '}
                      <span className="text-white font-semibold">
                    {empleados.find((e) => e.uid === modalEliminar)?.nombre}
                  </span>
                    </p>
                    <p>
                      UID:{' '}
                      <span className="text-white/50">
                    {modalEliminar}
                  </span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                      onClick={() => setModalEliminar(null)}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-semibold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                      onClick={() => eliminarEmpleado(modalEliminar)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-all"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* MODAL HISTORIAL DE ASISTENCIAS POR USUARIO (activo o eliminado) */}
        {modalHistorialAsistencias && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-gradient-to-br from-slate-800 to-purple-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-gradient-to-br from-slate-800 to-purple-900 pb-4">
                  <div>
                    <h3 className="text-white text-2xl font-bold">
                      {modalHistorialAsistencias.nombre}
                    </h3>
                    <p className="text-white/60 text-sm">Historial de Asistencias</p>
                  </div>
                  <button
                      onClick={() => setModalHistorialAsistencias(null)}
                      className="text-white/70 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Resumen */}
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Total de asistencias</p>
                        <p className="text-white text-3xl font-bold">
                          {modalHistorialAsistencias.asistencia?.total || 0}
                        </p>
                      </div>
                      <Calendar className="text-blue-300" size={48} />
                    </div>
                    <button
                        onClick={() => resetearAsistencias(modalHistorialAsistencias)}
                        className="w-full mt-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 border border-amber-500/30"
                    >
                      <RotateCcw size={18} />
                      Resetear Contador Total
                    </button>
                  </div>

                  {/* Asistencias por día */}
                  <div>
                    <h4 className="text-white text-lg font-semibold mb-3">
                      Asistencias por Día
                    </h4>
                    {modalHistorialAsistencias.asistencia?.por_dia &&
                    Object.keys(
                        modalHistorialAsistencias.asistencia.por_dia
                    ).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(
                              modalHistorialAsistencias.asistencia.por_dia
                          )
                              .sort((a, b) => b[0].localeCompare(a[0]))
                              .map(([fecha, datos]) => (
                                  <div
                                      key={fecha}
                                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="text-blue-300" size={18} />
                                        <span className="text-white font-semibold">
                                {fecha}
                              </span>
                                      </div>
                                      <span className="text-blue-300 font-bold">
                              {datos.cantidad}{' '}
                                        {datos.cantidad === 1
                                            ? 'asistencia'
                                            : 'asistencias'}
                            </span>
                                    </div>
                                    {datos.horas && datos.horas.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {datos.horas.map((hora, idx) => (
                                              <span
                                                  key={idx}
                                                  className="bg-white/10 text-white/70 text-xs px-2 py-1 rounded"
                                              >
                                  {hora}
                                </span>
                                          ))}
                                        </div>
                                    )}
                                  </div>
                              ))}
                        </div>
                    ) : (
                        <div className="bg-white/5 rounded-lg p-8 border border-white/10 text-center">
                          <UserCheck className="text-white/30 mx-auto mb-2" size={48} />
                          <p className="text-white/50">
                            No hay registros de asistencia por día
                          </p>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* MODAL DETALLE EMPLEADO (al hacer click en la tarjeta de activo) */}
        {modalEmpleado && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-gradient-to-br from-slate-800 to-purple-900 rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-2xl font-bold">
                    {modalEmpleado.nombre}
                  </h3>
                  <button
                      onClick={() => setModalEmpleado(null)}
                      className="text-white/70 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-white/70 text-sm mb-1">UID</div>
                    <div className="text-white font-mono text-lg">
                      {modalEmpleado.uid}
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-white/70 text-sm mb-1">
                      Total Asistencias
                    </div>
                    <div className="text-white text-3xl font-bold">
                      {modalEmpleado.asistencia?.total || 0}
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-white/70 text-sm mb-1">
                      Acceso Zona Privada
                    </div>
                    <div
                        className={`text-lg font-bold ${
                            modalEmpleado.acceso_zona_privada
                                ? 'text-green-400'
                                : 'text-red-400'
                        }`}
                    >
                      {modalEmpleado.acceso_zona_privada
                          ? '✓ PERMITIDO'
                          : '✗ DENEGADO'}
                    </div>
                  </div>

                  <button
                      onClick={() => {
                        setModalHistorialAsistencias(modalEmpleado);
                        setModalEmpleado(null);
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar size={20} />
                    Ver Historial de Asistencias
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* MODAL DETALLE DE ASISTENCIAS POR DÍA (vista calendario) */}
        {selectedDateAttendance && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-gradient-to-br from-slate-800 to-purple-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-emerald-400/40 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-white text-2xl font-bold flex items-center gap-2">
                      <Calendar size={22} className="text-emerald-300" />
                      Asistencias del {selectedDateAttendance.fecha}
                    </h3>
                    <p className="text-white/60 text-sm">
                      Total de pases: {selectedDateAttendance.total}
                    </p>
                  </div>
                  <button
                      onClick={() => setSelectedDateAttendance(null)}
                      className="text-white/70 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                {selectedDateAttendance.registros.length === 0 ? (
                    <div className="bg-white/5 rounded-lg p-8 border border-white/10 text-center">
                      <UserCheck className="text-white/30 mx-auto mb-2" size={48} />
                      <p className="text-white/50 text-sm">
                        No se encontraron registros para este día.
                      </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                      {selectedDateAttendance.registros.map((reg, idx) => (
                          <div
                              key={idx}
                              className="bg-white/5 rounded-lg p-4 border border-white/15"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-white font-semibold flex items-center gap-2">
                                  {reg.nombre}
                                  {reg.eliminado && (
                                      <span className="text-[10px] bg-red-500/30 text-red-200 px-2 py-0.5 rounded-full border border-red-500/60">
                              ELIMINADO
                            </span>
                                  )}
                                </p>
                                <p className="text-white/50 text-xs font-mono">
                                  {reg.uid}
                                </p>
                              </div>
                              <span className="text-emerald-300 text-sm font-semibold">
                        {reg.cantidad}{' '}
                                {reg.cantidad === 1 ? 'pase' : 'pases'}
                      </span>
                            </div>
                            {reg.horas && reg.horas.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {reg.horas.map((hora, i) => (
                                      <span
                                          key={i}
                                          className="bg-white/10 text-white/80 text-xs px-2 py-1 rounded-full border border-white/20"
                                      >
                            {hora}
                          </span>
                                  ))}
                                </div>
                            )}
                          </div>
                      ))}
                    </div>
                )}
              </div>
            </div>
        )}
      </div>
  );
}

export default App;
