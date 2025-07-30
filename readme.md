# 🎙️ TTS Mall v2 - Sistema Modular de Text-to-Speech

Sistema web modular para generar y gestionar anuncios de audio mediante Text-to-Speech, diseñado para centros comerciales.

## ✨ Características

- **Arquitectura Modular ES6**: Sistema escalable basado en módulos
- **Generación TTS**: Integración con ElevenLabs (30+ voces)
- **Calendario**: Programación automática de anuncios
- **Biblioteca**: Gestión completa de mensajes
- **Integración Radio**: Transmisión directa a AzuraCast

## 🚀 Instalación

1. Clonar repositorio
2. Configurar API keys en `api/config.php` (usar `api/config.example.php` como base)
3. Inicializar base de datos: `php calendario/api/db/init-db.php`
4. Configurar permisos: `chmod -R 777 api/temp calendario/logs`
5. Configurar cron para calendario (opcional)

## 📁 Estructura

- `/shared`: Core del sistema (router, event-bus, etc)
- `/modules`: Módulos funcionales
- `/api`: Backend PHP
- `/calendario`: Sistema de programación
- `/assets`: Recursos globales



## 📝 Documentación

Ver documentación completa en [Wiki del proyecto](https://github.com/tu-usuario/tts-mall-v2/wiki)



