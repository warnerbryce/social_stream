(function () {
	function pushMessage(data){	  
		try {
			chrome.runtime.sendMessage(chrome.runtime.id, { "message": data }, function(e){});
		} catch(e){}
	}

	function toDataURL2(blobUrl, callback) {
		var xhr = new XMLHttpRequest;
		xhr.responseType = 'blob';

		xhr.onload = function() {
		   var recoveredBlob = xhr.response;

		   var reader = new FileReader;

		   reader.onload = function() {
			 callback(reader.result);
		   };

		   reader.readAsDataURL(recoveredBlob);
		};

		xhr.open('GET', blobUrl);
		xhr.send();
	};

	function errorlog(e){
		//console.error(e);
	}

	function processMessage(ele){
		
		var chatimg="";
		try{
			chatimg = document.querySelector(".ChatInfo>.Avatar>img.avatar-media").src;
			if (!chatimg){
				chatimg = "";
			} 
		} catch(e){errorlog(e);}
		
		try{
			if (!chatimg){
				chatimg = document.querySelector("#MiddleColumn").querySelector("div.Avatar>img");
			}
			if (!chatimg){
				chatimg = "";
			} 
		} catch(e){errorlog(e);}
		
		
		var chatname = "";
		var chatmessage = "";
		var contentimg = "";
		try{
			chatname = document.querySelector(".ChatInfo>.info>.title").innerText;
		} catch(e){errorlog(e);}
		try{
			chatmessage = ele.querySelector(".content-inner").innerText;
		} catch(e){errorlog(e);}
		try{
			contentimg = ele.querySelector(".media-inner").querySelector("img").src;
			if (!contentimg){
				contentimg = ele.querySelector(".content-inner").querySelector("img").src;
			}
		} catch(e){errorlog(e);}
	  
		var data = {};
		data.chatname = chatname;
		data.chatbadges = "";
		data.backgroundColor = "";
		data.textColor = "";
		data.chatmessage = chatmessage;
		data.chatimg = chatimg;
		data.hasDonation = "";
		data.hasMembership = "";;
		data.contentimg = contentimg;
		data.type = "telegram";
		
		if (!chatmessage && !contentimg){return;}
		
		if (data.contentimg && !data.contentimg.startsWith("https://")){ // data.contentimg
			toDataURL2(data.contentimg, function(dataUrl) {
				data.contentimg = dataUrl;
				if (data.chatimg && !data.chatimg.startsWith("https://")){
					toDataURL2(data.chatimg, function(dataUrl) {
						data.chatimg = dataUrl;
						pushMessage(data);
						return;
					});
					return;
				} else {
					pushMessage(data);
					return;
				}
				return;
			});
			return;
		} else {
			pushMessage(data);
			return;
		}
	  
		if (data.chatimg && !data.chatimg.startsWith("https://")){
			toDataURL2(data.chatimg, function(dataUrl) {
				data.chatimg = dataUrl;
				pushMessage(data);
				return;
			});
			return;
		} else {
			pushMessage(data);
			return;
		}
		return;
	}
	
	
	setInterval(function(){
		var xxx = document.querySelectorAll('div.message-list-item');
		for (var j = 0; j< xxx.length; j++){
			if (xxx[j].marked){continue;}
			xxx[j].marked = true;
			processMessage(xxx[j]);
		}
	},3000);

	var textOnlyMode = false;
	chrome.runtime.sendMessage(chrome.runtime.id, { "getSettings": true }, function(response){  // {"state":isExtensionOn,"streamID":channel, "settings":settings}
		if ("settings" in response){
			if ("textonlymode" in response.settings){
				textOnlyMode = response.settings.textonlymode;
			}
		}
	});

	chrome.runtime.onMessage.addListener(
		function (request, sender, sendResponse) {
			try{
				if ("focusChat" == request){
					if (!document.querySelector('.public-DraftEditorPlaceholder-inner')){
						sendResponse(false);
						return;
					}
					document.querySelector(".public-DraftEditorPlaceholder-inner").focus();
					sendResponse(true);
					return;
				}
				if ("textOnlyMode" == request){
					textOnlyMode = true;
					sendResponse(true);
					return;
				} else if ("richTextMode" == request){
					textOnlyMode = false;
					sendResponse(true);
					return;
				}
			} catch(e){	}
			
			sendResponse(false);
		}
	);

	
})();