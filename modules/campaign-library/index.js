/**
 * Campaign Library Module - Biblioteca de Mensajes
 * @module CampaignLibraryModule
 */

import { eventBus } from '../../shared/event-bus.js';
import { storageManager } from '../../shared/storage-manager.js';
import { apiClient } from '../../shared/api-client.js';

export default class CampaignLibraryModule {
    constructor() {
        this.name = 'campaign-library';
        this.container = null;
        this.messages = [];
        this.filteredMessages = [];
        this.currentFilter = 'all';
        this.currentSort = 'date_desc';
        this.searchQuery = '';
        this.isLoading = false;
    }
    
    getName() {
        return this.name;
    }
    
    async load(container) {
        console.log('[CampaignLibrary] Loading...');
        this.container = container;
        
        try {
            // Renderizar estructura inicial
            this.render();
            
            // Cargar estilos
            await this.loadStyles();
            
            // Adjuntar eventos
            this.attachEvents();
            
            // Cargar mensajes
            await this.loadMessages();
            
            eventBus.emit('library:loaded');
            
        } catch (error) {
            console.error('[CampaignLibrary] Load failed:', error);
            this.showError('Error al cargar la biblioteca');
        }
    }
    
    async unload() {
        console.log('[CampaignLibrary] Unloading...');
        this.messages = [];
        this.container = null;
        
        // Cleanup del objeto global
        if (window.campaignLibrary) {
            delete window.campaignLibrary;
        }
    }
    
    async loadStyles() {
        // Cargar CSS externo
        if (!document.querySelector('#campaign-library-styles')) {
            const link = document.createElement('link');
            link.id = 'campaign-library-styles';
            link.rel = 'stylesheet';
            link.href = '/v2/modules/campaign-library/styles/library.css';
            document.head.appendChild(link);
            
            // Esperar a que cargue
            await new Promise((resolve) => {
                link.onload = resolve;
                link.onerror = () => {
                    console.error('[CampaignLibrary] Failed to load styles');
                    resolve(); // Continuar de todos modos
                };
            });
        }
    }
    
  // En /v2/modules/campaign-library/index.js
// Actualizar el método render() para remover header y tabs:

render() {
    this.container.innerHTML = `
        <div class="campaign-library-module">
            <!-- Controles -->
            <div class="library-controls">
                <!-- Filtros -->
                <div class="library-filters">
                    <button class="filter-btn active" data-filter="all">
                        Todos <span class="filter-count">(0)</span>
                    </button>
                    <button class="filter-btn" data-filter="ofertas">
                        🛒 Ofertas <span class="filter-count">(0)</span>
                    </button>
                    <button class="filter-btn" data-filter="eventos">
                        🎉 Eventos <span class="filter-count">(0)</span>
                    </button>
                    <button class="filter-btn" data-filter="informacion">
                        ℹ️ Información <span class="filter-count">(0)</span>
                    </button>
                    <button class="filter-btn" data-filter="emergencias">
                        🚨 Emergencias <span class="filter-count">(0)</span>
                    </button>
                    <button class="filter-btn" data-filter="servicios">
                        🛎️ Servicios <span class="filter-count">(0)</span>
                    </button>
                    <button class="filter-btn" data-filter="horarios">
                        🕐 Horarios <span class="filter-count">(0)</span>
                    </button>
                    <button class="filter-btn" data-filter="sin-categoria">
                        📁 Sin categoría <span class="filter-count">(0)</span>
                    </button>
                </div>
                
                <!-- Búsqueda y ordenamiento -->
                <div class="library-actions">
                    <input type="text" 
                           id="library-search" 
                           class="search-input" 
                           placeholder="🔍 Buscar mensajes...">
                    
                    <select id="library-sort" class="sort-select">
                        <option value="date_desc">Más recientes</option>
                        <option value="date_asc">Más antiguos</option>
                        <option value="title_asc">Título A-Z</option>
                        <option value="title_desc">Título Z-A</option>
                    </select>
                    
                    <button class="btn btn-primary" id="create-new-btn">
                        ➕ Crear Mensaje
                    </button>
                </div>
            </div>
            
            <!-- Grid de mensajes -->
            <div id="messages-grid" class="messages-grid">
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Cargando mensajes...</p>
                </div>
            </div>
            
            <!-- Estado vacío -->
            <div id="empty-state" class="empty-state" style="display: none;">
                <div class="empty-state-icon">📭</div>
                <h3>No hay mensajes en la biblioteca</h3>
                <p>Crea tu primer mensaje para comenzar</p>
                <button class="btn btn-primary" id="create-first-btn">
                    ➕ Crear mi primer mensaje
                </button>
            </div>
        </div>
    `;
}
    
