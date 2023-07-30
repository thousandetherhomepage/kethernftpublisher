export class PublisherSettings extends HTMLElement {
    constructor() {
        super();
        this._shadowRoot = this.attachShadow({ mode: 'open' });
        this._settings = this.getAttribute('settings') || null;
        this._updateRendering();
    }

    update(settings) {
        this._settings = settings;
        this._updateRendering();
    }

    _updateRendering() {
        if (!this._settings) {
            return;
        }

        const items = Object.entries(this._settings)
            .map(([key, value]) => `<li>${key}: ${value}</li>`)
            .join('');

        this._shadowRoot.innerHTML = `
          <div>
              <h2>Publisher Contract Settings</h2>
              <ul>
                  ${items}
              </ul>
          </div>
        `;
    }
}

customElements.define('publisher-settings', PublisherSettings);

