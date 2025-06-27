/**
 * Component Factory - Inicialización centralizada de componentes
 * @module ComponentFactory
 */

export class ComponentFactory {
    /**
     * Configuración de todos los componentes
     */
    static componentConfig = {
        tagInput: {
            module: './components/tag-input.js',
            container: '#tags-container',
            config: {
                placeholder: 'Agregar etiqueta...',
                suggestions: ['urgente', 'oferta', 'evento', 'información', 'promoción']
            }
        },
        styleSlider: {
            module: './components/audio-slider.js',
            container: '#style-slider-container',
            configAttr: 'data-slider-config',
            stateField: 'settings.style',
            multiplier: 100
        },
        stabilitySlider: {
            module: './components/audio-slider.js',
            container: '#stability-slider-container',
            configAttr: 'data-slider-config',
            stateField: 'settings.stability',
            multiplier: 100
        },
        similaritySlider: {
            module: './components/audio-slider.js',
            container: '#similarity-slider-container',
            configAttr: 'data-slider-config',
            stateField: 'settings.similarity_boost',
            multiplier: 100
        },
        speakerBoostToggle: {
            module: './components/speaker-boost-toggle.js',
            container: '#speaker-boost-container',
            stateField: 'settings.use_speaker_boost'
        },
        profileSelector: {
            module: './components/profile-selector.js',
            container: '#voice-profiles-container'
        }
    };
    
    /**
     * Inicializa todos los componentes de forma paralela
     */
    static async initializeAll(container, state, callbacks) {
        const components = {};
        const loadPromises = [];
        
        // Preparar todas las cargas en paralelo
        Object.entries(this.componentConfig).forEach(([name, config]) => {
            const element = container.querySelector(config.container);
            if (!element) {
                console.warn(`[ComponentFactory] Container not found for ${name}: ${config.container}`);
                return;
            }
            
            const promise = this.loadComponent(name, config, element, state, callbacks)
                .then(component => {
                    if (component) components[name] = component;
                })
                .catch(error => {
                    console.warn(`[ComponentFactory] Failed to load ${name}:`, error);
                });
                
            loadPromises.push(promise);
        });
        
        // Esperar a que todos terminen
        await Promise.all(loadPromises);
        
        return components;
    }
    
    /**
     * Carga un componente individual
     */
    static async loadComponent(name, config, element, state, callbacks) {
        try {
            // Importar módulo
            const module = await import(config.module);
            const Component = module.default || module[Object.keys(module)[0]];
            
            if (!Component || typeof Component.render !== 'function') {
                throw new Error(`Invalid component export for ${name}`);
            }
            
            // Preparar configuración
            let componentConfig = { ...config.config };
            
            // Si tiene configuración en atributo data
            if (config.configAttr) {
                const attrConfig = element.getAttribute(config.configAttr);
                if (attrConfig) {
                    Object.assign(componentConfig, JSON.parse(attrConfig));
                }
            }
            
            // Agregar valor inicial del estado
            if (config.stateField && state) {
                const value = this.getNestedValue(state, config.stateField);
                if (config.multiplier) {
                    componentConfig.value = value * config.multiplier;
                } else {
                    componentConfig.value = value;
                }
            }
            
            // Agregar callback
            if (callbacks[name]) {
                componentConfig.onChange = callbacks[name];
            }
            
            // Renderizar componente
            return await Component.render(element, componentConfig);
            
        } catch (error) {
            console.error(`[ComponentFactory] Error loading ${name}:`, error);
            return null;
        }
    }
    
    /**
     * Obtiene valor anidado del estado
     */
    static getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
}