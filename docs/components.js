function emit(name, detail) {
  const event = new CustomEvent(name, { detail, bubbles: true, composed: true });
  this.dispatchEvent(event);
}

const store = {
    messages: [],
};

customElements.define('publisher-messages',
    class PublisherMessages extends HTMLElement {
        constructor() {
            super();
            this.element = this.attachShadow({ mode: 'open' });
            this.render();
        }
        append(msg) {
            store.messages.push(msg);
            this.render();
        }
        replace(msg) {
            store.messages = [msg];
            this.render();
        }
        render() {
            if (store.messages.length === 0) return;

            const items = store.messages
                .map(function (value) {
                    // Check if string
                    if (typeof value === "string") return `<li>${value}</li>`
                    if (Array.isArray(value)) return `<li class="${value[0]}">${value[1]}</li>`;
                    return `<li class="${value.class}">${value.message}</li>`;
                })
                .join('');

            this.element.innerHTML = `
                <style>
                .error { color: red; }
                .success { color: green; }
                </style>
                <ul>${items}</ul>`;
        }
    });

customElements.define('publisher-contract',
    class PublisherContract extends HTMLElement {
        constructor() {
            super();
            this.element = this.attachShadow({ mode: 'open' });
            this.element.innerHTML = `<div>
                <p><strong>Sounds good? Connect your wallet to get started...</strong></p>
                <w3m-core-button></w3m-core-button>
            </div>`;
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
            const magistrateExtra = this.data.isSortitionApproved ?
                `<p>👑 status: ✅ Sortition magistrate is approved to publish to all tokens on your behalf.</p>` :
                `<p>👑 status: ❌ Sortition magistrate is not approved.</p>`;

            this.element.innerHTML = `
                <style>
                    form { border-left: 5px solid rgba(1,1,1,0.1); padding-left: 1em; margin-bottom: 2em;}
                </style>
                <div>
                  <h2>Manage Publisher Approvals</h2>

                  <div>
                      <publisher-messages />
                  </div>

                  <h3>Step 1</h3>

                  <form name="approvePublisher">
                      <p>Approve KetherNFTPublisher contract on KetherNFT contract.</p>
                      <p><strong>Warning:</strong> Double check the wallet confirmation that you're approving the correct contract. Approving to a malicious contract can steal your Kether NFTs.</p>
                      <input type="submit" value="KetherNFT.setApprovalForAll(KetherNFTPublisher, true)" />
                      <p>Current status: ${this.data.isPublisherApproved ? "✅" : "❌"}</p>
                  </form>

                  <h3>Step 2</h3>

                  <form name="approve">
                      <p>Approve address to publish to tokenId. Only one approval can exist per tokenId at a time. To remove approval, submit 0x0 address for that tokenId. Approve the sortition contract to delegate to magistrate.</p>

                      <input type="text" name="to" placeholder="to address" size="40" value="${this.data.ketherSortition || ''}" />
                      <input type="text" name="tokenId" placeholder="42" size="4" />
                      <input type="submit" value="Approve">
                  </form>

                  <em>or</em>

                  <form name="setApprovalForAll">
                      <p>Approve address for all owned tokens. Uncheck to remove approval.</p>

                      <input type="text" name="to" placeholder="to address" size="40" value="${this.data.ketherSortition || ''}" />
                      <input type="checkbox" name="value" checked />
                      <input type="submit" value="setApprovalForAll">
                      ${magistrateExtra}
                  </form>
                </div>
            `;

            this.element.querySelector('form[name=approvePublisher]').addEventListener('submit', this.onSubmitApprovePublisher.bind(this));
            this.element.querySelector('form[name=approve]').addEventListener('submit', this.onSubmitApprove.bind(this));
            this.element.querySelector('form[name=setApprovalForAll]').addEventListener('submit', this.onSubmitApproveAll.bind(this));
        }

        async onSubmitApprovePublisher(event) {
            event.preventDefault();
            const form = event.target;
            form.querySelector('input[type=submit]').disabled = true;

            try {
                const {hash} = await this.methods.approvePublisher();
                console.log("Submitted", hash);
                emit.call(this, "update", {hash});
                this.element.querySelector('publisher-messages').replace(['success', 'Submitted approval for publisher, waiting for transacton: ' + hash]);
            } catch (err) {
                console.error(err);
                this.element.querySelector('publisher-messages').append(['error', err.toString()]);
                form.querySelector('input[type=submit]').disabled = false;
            }
        }

        async onSubmitApprove(event) {
            event.preventDefault();
            const form = event.target;
            const to = form.querySelector('input[name=to]').value;
            const tokenId = form.querySelector('input[name=tokenId]').value;

            form.querySelector('input[type=submit]').disabled = true;

            try {
                const {hash} = await this.methods.approve(to, tokenId);
                console.log("Submitted", {to, tokenId}, hash);
                emit.call(this, "update", {hash});
                this.element.querySelector('publisher-messages').replace(['success', 'Submitted approve, waiting for transaction: ' + hash]);
            } catch (err) {
                console.error(err);
                this.element.querySelector('publisher-messages').append(['error', err.toString()]);
                form.querySelector('input[type=submit]').disabled = false;
            }
        }

        async onSubmitApproveAll(event) {
            event.preventDefault();
            const form = event.target;
            const to = form.querySelector('input[name=to]').value;
            const value = form.querySelector('input[name=value]').checked;

            form.querySelector('input[type=submit]').disabled = true;

            try {
                const {hash} = await this.methods.setApprovalForAll(to, value);
                console.log("Submitted", {to, value}, hash);
                emit.call(this, "update", {hash});
                this.element.querySelector('publisher-messages').replace(['success', 'Submitted setApprovalForAll, waiting for transaction: ' + hash]);
            } catch (err) {
                console.error(err);
                this.element.querySelector('publisher-messages').append(['error', err.toString()]);
                form.querySelector('input[type=submit]').disabled = false;
            }
        }
    });

