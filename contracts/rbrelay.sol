pragma solidity ^0.4.11;

import "./RLP.sol";
import "./rlpEncode.sol";
import "./MerklePatriciaProof.sol";

contract Target {
	function processTransaction(bytes rawTx, bytes32 txHash) {}
}

contract rbrelay {
	mapping(bytes32=>uint) public rbchain;

	bytes32 public head;
	mapping(address=>bool) isSigner;

	function getBlockNumber(bytes32 blockHash) returns (uint) {
		return rbchain[blockHash];
	}
    
	function rbrelay() {
	    rbchain[0x6341fd3daf94b748c72ced5a5b26028f2474f5f00d824504e4fa37a75767e177] = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
	    
	    // head == second block hash
	    head = 0xa7684ac44d48494670b2e0d9085b7750e7341620f0a271db146ed5e70c1db854;
	    rbchain[head] = 1;

		isSigner[0x42EB768f2244C8811C63729A21A3569731535f06] = true;
		isSigner[0x7ffC57839B00206D1ad20c69A1981b489f772031] = true;
		isSigner[0xB279182D99E65703F0076E4812653aaB85FCA0f0] = true;
	}

	function storeBlockHeader(bytes headerBytes) {
		var (parentHash, blockNumber, unsignedHash, blockHash, r, s, v) = parseBlockHeader(headerBytes);

		require(verifyHeader(parentHash, unsignedHash, blockHash, r, s, v));

		rbchain[blockHash] = blockNumber;

		if(blockNumber > rbchain[parentHash]) {
			head = blockHash;
		}
	}

	function parseBlockHeader(bytes headerBytes) constant returns (bytes32 parentHash, uint blockNumber, bytes32 unsignedHash, bytes32 blockHash, bytes32 r, bytes32 s, uint8 v) {
        RLP.RLPItem[] memory rlpH = RLP.toList(RLP.toRLPItem(headerBytes));

        parentHash = RLP.toBytes32(rlpH[0]);
        blockNumber = RLP.toUint(rlpH[8]);
        unsignedHash = constructUnsignedHash(headerBytes);
		blockHash = sha3(headerBytes);
		bytes memory extraData = RLP.toData(rlpH[12]);
		(r, s, v) = getSignature(extraData);
	}

	function constructUnsignedHash(bytes memory headerBytes) constant returns (bytes32) {
        RLP.RLPItem memory item = RLP.toRLPItem(headerBytes);
        RLP.RLPItem[] memory rlpH = RLP.toList(item);
        bytes[] memory unsignedHeader = new bytes[](15);
        
        for(uint i=0; i<rlpH.length; i++) {
            bytes memory headerItem;
            if(i == 12) {
                bytes memory signedExtraData = RLP.toData(rlpH[i]);
                uint initLen = signedExtraData.length - 65;
                bytes memory unsignedExtraData = new bytes(initLen);
                for(uint j = 0; j<initLen; j++) {
                    unsignedExtraData[j] = signedExtraData[j];
                }

                // the following saves 8780 gas:
                // uint uPtr;
                // uint sPtr;
                // assembly {
                // 	uPtr := add(unsignedExtraData,0x20)
                // 	sPtr := add(signedExtraData,0x20)
                // }
                // memcpy(uPtr, sPtr, initLen);

                headerItem = rlpEncode.encodeBytes(unsignedExtraData);
            } else {
                headerItem = RLP.toBytes(rlpH[i]);
            }
            unsignedHeader[i] = headerItem;
        }
        bytes memory rlpUnsignedHeader = rlpEncode.encodeList(unsignedHeader);
        bytes32 unsignedHash = sha3(rlpUnsignedHeader);
        return unsignedHash;
    }
    
    function getSignature(bytes memory signedExtraData) internal constant returns (bytes32 r, bytes32 s, uint8 v) {
		uint vWord;
		uint OFFSET = 0x20 + signedExtraData.length - 65;
		assembly {
 			r := mload(add(signedExtraData,OFFSET))
			OFFSET := add(OFFSET,0x20)
			s := mload(add(signedExtraData,OFFSET))
			OFFSET := add(OFFSET,0x1)
			vWord := and(mload(add(signedExtraData,OFFSET)),0xff)
		}
		v = uint8(vWord)+27;
	}

	function verifyHeader(bytes32 parentHash, bytes32 unsignedHash, bytes32 blockHash, bytes32 r, bytes32 s, uint8 v)  returns (bool) {
	    if(rbchain[parentHash] == 0) {return false;}
	    if(rbchain[blockHash] != 0) {return false;}

		address miner = ecrecover(unsignedHash,v,r,s);
		if(!isSigner[miner]) {
			return false;
		}

		return true;
	}

	// rawTx and parentNodes are rlp encoded
	function relayTx(bytes rawTx, bytes txIndex, bytes parentNodes, bytes32 blockHash, bytes headerBytes, address targetAddr) {
		bytes32 txHash = verifyTx(rawTx, txIndex, parentNodes, blockHash, headerBytes);
		require(txHash != 0x0);

		Target t = Target(targetAddr);
		t.processTransaction(rawTx,txHash);
	}

	// rawTx and parentNodes are rlp encoded
	function verifyTx(bytes rawTx, bytes txIndex, bytes parentNodes, bytes32 blockHash, bytes headerBytes) constant returns (bytes32) {
		if(rbchain[blockHash] == 0) {return 0x0;}
		if(sha3(headerBytes) != blockHash) {return 0x0;}

		RLP.RLPItem[] memory rlpH = RLP.toList(RLP.toRLPItem(headerBytes));
		bytes32 txRoot = RLP.toBytes32(rlpH[4]);

		if(verifyMerkleProof(rawTx, txIndex, parentNodes, txRoot)) {return 0x0;}

		/*
			compute and return txHash
		*/
	}

	function verifyMerkleProof(bytes value, bytes encodedPath, bytes parentNodes, bytes32 root) constant returns (bool) {
		return MerklePatriciaProof.verifyProof(value, encodedPath, parentNodes, root);
	}

	function memcpy(uint dest, uint src, uint len) private {
        // Copy word-length chunks while possible
        for(; len >= 32; len -= 32) {
            assembly {
                mstore(dest, mload(src))
            }
            dest += 32;
            src += 32;
        }

        // Copy remaining bytes
        uint mask = 256 ** (32 - len) - 1;
        assembly {
            let srcpart := and(mload(src), not(mask))
            let destpart := and(mload(dest), mask)
            mstore(dest, or(destpart, srcpart))
        }
    }
}
