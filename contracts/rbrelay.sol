pragma solidity ^0.4.11;

contract rbrelay {
	uint16 EPOCH_LENGTH = 30000;
	uint8 BLOCK_PERIOD = 15;

	// uint8 EXTRA_VANITY = 32;
	// uint8 EXTRA_SEAL = 65;

	// uint NONCE_DROP = 0x0000000000000000;
	// uint NONCE_AUTH = 0xffffffffffffffff;

	// uint8 DIFF_NOTURN = 1;
	// uint8 DIFF_INTURN = 2;

	// bytes32 UNCLE_HASH = sha3([0xc0]);

	block[] public rbchain;

	uint public latest;

	address[] signers = [0x42EB768f2244C8811C63729A21A3569731535f06,
						 0x7ffC57839B00206D1ad20c69A1981b489f772031,
						 0xB279182D99E65703F0076E4812653aaB85FCA0f0];

	struct block {
		bytes32 parentHash;
		bytes32 stateRoot;
		bytes32 transactionsRoot;
		bytes32 receiptsRoot;
		uint blockNumber;
		bytes32 blockHash;
	}

	block b;

	function storeBlockHeader(bytes32 parentHash,bytes32 stateRoot,bytes32 transactionsRoot,
		bytes32 receiptsRoot,uint blockNumber,bytes32 r,bytes32 s,uint8 v,bytes32 uinsignedHash,
		bytes32 signedHash) {
		//var (parentHash,blockNumber,timeStamp,s,r,v,newSigners) = parseBlockHeader(blockHeaderBytes);

		if(blockNumber > 0) {
			require(blockNumber == 0 || parentHash == rbchain[blockNumber - 1].blockHash);

			// var (,,prevTimestamp) = rbchain[blockNumber - 1].timeStamp;
			// require(timeStamp >= prevTimestamp + BLOCK_PERIOD);
		}

		// are the following checks necessary??

		bool checkpoint = blockNumber%EPOCH_LENGTH==0;

		if (!checkpoint) {
			bool a = false;
			address miner = ecrecover(uinsignedHash,v,r,s);
			for (uint i = 0; i < signers.length; i++) {
				if (miner == signers[i]) {
					a = true;
				}
			}
			require(a);
		}

		// require(!checkpoint || beneficiary==0x0);

		// require(!checkpoint || nonce==0x0);
		// require(nonce==NONCE_DROP || nonce==NONCE_AUTH);

		// if(blockNumber%SIGNER_COUNT==SIGNER_INDEX) {
		// 	require(difficulty==DIFF_INTURN);
		// } else {
		// 	require(difficulty==DIFF_NOTURN);
		// }

		// require(omnersHash==UNCLE_HASH);

		b.parentHash = parentHash;
		b.stateRoot = stateRoot;
		b.transactionsRoot = transactionsRoot;
		b.receiptsRoot = receiptsRoot;
		b.blockNumber = blockNumber;
		b.blockHash = signedHash;

		if(blockNumber == rbchain.length) {
			rbchain.push(b);
		} else if(blockNumber < rbchain.length) {
			rbchain[blockNumber] = b;
		} else {
			throw;
		}

		latest = blockNumber;
	}

// 	function parseBlockHeader(bytes blockHeaderBytes) private returns (bytes32,uint,
// 		uint) {
// 		uint8 lengthByte;

// 		bytes32 parentHash;
// 		/*bytes32 omnersHash;
// 		bytes20 beneficiary;
// 		bytes32 stateRoot;
// 		bytes32 transactionRoot;
// 		bytes32 receiptsRoot;

// 		bytes1[256] memory logsBloom;

// 		uint8 difficulty;*/
// 		//uint8 blockNumberLength;
// 		uint blockNumber;
// 		//uint gasLimit;
// 		//uint8 gasLimitLength;
// 		//uint gasUsed;
// 		//uint8 gasUsedLength;
// 		uint timeStamp;
// 		//uint8 timeStampLength;
// /*
// 		bytes extraData;
// 		bytes32 mixHash;
// 		bytes8 nonce;*/

// 		uint OFFSET = 0x20;

// 		// all the fields are 32 bytes unless otherwise stated
// 		assembly {
// 		// 	lengthByte := mload(add(blockHeaderBytes,OFFSET))
// 		// }
// 		// if(lengthByte<0xf8) {
// 		// 	OFFSET += 1;
// 		// } else {
// 		// 	OFFSET += 1 + lengthByte-0xf7;
// 		// }
// 		// assembly {
// 			//OFFSET := add(OFFSET,1)
// 			parentHash := mload(add(blockHeaderBytes,OFFSET))

// 			//OFFSET := add(OFFSET,1)
// 		    //omnersHash := mload(add(add(blockHeaderBytes,OFFSET),0x20))

// 		    //OFFSET := add(OFFSET,1)
// 		    // 20 bytes
// 		    //beneficiary := mload(add(add(blockHeaderBytes,OFFSET),0x40))

// 		    //OFFSET := add(OFFSET,1)
// 		    //stateRoot := mload(add(add(blockHeaderBytes,OFFSET),0x54))

// 		    //OFFSET := add(OFFSET,1)
// 		    //transactionRoot := mload(add(add(blockHeaderBytes,OFFSET),0x74))

// 		    //OFFSET := add(OFFSET,1)
// 		    //receiptsRoot := mload(add(add(blockHeaderBytes,OFFSET),0x94))

// 		    //OFFSET := add(OFFSET,3)
// 		    //logsBloom := mload(add(add(blockHeaderBytes,OFFSET),0xb4))

// 		    let BLOOM_OFFSET := 0x100 // this one may or may not be correct...
// 		    OFFSET := add(0x20,BLOOM_OFFSET)

// 		    // not sure if the following fields are uints - it just says scalars in the yellowpaper

// 		    // 1 byte - no rlp bytes prior
// 		    //difficulty := mload(add(add(blockHeaderBytes,OFFSET),0xb4))

// 		//    blockNumberLength := sub(mload(add(add(blockNumberLength,OFFSET),0xb5)),0x80)
// 		// }
// 		// bytes memory blockNumber = new bytes(blockNumberLength);
// 		// assembly {
// 		    // no offset increase to account for difficulty being 1 byte
// 		    blockNumber := mload(add(add(blockHeaderBytes,OFFSET),0xb6))//0xd4
// 		    OFFSET := add(OFFSET,0x20/*blockNumberLength*/)

// 		    // gasLimitLength := sub(mload(add(add(blockHeaderBytes,OFFSET),0xb6)),0x80)
// 		    // OFFSET := add(OFFSET,1)
// 		    // gasLimit := mload(add(add(blockHeaderBytes,OFFSET),0xd6))
// 		    OFFSET := add(OFFSET,0x20/*gasLimitLength*/)

// 		    // gasUsedLength := sub(mload(add(add(blockHeaderBytes,OFFSET),0xb6)),0x80)
// 		    // OFFSET := add(OFFSET,1)
// 		    //gasUsed := mload(add(add(blockHeaderBytes,OFFSET),0xf6))
// 		    OFFSET := add(OFFSET,0x20/*gasUsedLength*/)

// 		//     timeStampLength := sub(mload(add(add(blockHeaderBytes,OFFSET),0xb6)),0x80)
// 		// }
// 		// bytes memory timeStamp = new bytes(timeStampLength);
// 		// assembly {
// 		    // OFFSET := add(OFFSET,1)
// 		    // 5 bytes... until December 2286
// 		    timeStamp := mload(add(add(blockHeaderBytes,OFFSET),0xb6))//0x134
// 		}

// 		return (parentHash,toUint(blockNumber),toUint(timeStamp));
// 	}

// 	function toUint(bytes b) private returns (uint) {
// 		uint result;

// 		for(uint8 i=1; i<=b.length; i++) {
// 			result += uint8(b[i])*(10**(b.length-i));
// 		}

// 		return result;
// 	}
}