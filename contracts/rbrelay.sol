pragma solidity ^0.4.11;

import "./RLP.sol";
import "./RLPEncode.sol";
import "./MerklePatriciaProof.sol";
import "./Rb20.sol";
import "./Target.sol";

contract rbrelay {
    mapping(bytes32=>uint) public rbchain;

    bytes32 public startHash;
    bytes32 public head;
    mapping(address=>bool) isSigner;
    uint relayPrice;
    Rb20 public rb20;

    function rbrelay(bytes32 _startHash, uint startNum) {
        if(_startHash==0) {
            startHash = 0x6341fd3daf94b748c72ced5a5b26028f2474f5f00d824504e4fa37a75767e177;
            rbchain[startHash] = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
        } else {
            startHash = _startHash;
            rbchain[startHash] = startNum;
        }
        head = startHash;

        relayPrice = 100000000000000000;
        rb20 = new Rb20(1, "RBT", 1, "RBT");

        isSigner[0x42EB768f2244C8811C63729A21A3569731535f06] = true;
        isSigner[0x7ffC57839B00206D1ad20c69A1981b489f772031] = true;
        isSigner[0xB279182D99E65703F0076E4812653aaB85FCA0f0] = true;
    }

    function storeBlockHeader(bytes headerBytes) {
        var (parentHash, blockNumber, unsignedHash, blockHash, r, s, v) = parseBlockHeader(headerBytes);

        require(verifyHeader(parentHash, unsignedHash, r, s, v));
        require(rbchain[blockHash] == 0);
        rbchain[blockHash] = blockNumber;

        if(blockNumber > rbchain[parentHash]) {
            head = blockHash;
        }
        mint();
    }

    function parseBlockHeader(bytes headerBytes) private constant returns (bytes32 parentHash, uint blockNumber, bytes32 unsignedHash, bytes32 blockHash, bytes32 r, bytes32 s, uint8 v) {
        RLP.RLPItem[] memory rlpH = RLP.toList(RLP.toRLPItem(headerBytes));

        parentHash = RLP.toBytes32(rlpH[0]);
        blockNumber = RLP.toUint(rlpH[8]);
        unsignedHash = constructUnsignedHash(headerBytes);
        blockHash = sha3(headerBytes);
        bytes memory extraData = RLP.toData(rlpH[12]);
        (r, s, v) = getSignature(extraData);
    }

    function constructUnsignedHash(bytes memory headerBytes) private constant returns (bytes32) {
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

                headerItem = RLPEncode.encodeBytes(unsignedExtraData);
            } else {
                headerItem = RLP.toBytes(rlpH[i]);
            }
            unsignedHeader[i] = headerItem;
        }
        bytes memory rlpUnsignedHeader = RLPEncode.encodeList(unsignedHeader);
        bytes32 unsignedHash = sha3(rlpUnsignedHeader);
        return unsignedHash;
    }
    
    function getSignature(bytes memory signedExtraData) private constant returns (bytes32 r, bytes32 s, uint8 v) {
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

    function verifyHeader(bytes32 parentHash, bytes32 unsignedHash, bytes32 r, bytes32 s, uint8 v) private constant returns (bool) {
        if(rbchain[parentHash] == 0) {return false;}

        address miner = ecrecover(unsignedHash,v,r,s);
        if(!isSigner[miner]) {
            return false;
        }

        return true;
    }

    // rawTx and parentNodes are rlp encoded
    function relayTx(bytes rawTx, bytes path, bytes parentNodes, bytes headerBytes, address targetAddr) payable {
        require(_valueInTrieIndex(rawTx, path, parentNodes, headerBytes, 4));
        require(msg.value >= relayPrice);

        Target t = Target(targetAddr);
        t.processTransaction(rawTx);
    }

    // receipt and parentNodes are rlp encoded
    function relayReceipt(bytes receipt, bytes path, bytes parentNodes, bytes headerBytes, address targetAddr) payable {
        require(_valueInTrieIndex(receipt, path, parentNodes, headerBytes, 5));
        require(msg.value >= relayPrice);

        Target t = Target(targetAddr);
        t.processReceipt(receipt);
    }

    // account and parentNodes are rlp encoded
    function relayAccount(bytes account, bytes path, bytes parentNodes, bytes headerBytes, address targetAddr) payable {
        require(_valueInTrieIndex(account, path, parentNodes, headerBytes, 3));
        require(msg.value >= relayPrice);

        Target t = Target(targetAddr);
        t.processAccount(account);
    }

    // value and parentNodes are rlp encoded
    function _valueInTrieIndex(bytes value, bytes encodedPath, bytes parentNodes, bytes headerBytes, uint8 trieIndex) private constant returns (bool) {
        bytes32 blockHash = sha3(headerBytes);

        if(sha3(headerBytes) != blockHash) {return false;}
        if(rbchain[blockHash] == 0) {return false;}

        RLP.RLPItem[] memory rlpH = RLP.toList(RLP.toRLPItem(headerBytes));
        bytes32 txRoot = RLP.toBytes32(rlpH[trieIndex]);

        if(!trieValue(value, encodedPath, parentNodes, txRoot)) {return false;}

        return true;
    }

    function trieValue(bytes value, bytes encodedPath, bytes parentNodes, bytes32 root) constant returns (bool) {
        return MerklePatriciaProof.verify(value, encodedPath, parentNodes, root);
    }

    function burn(uint256 _value) {
        uint reward = rb20.burn(msg.sender, _value, this.balance);
        require(msg.sender.send(reward));
    }
    function mint() private {
        rb20.mint(msg.sender);
    }

}


