/*
 * @title RLPEncoder
 * @author Sam Mayo (sammayo888@gmail.com)
 *
 * @dev Library for rlp encoding arbitrary bytes or lists.
 */

library rlpEncode {
    /*
     * @dev Returns an rlp encoded string.
     * @param self The bytes to be encoded.
     * @return The encoded bytes.
     */
	function encodeBytes(bytes memory self) internal constant returns (bytes) {
        bytes memory encoded;
        if(self.length == 1 && uint(self[0]) < 0x80) {
            encoded = new bytes(1);
            encoded = self;
        } else {
        	encoded = encode(self, 0x80, 0xb7);
		}
        return encoded;
    }
    
    /*
     * @dev Returns an rlp encoded bytes[].
     * @param self The bytes[] to be encoded.
     * @return The encoded bytes[].
     */
    function encodeList(bytes[] memory self) internal constant returns (bytes) {
    	bytes memory list = flatten(self);
	    bytes memory encoded = encode(list, 0xc0, 0xf7);
        return encoded;
    }

    function encode(bytes memory self, uint8 prefix1, uint8 prefix2) private constant returns (bytes) {
    	uint selfPtr;
        assembly { selfPtr := add(self, 0x20) }

        bytes memory encoded;
        uint encodedPtr;

    	uint len = self.length;
        uint lenLen;
        uint i = 0x1;
	    while(len/i != 0) {
	        lenLen++;
	        i *= 0x100;
	    }

        if(len <= 55) {
		    encoded = new bytes(len+1);

            // length encoding byte
		    encoded[0] = byte(prefix1+len);

            // string/list contents
            assembly { encodedPtr := add(encoded, 0x21) }
            memcpy(encodedPtr, selfPtr, len);
        } else {
        	// 1 is the length of the length of the length
		    encoded = new bytes(1+lenLen+len);

            // length of the length encoding byte
		    encoded[0] = byte(prefix2+lenLen);

            // length bytes
            bytes memory lenBytes = new bytes(lenLen);
            // uint lenPtr;
            assembly {
                encodedPtr := add(encoded, 0x21)
                // lenPtr := add(lenBytes, 0x20)

                // mstore(lenPtr, len)
            }
            // memcpy(encodedPtr, lenPtr, lenLen);
		    for(i=1; i<=lenLen; i++) {
		        encoded[i] = byte((len/(0x100**(lenLen-i)))%0x100);
		    }

            // string/list contents
            assembly { encodedPtr := add(encodedPtr, lenLen) }
            memcpy(encodedPtr, selfPtr, len);
        }
        return encoded;
    }
    
    function flatten(bytes[] memory self) private constant returns (bytes) {
        if(self.length == 0) {
            return new bytes(0);
        }

        uint len;
    	for(uint i=0; i<self.length; i++) {
    		len += self[i].length;
        }

        bytes memory flattened = new bytes(len);
        uint flattenedPtr;
        assembly { flattenedPtr := add(flattened, 0x20) }

        for(i=0; i<self.length; i++) {
            bytes memory item = self[i];
            
            uint selfPtr;
            assembly { selfPtr := add(item, 0x20)}

            memcpy(flattenedPtr, selfPtr, item.length);
            flattenedPtr += self[i].length;
        }

        return flattened;
    }

    /*
     * String & slice utility library for Solidity contracts.
     * @author Nick Johnson <arachnid@notdot.net>
     */

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