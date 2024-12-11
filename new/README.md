# Calendario de Eventos Online

  

## Requisitos Previos

- Node.js (v14.0.0 o superior)

- MongoDB (v4.0.0 o superior)

- Cloudflared CLI

  

## Dependencias del Proyecto

Crear un archivo `package.json` con las siguientes dependencias:

  

```json:package.json

{

"name":  "calendario-eventos",

"version":  "1.0.0",

"description":  "Calendario de eventos online con autenticación",

"main":  "server.js",

"dependencies":  {

"express":  "^4.17.1",

"mongoose":  "^6.0.0",

"bcrypt":  "^5.0.1",

"jsonwebtoken":  "^8.5.1",

"body-parser":  "^1.19.0",

"cors":  "^2.8.5"

}

}
```
  
  

# Estructura del Proyecto

  

proyecto/

├── server.js

├── app.js

├── calendar.js

├── package.json

├── index.html

└── README.md

  

Instalación y Configuración

1- Instalar Dependencias

  

```npm install```

2.-iniciar mongoDB

```mongod```

3.- Configurar Cloudflared Necesitarás dos túneles diferentes:

Para el Servidor (Backend):

```cloudflared tunnel --url http://localhost:3000```

Para el Cliente (Frontend):

```cloudflared tunnel --url http://localhost:5500```

  

2.- Servir el Frontend
- Usar Live Server de VS Code o cualquier servidor HTTP simple para servir los archivos estáticos.

  

3.- Actualizar URLs

  

- En app.js, actualizar BASE_URL con la URL del túnel de Cloudflared para el backend

- En calendar.js, asegurarse que se use la misma BASE_URL

## Notas Importantes

1.- Configuración de MongoDB

- La base de datos debe estar ejecutándose en mongodb://127.0.0.1:27017/onlineCalendar

- Asegurarse que MongoDB esté instalado y funcionando

2.-Túneles Cloudflared

- Se necesitan dos túneles separados:

-- Uno para el backend (server.js) en puerto 3000

-- Otro para el frontend (archivos estáticos) en puerto 5500

- Las URLs de los túneles son temporales y cambian cada vez que se reinician

3.- Seguridad

- Cambiar el SECRET en server.js por una clave segura (OPCIONAL)

- No compartir las URLs de los túneles públicamente

## Funcionalidades

- Registro de usuarios

- Inicio de sesión

- Crear eventos

- Editar eventos

- Eliminar eventos

- Visualización en calendario

- Descarga de eventos en formato JSON (WIP)

  

Solución de Problemas Comunes

1.- Si MongoDB no conecta:

  

- Verificar que MongoDB esté ejecutándose

- Comprobar la URL de conexión

  

2.- Si los túneles no funcionan:

  

- Asegurarse de tener permisos de administrador

- Verificar que los puertos no estén en uso

3.- Si CORS da problemas:

  

- Verificar que las URLs en el frontend coincidan con los túneles actuales

NOTA: la aplicacion ya esta hosteada desde mi pc en https://agendasgroovy.abymint.com/
Si quieren hostearlo en su pc pueden seguir los pasos de este README.md