var rbrelay = artifacts.require("./rbrelay.sol");

contract('rbrelay', function(accounts) {
  let rb
  rbrelay.deployed().then(function(instance) {
    rb = instance;
  }).catch(function(e) {
    throw new Error(e);
  })

  it("should store 0th block header", function() {
    return rb.storeBlockHeader("0x0000000000000000000000000000000000000000000000000000000000000000","0x53580584816f617295ea26c0e17641e0120cab2f0a8ffb53a866fd53aa8e8c2d","0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421","0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",0,"0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000",0,"0x468299f8ae3ca255b24078c25564581d49f5ead8fcdfbdc9f1bdce0fd699494e","0x6341fd3daf94b748c72ced5a5b26028f2474f5f00d824504e4fa37a75767e177").then(function() {
      return rb.rbchain.call(0)
    }).then(function(data) {
      console.log(data)
      //Should compare the data here to the input
    })
  })

  it("should store 1th block header", function() {
    return rb.storeBlockHeader("0x6341fd3daf94b748c72ced5a5b26028f2474f5f00d824504e4fa37a75767e177","0x53580584816f617295ea26c0e17641e0120cab2f0a8ffb53a866fd53aa8e8c2d","0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421","0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",1,"0x9f1efa1efa72af138c915966c639544a0255e6288e188c22ce9168c10dbe46da","0x3d88b4aa065930119fb886210bf01a084fde5d3bc48d8aa38bca92e4fcc52151",27,"0xa8ef7c23baf9d1faa6bef2ec1af780c67beae4712fdc96f01574d1db42b06737","0xa7684ac44d48494670b2e0d9085b7750e7341620f0a271db146ed5e70c1db854").then(function() {
      return rb.rbchain.call(1)
    }).then(function(data) {
      console.log(data)
      //Should compare the data here to the input
    })
  })

})
