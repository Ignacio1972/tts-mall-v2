/**
 * Event Modal Component - Modal para crear/editar eventos
 * @module EventModal
 */

export class EventModal {
    constructor(options = {}) {
        this.options = options;
        this.modal = null;
        this.currentEvent = null;
        this.isEditMode = false;
        
        this.createModal();
    }
    
    createModal() {
        // Crear estructura del modal
        const modalHTML = `
            <div id="event-modal" class="modal-overlay" style="display: none;">
                <div class="modal-content event-modal">
                    <div class="modal-header">
                        <h2 id="modal-title">Programar Anuncio</h2>
                        <button class="modal-close" id="modal-close-btn">&times;</button>
                    </div>
                    
                    <form id="event-form" class="modal-body">
                        <!-- Título del evento -->
                        <div class="form-group">
                            <label class="form-label required">
                                <span class="form-label__icon">📝</span>
                                Título del Anuncio
                            </label>
                            <input type="text" 
                                   id="event-title" 
                                   class="form-control" 
                                   required 
                                   placeholder="Ej: Oferta de Verduras">
                            <small class="form-help">Descripción breve para identificar el anuncio</small>
                        </div>
                        
                        <!-- Selección de archivo -->
                        <div class="form-group">
                            <label class="form-label required">
                                <span class="form-label__icon">🎵</span>
                                Archivo de Audio
                            </label>
                            <select id="event-file" class="form-control" required>
                                <option value="">-- Seleccionar archivo --</option>
                            </select>
                            <small class="form-help">Archivos disponibles de la biblioteca</small>
                        </div>
                        
                        <!-- Fecha y hora -->
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label required">
                                    <span class="form-label__icon">📅</span>
                                    Fecha
                                </label>
                                <input type="date" 
                                       id="event-date" 
                                       class="form-control" 
                                       required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label required">
                                    <span class="form-label__icon">🕐</span>
                                    Hora
                                </label>
                                <input type="time" 
                                       id="event-time" 
                                       class="form-control" 
                                       required>
                            </div>
                        </div>
                        
                        <!-- Categoría -->
                        <div class="form-group">
                            <label class="form-label required">
                                <span class="form-label__icon">🏷️</span>
                                Categoría
                            </label>
                            <div class="category-selector">
                                ${this.options.categories.map(cat => `
                                    <label class="category-option">
                                        <input type="radio" 
                                               name="event-category" 
                                               value="${cat.id}" 
                                               ${cat.id === 'ofertas' ? 'checked' : ''}>
                                        <div class="category-option-content" style="border-color: ${cat.color}">
                                            <span>${cat.name}</span>
                                        </div>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Prioridad -->
                        <div class="form-group">
                            <label class="form-label">
                                <span class="form-label__icon">⚡</span>
                                Prioridad
                            </label>
                            <div class="priority-selector">
                                <input type="range" 
                                       id="event-priority" 
                                       min="1" 
                                       max="10" 
                                       value="5" 
                                       class="priority-slider">
                                <div class="priority-labels">
                                    <span>Baja (1)</span>
                                    <span id="priority-value">Media (5)</span>
                                    <span>Alta (10)</span>
                                </div>
                            </div>
                            <small class="form-help">Mayor prioridad = se reproduce primero en caso de conflicto</small>
                        </div>
                        
                        <!-- Notas -->
                        <div class="form-group">
                            <label class="form-label">
                                <span class="form-label__icon">📋</span>
                                Notas (opcional)
                            </label>
                            <textarea id="event-notes" 
                                      class="form-control" 
                                      rows="3" 
                                      placeholder="Información adicional sobre este anuncio..."></textarea>
                        </div>
                        
                        <!-- Estado del evento -->
                        <div class="form-group" id="event-status-group" style="display: none;">
                            <label class="toggle-control">
                                <input type="checkbox" id="event-active" checked>
                                <span class="toggle-control__slider"></span>
                                <span class="toggle-control__label">
                                    <span class="toggle-control__icon">✅</span>
                                    Evento activo
                                </span>
                            </label>
                            <small class="form-help">Los eventos inactivos no se reproducirán</small>
                        </div>
                    </form>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="modal-cancel-btn">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-danger" id="modal-delete-btn" style="display: none;">
                            🗑️ Eliminar
                        </button>
                        <button type="submit" form="event-form" class="btn btn-primary" id="modal-save-btn">
                            💾 Guardar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('event-modal');
        
        // Inicializar event listeners
        this.attachEventListeners();
        
        // Poblar selector de archivos
        this.populateFileSelector();
    }
    
