pragma solidity ^0.4.11;

import "./RLP.sol";
import "./rlpEncode.sol";
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
		bytes32 receiptsRoot;
		uint blockNumber;
	}

	function getParentHash(bytes32 blockHash) returns (bytes32) {
		return rbchain[blockHash].parentHash;
	}
	function getStateRoot(bytes32 blockHash) returns (bytes32) {
		return rbchain[blockHash].stateRoot;
	}
	function getTransactionsRoot(bytes32 blockHash) returns (bytes32) {
		return rbchain[blockHash].transactionsRoot;
	}
	function getReceiptsRoot(bytes32 blockHash) returns (bytes32) {
		return rbchain[blockHash].receiptsRoot;
	}
	function getBlockNumber(bytes32 blockHash) returns (uint) {
		return rbchain[blockHash].blockNumber;
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

	// function storeBlockHeader(bytes headerBytes) {
	// 	var (h, unsignedHash, blockHash, r, s, v) = parseBlockHeader(headerBytes);

	// 	require(verifyHeader(h.parentHash, unsignedHash, r, s, v));

	// 	rbchain[blockHash] = h;

	// 	latest = h.blockNumber;
	// }

	// function parseBlockHeader(bytes headerBytes) internal returns (header, bytes32, bytes32, bytes32, bytes32, uint8) {
	// 	RLP.RLPItem memory item = RLP.toRLPItem(headerBytes);
 //        RLP.RLPItem[] memory rlpH = RLP.toList(item);

 //        header h;

	// 	h.parentHash = RLP.toBytes32(rlpH[0]);
	// 	h.stateRoot = RLP.toBytes32(rlpH[3]);
	// 	h.transactionsRoot = RLP.toBytes32(rlpH[4]);
	// 	h.receiptsRoot = RLP.toBytes32(rlpH[5]);
	// 	h.blockNumber = RLP.toUint(rlpH[8]);

	// 	bytes32 blockHash = sha3(headerBytes);

	// 	bytes32 r;
	// 	bytes32 s;
	// 	uint8 v;
	// 	bytes32 unsignedHash = constructUnsignedHash(headerBytes);

	// 	return (h, unsignedHash, blockHash, r, s, v);
	// }

	function constructUnsignedHash(bytes headerBytes) constant returns (bytes) {
        RLP.RLPItem memory item = RLP.toRLPItem(headerBytes);
        RLP.RLPItem[] memory rlpH = RLP.toList(item);
        bytes[] unsignedHeader;
//      bytes32 r;
// 		bytes32 s;
// 		uint8 v;
        
        for(uint i=0; i<rlpH.length; i++) {
            bytes memory headerItem;
            if(i == 12) {
                // bytes memory signedExtraData = RLP.toData(rlpH[i]);
                // uint initLen = headerBytes.length - 65;
                // bytes memory decodedHeaderItem = new bytes(initLen);
                // for (uint j = 0; j<decodedHeaderItem.length; j++) {
                //     decodedHeaderItem[j] = signedExtraData[j];
                // }
                headerItem = rlpEncode.encodeString(decodedHeaderItem);
        
        // 		uint OFFSET = 0x20 + initLen;
        // 		assembly {
        //  			r := mload(add(signedExtraData,OFFSET))
        // 			OFFSET := add(OFFSET,0x20)
        // 			s := mload(add(signedExtraData,OFFSET))
        // 			OFFSET := add(OFFSET,0x20)
        // 			v := mload(add(signedExtraData,OFFSET))
        // 		}
            } else {
                headerItem = RLP.toBytes(rlpH[i]);
            }
            unsignedHeader.push(headerItem);
        }
        //bytes memory rlpUnsignedHeader = rlpEncode.encodeList(unsignedHeader);
        //bytes32 unsignedHash = sha3(rlpUnsignedHeader);
        return unsignedHeader[0];
    }
    
	function verifyHeader(bytes32 parentHash, bytes32 unsignedHash, bytes32 r, bytes32 s, uint8 v) returns (bool) {
	    if(rbchain[parentHash].stateRoot==0x0) {return false;}

		address miner = ecrecover(unsignedHash,v,r,s);
		if(isSigner[miner]) {
			return false;
		}

		return true;
	}

	// rawTx and stack are rlp encoded
	function relayTx(bytes rawTx, bytes txIndex, bytes stack, bytes32 blockHash, address targetAddr) {
		bytes32 txHash = verifyTx(rawTx,txIndex,stack,blockHash);
		require(txHash != 0x0);

		Target t = Target(targetAddr);
		t.processTransaction(rawTx,txHash);
	}

	// rawTx and stack are rlp encoded
	function verifyTx(bytes rawTx, bytes txIndex, bytes stack, bytes32 blockHash) constant returns (bytes32) {
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

	function verifyMerkleProof(bytes value, bytes encodedPath, bytes rlpStack, bytes32 root) constant returns (bool) {
		return MerklePatriciaProof.verifyProof(value, encodedPath, rlpStack, root);
	}
}
