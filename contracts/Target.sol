pragma solidity ^0.4.11;

contract Target {
    bool public txDone;
    bool public receiptDone;
    bool public accountDone;

    function processTransaction(bytes rawTx) {
        txDone = true;
    }
    function processReceipt(bytes receipt) {
        receiptDone = true;
    }
    function processAccount(bytes account) {
        accountDone = true;
    }
}
