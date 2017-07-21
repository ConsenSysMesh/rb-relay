pragma solidity ^0.4.11;

library rlpEncode {
	function encodeString(bytes str) internal constant returns (bytes) {
        uint len = str.length;
        uint lenLen = 1;
	    uint i = 0x100;
	    while(len/i != 0) {
	        lenLen++;
	        i *= 0x100;
	    }
        bytes memory encoded;
        if(len == 1 && uint(str[0]) < 0x80) {
            encoded = new bytes(1);
            encoded = str;
        } else {
        	encoded = encode(str, len, lenLen, 0x80, 0xb7);
		}
        return encoded;
    }
    
    function encodeList(bytes[] _list) internal constant returns (bytes) {
        uint len = _list.length;
        uint lenLen;
        uint i = 0x1;
	    while(len/i != 0) {
	        lenLen++;
	        i *= 0x100;
	    }
	    bytes memory list = flatten(_list);
	    bytes memory encoded = encode(list, len, lenLen, 0xc0, 0xf7);
        return encoded;
    }

    function encode(bytes b, uint len, uint lenLen, uint8 prefix1, uint8 prefix2) private constant returns (bytes) {
    	bytes memory encoded;
        if(len <= 55) {
		    encoded = new bytes(len+1);
		    encoded[0] = byte(prefix1+len);
		    for(uint i=1; i<encoded.length; i++) {
		        encoded[i] = b[i-1];
		    }
        } else {
		    encoded = new bytes(len+1+lenLen);
		    encoded[0] = byte(prefix2+lenLen);
		    for(i=1; i<=lenLen; i++) {
		        encoded[i] = byte((len/(0x100**(lenLen-i)))%(0x100**(lenLen-i)));
		    }
		    for(i=lenLen+1; i<encoded.length; i++) {
		        encoded[i] = b[i-1];
		    }
        }
        return encoded;
    }
    
    function flatten(bytes[] list) private constant returns (bytes) {
        bytes memory flattened;
        for(uint i=0; i<list.length; i++) {
            for(uint j=0; j<list[i].length; j++) {
                flattened[i*list[i].length + j] = list[i][j];
            }
        }
        return flattened;
    }
}