    attachEvents() {
        // Filtros
        this.container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
        
        // Búsqueda
        const searchInput = this.container.querySelector('#library-search');
        searchInput.addEventListener('input', (e) => {
            this.searchMessages(e.target.value);
        });
        
        // Ordenamiento
        const sortSelect = this.container.querySelector('#library-sort');
        sortSelect.addEventListener('change', (e) => {
            this.setSorting(e.target.value);
        });
        
        // Crear nuevo
        this.container.querySelector('#create-new-btn').addEventListener('click', () => {
            window.location.hash = '#/configuracion';
        });
        
        const createFirstBtn = this.container.querySelector('#create-first-btn');
        if (createFirstBtn) {
            createFirstBtn.addEventListener('click', () => {
                window.location.hash = '#/configuracion';
            });
        }
        
        // Escuchar eventos de guardado
        eventBus.on('message:saved:library', (message) => {
            this.addMessage(message);
        });
    }
    
    async loadMessages() {
        this.isLoading = true;
        
        try {
            // Cargar desde localStorage
            const localMessages = this.loadLocalMessages();
            
            // Cargar desde backend
            const backendMessages = await this.loadBackendMessages();
            
            // Combinar y deduplicar
            this.messages = this.mergeMessages(localMessages, backendMessages);
            
            // Actualizar contadores
            this.updateFilterCounts();
            
            // Mostrar mensajes
            this.displayMessages();
            
        } catch (error) {
            console.error('Error cargando mensajes:', error);
            this.messages = this.loadLocalMessages(); // Fallback a local
            this.updateFilterCounts();
            this.displayMessages();
        } finally {
            this.isLoading = false;
        }
    }
    
