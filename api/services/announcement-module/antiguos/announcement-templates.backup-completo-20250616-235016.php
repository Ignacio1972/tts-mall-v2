<?php
/**
 * Announcement Templates - Sistema de plantillas para anuncios
 * Templates predefinidos para diferentes tipos de anuncios comerciales
 */

class AnnouncementTemplates {
    
    // Templates organizados por categoría
    const TEMPLATES = [
        'ofertas' => [
            'descuento_simple' => [
                'name' => 'Descuento Simple',
                'template' => 'Atención clientes, {producto} con un {descuento}% de descuento. {duracion}.',
                'variables' => ['producto', 'descuento', 'duracion'],
                'example' => ['producto' => 'todas las frutas', 'descuento' => '30', 'duracion' => 'Solo por hoy'],
                'speech_preset' => 'oferta'
            ],
            'descuento_precio' => [
                'name' => 'Descuento con Precios',
                'template' => 'Oferta especial en {producto}. Antes ${precio_antes}, ahora solo ${precio_ahora}. {duracion}.',
                'variables' => ['producto', 'precio_antes', 'precio_ahora', 'duracion'],
                'example' => ['producto' => 'carnes rojas', 'precio_antes' => '9.990', 'precio_ahora' => '6.990', 'duracion' => 'Válido hasta el domingo'],
                'speech_preset' => 'oferta'
            ],
            'dos_por_uno' => [
                'name' => '2x1 o 3x2',
                'template' => 'Increíble promoción {tipo} en {producto}. {detalle}. {duracion}.',
                'variables' => ['tipo', 'producto', 'detalle', 'duracion'],
                'example' => ['tipo' => '2x1', 'producto' => 'bebidas y jugos', 'detalle' => 'Lleva 2 y paga solo 1', 'duracion' => 'Solo este fin de semana'],
                'speech_preset' => 'oferta'
            ],
            'liquidacion' => [
                'name' => 'Liquidación',
                'template' => 'Última liquidación de {temporada}. {producto} con hasta {descuento}% de descuento. {mensaje_urgencia}.',
                'variables' => ['temporada', 'producto', 'descuento', 'mensaje_urgencia'],
                'example' => ['temporada' => 'verano', 'producto' => 'Toda la ropa', 'descuento' => '70', 'mensaje_urgencia' => 'Últimas unidades disponibles'],
                'speech_preset' => 'oferta'
            ]
        ],
        
        'horarios' => [
            'apertura' => [
                'name' => 'Apertura',
                'template' => 'Buenos {momento}, les informamos que {negocio} ya está abierto. Los esperamos hasta las {hora_cierre}. {mensaje_extra}',
                'variables' => ['momento', 'negocio', 'hora_cierre', 'mensaje_extra'],
                'example' => ['momento' => 'días', 'negocio' => 'nuestro supermercado', 'hora_cierre' => '10 de la noche', 'mensaje_extra' => 'Gracias por su preferencia'],
                'speech_preset' => 'informativo'
            ],
            'proximo_cierre' => [
                'name' => 'Próximo Cierre',
                'template' => 'Estimados clientes, les informamos que cerraremos en {minutos} minutos. Por favor, acérquense a las cajas. {mensaje_extra}',
                'variables' => ['minutos', 'mensaje_extra'],
                'example' => ['minutos' => '30', 'mensaje_extra' => 'Mañana los esperamos desde las 8 de la mañana'],
                'speech_preset' => 'cierre'
            ],
            'cierre_departamento' => [
                'name' => 'Cierre de Departamento',
                'template' => 'Atención clientes, el departamento de {departamento} cerrará en {minutos} minutos. {instruccion}.',
                'variables' => ['departamento', 'minutos', 'instruccion'],
                'example' => ['departamento' => 'carnicería', 'minutos' => '15', 'instruccion' => 'Si necesita atención, acérquese ahora'],
                'speech_preset' => 'informativo'
            ]
        ],
        
        'emergencias' => [
            'evacuacion' => [
                'name' => 'Evacuación',
                'template' => 'Atención, atención. {motivo}. Por favor, evacuar el edificio de manera ordenada por las salidas de emergencia. {instruccion_extra}.',
                'variables' => ['motivo', 'instruccion_extra'],
                'example' => ['motivo' => 'Se ha activado la alarma de emergencia', 'instruccion_extra' => 'No utilice los ascensores'],
                'speech_preset' => 'emergencia'
            ],
            'emergencia_medica' => [
                'name' => 'Emergencia Médica',
                'template' => 'Atención, se solicita {profesional} en {ubicacion} de manera urgente. {repetir}',
                'variables' => ['profesional', 'ubicacion', 'repetir'],
                'example' => ['profesional' => 'personal médico o paramédico', 'ubicacion' => 'la sección de electrodomésticos', 'repetir' => 'Repito, personal médico en electrodomésticos'],
                'speech_preset' => 'emergencia'
            ]
        ],
        
        'servicios' => [
            'llamado_caja' => [
                'name' => 'Apertura de Caja',
                'template' => 'Atención clientes, se ha habilitado la {caja}. Pueden acercarse para ser atendidos.',
                'variables' => ['caja'],
                'example' => ['caja' => 'caja número 5'],
                'speech_preset' => 'informativo'
            ],
            'vehiculo_mal_estacionado' => [
                'name' => 'Vehículo Mal Estacionado',
                'template' => 'Atención, se solicita al propietario del vehículo {descripcion}, patente {patente}, retirarlo de {ubicacion}. {consecuencia}.',
                'variables' => ['descripcion', 'patente', 'ubicacion', 'consecuencia'],
                'example' => ['descripcion' => 'sedan gris', 'patente' => 'AB CD 12', 'ubicacion' => 'la entrada de emergencia', 'consecuencia' => 'De lo contrario será remolcado'],
                'speech_preset' => 'informativo'
            ],
            'niño_perdido' => [
                'name' => 'Niño Perdido',
                'template' => 'Atención clientes, {descripcion_niño} se encuentra en {ubicacion}. Sus padres pueden acercarse a retirarlo. {mensaje_calma}.',
                'variables' => ['descripcion_niño', 'ubicacion', 'mensaje_calma'],
                'example' => ['descripcion_niño' => 'el pequeño Matías de polera roja', 'ubicacion' => 'atención al cliente', 'mensaje_calma' => 'El niño está bien y acompañado'],
                'speech_preset' => 'informativo'
            ]
        ],
        
        'eventos' => [
            'evento_especial' => [
                'name' => 'Evento Especial',
                'template' => '{saludo}, los invitamos a {evento} que se realizará {cuando} en {ubicacion}. {detalles}.',
                'variables' => ['saludo', 'evento', 'cuando', 'ubicacion', 'detalles'],
                'example' => ['saludo' => 'Estimados clientes', 'evento' => 'nuestra degustación de vinos', 'cuando' => 'en 30 minutos', 'ubicacion' => 'el pasillo central', 'detalles' => 'Tendremos productos con descuentos especiales'],
                'speech_preset' => 'informativo'
                  ]
        ],  // <-- AQUÍ DEBE CERRAR 'eventos' CON COMA
            
        'celebracion' => [  // <-- ESTO DEBE ESTAR AL MISMO NIVEL QUE 'eventos'
            'test_mall' => [
                'name' => 'Test Mall Barrio',
                'template' => 'Atención visitantes de Mall Barrio Independencia. {mensaje}. Gracias por su atención.',
                'variables' => ['mensaje'],
                'example' => ['mensaje' => 'Este es un mensaje de prueba'],
                'speech_preset' => 'informativo'
            ]
        ]
        
    ];
    
