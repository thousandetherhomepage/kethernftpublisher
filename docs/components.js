customElements.define('publisher-settings',
    class PublisherSettings extends HTMLElement {
        constructor() {
            super();
            this.element = this.attachShadow({ mode: 'open' });
            this.settings = null;
            this.render();
        }

        update(settings) {
            this.settings = settings;
            this.render();
        }

        render() {
            if (!this.settings) {
                return;
            }

            const items = Object.entries(this.settings)
                .map(([key, value]) => `<li><strong>${key}</strong>: ${value}</li>`)
                .join('');

            let extra = "";
            console.log(this.settings.publishFeeAmount);
            if (this.settings.publishFeeAmount == 0n) {
                extra = `<p>
                    Note: When publish fee is enabled, the publishing contract (<code>${this.settings.ketherNFTPublisher}</code>) must be approved on the token address to spend the requisite fee each time publish is called.
                </p>`
            }

            this.element.innerHTML = `
              <div>
                  <h2>Publisher Contract Settings</h2>
                  <ul>
                      ${items}
                  </ul>
                  ${extra}
              </div>
            `;
        }
    });


customElements.define('manage-publisher',
    class ManagePublisher extends HTMLElement {
        constructor() {
            super();
            this.data = {};
            this.element = this.attachShadow({ mode: 'open' });
            this.render();
        }

        update(data) {
            this.data = data;
            this.render();
        }

        render() {
            this.element.innerHTML = `
                <form>
                  <p>Approve address to publish to tokenId. Only one approval can exist per tokenId at a time. To remove approval, submit 0x0 address for that tokenId.
                  <div>
                      <input type="text" name="to" placeholder="to address" size="32" value="${this.data.ketherSortition || ''}" />
                      <input type="text" name="tokenId" placeholder="42" size="4" />
                      <input type="submit" value="Approve">
                  </div>
                </form>
            `;

            this.element.querySelector('form').addEventListener('submit', this.onSubmit.bind(this));
        }

        onSubmit(event) {
            event.preventDefault();
            const textInputValue = this.element.getElementById('textInput').value;
            console.log('Submitted value:', textInputValue);
        }
    });

