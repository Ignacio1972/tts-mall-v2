<?php
/**
 * Servicio TTS Enhanced - Versión Mejorada
 * Ahora respeta los voice_settings que vienen del frontend
 */

// Incluir configuración
require_once dirname(__DIR__) . '/config.php';

/**
 * Genera audio TTS con las voces nuevas
 */
function generateEnhancedTTS($text, $voice, $options = []) {
    logMessage("=== TTS-SERVICE: Options recibidas: " . json_encode($options));
    
    // Mapeo de voces nuevas
    $voiceMap = [
        'cristian' => 'nNS8uylvF9GBWVSiIt5h',
        'fernanda' => 'JM2A9JbRp8XUJ7bdCXJc',
        'rosa' => 'Yeu6FDmacNCxWs1YwWdK',
        'alejandro' => '0cheeVA5B3Cv6DGq65cT',
        'vicente' => 'toHqs8ENHjZX53stqKOK',
        'zabra' => 'G6LT3kjUUW86fQaWfBaj',
        // NUEVAS VOCES
        'azucena' => 'ay4iqk10DLwc8KGSrf2t',
        'valeria' => '22VndfJPBU7AZORAZZTT',
        'ninoska' => 'gt8UWQljAEAt5YLqG4LW',
        'ruben' => 'rp876bky8TK6Abie5pir',
        'yorman' => 'J2Jb9yZNvpXUNAL3a2bw',
        'santiago' => 'js7Ktj7UJCd7W0StVolw',
        'luis' => 'ziigB5Dny14v5lDIHo0x',

        // Mantener compatibilidad con voces antiguas
        'Rachel' => '21m00Tcm4TlvDq8ikWAM',
        'Domi' => 'AZnzlk1XvdvUeBnXmlld',
        'Bella' => 'EXAVITQu4vr4xnSDxMaL',
        'Elli' => 'MF3mGyEYCl7XYWbV9V6O',
        'Josh' => 'TxGEqnHWrfWFTfGW9XjX'
    ];
    
    // Obtener el ID de la voz
    if (isset($voiceMap[$voice])) {
        $voiceId = $voiceMap[$voice];
    } else {
        // Si no está en el mapa, usar el ID directamente
        $voiceId = $voice;
    }
    
    logMessage("TTS Enhanced - Voz: $voice -> ID: $voiceId");
    
    // URL de ElevenLabs
    $url = ELEVENLABS_BASE_URL . "/text-to-speech/$voiceId";
    
    // CAMBIO PRINCIPAL: Construir voice_settings respetando valores del frontend
    $defaultVoiceSettings = [
        'stability' => 0.75,
        'similarity_boost' => 0.8,
        'style' => 0.5,
        'use_speaker_boost' => true
    ];
    
    // Si vienen voice_settings del frontend, mezclar con defaults
    if (isset($options['voice_settings']) && is_array($options['voice_settings'])) {
        $voiceSettings = array_merge($defaultVoiceSettings, $options['voice_settings']);
        logMessage("Voice settings mezclados con frontend: " . json_encode($voiceSettings));
    } else {
        $voiceSettings = $defaultVoiceSettings;
        logMessage("Usando voice settings por defecto");
    }
    
    // Asegurar que los valores estén en rango válido (0.0 - 1.0)
    $voiceSettings['stability'] = max(0, min(1, floatval($voiceSettings['stability'])));
    $voiceSettings['similarity_boost'] = max(0, min(1, floatval($voiceSettings['similarity_boost'])));
    $voiceSettings['style'] = max(0, min(1, floatval($voiceSettings['style'])));
    $voiceSettings['use_speaker_boost'] = (bool)$voiceSettings['use_speaker_boost'];
    
    // CORRECCIÓN: Según la documentación, speed NO va en voice_settings
    // Va al mismo nivel que text y model_id
    
    // Datos para enviar
    $data = [
        'text' => $text,
        'model_id' => $options['model_id'] ?? 'eleven_multilingual_v2',
        'voice_settings' => $voiceSettings  // SIN speed aquí
    ];
    
    // NUEVO: Añadir speed al nivel correcto
    if (isset($options['speed'])) {
        $speedMap = [
            'muy_lento' => 0.7,
            'lento' => 0.85,
            'normal' => 1.0,
            'rapido' => 1.1,
            'emergencia' => 1.2  // Máximo permitido por ElevenLabs
        ];
        
        // Speed va al mismo nivel que text, NO dentro de voice_settings
        $data['speed'] = $speedMap[$options['speed']] ?? 1.0;
        logMessage("Aplicando speed directo de ElevenLabs: " . $data['speed']);
    }
    
    // Agregar language si viene especificado
    if (isset($options['language'])) {
        $data['language'] = $options['language'];
    }
    
    // Agregar otros parámetros opcionales si vienen
    if (isset($options['enable_ssml'])) {
        $data['enable_ssml'] = $options['enable_ssml'];
    }
    if (isset($options['seed'])) {
        $data['seed'] = $options['seed'];
    }
    
    // Agregar optimize_streaming_latency si viene
    if (isset($options['optimize_streaming_latency'])) {
        $data['optimize_streaming_latency'] = $options['optimize_streaming_latency'];
    }
    
    // Log para debugging
    logMessage("Request a ElevenLabs: " . json_encode($data));
    logMessage("Voice settings finales: style={$voiceSettings['style']}, stability={$voiceSettings['stability']}, similarity={$voiceSettings['similarity_boost']}");
    if (isset($data['speed'])) {
        logMessage("Speed parameter: " . $data['speed']);
    }
    
    // Hacer la petición
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Accept: audio/mpeg',
            'Content-Type: application/json',
            'xi-api-key: ' . ELEVENLABS_API_KEY
        ],
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    // Log de respuesta
    logMessage("Respuesta HTTP: $httpCode");
    
    if ($error) {
        logMessage("Error CURL: $error");
        throw new Exception("Error de conexión: $error");
    }
    
    if ($httpCode !== 200) {
        // Log más detallado para errores
        $errorInfo = json_decode($response, true);
        if ($errorInfo) {
            logMessage("Error ElevenLabs detallado: " . json_encode($errorInfo));
        } else {
            logMessage("Error ElevenLabs: HTTP $httpCode - Response: " . substr($response, 0, 200));
        }
        
        // Mensajes de error más específicos
        switch ($httpCode) {
            case 401:
                throw new Exception("API Key inválida o expirada");
            case 422:
                throw new Exception("Parámetros inválidos: " . ($errorInfo['detail']['message'] ?? 'Verificar texto o voz'));
            case 429:
                throw new Exception("Límite de rate excedido. Intente en unos segundos");
            default:
                throw new Exception("Error ElevenLabs API: HTTP $httpCode");
        }
    }
    
    if (!$response) {
        throw new Exception('Respuesta vacía de ElevenLabs');
    }
    
    logMessage("Audio generado exitosamente, tamaño: " . strlen($response) . " bytes");
    
    return $response;
}

/**
 * Función helper para convertir valores del frontend (0-100) a API (0.0-1.0)
 * Por si el frontend envía porcentajes
 */
function normalizeVoiceValue($value) {
    if ($value > 1 && $value <= 100) {
        // Si parece ser un porcentaje, convertir
        return $value / 100;
    }
    return $value;
}
?>