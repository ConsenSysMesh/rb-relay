pragma solidity ^0.4.12;

import "./RLP.sol";

contract Target {
	function processTransaction(bytes rawTx,bytes32 txHash) {}
}

contract rbrelay {
	mapping(bytes32=>header) public rbchain;

	uint public latest;
	mapping(address=>bool) isSigner;

	struct header {
		bytes32 parentHash;
		bytes32 stateRoot;
		bytes32 transactionsRoot;
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

	function storeBlockHeader(bytes headerBytes, bytes32 r, bytes32 s, uint8 v, bytes32 blockHash) {
		var (parentHash, stateRoot, transactionsRoot, receiptsRoot, blockNumber) = parseBlockHeader(headerBytes);

		require(verifyHeader(headerBytes, parentHash, r, s, v, blockHash));

		header h;

		h.parentHash = parentHash;
		h.stateRoot = stateRoot;
		h.transactionsRoot = transactionsRoot;
		h.receiptsRoot = receiptsRoot;
		h.blockNumber = blockNumber;

		rbchain[blockHash] = h;

		latest = blockNumber;
	}

	function parseBlockHeader(bytes headerBytes) returns (bytes32, bytes32, bytes32, bytes32, uint) 
	{
		RLP.RLPItem memory item = RLP.toRLPItem(headerBytes);
        RLP.RLPItem[] memory h = RLP.toList(item);

		bytes32 parentHash = RLP.toBytes32(h[0]);
		bytes32 stateRoot = RLP.toBytes32(h[3]);
		bytes32 transactionsRoot = RLP.toBytes32(h[4]);
		bytes32 receiptsRoot = RLP.toBytes32(h[5]);
		uint blockNumber = RLP.toUint(h[8]);

		return (parentHash, stateRoot, transactionsRoot, receiptsRoot, blockNumber);
	}
    
	function verifyHeader(bytes headerBytes, bytes32 parentHash, bytes32 r, bytes32 s, uint8 v, bytes32 blockHash) returns (bool) {
	    if(rbchain[parentHash].stateRoot==0x0) {
		    return false;
	    }

		bytes32 unsignedHash = sha3(headerBytes);
		address miner = ecrecover(unsignedHash,v,r,s);
		if (isSigner[miner]) {
			return true;
		}

		return false;
	}

	function relayTx(bytes rawTx, bytes txIndex, bytes stack, bytes32 blockHash, address Contract) {
		bytes32 txHash = verifyTx(rawTx,txIndex,stack,blockHash);
		require(txHash != 0x0);

		Target t = Target(Contract);
		t.processTransaction(rawTx,txHash);
	}

	// rawTx and stack are rlp encoded
	function verifyTx(bytes rawTx, bytes txIndex, bytes stack, bytes32 blockHash) returns (bytes32 txHash) {
		header h = rbchain[blockHash];
		if(h.transactionsRoot == 0x0) {
			return 0x0;
		}

		bytes32 txRoot = h.transactionsRoot;

		require(verifyMerkleProof(rawTx, txIndex, stack, txRoot));

		/*
			compute and return txHash
		*/
	}

	// value and stack are rlp encoded
	function verifyMerkleProof(bytes value, bytes path, bytes stack, bytes32 root) returns (bool) {
		bytes[] rlpNode;
		RLP.RLPItem[][] valueInNode;

		RLP.RLPItem memory item = RLP.toRLPItem(stack);
        RLP.RLPItem[] memory s = RLP.toList(item);
        for(uint i=0; i<s.length; i++) {
        	rlpNode.push(RLP.toBytes(s[i]));
        	valueInNode.push(RLP.toList(s[i]));
        }

		bytes currentNode;
		RLP.RLPItem[] currentNodeValues;
	    uint len = rlpNode.length;
	    
	    bytes32 nodeKey = root;
	    uint pathPtr = 0;
	    
	    for (uint i=0; i<len; i++) {
			currentNodeValues = valueInNode[i];

			if(nodeKey != sha3(rlpNode[i])) {
		    	return false;
		  	}
		  	if(pathPtr > path.length){
		    	return false
		  	}

	      	if(currentNodeValues.length == 17) {
	          	if(pathPtr == path.length) {
	            	if(RLP.toBytes(currentNodeValues[16]) == value) {
	              		return true;
	            	} else {
	              		return false;
	            	}
	          	}
	          	uint8 nextPathNibble = getNthNibbleOfBytes(pathPtr,path);
	          	nodeKey = RLP.toBytes32(currentNodeValues[nextPathNibble]);
	          	pathPtr += 1;
	       	} else if(currentNodeValues.length == 2) {
	       		if(nibblesToTraverse(RLP.toData(currentNodeValues[0]), path, pathPtr)==0) {
	       			return false;
	       		}

	        	pathPtr += nibblesToTraverse(RLP.toData(currentNodeValues[0]), path, pathPtr);
	          	
	          	if(pathPtr == path.length) {//leaf node
		            if(RLP.toBytes(currentNodeValues[1]) == value) {
		              	return true;
		            } else {
		              	return false;
		            }
	          	} else {//extension node
	            	nodeKey = RLP.toBytes32(currentNodeValues[1]);
	          	}
	        } else {
	        	return false;
	        }
	    }
	}

	function nibblesToTraverse(bytes encodedPartialPath, bytes path, uint pathPtr) returns (uint) {
		bytes partialPath;
		bytes slicedPath;

		uint8 hpNibble = getNthNibbleOfBytes(0,encodedPartialPath);
		if(hpNibble == 1 || hpNibble == 3) {
			partialPath.push(byte(getNthNibbleOfBytes(1,encodedPartialPath)));
		}

		for(uint i=1; i<encodedPartialPath.length; i++) {
			partialPath.push(byte(getNthNibbleOfBytes(2*i,encodedPartialPath)));
			partialPath.push(byte(getNthNibbleOfBytes(2*i+1,encodedPartialPath)));

			if(i>pathPtr && i) {
				slicedPath.push(byte(getNthNibbleOfBytes(2*i,path)));
				slicedPath.push(byte(getNthNibbleOfBytes(2*i+1,path)));
			}
		}

		for(i=pathPtr+1; i<=pathPtr+partialPath.length; i++) {

		}

		if(partialPath == slicedPath  path.slice(pathPtr, pathPtr + partialPath.length)) {
			return hpNibble==0||hpNibble==2 ? partialPath.length : partialPath.length-1;
		} else {
			return 0;
		}
	}

	function getNthNibbleOfBytes(uint n, bytes str) returns (uint8) {
		return n%2==0 ? uint8(str[n])/0x10 : uint8(str[n])%0x10;
	}
}