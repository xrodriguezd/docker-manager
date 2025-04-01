const express = require('express');
const cors = require('cors');
const Docker = require('dockerode');
const path = require('path');

const app = express();
const docker = new Docker();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos de la aplicación React
app.use(express.static(path.join(__dirname, 'dist')));

// Mapa para almacenar los temporizadores de detención y sus tiempos de inicio
const stopTimers = new Map();
const startTimes = new Map();

// Función para detener un contenedor
const stopContainer = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    await container.stop();
    console.log(`Contenedor ${containerId} detenido automáticamente después de 5 minutos`);
    startTimes.delete(containerId);
  } catch (error) {
    console.error(`Error al detener automáticamente el contenedor ${containerId}:`, error);
  }
};

// Función para programar la detención automática
const scheduleStop = (containerId) => {
  // Limpiar cualquier temporizador existente
  const existingTimer = stopTimers.get(containerId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Guardar el tiempo de inicio
  startTimes.set(containerId, Date.now());

  // Programar nueva detención
  const timer = setTimeout(() => {
    stopContainer(containerId);
    stopTimers.delete(containerId);
  }, 5 * 60 * 1000); // 5 minutos en milisegundos

  stopTimers.set(containerId, timer);
};

// Función para limpiar el temporizador de detención
const clearStopTimer = (containerId) => {
  const timer = stopTimers.get(containerId);
  if (timer) {
    clearTimeout(timer);
    stopTimers.delete(containerId);
  }
  startTimes.delete(containerId);
};

// Función para obtener el tiempo restante
const getRemainingTime = (containerId) => {
  const startTime = startTimes.get(containerId);
  if (!startTime) return null;
  
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, 5 * 60 * 1000 - elapsed);
  return Math.ceil(remaining / 1000); // Convertir a segundos
};

// Función para verificar si un contenedor está en ejecución
const isContainerRunning = (status) => {
  return status.toLowerCase().includes('up');
};

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Obtener todos los contenedores
app.get('/api/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    console.log('Contenedores encontrados:', containers);
    
    // Verificar cada contenedor y asignar temporizadores si es necesario
    for (const container of containers) {
      if (isContainerRunning(container.Status) && !startTimes.has(container.Id)) {
        console.log(`Asignando temporizador al contenedor ${container.Id} que ya estaba en ejecución`);
        scheduleStop(container.Id);
      }
    }

    const formattedContainers = containers.map(container => {
      const formatted = {
        id: container.Id,
        name: container.Names[0].replace('/', ''),
        status: container.Status,
        image: container.Image,
        remainingTime: getRemainingTime(container.Id)
      };
      console.log('Contenedor formateado:', formatted);
      return formatted;
    });
    res.json(formattedContainers);
  } catch (error) {
    console.error('Error fetching containers:', error);
    res.status(500).json({ error: 'Error al obtener los contenedores' });
  }
});

// Iniciar un contenedor
app.post('/api/containers/:id/start', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.start();
    console.log('Contenedor iniciado:', req.params.id);
    
    // Programar la detención automática
    scheduleStop(req.params.id);
    
    res.json({ message: 'Contenedor iniciado' });
  } catch (error) {
    console.error('Error starting container:', error);
    res.status(500).json({ error: 'Error al iniciar el contenedor' });
  }
});

// Detener un contenedor
app.post('/api/containers/:id/stop', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.stop();
    console.log('Contenedor detenido:', req.params.id);
    
    // Limpiar el temporizador de detención
    clearStopTimer(req.params.id);
    
    res.json({ message: 'Contenedor detenido' });
  } catch (error) {
    console.error('Error stopping container:', error);
    res.status(500).json({ error: 'Error al detener el contenedor' });
  }
});

// Obtener logs de un contenedor
app.get('/api/containers/:id/logs', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: 100,
      timestamps: true
    });
    res.json({ logs: logs.toString() });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Error al obtener los logs' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
}); 