<?php
/**
 * Speech Controls - Control de velocidad y énfasis
 * Maneja SSML y modificaciones de voz
 */

class SpeechControls {
    
    // Velocidades predefinidas
    const SPEEDS = [
        'muy_lento' => 'x-slow',
        'lento' => 'slow',
        'normal' => 'medium',
        'rapido' => 'fast',
        'muy_rapido' => 'x-fast',
        'emergencia' => 'x-fast'
    ];
    
    // Palabras a enfatizar por idioma
    const EMPHASIS_WORDS = [
        'es' => [
            // Descuentos y ofertas
            'gratis', 'descuento', 'oferta', 'promoción', 'rebaja', 'liquidación',
            '%', 'por ciento', 'mitad de precio', '2x1', '3x2',
            // Urgencia
            'hoy', 'ahora', 'último', 'última', 'últimos', 'últimas',
            'solo hoy', 'termina', 'finaliza', 'apúrate', 'corre',
            // Importancia
            'importante', 'atención', 'aviso', 'urgente', 'emergencia',
            'nuevo', 'nueva', 'exclusivo', 'exclusiva', 'limitado', 'limitada'
        ],
        'en' => [
            'free', 'discount', 'sale', 'offer', 'promotion', 'clearance',
            '%', 'percent', 'half price', 'buy one get one',
            'today', 'now', 'last', 'final', 'hurry', 'limited',
            'important', 'attention', 'notice', 'urgent', 'emergency',
            'new', 'exclusive', 'special'
        ]
    ];
    
    /**
     * Aplica control de velocidad al texto
     */
    public static function applySpeed($text, $speed = 'normal') {
        $speedValue = self::SPEEDS[$speed] ?? self::SPEEDS['normal'];
        return sprintf('<prosody rate="%s">%s</prosody>', $speedValue, $text);
    }
    
    /**
     * Aplica énfasis automático a palabras clave
     */
    public static function applyEmphasis($text, $language = 'es', $customWords = []) {
        // Combinar palabras predefinidas con personalizadas
        $words = array_merge(
            self::EMPHASIS_WORDS[$language] ?? self::EMPHASIS_WORDS['es'],
            $customWords
        );
        
        // Aplicar énfasis a cada palabra
        foreach ($words as $word) {
            // Patrón para palabra completa (case insensitive)
            $pattern = '/\b(' . preg_quote($word, '/') . ')\b/iu';
            $text = preg_replace(
                $pattern,
                '<emphasis level="strong">$1</emphasis>',
                $text
            );
        }
        
        // Énfasis especial para precios
        $text = preg_replace(
            '/\$\s*(\d+(?:[.,]\d{2})?)/u',
            '<emphasis level="strong"><say-as interpret-as="currency">$$$1</say-as></emphasis>',
            $text
        );
        
        // Énfasis para porcentajes
        $text = preg_replace(
            '/(\d+)\s*%/u',
            '<emphasis level="strong"><say-as interpret-as="percentage">$1%</say-as></emphasis>',
            $text
        );
        
        return $text;
    }
    
    /**
     * Agrega pausas inteligentes
     */
    public static function addPauses($text, $pauseLength = 'medium') {
        $pauses = [
            'short' => '0.3s',
            'medium' => '0.5s',
            'long' => '1s'
        ];
        
        $pause = $pauses[$pauseLength] ?? $pauses['medium'];
        
        // Pausas después de puntuación
        $text = str_replace('. ', '. <break time="' . $pause . '"/> ', $text);
        $text = str_replace('! ', '! <break time="' . $pause . '"/> ', $text);
        $text = str_replace('? ', '? <break time="' . $pause . '"/> ', $text);
        $text = str_replace(', ', ', <break time="200ms"/> ', $text);
        
        return $text;
    }
    
    /**
     * Procesa texto completo con todos los controles
     */
    public static function processText($text, $options = []) {
        $defaults = [
            'speed' => 'normal',
            'language' => 'es',
            'emphasis' => true,
            'emphasis_words' => [],
            'pauses' => true,
            'pause_length' => 'medium'
        ];
        
        $options = array_merge($defaults, $options);
        
        // Aplicar énfasis si está habilitado
        if ($options['emphasis']) {
            $text = self::applyEmphasis($text, $options['language'], $options['emphasis_words']);
        }
        
        // Agregar pausas si está habilitado
        if ($options['pauses']) {
            $text = self::addPauses($text, $options['pause_length']);
        }
        
        // Aplicar velocidad
        $text = self::applySpeed($text, $options['speed']);
        
        // Envolver en SSML
        return '<speak>' . $text . '</speak>';
    }
    
    /**
     * Presets para diferentes tipos de anuncios
     */
    public static function getPreset($type) {
        $presets = [
            'oferta' => [
                'speed' => 'normal',
                'emphasis' => true,
                'pauses' => true,
                'pause_length' => 'medium'
            ],
            'emergencia' => [
                'speed' => 'rapido',
                'emphasis' => true,
                'pauses' => false,
                'pause_length' => 'short'
            ],
            'informativo' => [
                'speed' => 'normal',
                'emphasis' => false,
                'pauses' => true,
                'pause_length' => 'long'
            ],
            'cierre' => [
                'speed' => 'lento',
                'emphasis' => true,
                'pauses' => true,
                'pause_length' => 'long'
            ]
        ];
        
        return $presets[$type] ?? $presets['informativo'];
    }
}
?>
