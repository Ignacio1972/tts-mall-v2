<?php
/**
 * Servicio TTS Enhanced - Versión Simplificada
 * Solo funcionalidad básica para que funcione
 */

// Incluir configuración
require_once dirname(__DIR__) . '/config.php';

/**
 * Genera audio TTS con las voces nuevas
 */
function generateEnhancedTTS($text, $voice, $options = []) {
    // Mapeo de voces nuevas
    $voiceMap = [
        'cristian' => 'nNS8uylvF9GBWVSiIt5h',
        'fernanda' => 'JM2A9JbRp8XUJ7bdCXJc',
        'rosa' => 'Yeu6FDmacNCxWs1YwWdK',
        'alejandro' => '0cheeVA5B3Cv6DGq65cT',
        'vicente' => 'toHqs8ENHjZX53stqKOK',
        'zabra' => 'G6LT3kjUUW86fQaWfBaj',
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
    
    // Datos para enviar
    $data = [
        'text' => $text,
        'model_id' => 'eleven_multilingual_v2',
        'voice_settings' => [
            'stability' => 0.75,
            'similarity_boost' => 0.8,
            'use_speaker_boost' => true
        ]
    ];
    
    // Log para debugging
    logMessage("Request a ElevenLabs: " . json_encode($data));
    
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
        logMessage("Error ElevenLabs: HTTP $httpCode - Response: " . substr($response, 0, 200));
        throw new Exception("Error ElevenLabs API: HTTP $httpCode");
    }
    
    if (!$response) {
        throw new Exception('Respuesta vacía de ElevenLabs');
    }
    
    logMessage("Audio generado exitosamente, tamaño: " . strlen($response) . " bytes");
    
    return $response;
}
?>
