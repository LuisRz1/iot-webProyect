import { Lightbulb, Thermometer, Lock, Volume2, Camera, Power, Sun, Wind, Zap, ChevronDown } from 'lucide-react';
import { useState } from 'react';

function App() {
  const [devices, setDevices] = useState({
    livingRoomLight: true,
    kitchenLight: false,
    bedroomLight: true,
    livingRoomTemp: 22,
    alarmArmed: true,
    alarmSound: false,
    camera: true,
    garage: false,
  });

  const toggleDevice = (key: keyof typeof devices) => {
    if (typeof devices[key] === 'boolean') {
      setDevices(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const updateTemp = (value: number) => {
    setDevices(prev => ({ ...prev, livingRoomTemp: value }));
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/image.png)' }}
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-white mb-2">Smarty</h1>
            <p className="text-xl text-white/70">Control del banco</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center group-hover:bg-blue-500/40 transition-colors">
                    <Lightbulb className="text-blue-300" size={24} />
                  </div>
                  <button
                    onClick={() => toggleDevice('livingRoomLight')}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      devices.livingRoomLight ? 'bg-blue-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        devices.livingRoomLight ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <h3 className="text-white text-lg font-semibold mb-1">Luz de la habitación</h3>
                <p className="text-white/60 text-sm">{devices.livingRoomLight ? 'On' : 'Off'}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-500/30 rounded-lg flex items-center justify-center group-hover:bg-amber-500/40 transition-colors">
                    <Lightbulb className="text-amber-300" size={24} />
                  </div>
                  <button
                    onClick={() => toggleDevice('kitchenLight')}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      devices.kitchenLight ? 'bg-amber-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        devices.kitchenLight ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <h3 className="text-white text-lg font-semibold mb-1">Luz de la habitación</h3>
                <p className="text-white/60 text-sm">{devices.kitchenLight ? 'On' : 'Off'}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center group-hover:bg-purple-500/40 transition-colors">
                    <Lightbulb className="text-purple-300" size={24} />
                  </div>
                  <button
                    onClick={() => toggleDevice('bedroomLight')}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      devices.bedroomLight ? 'bg-purple-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        devices.bedroomLight ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <h3 className="text-white text-lg font-semibold mb-1">Luz de la habitación</h3>
                <p className="text-white/60 text-sm">{devices.bedroomLight ? 'On' : 'Off'}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-red-500/30 rounded-lg flex items-center justify-center group-hover:bg-red-500/40 transition-colors">
                    <Volume2 className="text-red-300" size={24} />
                  </div>
                  <button
                    onClick={() => toggleDevice('alarmSound')}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      devices.alarmSound ? 'bg-red-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        devices.alarmSound ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <h3 className="text-white text-lg font-semibold mb-1">Sonido</h3>
                <p className="text-white/60 text-sm">{devices.alarmSound ? 'On' : 'Off'}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-cyan-500/30 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/40 transition-colors">
                    <Camera className="text-cyan-300" size={24} />
                  </div>
                  <button
                    onClick={() => toggleDevice('camera')}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      devices.camera ? 'bg-cyan-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        devices.camera ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <h3 className="text-white text-lg font-semibold mb-1">Cámara de seguridad</h3>
                <p className="text-white/60 text-sm">{devices.camera ? 'Recording' : 'Off'}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500/30 rounded-lg flex items-center justify-center group-hover:bg-green-500/40 transition-colors">
                    <Power className="text-green-300" size={24} />
                  </div>
                  <button
                    onClick={() => toggleDevice('garage')}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      devices.garage ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        devices.garage ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <h3 className="text-white text-lg font-semibold mb-1">Puerta principal</h3>
                <p className="text-white/60 text-sm">{devices.garage ? 'Open' : 'Closed'}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500/30 rounded-lg flex items-center justify-center">
                      <Thermometer className="text-orange-300" size={24} />
                    </div>
                    <h3 className="text-white text-lg font-semibold">Temperatura</h3>
                  </div>
                </div>
                <div className="text-4xl font-bold text-white mb-6">{devices.livingRoomTemp}°C</div>
                <div className="space-y-3">
                  {[18, 20, 22, 24, 26].map(temp => (
                    <button
                      key={temp}
                      onClick={() => updateTemp(temp)}
                      className={`w-full py-2 rounded-lg transition-all font-medium ${
                        devices.livingRoomTemp === temp
                          ? 'bg-orange-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {temp}°C
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-500/30 rounded-lg flex items-center justify-center">
                    <Lock className="text-indigo-300" size={24} />
                  </div>
                  <h3 className="text-white text-lg font-semibold">Alarma</h3>
                </div>
                <button
                  onClick={() => toggleDevice('alarmArmed')}
                  className={`w-full py-4 rounded-lg transition-all font-semibold text-lg ${
                    devices.alarmArmed
                      ? 'bg-green-500/30 text-green-200 border border-green-500/50'
                      : 'bg-red-500/30 text-red-200 border border-red-500/50'
                  }`}
                >
                  {devices.alarmArmed ? 'Alarm Armed' : 'Alarm Disarmed'}
                </button>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-white text-lg font-semibold mb-4">Estado de la energía</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={18} className="text-yellow-400" />
                      <span className="text-white/70">Uso de la energía</span>
                    </div>
                    <span className="text-white font-semibold">2.4 kW</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun size={18} className="text-blue-400" />
                      <span className="text-white/70">Panel solar</span>
                    </div>
                    <span className="text-white font-semibold">1.8 kW</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind size={18} className="text-green-400" />
                      <span className="text-white/70">Turbina</span>
                    </div>
                    <span className="text-white font-semibold">0.6 kW</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
