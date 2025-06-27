// /var/www/tts-mall/v2/modules/campaign-library/index.js
export default class CampaignLibraryModule {
    constructor() {
        this.name = 'campaign-library';
    }
    
    async load(container) {
        container.innerHTML = `
            <div style="padding: 40px;">
                <h2>📚 Campañas y Mensajes</h2>
                <p>Biblioteca en construcción - Robert agregará la UI aquí</p>
            </div>
        `;
    }
    
    async unload() {
        // Cleanup cuando Robert implemente
    }
    
    getName() {
        return this.name;
    }
}