pragma solidity ^0.4.11;

contract rbrelay {
	/*uint16 EPOCH_LENGTH = 30000;
	uint8 BLOCK_PERIOD = 15;

	uint8 EXTRA_VANITY = 32;
	uint8 EXTRA_SEAL = 65;

	uint NONCE_DROP = 0x0000000000000000;
	uint NONCE_AUTH = 0xffffffffffffffff;

	uint8 DIFF_NOTURN = 1;
	uint8 DIFF_INTURN = 2;

	bytes32 UNCLE_HASH = sha3([0xc0]);*/

	bytes[] rbchain;

	function storeBlockHeader(bytes blockHeaderBytes) {
		var (parentHash,blockNumber,timeStamp) = parseBlockHeader(blockHeaderBytes);

		require(blockNumber==rbchain.length);

		if(blockNumber>0) {
			require(blockNumber==0 || parentHash==sha3(rbchain[blockNumber-1]));

			var (,,prevTimestamp) = parseBlockHeader(rbchain[blockNumber-1]);
			require(timeStamp>=prevTimestamp+BLOCK_PERIOD);
		}
/*
		// are the following checks necessary??

		bool checkpoint = blockNumber==EPOCH_LENGTH;

		require(!checkpoint || beneficiary==0x0);

		require(!checkpoint || nonce==0x0);
		require(nonce==NONCE_DROP || nonce==NONCE_AUTH);

		if(blockNumber%SIGNER_COUNT==SIGNER_INDEX) {
			require(difficulty==DIFF_INTURN);
		} else {
			require(difficulty==DIFF_NOTURN);
		}

		require(omnersHash==UNCLE_HASH);*/

		rbchain.push(blockHeaderBytes);
	}

	function parseBlockHeader(bytes blockHeaderBytes) private returns (bytes32,uint,
		uint) {
		byte lengthByte;

		bytes32 parentHash;
		/*bytes32 omnersHash;
		bytes20 beneficiary;
		bytes32 stateRoot;
		bytes32 transactionRoot;
		bytes32 receiptsRoot;

		bytes1[256] memory logsBloom;

		uint8 difficulty;*/
		uint blockNumber;
		/*uint gasLimit;
		uint gasUsed;*/
		uint timeStamp;
/*
		bytes extraData;
		bytes32 mixHash;
		bytes8 nonce;*/

		uint OFFSET = 0x20;

		// all the fields are 32 bytes unless otherwise stated
		/*assembly {
			lengthByte := mload(add(blockHeaderBytes,OFFSET))
		}
		if(lengthByte<0xf8) {
			OFFSET += 1;
		} else {
			OFFSET += 1 + lengthByte-0xf7;
		}*/
		assembly {
			//OFFSET := add(OFFSET,1)
			parentHash := mload(add(blockHeaderBytes,OFFSET))

			/*OFFSET := add(OFFSET,1)
		    omnersHash := mload(add(add(blockHeaderBytes,OFFSET),0x20))

		    OFFSET := add(OFFSET,1)
		    // 20 bytes
		    beneficiary := mload(add(add(blockHeaderBytes,OFFSET),0x40))

		    OFFSET := add(OFFSET,1)
		    stateRoot := mload(add(add(blockHeaderBytes,OFFSET),0x54))

		    OFFSET := add(OFFSET,1)
		    transactionRoot := mload(add(add(blockHeaderBytes,OFFSET),0x74))

		    OFFSET := add(OFFSET,1)
		    receiptsRoot := mload(add(add(blockHeaderBytes,OFFSET),0x94))

		    OFFSET := add(OFFSET,1)
		    logsBloom := mload(add(add(blockHeaderBytes,OFFSET),0xb4))

		    let BLOOM_OFFSET := 0x100 // this one might be 256 bytes... not sure
		    OFFSET := add(0x20,BLOOM_OFFSET)

		    // not sure if the following fields are uints - it just says scalars in the yellowpaper

		    OFFSET := add(OFFSET,1)
		    // 1 byte
		    difficulty := mload(add(add(blockHeaderBytes,OFFSET),0xb4))*/

		    blockNumber := mload(add(add(blockHeaderBytes,OFFSET),0xd4))//0xd4

		    /*gasLimit := mload(add(add(blockHeaderBytes,OFFSET),0xf4))

		    gasUsed := mload(add(add(blockHeaderBytes,OFFSET),0x114))*/

		    // 10 bytes... until December 2286
		    timeStamp := mload(add(add(blockHeaderBytes,OFFSET),0x134))//0x134
		}

		return (parentHash,blockNumber,timeStamp);
	}
}