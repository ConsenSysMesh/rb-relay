/*
 * @title MerklePatriciaVerifier
 * @author Sam Mayo (sammayo888@gmail.com)
 *
 * @dev Library for verifing merkle patricia proofs.
 */

import "./RLP.sol";

library MerklePatriciaProof {
    /*
     * @dev Verifies a merkle patricia proof.
     * @param value The terminating value in the trie.
     * @param encodedPath The path in the trie leading to value.
     * @param rlpParentNodes The rlp encoded stack of nodes.
     * @param root The root hash of the trie.
     * @return The boolean validity of the proof.
     */
    function verifyProof(bytes value, bytes encodedPath, bytes rlpParentNodes, bytes32 root) internal constant returns (bool) {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpParentNodes);
        RLP.RLPItem[] memory parentNodes = RLP.toList(item);

        bytes memory currentNode;
        RLP.RLPItem[] memory currentNodeList;
        
        bytes32 nodeKey = root;
        uint pathPtr = 0;

        bytes memory path = getNibbleArray(encodedPath);
        if(path.length == 0) {return false;}
        
        for (uint i=0; i<parentNodes.length; i++) {
            if(pathPtr > path.length) {return false;}

            currentNode = RLP.toBytes(parentNodes[i]);
            if(nodeKey != sha3(currentNode)) {return false;}
            currentNodeList = RLP.toList(parentNodes[i]);

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
    
    function nibblesToTraverse(bytes encodedPartialPath, bytes path, uint pathPtr) private constant returns (uint) {
        uint len;
        // encodedPartialPath has elements that are each two hex characters (1 byte), but partialPath
        // and slicedPath have elements that are each one hex character (1 nibble)
        bytes memory partialPath = getNibbleArray(encodedPartialPath);
        bytes memory slicedPath = new bytes(partialPath.length);

        // pathPtr counts nibbles in path
        // partialPath.length is a number of nibbles
        if(pathPtr+partialPath.length < path.length) {
            for(uint i=pathPtr+1; i<=pathPtr+partialPath.length; i++) {
                byte pathNibble = path[i];
                slicedPath[i-pathPtr-1] = pathNibble;
            }
        }

        if(sha3(partialPath) == sha3(slicedPath)) {
            len = partialPath.length;
        } else {
            len = 0;
        }
        return len;
    }

    // bytes b must be hp encoded
    function getNibbleArray(bytes b) private constant returns (bytes) {
        bytes memory nibbles;
        if(b.length>0) {
            uint8 offset;
            uint8 hpNibble = uint8(getNthNibbleOfBytes(0,b));
            if(hpNibble == 1 || hpNibble == 3) {
                nibbles = new bytes(b.length*2-1);
                byte oddNibble = getNthNibbleOfBytes(1,b);
                nibbles[0] = oddNibble;
                offset = 1;
            } else {
                nibbles = new bytes(b.length*2-2);
                offset = 0;
            }

            for(uint i=offset; i<nibbles.length; i++) {
                nibbles[i] = getNthNibbleOfBytes(i-offset+2,b);
            }
        }
        return nibbles;
    }

    function getNthNibbleOfBytes(uint n, bytes str) private constant returns (byte) {
        return byte(n%2==0 ? uint8(str[n/2])/0x10 : uint8(str[n/2])%0x10);
    }
}
