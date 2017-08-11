# rb-relay
Rinkeby Relay

note: current contract requires a `00` byte in front of path

todo: cli:
  display:
    at begining show all contract addresses√ and balances/totalSuply
    each line show gasPrice, nonce, accountBalance, totalSupply, ETHbalance
    make it all green if its within 100 blocks, yellow if within 1000
    show the current speed or relaying. success rate ()

  make secrets.json command

  still issue with newRbLatest. the relay Fs up after a while and it doenst properly understnd which number it is on.

questions:

  How does truebit deal with lots of challenges? Is there a time limit for the result? Cause what if an attacker creates a bunch of challenges? It would take a lot longer to resolve.

  How should the console program send Tx's. If there are multiple people running it, how do they play nicely? we may get multiple store tx or the same block at the same time. a smart relayer would look at the mempool, and bump the blockstore tx for there own with greater gasPrice. whats the best Game theory for this?

  

