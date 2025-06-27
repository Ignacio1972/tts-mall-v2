/**
 * Voice Selector Component
 * Selector visual de voces con cards
 * @module VoiceSelector
 */

export class VoiceSelector {
    constructor() {
        this.voices = [
            {
                id: 'cristian',
                name: 'Cristian',
                icon: '👨',
                description: 'Voz juvenil y simpático',
                category: 'juvenil'
            },
            {
                id: 'valeria',
                name: 'Valeria',
                icon: '👩',
                description: 'Simpática y alegre',
                category: 'alegre'
            },
            {
                id: 'yorman',
                name: 'Yorman',
                icon: '👨',
                description: 'Voz madura de películas',
                category: 'profesional'
            },
            {
                id: 'alejandro',
                name: 'Alejandro',
                icon: '👨',
                description: 'Medio Fome',
                category: 'neutral'
            },
            {
                id: 'fernanda',
                name: 'Fernanda',
                icon: '👩',
                description: 'Para cosas fomes (Anuncios)',
                category: 'anuncios',
                recommended: true
            },
            {
                id: 'rosa',
                name: 'Rosa',
                icon: '👩',
                description: 'Voz femenina amigable (Bienvenidas)',
                category: 'amigable'
            },
            {
                id: 'vicente',
                name: 'Vicente',
                icon: '👨',
                description: 'Voz masculina versátil (Radio)',
                category: 'radio'
            },
            {
                id: 'zabra',
                name: 'Zabra',
                icon: '👩',
                description: 'Voz Masculina dinámica',
                category: 'dinamica'
            },
            {
                id: 'azucena',
                name: 'Azucena',
                icon: '👩',
                description: 'Voz femenina expresiva',
                category: 'expresiva'
            },
            {
                id: 'ninoska',
                name: 'Ninoska',
                icon: '👩',
                description: 'Voz femenina enérgica',
                category: 'energica'
            },
            {
                id: 'ruben',
                name: 'Rubén Suárez',
                icon: '👨',
                description: 'Voz masculina profesional',
                category: 'profesional'
            },
            {
                id: 'santiago',
                name: 'Santiago',
                icon: '👨',
                description: 'Voz masculina clara',
                category: 'clara'
            },
            {
                id: 'luis',
                name: 'Luis',
                icon: '👨',
                description: 'Voz masculina profunda',
                category: 'profunda'
            }
        ];
        
        this.selectedVoice = 'fernanda'; // Default
        this.onChange = null;
    }
    
    /**
     * Renderiza el componente
     * @param {HTMLElement} container - Contenedor donde renderizar
     * @param {Object} options - Opciones de configuración
     */
    static async render(container, options = {}) {
        const instance = new VoiceSelector();
        Object.assign(instance, options);
        
        container.innerHTML = instance.getHTML();
        instance.attachEvents(container);
        
        return instance;
    }
    
    /**
     * Genera el HTML del componente
     */
    getHTML() {
        return `
            <div class="voice-selector">
                ${this.voices.map(voice => `
                    <div class="voice-card ${voice.id === this.selectedVoice ? 'voice-card--active' : ''}" 
                         data-voice-id="${voice.id}"
                         role="button"
                         tabindex="0"
                         aria-label="Seleccionar voz ${voice.name}"
                         aria-pressed="${voice.id === this.selectedVoice}">
                        ${voice.recommended ? '<span class="voice-card__badge">Recomendado</span>' : ''}
                        <div class="voice-card__icon">${voice.icon}</div>
                        <div class="voice-card__name">${voice.name}</div>
                        <div class="voice-card__description">${voice.description}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Adjunta los event listeners
     */
    attachEvents(container) {
        const cards = container.querySelectorAll('.voice-card');
        
        cards.forEach(card => {
            // Click en card
            card.addEventListener('click', () => {
                this.selectVoice(card.dataset.voiceId, container);
            });
            
            // Soporte teclado
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectVoice(card.dataset.voiceId, container);
                }
            });
            
            // Preview de voz al hover (emitir evento)
            card.addEventListener('mouseenter', () => {
                this.previewVoice(card.dataset.voiceId);
            });
        });
        
        // Navegación con flechas
        container.addEventListener('keydown', (e) => {
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
            
            e.preventDefault();
            const currentCard = container.querySelector('.voice-card--active');
            const allCards = Array.from(cards);
            const currentIndex = allCards.indexOf(currentCard);
            
            let newIndex;
            const columns = Math.floor(container.offsetWidth / 220); // Aprox card width
            
            switch(e.key) {
                case 'ArrowLeft':
                    newIndex = Math.max(0, currentIndex - 1);
                    break;
                case 'ArrowRight':
                    newIndex = Math.min(allCards.length - 1, currentIndex + 1);
                    break;
                case 'ArrowUp':
                    newIndex = Math.max(0, currentIndex - columns);
                    break;
                case 'ArrowDown':
                    newIndex = Math.min(allCards.length - 1, currentIndex + columns);
                    break;
            }
            
            if (newIndex !== currentIndex) {
                allCards[newIndex].focus();
                this.selectVoice(allCards[newIndex].dataset.voiceId, container);
            }
        });
    }
    
    /**
     * Selecciona una voz
     */
    selectVoice(voiceId, container) {
        if (this.selectedVoice === voiceId) return;
        
        // Actualizar estado
        this.selectedVoice = voiceId;
        
        // Actualizar UI
        container.querySelectorAll('.voice-card').forEach(card => {
            const isSelected = card.dataset.voiceId === voiceId;
            card.classList.toggle('voice-card--active', isSelected);
            card.setAttribute('aria-pressed', isSelected);
        });
        
        // Disparar evento
        this.triggerChange();
        
        // Feedback auditivo (emitir evento para que el módulo principal reproduzca)
        this.playSelectionSound();
    }
    
    /**
     * Preview de voz (emite evento)
     */
    previewVoice(voiceId) {
        // Emitir evento personalizado para preview
        const event = new CustomEvent('voice:preview', {
            detail: { voiceId },
            bubbles: true
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Sonido de selección
     */
    playSelectionSound() {
        const event = new CustomEvent('ui:feedback', {
            detail: { type: 'selection' },
            bubbles: true
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Dispara evento de cambio
     */
    triggerChange() {
        if (this.onChange) {
            const selectedVoiceData = this.voices.find(v => v.id === this.selectedVoice);
            this.onChange(this.selectedVoice, selectedVoiceData);
        }
    }
    
    /**
     * Obtiene la voz seleccionada
     */
    getValue() {
        return this.selectedVoice;
    }
    
    /**
     * Establece la voz seleccionada
     */
    setValue(voiceId) {
        if (this.voices.find(v => v.id === voiceId)) {
            this.selectedVoice = voiceId;
            // Re-renderizar si es necesario
        }
    }
}

// Export default para import dinámico
export default VoiceSelector;