    loadLocalMessages() {
        const messages = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('tts_mall_library_message_')) {
                try {
                    const message = JSON.parse(localStorage.getItem(key));
                    messages.push(message);
                } catch (e) {
                    console.error('Error parsing message:', e);
                }
            }
        }
        
        return messages;
    }
    
    async loadBackendMessages() {
        try {
            const response = await fetch('/v2/api/library-metadata.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'list' })
            });
            
            if (!response.ok) throw new Error('Backend error');
            
            const result = await response.json();
            return result.success ? result.messages : [];
            
        } catch (error) {
            console.warn('Backend unavailable, using local storage only');
            return [];
        }
    }
    
    mergeMessages(local, backend) {
        const merged = new Map();
        
        // Agregar mensajes del backend
        backend.forEach(msg => merged.set(msg.id, msg));
        
        // Agregar/actualizar con mensajes locales
        local.forEach(msg => merged.set(msg.id, msg));
        
        return Array.from(merged.values());
    }
    
    displayMessages() {
        const grid = this.container.querySelector('#messages-grid');
        const emptyState = this.container.querySelector('#empty-state');
        
        // Aplicar filtro y ordenamiento
        this.applyFiltersAndSort();
        
        if (this.filteredMessages.length === 0 && this.messages.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        if (this.filteredMessages.length === 0) {
            grid.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <p style="font-size: 1.25rem;">No se encontraron mensajes</p>
                    <p>Intenta con otros filtros o términos de búsqueda</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.filteredMessages.map(message => `
            <div class="message-card" data-id="${message.id}">
                <div class="message-card-header">
                    <h3 class="message-title">${this.escapeHtml(message.title)}</h3>
                    <span class="message-category ${message.category || 'sin-categoria'}">
                        ${this.getCategoryLabel(message.category)}
                    </span>
                </div>
                
                <div class="message-excerpt">
                    ${this.escapeHtml(message.excerpt || message.text.substring(0, 100) + '...')}
                </div>
                
                <div class="message-meta">
                    <span class="message-voice">🎤 ${message.voice}</span>
                    <span class="message-date">📅 ${this.formatDate(message.savedAt)}</span>
                </div>
                
                <div class="message-actions">
                    <button class="btn-icon" onclick="window.campaignLibrary.playMessage('${message.id}')" title="Reproducir">
                        ▶️
                    </button>
                    <button class="btn-icon" onclick="window.campaignLibrary.editMessage('${message.id}')" title="Editar título">
                        ✏️
                    </button>
                    <button class="btn-icon" onclick="window.campaignLibrary.sendToRadio('${message.id}')" title="Enviar a radio">
                        📻
                    </button>
                    <button class="btn-icon btn-danger" onclick="window.campaignLibrary.deleteMessage('${message.id}')" title="Eliminar">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
        
        // Exponer métodos globalmente para onclick
        window.campaignLibrary = {
            playMessage: (id) => this.playMessage(id),
            editMessage: (id) => this.editMessage(id),
            sendToRadio: (id) => this.sendToRadio(id),
            deleteMessage: (id) => this.deleteMessage(id)
        };
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Actualizar botones activos
        this.container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.displayMessages();
    }
    
    searchMessages(query) {
        this.searchQuery = query.toLowerCase();
        this.displayMessages();
    }
    
    setSorting(sort) {
        this.currentSort = sort;
        this.displayMessages();
    }
    
    applyFiltersAndSort() {
        // Filtrar
        this.filteredMessages = this.messages.filter(msg => {
            // Filtro de categoría
            if (this.currentFilter !== 'all') {
                const msgCategory = msg.category || 'sin-categoria';
                if (msgCategory !== this.currentFilter) {
                    return false;
                }
            }
            
            // Búsqueda
            if (this.searchQuery) {
                const searchIn = (msg.title + msg.text + msg.voice).toLowerCase();
                if (!searchIn.includes(this.searchQuery)) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Ordenar
        this.filteredMessages.sort((a, b) => {
            switch (this.currentSort) {
                case 'date_desc':
                    return (b.savedAt || 0) - (a.savedAt || 0);
                case 'date_asc':
                    return (a.savedAt || 0) - (b.savedAt || 0);
                case 'title_asc':
                    return a.title.localeCompare(b.title);
                case 'title_desc':
                    return b.title.localeCompare(a.title);
                default:
                    return 0;
            }
        });
    }
    
    updateFilterCounts() {
        const counts = {
            all: this.messages.length,
            ofertas: 0,
            eventos: 0,
            informacion: 0,
            emergencias: 0,
            servicios: 0,
            horarios: 0,
            'sin-categoria': 0
        };
        
        this.messages.forEach(msg => {
            const cat = msg.category || 'sin-categoria';
            if (counts[cat] !== undefined) {
                counts[cat]++;
            }
        });
        
        // Actualizar UI
        Object.entries(counts).forEach(([filter, count]) => {
            const btn = this.container.querySelector(`[data-filter="${filter}"] .filter-count`);
            if (btn) {
                btn.textContent = `(${count})`;
            }
        });
    }
    
    async playMessage(id) {
        const message = this.messages.find(m => m.id === id);
        if (!message || !message.audioFilename) {
            this.showError('Audio no disponible');
            return;
        }
        
        // Remover player anterior si existe
        const existingPlayer = document.querySelector('.floating-player');
        if (existingPlayer) {
            existingPlayer.remove();
        }
        
        // Crear player flotante
        const player = document.createElement('div');
        player.className = 'floating-player';
        player.innerHTML = `
            <div class="player-header">
                <span>🎵 ${this.escapeHtml(message.title)}</span>
                <button onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
            <audio controls autoplay>
<source src="/v2/api/biblioteca.php?filename=${message.azuracastFilename || message.audioFilename}" type="audio/mpeg">                Tu navegador no soporta el elemento de audio.
            </audio>
        `;
        
        document.body.appendChild(player);
    }
    
    async editMessage(id) {
        const message = this.messages.find(m => m.id === id);
        if (!message) return;
        
        const newTitle = prompt('Editar título del mensaje:', message.title);
        if (!newTitle || newTitle === message.title) return;
        
        if (newTitle.trim().length < 3) {
            this.showError('El título debe tener al menos 3 caracteres');
            return;
        }
        
        message.title = newTitle.trim();
        message.updatedAt = Date.now();
        
        // Guardar localmente
        storageManager.save(`library_message_${message.id}`, message);
        
        // Guardar en backend
        try {
            await fetch('/v2/api/library-metadata.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    id: message.id,
                    data: { title: newTitle }
                })
            });
        } catch (error) {
            console.error('Error actualizando en backend:', error);
        }
        
        this.displayMessages();
        this.showSuccess('Título actualizado');
    }
    
    async sendToRadio(id) {
        const message = this.messages.find(m => m.id === id);
        if (!message || !message.azuracastFilename) {
            this.showError('Audio no disponible para enviar');
            return;
        }
        
      //  if (!confirm(`¿Enviar "${message.title}" a la radio ahora?`)) return;
        
        try {
            const response = await apiClient.post('/generate.php', {
                action: 'send_to_radio',
                filename: message.azuracastFilename
            });
            
            if (response.success) {
                this.showSuccess('¡Mensaje enviado a la radio!');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showError('Error al enviar: ' + error.message);
        }
    }
    
    async deleteMessage(id) {
        const message = this.messages.find(m => m.id === id);
        if (!message) return;
        
        if (!confirm(`¿Eliminar "${message.title}" permanentemente?\n\nEsta acción no se puede deshacer.`)) return;
        
        // Eliminar localmente
        storageManager.delete(`library_message_${message.id}`);
        
        // Eliminar del array
        this.messages = this.messages.filter(m => m.id !== id);
        
        // Eliminar en backend
        try {
            await fetch('/v2/api/library-metadata.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    id: message.id
                })
            });
        } catch (error) {
            console.error('Error eliminando en backend:', error);
        }
        
        // Actualizar UI
        this.updateFilterCounts();
        this.displayMessages();
        this.showSuccess('Mensaje eliminado');
    }
    
    addMessage(message) {
        // Agregar al inicio del array
        this.messages.unshift(message);
        
        // Actualizar UI
        this.updateFilterCounts();
        this.displayMessages();
    }
    
    getCategoryLabel(category) {
        const labels = {
            'ofertas': '🛒 Ofertas',
            'eventos': '🎉 Eventos',
            'informacion': 'ℹ️ Información',
            'emergencias': '🚨 Emergencias',
            'servicios': '🛎️ Servicios',
            'horarios': '🕐 Horarios',
            'sin-categoria': '📁 Sin categoría'
        };
        
        return labels[category] || labels['sin-categoria'];
    }
    
    formatDate(timestamp) {
        if (!timestamp) return 'Fecha desconocida';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // Si es de hoy
        if (diff < 86400000 && date.getDate() === now.getDate()) {
            return `Hoy ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Si es de ayer
        if (diff < 172800000 && date.getDate() === now.getDate() - 1) {
            return `Ayer ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Fecha completa
        return date.toLocaleDateString('es-CL', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type) {
        // Emitir evento global
        eventBus.emit('ui:notification', { message, type });
        
        // Fallback con notificación local
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease';
        }, 10);
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}