# rb-relay
Rinkeby Relay

# Install
`git clone https://github.com/ConsenSys/rb-relay.git`
`npm link`
you have to create a `secrets.json` in the root of the project that looks like this:
`{"mnemonic": "put your twelve word seed in here so you can sign transactions"}`

# Use
Relay headers from Rinkeby to Ropsten
`rbrelay start`
Your wallet must have funds on the destination chain (ropsten)

Relay a TX from rinkeby to ropsten
`rbrelay tx 0x906a8ed7932dea662f1062414e8e558d49b52d1cfb56097247ca123aa4b64261 0x5e8ef53f0fde5347ce873deb9dddfbf7b3411b5b`

# WIP
Later we can relay receipts, account state, and storage variables
