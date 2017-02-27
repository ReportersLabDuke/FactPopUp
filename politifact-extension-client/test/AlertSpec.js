describe("alert.js", function() {
  
  beforeEach(function() {
  });
	
  describe("when splitting the connection string", function() {
    //beforeAll(function () {
    //var originalUri = "", targetUri = "", endpoint = "", sasKeyName = "", sasKeyValue = "", sasToken = "";
    //TODO: replace connection string value with spy for keys.js
    var hubName = "FactPopUpHub", testAzureConnectionString = "Endpoint=sb://xxxxxxxxxx.servicebus.windows.net/;SharedAccessKeyName=DefaultListenSharedAccessSignature;SharedAccessKey=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    splitConnectionString(testAzureConnectionString);
     
    it("should properly extract the endpoint url", function() {
      expect(endpoint).toBe('https' + "://xxxxxxxxxx.servicebus.windows.net/");
    });
    
    it("should properly extract the sasKeyName", function() {
      expect(sasKeyName).toBe("DefaultListenSharedAccessSignature");
    });
    
    it("should properly extract the sasKeyValue", function() {
      expect(sasKeyValue).toBe("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    });
    
    
  });

  describe("when generating the sas token", function() {
    beforeAll(function() {
      spyOn(CryptoJS, 'HmacSHA256').and.callThrough();
    });
    
    generateSaSToken();
    
    it("should call CryptoJS.HmacSHA256", function() {
      expect(CryptoJS.HmacSHA256).toHaveBeenCalled();
      
    });
    
  });
  
  describe("when registering with Notification Hubs", function () {
    beforeAll(function () {
      spyOn(XMLHttpRequest.prototype, open);
      spyOn(XMLHttpRequest.prototype, send);
	  spyOn(XMLHttpRequest.prototype, setRequestHeader);
      
    });
    
    sendNHRegistrationRequest();
	
	it("should have set the request headers", function () {
		expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledTimes(3);
	});
    
    it("should send a web request", function () {
      expect(XMLHttpRequest.prototype.open).toHaveBeenCalled();
      expect(XMLHttpRequest.prototype.send).toHaveBeenCalled();
    });
  });
 
});
