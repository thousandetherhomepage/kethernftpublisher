customElements.define('publisher-messages',
    class PublisherMessages extends HTMLElement {
        constructor() {
            super();
            this.element = this.attachShadow({ mode: 'open' });
            this.messages = [];
            this.render();
        }
        append(msg) {
            this.messages.push(msg);
            this.render();
        }
        replace(msg) {
            this.messages = [msg];
            this.render();
        }
        render() {
            if (this.messages.length === 0) return;

            const items = this.messages
                .map(function (value) {
                    // Check if string
                    if (typeof value === "string") return `<li>${value}</li>`
                    if (Array.isArray(value)) return `<li class="${value[0]}">${value[1]}</li>`;
                    return `<li class="${value.class}">${value.message}</li>`;
                })
                .join('');

            this.element.innerHTML = `<ul>${items}</ul>`;
        }
    });

customElements.define('publisher-contract',
    class PublisherContract extends HTMLElement {
        constructor() {
            super();
            this.element = this.attachShadow({ mode: 'open' });
            this.element.innerHTML = "Waiting for wallet to connect...";
            this.settings = null;
            this.methods = {};
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

              <div>
                <manage-publisher />
              </div>
            `;

            const manager = this.element.querySelector('manage-publisher');
            manager.methods = this.methods;
            manager.update(this.settings);
        }
    });


customElements.define('manage-publisher',
    class ManagePublisher extends HTMLElement {
        constructor() {
            super();
            this.data = {};
            this.element = this.attachShadow({ mode: 'open' });
            this.render();
            this.methods = {};
        }

        update(data) {
            this.data = data;
            this.render();
        }

        render() {
            this.element.innerHTML = `
                <form>
                  <h2>Manage Publisher Approvals</h2>

                  <publisher-messages />

                  <p>Approve address to publish to tokenId. Only one approval can exist per tokenId at a time. To remove approval, submit 0x0 address for that tokenId.
                  <div>
                      <input type="text" name="to" placeholder="to address" size="40" value="${this.data.ketherSortition || ''}" />
                      <input type="text" name="tokenId" placeholder="42" size="4" />
                      <input type="submit" value="Approve">
                  </div>
                </form>
            `;

            this.element.querySelector('form').addEventListener('submit', this.onSubmit.bind(this));
        }

        async onSubmit(event) {
            event.preventDefault();
            const to = this.element.querySelector('input[name=to]').value;
            const tokenId = this.element.querySelector('input[name=tokenId]').value;

            this.element.querySelector('input[type=submit]').disabled = true;

            try {
                const hash = await this.methods.approve(to, tokenId);
                console.log("Submitted:", {to, tokenId}, hash);
                this.element.querySelector('publisher-messages').replace(['success', hash]);
            } catch (err) {
                console.error(err);
                this.element.querySelector('publisher-messages').append(['error', err.toString()]);
            }

        }
    });

