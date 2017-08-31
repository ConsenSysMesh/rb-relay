# rb-relay
Rinkeby Relay

note: current contract requires a `00` byte in front of path

todo: cli:
  display:
    at begining show all contract addresses√ and balances/totalSuply
    each line show gasPrice, nonce, accountBalance, totalSupply, ETHbalance
    make it all green if its within 100 blocks, yellow if within 1000
    show the current speed or relaying. success rate ()
    command for creating secrets.json

  make secrets.json command

  still issue with newRbLatest. the relay Fs up after a while and it doenst properly understnd which number it is on.

questions:

  How does truebit deal with lots of challenges? Is there a time limit for the result? Cause what if an attacker creates a bunch of challenges? It would take a lot longer to resolve.

  How should the console program send Tx's. If there are multiple people running it, how do they play nicely? we may get multiple store tx or the same block at the same time. a smart relayer would look at the mempool, and bump the blockstore tx for there own with greater gasPrice. whats the best Game theory for this?


issue:

  2017-08-11T02:45:58.101Z  Rinkeby Head: 693872  Broadcasting: 618296  Relay Head: 618291  10.49 sec/headStored
  2017-08-11T02:46:00.602Z  Rinkeby Head: 693873  Broadcasting: 618297  Relay Head: 618292  10.42 sec/headStored
  2017-08-11T02:46:03.499Z  Rinkeby Head: 693873  Broadcasting: 1   Relay Head: 0   0 sec/headStored
  2017-08-11T02:46:06.000Z  Rinkeby Head: 693873  Broadcasting: 2   Relay Head: 0   0 sec/headStored
  2017-08-11T02:46:08.502Z  Rinkeby Head: 693873  Broadcasting: 3   Relay Head: 618295  10.22 sec/headStored
  2017-08-11T02:46:11.002Z  Rinkeby Head: 693873  Broadcasting: 4   Relay Head: 618295  10.24 sec/headStored


new Target at : 0x79373CecBeE4263CB43907a5d637e4eEE0Ce16Da
