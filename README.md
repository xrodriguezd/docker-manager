# Docker Manager

Una aplicación web para gestionar contenedores Docker con la capacidad de iniciarlos y detenerlos automáticamente después de 5 minutos.

## Descripción

Docker Manager es una herramienta web que te permite:

-   Iniciar contenedores Docker de forma sencilla
-   Detener contenedores automáticamente después de 5 minutos
-   Gestionar múltiples contenedores de manera eficiente
-   Ver logs de los contenedores en tiempo real
-   Monitorear el tiempo restante de cada contenedor

## Requisitos

-   Docker instalado en tu sistema
-   Node.js (versión 14 o superior)
-   npm (gestor de paquetes de Node.js)

## Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/xrodriguezd/docker-manager.git
cd docker-manager
```

2. Instala las dependencias:

```bash
npm install
```

3. Construye la aplicación React:

```bash
npm run build
```

## Uso

1. Inicia el servidor:

```bash
npm start
```

2. Abre tu navegador y visita:

```
http://localhost:3001
```

## Características

-   Interfaz web moderna y responsive
-   Detención automática de contenedores después de 5 minutos
-   Visualización en tiempo real del estado de los contenedores
-   Monitoreo del tiempo restante para cada contenedor
-   Visualización de logs de contenedores
-   API RESTful para gestionar contenedores

## API Endpoints

-   `GET /api/containers` - Lista todos los contenedores
-   `POST /api/containers/:id/start` - Inicia un contenedor
-   `POST /api/containers/:id/stop` - Detiene un contenedor
-   `GET /api/containers/:id/logs` - Obtiene los logs de un contenedor

## Tecnologías Utilizadas

-   Node.js
-   Express.js
-   React
-   Dockerode
-   CORS

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
