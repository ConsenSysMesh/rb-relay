pragma solidity ^0.4.11;

import "./RLP.sol";

contract Target {
    mapping (bytes32=>bool) public txs;
    mapping (bytes32=>bool) public receipts;
    mapping (bytes32=>bool) public accounts;
    // bytes32 public tx;
    // bytes32 public receipt;
    // bytes32 public account;

    function processTransaction(bytes rawTx) {
        RLP.RLPItem[] memory rlpTx = RLP.toList(RLP.toRLPItem(headerBytes));

        txs[sha3(rawTx)] = true;
        // tx = sha3(rawTx);
    }
    function processReceipt(bytes rawReceipt) {
        RLP.RLPItem[] memory rlpR = RLP.toList(RLP.toRLPItem(headerBytes));

        receipts[sha3(rawReceipt)] = true;
        // receipt = sha3(rawReceipt);
    }
    function processAccount(bytes rawAccount) {
        accounts[sha3(rawAccount)] = true;
        // account = sha3(rawAccount);
    }
}