    /**
     * Obtiene todos los templates disponibles
     */
    public static function getAllTemplates() {
        return self::TEMPLATES;
    }
    
    /**
     * Obtiene templates por categoría
     */
    public static function getTemplatesByCategory($category) {
        return self::TEMPLATES[$category] ?? [];
    }
    
    /**
     * Obtiene un template específico
     */
    public static function getTemplate($category, $templateId) {
        return self::TEMPLATES[$category][$templateId] ?? null;
    }
    
    /**
     * Genera anuncio desde template
     */
    public static function generateFromTemplate($category, $templateId, $variables = []) {
        $template = self::getTemplate($category, $templateId);
        
        if (!$template) {
            throw new Exception("Template no encontrado: $category/$templateId");
        }
        
        $text = $template['template'];
        
        // Reemplazar variables
        foreach ($variables as $key => $value) {
            $text = str_replace('{' . $key . '}', $value, $text);
        }
        
        // Verificar que no queden variables sin reemplazar
        if (preg_match('/\{[^}]+\}/', $text)) {
            throw new Exception("Faltan variables por completar en el template");
        }
        
        return [
            'text' => $text,
            'speech_preset' => $template['speech_preset'],
            'template_name' => $template['name']
        ];
    }
    
    /**
     * Valida que todas las variables requeridas estén presentes
     */
    public static function validateVariables($category, $templateId, $variables) {
        $template = self::getTemplate($category, $templateId);
        
        if (!$template) {
            return ['valid' => false, 'error' => 'Template no encontrado'];
        }
        
        $missing = [];
        foreach ($template['variables'] as $required) {
            if (!isset($variables[$required]) || empty(trim($variables[$required]))) {
                $missing[] = $required;
            }
        }
        
        if (!empty($missing)) {
            return [
                'valid' => false,
                'error' => 'Faltan variables requeridas',
                'missing' => $missing
            ];
        }
        
        return ['valid' => true];
    }
    
    /**
     * Obtiene lista simple de templates para UI
     */
    public static function getTemplateList() {
        $list = [];
        
        foreach (self::TEMPLATES as $category => $templates) {
            foreach ($templates as $id => $template) {
                $list[] = [
                    'category' => $category,
                    'id' => $id,
                    'name' => $template['name'],
                    'variables' => $template['variables'],
                    'example' => $template['example']
                ];
            }
        }
        
        return $list;
    }
}
?>
