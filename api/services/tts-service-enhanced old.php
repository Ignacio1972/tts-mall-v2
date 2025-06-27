<?php
/**
 * Servicio TTS Enhanced - VERSIÓN SIMPLIFICADA Y CORREGIDA
 * Solo los parámetros que funcionan con eleven_multilingual_v2
 */

// Incluir configuración
require_once dirname(__DIR__) . '/config.php';

/**
 * Genera audio TTS con configuración simplificada
 */
function generateEnhancedTTS($text, $voice, $options = []) {
    logMessage("=== TTS-SERVICE FIXED: Iniciando generación");
    logMessage("Options recibidas: " . json_encode($options));
    
    // Mapeo de voces - MANTENER EXISTENTE
    $voiceMap = [
        'cristian' => 'nNS8uylvF9GBWVSiIt5h',
        'fernanda' => 'JM2A9JbRp8XUJ7bdCXJc',
        'rosa' => 'Yeu6FDmacNCxWs1YwWdK',
        'alejandro' => '0cheeVA5B3Cv6DGq65cT',
        'vicente' => 'toHqs8ENHjZX53stqKOK',
        'zabra' => 'G6LT3kjUUW86fQaWfBaj',
        'azucena' => 'ay4iqk10DLwc8KGSrf2t',
        'valeria' => '22VndfJPBU7AZORAZZTT',
        'ninoska' => 'gt8UWQljAEAt5YLqG4LW',
        'ruben' => 'rp876bky8TK6Abie5pir',
        'yorman' => 'J2Jb9yZNvpXUNAL3a2bw',
        'santiago' => 'js7Ktj7UJCd7W0StVolw',
        'luis' => 'ziigB5Dny14v5lDIHo0x'
    ];
    
    // Obtener ID de voz
    $voiceId = $voiceMap[$voice] ?? $voice;
    logMessage("Voz: $voice -> ID: $voiceId");
    
    // URL de ElevenLabs
    $url = ELEVENLABS_BASE_URL . "/text-to-speech/$voiceId";
    
    // === CONFIGURACIÓN SIMPLIFICADA ===
    // Solo los 4 parámetros que funcionan
    $defaultVoiceSettings = [
        'stability' => 0.75,
        'similarity_boost' => 0.85,
        'style' => 0.5,
        'use_speaker_boost' => true
    ];
    
    // Merge con settings del frontend si vienen
    if (isset($options['voice_settings']) && is_array($options['voice_settings'])) {
        $voiceSettings = array_merge($defaultVoiceSettings, $options['voice_settings']);
        logMessage("Voice settings del frontend aplicados");
    } else {
        $voiceSettings = $defaultVoiceSettings;
        logMessage("Usando voice settings por defecto");
    }
    
    // === VALIDACIÓN DE RANGOS ===
    $voiceSettings['stability'] = max(0.0, min(1.0, floatval($voiceSettings['stability'])));
    $voiceSettings['similarity_boost'] = max(0.0, min(1.0, floatval($voiceSettings['similarity_boost'])));
    $voiceSettings['style'] = max(0.0, min(1.0, floatval($voiceSettings['style'])));
    $voiceSettings['use_speaker_boost'] = (bool)$voiceSettings['use_speaker_boost'];
    
    // === PAYLOAD FINAL SIMPLIFICADO ===
    $data = [
        'text' => $text,
        'model_id' => 'eleven_multilingual_v2',
        'voice_settings' => $voiceSettings
    ];
    
    // Log del payload final
    logMessage("Payload final a ElevenLabs:");
    logMessage("- text: " . substr($text, 0, 50) . "...");
    logMessage("- model_id: eleven_multilingual_v2");
    logMessage("- voice_settings: " . json_encode($voiceSettings));
    
    // === PETICIÓN HTTP ===
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
    
    // === MANEJO DE RESPUESTA ===
    logMessage("HTTP Response Code: $httpCode");
    
    if ($error) {
        logMessage("CURL Error: $error");
        throw new Exception("Error de conexión: $error");
    }
    
    if ($httpCode !== 200) {
        $errorInfo = json_decode($response, true);
        logMessage("ElevenLabs Error Response: " . substr($response, 0, 500));
        
        switch ($httpCode) {
            case 401:
                throw new Exception("API Key inválida o expirada");
            case 422:
                $detail = $errorInfo['detail']['message'] ?? 'Parámetros inválidos';
                throw new Exception("Error de parámetros: $detail");
            case 429:
                throw new Exception("Límite de rate excedido. Intente en unos segundos");
            default:
                throw new Exception("Error ElevenLabs API: HTTP $httpCode");
        }
    }
    
    if (!$response) {
        throw new Exception('Respuesta vacía de ElevenLabs');
    }
    
    $audioSize = strlen($response);
    logMessage("✅ Audio generado exitosamente: $audioSize bytes");
    
    return $response;
}

/**
 * Función helper para debugging - mostrar configuración actual
 */
function debugVoiceSettings($settings) {
    logMessage("=== DEBUG VOICE SETTINGS ===");
    logMessage("stability: " . $settings['stability']);
    logMessage("similarity_boost: " . $settings['similarity_boost']);
    logMessage("style: " . $settings['style']);
    logMessage("use_speaker_boost: " . ($settings['use_speaker_boost'] ? 'true' : 'false'));
    logMessage("========================");
}
?>