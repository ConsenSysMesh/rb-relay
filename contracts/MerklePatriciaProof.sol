pragma solidity ^0.4.11;

import "./RLP.sol";

library MerklePatriciaProof {
	// value and rlpStack are rlp encoded
	function verifyMerkleProof(bytes value, bytes encodedPath, bytes rlpStack, bytes32 root) internal returns (bool) {
		RLP.RLPItem memory item = RLP.toRLPItem(rlpStack);
        RLP.RLPItem[] memory stack = RLP.toList(item);

		bytes memory currentNode;
		RLP.RLPItem[] memory currentNodeList;
	    
	    bytes32 nodeKey = root;
	    uint pathPtr = 0;

	    bytes memory path = getNibbleArray(encodedPath);
	    if(path.length == 0) {return false;}
	    
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

	          	uint8 nextPathNibble = uint8(path[pathPtr]);
	          	if(nextPathNibble > 16) {return false;}
	          	nodeKey = RLP.toBytes32(currentNodeList[nextPathNibble]);
	          	pathPtr += 1;
	       	} else if(currentNodeList.length == 2) {
				pathPtr += nibblesToTraverse(RLP.toData(currentNodeList[0]), path, pathPtr);
	          	
	          	if(pathPtr == path.length) {//leaf node
		            if(sha3(RLP.toData(currentNodeList[1])) == sha3(value)) {
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
    
	function nibblesToTraverse(bytes encodedPartialPath, bytes path, uint pathPtr) internal returns (uint len) {
		// encodedPartialPath has elements that are each two hex characters (1 byte), but partialPath
		// and slicedPath have elements that are each one hex character (1 nibble)
        bytes partialPath = getNibbleArray(encodedPartialPath);
        bytes slicedPath;

		// pathPtr counts nibbles in path
		// partialPath.length is a number of nibbles
		if(pathPtr+partialPath.length < path.length) {
    		for(uint i=pathPtr+1; i<=pathPtr+partialPath.length; i++) {
    		    byte pathNibble = path[i];
    			slicedPath.push(pathNibble);
    		}
		}

		if(sha3(partialPath) == sha3(slicedPath)) {
			len = partialPath.length;
		} else {
			len = 0;
		}
		
		partialPath.length = 0;
		slicedPath.length = 0;
	}

	// bytes nibbles;
	// bytes b must be hp encoded
	function getNibbleArray(bytes b) internal returns (bytes storage) {
	    bytes nibbles;
		if(b.length>0) {
		    uint8 hpNibble = uint8(getNthNibbleOfBytes(0,b));
			if(hpNibble == 1 || hpNibble == 3) {
			    byte oddNibble = getNthNibbleOfBytes(1,b);
				nibbles.push(oddNibble);
			}

			for(uint i=1; i<b.length; i++) {
				nibbles.push(getNthNibbleOfBytes(2*i,b));
				nibbles.push(getNthNibbleOfBytes(2*i+1,b));
			}
		}
		return nibbles;

		nibbles.length = 0;
	}

	function getNthNibbleOfBytes(uint n, bytes str) internal returns (byte) {
		return byte(n%2==0 ? uint8(str[n/2])/0x10 : uint8(str[n/2])%0x10);
	}
}