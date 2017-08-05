pragma solidity ^0.4.11;

import "./RLP.sol";

contract Target {
    uint public numTransactionsProcessed;
    uint public numReceiptsProcessed;
    uint public numAccountsProcessed;

    function processTransaction(bytes rawTx) {
        numTransactionsProcessed++;
    }
    function processReceipt(bytes receipt) {
        numReceiptsProcessed++;
    }
    function processAccount(bytes account) {
        numAccountsProcessed++;
    }
}
