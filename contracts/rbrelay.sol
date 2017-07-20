pragma solidity ^0.4.11;

import "./RLP.sol";
import "./MerklePatriciaProof.sol";

contract Target {
	function processTransaction(bytes rawTx, bytes32 txHash) {}
}

contract rbrelay {
	mapping(bytes32=>header) public rbchain;

	uint public latest;
	mapping(address=>bool) isSigner;

	struct header {
		bytes32 parentHash;
		bytes32 stateRoot;
		bytes32 transactionsRoot;
// 		bool False; // worst bug fix ever - take this out and switch to solc 0.4.13
		bytes32 receiptsRoot;
		uint blockNumber;
	}
    
	function rbrelay() {
	    bytes32 genesisHash = 0x6341fd3daf94b748c72ced5a5b26028f2474f5f00d824504e4fa37a75767e177;
	    
	    header genesis;
	    
	    genesis.parentHash = 0x0;
	    genesis.stateRoot = 0x53580584816f617295ea26c0e17641e0120cab2f0a8ffb53a866fd53aa8e8c2d;
	    genesis.transactionsRoot = 0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421;
		genesis.receiptsRoot = 0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421;
		genesis.blockNumber = 0;
		
		rbchain[genesisHash] = genesis;
		
		latest = 0;

		isSigner[0x42EB768f2244C8811C63729A21A3569731535f06] = true;
		isSigner[0x7ffC57839B00206D1ad20c69A1981b489f772031] = true;
		isSigner[0xB279182D99E65703F0076E4812653aaB85FCA0f0] = true;
	}

	function storeBlockHeader(bytes headerBytes, bytes32 r, bytes32 s, uint8 v) {
		var (h, unsignedHash, blockHash) = parseBlockHeader(headerBytes,r,s,v);

		require(verifyHeader(h.parentHash, unsignedHash, r, s, v));

		rbchain[blockHash] = h;

		latest = h.blockNumber;
	}

	function parseBlockHeader(bytes headerBytes, bytes32 r, bytes32 s, uint8 v) internal returns (header, bytes32, bytes32) 
	{
		RLP.RLPItem memory item = RLP.toRLPItem(headerBytes);
        RLP.RLPItem[] memory rlpH = RLP.toList(item);

        header h;

		h.parentHash = RLP.toBytes32(rlpH[0]);
		h.stateRoot = RLP.toBytes32(rlpH[3]);
		h.transactionsRoot = RLP.toBytes32(rlpH[4]);
		h.receiptsRoot = RLP.toBytes32(rlpH[5]);
		h.blockNumber = RLP.toUint(rlpH[8]);

		bytes32 unsignedHash = sha3(headerBytes);
		bytes32 blockHash;
		/*
			block hash = sha3(RLP(h[i])) | h[12] = RLP(toData(h[12]) + r + s + v)
		*/

		return (h, unsignedHash, blockHash);
	}
    
	function verifyHeader(bytes32 parentHash, bytes32 unsignedHash, bytes32 r, bytes32 s, uint8 v) returns (bool) {
	    if(rbchain[parentHash].stateRoot==0x0) {
		    return false;
	    }
		
		address miner = ecrecover(unsignedHash,v,r,s);
		if (isSigner[miner]) {
			return true;
		}

		return false;
	}

	// rawTx and stack are rlp encoded
	function relayTx(bytes rawTx, bytes txIndex, bytes stack, bytes32 blockHash, address targetAddr) {
		bytes32 txHash = verifyTx(rawTx,txIndex,stack,blockHash);
		require(txHash != 0x0);

		Target t = Target(targetAddr);
		t.processTransaction(rawTx,txHash);
	}

	// rawTx and stack are rlp encoded
	function verifyTx(bytes rawTx, bytes txIndex, bytes stack, bytes32 blockHash) returns (bytes32) {
		header h = rbchain[blockHash];
		if(h.transactionsRoot == 0x0) {
			return 0x0;
		}

		bytes32 txRoot = h.transactionsRoot;

		require(MerklePatriciaProof.verifyProof(rawTx, txIndex, stack, txRoot));

		/*
			compute and return txHash
		*/
	}

	function verifyMerkleProof(bytes value, bytes encodedPath, bytes rlpStack, bytes32 root) returns (bool) {
		return MerklePatriciaProof.verifyProof(value, encodedPath, rlpStack, root);
	}

	function getNthNibbleOfBytes(uint n, bytes str) returns (byte) {
		return MerklePatriciaProof.getNthNibbleOfBytes(n,str);
	}
}
