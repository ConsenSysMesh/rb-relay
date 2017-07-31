pragma solidity ^0.4.11;

contract Target {
	bool public done;
	
	function processTransaction(bytes rawTx, bytes32 txHash) {
		done = true;
	}
}