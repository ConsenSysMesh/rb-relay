pragma solidity ^0.4.11;

import "./RLP.sol";

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

	function relayTx(bytes rawTx, bytes txIndex, bytes stack, bytes32 blockHash, address targetAddr) {
		bytes32 txHash = verifyTx(rawTx,txIndex,stack,blockHash);
		require(txHash != 0x0);

		Target t = Target(targetAddr);
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

	// value and rlpStack are rlp encoded
	function verifyMerkleProof(bytes value, bytes path, bytes rlpStack, bytes32 root) constant returns (bool) {
		// RLP.RLPItem[][] valueInNode;

		RLP.RLPItem memory item = RLP.toRLPItem(rlpStack);
        RLP.RLPItem[] memory stack = RLP.toList(item);
        // for(uint i=0; i<s.length; i++) {
        // 	valueInNode.push(RLP.toList(s[i]));
        // }

        /*
			copy type struct RLPItem memory[] memory to storage:
			s is type RLPItem[] memory
			s[i] is type RLPItem memory
			toList(s[i]) is type RLPItem[] memory
        */


		bytes memory currentNode;
		RLP.RLPItem[] memory currentNodeList;
	    
	    bytes32 nodeKey = root;
	    uint pathPtr = 0;
	    
	    for (uint i=0; i<stack.length; i++) {
	    	if(pathPtr > path.length) {return false;}

	    	currentNode = RLP.toBytes(stack[i]);
	    	if(nodeKey != sha3(currentNode)) {return false;}
			currentNodeList = RLP.toList(stack[i]);

	      	if(currentNodeList.length == 17) {
	          	if(pathPtr == path.length) {
	            	if(sha3(RLP.toBytes(currentNodeList[16])) == sha3(value)) {
	              		return true;
	            	} else {
	              		return false;
	            	}
	          	}

	          	uint8 nextPathNibble = getNthNibbleOfBytes(pathPtr,path);
	          	nodeKey = RLP.toBytes32(currentNodeList[nextPathNibble]);
	          	pathPtr += 1;
	       	} else if(currentNodeList.length == 2) {
				pathPtr += nibblesToTraverse(RLP.toData(currentNodeList[0]), path, pathPtr);
	          	
	          	if(pathPtr == path.length) {//leaf node
		            if(sha3(RLP.toBytes(currentNodeList[1])) == sha3(value)) {
		              	return true;
		            } else {
		              	return false;
		            }
	          	}
	          	//extension node
          		if(nibblesToTraverse(RLP.toData(currentNodeList[0]), path, pathPtr) == 0) {
       				return false;
       			}

				nodeKey = RLP.toBytes32(currentNodeList[1]);
	        } else {
	        	return false;
	        }
	    }
	}

	function nibblesToTraverse(bytes encodedPartialPath, bytes path, uint pathPtr) returns (uint) {
		// encodedPartialPath has elements that are each two hex characters (1 byte), but partialPath
		// and slicedPath have elements that are each one hex character (1 nibble)

		bytes partialPath;
		bytes slicedPath;

		uint8 hpNibble = getNthNibbleOfBytes(0,encodedPartialPath);
		if(hpNibble == 1 || hpNibble == 3) {
			partialPath.push(byte(getNthNibbleOfBytes(1,encodedPartialPath)));
		}

		// encodedPartialPath.length is a number of bytes
		for(uint i=1; i<encodedPartialPath.length; i++) {
			partialPath.push(byte(getNthNibbleOfBytes(2*i,encodedPartialPath)));
			partialPath.push(byte(getNthNibbleOfBytes(2*i+1,encodedPartialPath)));
		}

		// pathPtr counts nibbles in path
		// partialPath.length is a number of nibbles
		for(i=pathPtr+1; i<=pathPtr+partialPath.length; i++) {
			slicedPath.push(byte(getNthNibbleOfBytes(i,path)));
		}

		if(sha3(partialPath) == sha3(slicedPath)) {
			return partialPath.length;
		} else {
			return 0;
		}
	}

	function getNthNibbleOfBytes(uint n, bytes str) returns (uint8) {
		return n%2==0 ? uint8(str[n])/0x10 : uint8(str[n])%0x10;
	}

	function truth() constant returns (bool) {
		return true;
	}
}