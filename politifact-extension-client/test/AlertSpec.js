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
	  this.server = sinon.fakeServer.create();
	  
	  this.xhr = sinon.useFakeXMLHttpRequest();
	  var requests = this.requests = [];

	  this.xhr.onCreate = function (xhr) {
		requests.push(xhr);
	  };
		
      spyOn(XMLHttpRequest.prototype, open);
      spyOn(XMLHttpRequest.prototype, send);
	  spyOn(XMLHttpRequest.prototype, setRequestHeader);
      
	  var registrationResponse = 
	  `<entry>
		<id>https://xxxxxxxxxx.servicebus.windows.net/xxxxxxxxxx/registrations/{registrationId}</id>
		<title type="text"> /xxxxxxxxxx/registrations/FAKEREGID</title>
		<updated>2012-08-17T17:32:00Z</updated>
		<metadata:etag>{weak Etag}</metadata:etag>
		<content type="application/xml">
		<WindowsRegistrationDescription xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.microsoft.com/netservices/2010/10/servicebus/connect">
			<ETag>{ETag}</ETag>
			<ExpirationTime>2012-07-16T19:20+01:00</ExpirationTime>
			<RegistrationId>FAKEREGID</RegistrationId>
				<ChannelUri>{ChannelUri}</ChannelUri>
			</WindowsRegistrationDescription>
		</content>
	  </entry>`
    });
    
    sendNHRegistrationRequest(processNHRegistrationResponse);
	
	it("should have set the request headers", function () {
		expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledTimes(3);
	});
    
    it("should send a web request", function () {
      expect(XMLHttpRequest.prototype.open).toHaveBeenCalled();
      expect(XMLHttpRequest.prototype.send).toHaveBeenCalled();
	  expect(this.requests.length).toEqual(1);
    });
	
	afterAll(function () {
	  this.server.restore();
	  this.xhr.restore();
	});
  });
 
});
