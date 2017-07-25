/*
 * @title RLPEncoder
 * @author Sam Mayo (sammayo888@gmail.com)
 *
 * @dev Library for rlp encoding arbitrary bytes or lists.
 */

import "./strings.sol";

library rlpEncode {
    using strings for *;

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
    	bytes memory encoded;

    	uint len = self.length;
        uint lenLen;
        uint i = 0x1;
	    while(len/i != 0) {
	        lenLen++;
	        i *= 0x100;
	    }

        if(len <= 55) {
		    encoded = new bytes(len+1);
		    encoded[0] = byte(prefix1+len);
		    for(i=1; i<encoded.length; i++) {
		        encoded[i] = self[i-1];
		    }
        } else {
        	// 1 is the length of the length of the length
		    encoded = new bytes(1+lenLen+len);
		    encoded[0] = byte(prefix2+lenLen);
		    for(i=1; i<=lenLen; i++) {
		        encoded[i] = byte((len/(0x100**(lenLen-i)))%0x100);
		    }
		    for(i=lenLen+1; i<encoded.length; i++) {
		        encoded[i] = self[i-lenLen-1];
		    }
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

        strings.slice[] memory slices = new strings.slice[](len);
        for(i=0; i<self.length; i++) {
            slices[i] = string(self[i]).toSlice();
        }

        bytes memory flattened = new bytes(len);

        uint pointer;
        for(i=0; i<self.length; i++) {
            for(uint j=0; j<self[i].length; j++) {
                flattened[pointer] = self[i][j];
                pointer++;
            }
        }
        return flattened;
    }
}