    attachEventListeners() {
        // Cerrar modal
        document.getElementById('modal-close-btn').addEventListener('click', () => this.close());
        document.getElementById('modal-cancel-btn').addEventListener('click', () => this.close());
        
        // Click fuera del modal
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        // ESC para cerrar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
        
        // Submit form
        document.getElementById('event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });
        
        // Delete button
        document.getElementById('modal-delete-btn').addEventListener('click', () => {
            this.handleDelete();
        });
        
        // Priority slider
        const prioritySlider = document.getElementById('event-priority');
        const priorityValue = document.getElementById('priority-value');
        
        prioritySlider.addEventListener('input', (e) => {
            const value = e.target.value;
            let label = 'Media';
            
            if (value <= 3) label = 'Baja';
            else if (value >= 8) label = 'Alta';
            else if (value >= 9) label = 'Urgente';
            
            priorityValue.textContent = `${label} (${value})`;
        });
        
        // Auto-llenar fecha/hora con valores actuales al cambiar archivo
        document.getElementById('event-file').addEventListener('change', (e) => {
            if (!this.isEditMode && e.target.value) {
                this.setDefaultDateTime();
            }
        });
    }
    
    populateFileSelector() {
        const fileSelect = document.getElementById('event-file');
        
        // Limpiar opciones existentes
        fileSelect.innerHTML = '<option value="">-- Seleccionar archivo --</option>';
        
        // Agregar archivos disponibles
        if (this.options.availableFiles && this.options.availableFiles.length > 0) {
            this.options.availableFiles.forEach(file => {
                const option = document.createElement('option');
                option.value = file.value;
                option.textContent = file.label;
                fileSelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '(No hay archivos disponibles)';
            option.disabled = true;
            fileSelect.appendChild(option);
        }
    }
    
    open(eventData = null) {
        this.currentEvent = eventData;
        this.isEditMode = !!eventData?.id;
        
        // Actualizar título del modal
        document.getElementById('modal-title').textContent = 
            this.isEditMode ? 'Editar Anuncio Programado' : 'Programar Nuevo Anuncio';
        
        // Mostrar/ocultar elementos según modo
        document.getElementById('modal-delete-btn').style.display = 
            this.isEditMode ? 'inline-flex' : 'none';
        document.getElementById('event-status-group').style.display = 
            this.isEditMode ? 'block' : 'none';
        
        // Resetear formulario
        document.getElementById('event-form').reset();
        
        // Si es edición, cargar datos
        if (this.isEditMode && eventData) {
            this.loadEventData(eventData);
        } else if (eventData?.start) {
            // Si viene de click en calendario, pre-llenar fecha
            this.setDateTimeFromCalendar(eventData.start);
        } else {
            // Valores por defecto para nuevo evento
            this.setDefaultDateTime();
        }
        
        // Mostrar modal
        this.modal.style.display = 'flex';
        
        // Focus en primer campo
        setTimeout(() => {
            document.getElementById('event-title').focus();
        }, 100);
    }
    
    loadEventData(event) {
        document.getElementById('event-title').value = event.title || '';
        document.getElementById('event-file').value = event.file_path || '';
        
        // Fecha y hora
        const startDate = new Date(event.start);
        document.getElementById('event-date').value = 
            startDate.toISOString().split('T')[0];
        document.getElementById('event-time').value = 
            startDate.toTimeString().slice(0, 5);
        
        // Categoría
        const categoryRadio = document.querySelector(
            `input[name="event-category"][value="${event.category}"]`
        );
        if (categoryRadio) categoryRadio.checked = true;
        
        // Prioridad
        const priority = event.priority || 5;
        document.getElementById('event-priority').value = priority;
        document.getElementById('priority-value').textContent = 
            this.getPriorityLabel(priority);
        
        // Notas
        document.getElementById('event-notes').value = event.notes || '';
        
        // Estado activo
        document.getElementById('event-active').checked = 
            event.is_active !== false;
    }
    
    setDefaultDateTime() {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30); // 30 minutos en el futuro
        
        document.getElementById('event-date').value = 
            now.toISOString().split('T')[0];
        document.getElementById('event-time').value = 
            now.toTimeString().slice(0, 5);
    }
    
    setDateTimeFromCalendar(date) {
        const d = new Date(date);
        document.getElementById('event-date').value = 
            d.toISOString().split('T')[0];
        document.getElementById('event-time').value = 
            d.toTimeString().slice(0, 5);
    }
    
    handleSave() {
        // Validar formulario
        const form = document.getElementById('event-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Recopilar datos
        const eventData = {
            title: document.getElementById('event-title').value.trim(),
            file_path: document.getElementById('event-file').value,
            category: document.querySelector('input[name="event-category"]:checked').value,
            start_datetime: this.getDateTime(),
            priority: parseInt(document.getElementById('event-priority').value),
            notes: document.getElementById('event-notes').value.trim(),
            is_active: document.getElementById('event-active').checked
        };
        
        // Si es edición, agregar ID
        if (this.isEditMode && this.currentEvent) {
            eventData.id = this.currentEvent.id;
        }
        
        // Callback al módulo principal
        if (this.options.onSave) {
            this.options.onSave(eventData);
        }
    }
    
    handleDelete() {
        if (!this.isEditMode || !this.currentEvent?.id) return;
        
        if (this.options.onDelete) {
            this.options.onDelete(this.currentEvent.id);
        }
    }
    
    getDateTime() {
        const date = document.getElementById('event-date').value;
        const time = document.getElementById('event-time').value;
        
        // Combinar fecha y hora en formato ISO
        return `${date}T${time}:00`;
    }
    
    getPriorityLabel(value) {
        value = parseInt(value);
        if (value <= 3) return `Baja (${value})`;
        if (value >= 9) return `Urgente (${value})`;
        if (value >= 8) return `Alta (${value})`;
        return `Media (${value})`;
    }
    
    close() {
        this.modal.style.display = 'none';
        this.currentEvent = null;
        this.isEditMode = false;
    }
    
    isOpen() {
        return this.modal.style.display !== 'none';
    }
}