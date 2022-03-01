(function () {
	
	function toDataURL(url, callback) {
	  var xhr = new XMLHttpRequest();
	  xhr.onload = function() {
		var reader = new FileReader();
		reader.onloadend = function() {
		  callback(reader.result);
		}
		reader.readAsDataURL(xhr.response);
	  };
	  xhr.open('GET', url);
	  xhr.responseType = 'blob';
	  xhr.send();
	}

	function processMessage(ele, wss=true){

	  if(ele.hasAttribute("is-deleted")) {
		return;
	  }
	  
	  var chatmessage = "";
	  var chatname = "";
	  var chatimg = "";
	  
	  try{
		chatname = ele.querySelector("#author-name").innerText;
	  } catch(e){}
	  
	  if (!textOnlyMode){
		  try{
			chatmessage = ele.querySelector("#message").innerHTML;
		  } catch(e){}
	  } else {
		  try{
			var cloned = ele.querySelector("#message").cloneNode(true);
			var children = cloned.querySelectorAll("[alt]");
			for (var i =0;i<children.length;i++){
				children[i].outerHTML = children[i].alt;
			}
			var children = cloned.querySelectorAll('[role="tooltip"]');
			for (var i =0;i<children.length;i++){
				children[i].outerHTML = "";
			}
			chatmessage = cloned.innerText;
		  } catch(e){}
	  }
	  
	  try{
		chatimg = ele.querySelector("#img").src;
		if (chatimg.startsWith("data:image/gif;base64") || (ele.getAttribute("author-type")=="owner")){
			chatimg = document.querySelector("#panel-pages").querySelector("#img").src; // this is the owner
		}
		chatimg = chatimg.replace("=s32-", "=s128-");
		chatimg = chatimg.replace("=s64-", "=s128-");
	  } catch(e){}
	  
	  var chatdonation = "";
	  try{
		chatdonation = ele.querySelector("#purchase-amount").innerHTML;
	  } catch(e){}
	  
	  var chatmembership = "";
	  try{
		chatmembership = ele.querySelector(".yt-live-chat-membership-item-renderer #header-subtext").innerHTML;
	  } catch(e){}
	  
	  var chatsticker = "";
	  try{
		chatsticker = ele.querySelector(".yt-live-chat-paid-sticker-renderer #img").src;
	  } catch(e){}
	  
	  if (chatsticker) {
		chatdonation = ele.querySelector("#purchase-amount-chip").innerHTML;
	  }

	  var chatbadges = "";
	  try{
		chatbadges = ele.querySelector("#chat-badges .yt-live-chat-author-badge-renderer img").parentNode.innerHTML;
	  } catch(e){}
	  

	  var hasDonation = '';
	  if (chatdonation) {
		hasDonation = chatdonation
	  }

	  var hasMembership = '';
	  
	  if (chatmembership) {
		  if (chatmessage){
			  hasMembership = '<div class="donation membership">MEMBER CHAT</div>';
		  } else {
			hasMembership = '<div class="donation membership">NEW MEMBER!</div>';
			chatmessage = chatmembership;
		  }
	  }

	  if (chatsticker) {
		chatmessage = '<img src="'+chatsticker+'">';
	  }
	  
	  var backgroundColor = "";
	  
	  var textColor = "";
	  if (ele.style.getPropertyValue('--yt-live-chat-paid-message-primary-color')) {
		backgroundColor = "background-color: "+ele.style.getPropertyValue('--yt-live-chat-paid-message-primary-color')+";";
		textColor = "color: #111;";
	  }

	  if (ele.style.getPropertyValue('--yt-live-chat-sponsor-color')) {
		backgroundColor = "background-color: "+ele.style.getPropertyValue('--yt-live-chat-sponsor-color')+";";
		textColor = "color: #111;";
	  }

	  var data = {};
	  data.chatname = chatname;
	  data.chatbadges = chatbadges;
	  data.backgroundColor = backgroundColor;
      data.textColor = textColor;
	  data.chatmessage = chatmessage;
	  data.chatimg = chatimg;
	  data.hasDonation = hasDonation;
	  data.hasMembership = hasMembership;
	  data.type = "youtube";
	  
		if (data.chatimg){
			toDataURL(data.chatimg, function(dataUrl) {
				data.chatimg = dataUrl;
				try {
					chrome.runtime.sendMessage(chrome.runtime.id, { "message": data }, function(){});
				} catch(e){}
			});
		} else {
			try {
				chrome.runtime.sendMessage(chrome.runtime.id, { "message": data }, function(){});
			} catch(e){}
		}
	}

	chrome.runtime.onMessage.addListener(
		function (request, sender, sendResponse) {
			try{
				if ("focusChat" == request){
					document.querySelector("div#input").focus();
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
			} catch(e){}
			sendResponse(false);
		}
	);

	var textOnlyMode = false;
	chrome.runtime.sendMessage(chrome.runtime.id, { "getSettings": true }, function(response){  // {"state":isExtensionOn,"streamID":channel, "settings":settings}
		if ("settings" in response){
			if ("textonlymode" in response.settings){
				textOnlyMode = response.settings.textonlymode;
			}
		}
	});  /////

	function onElementInserted(containerSelector, callback) {
		var onMutationsObserved = function(mutations) {
			mutations.forEach(function(mutation) {
				if (mutation.addedNodes.length) {
					for (var i = 0, len = mutation.addedNodes.length; i < len; i++) {
						if (mutation.addedNodes[i].tagName == "yt-live-chat-text-message-renderer".toUpperCase()) {
							callback(mutation.addedNodes[i]);
						} else if (mutation.addedNodes[i].tagName == "yt-live-chat-paid-message-renderer".toUpperCase()) {
							callback(mutation.addedNodes[i]);
						} else if (mutation.addedNodes[i].tagName == "yt-live-chat-membership-item-renderer".toUpperCase()) {
							callback(mutation.addedNodes[i]);
						} else if (mutation.addedNodes[i].tagName == "yt-live-chat-paid-sticker-renderer".toUpperCase()) {
							callback(mutation.addedNodes[i]);
						}
					}
				}
			});
		};
		var target = document.querySelectorAll(containerSelector)[0];
		if (!target){return;}
		var config = { childList: true, subtree: true };
		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
		var observer = new MutationObserver(onMutationsObserved);
		observer.observe(target, config);
	}

	onElementInserted("yt-live-chat-app", function(element){
	  processMessage(element, false);
	});
})();