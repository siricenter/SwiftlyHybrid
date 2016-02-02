/*
 The MIT License (MIT)
 
 Copyright (c) 2015 Lee Barney
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

//you can put your regular JavaScript code in this file or any other.

var clicks = 0

var theURL = "https://www.google.com/"

function sendCount(){
    /*toString MUST be called on the callbackFunc function object or the
     *JSON library will strip the function out of the message.
     *This means that named or anonymous functions can be used but anonymous functions
     *can not be treated as closures. The do will retain scope information for later execution.
     *The anonymous function will not 'capture' values from the scope of the containing function.
     */
    var message = {"cmd":"increment","count":clicks,"callbackFunc":function(responseAsJSON){
        
        var response = JSON.parse(responseAsJSON)
        clicks = response['count']
        document.querySelector("#messages_from_java").innerText = "Count is "+clicks
    }.toString()
    }
    var messageAsString = JSON.stringify(message)
    native.postMessage(messageAsString)
    
}

window.onload = function() {
    // get the sub information from Google Play
    //replacePageWithURL("http://ec2-54-152-204-90.compute-1.amazonaws.com/app/")
    //replacePageWithURL("https://www.google.com")
    var message = {"cmd":"onload", "callbackFunc":function(responseAsJSON){
        
//        var response = JSON.parse(responseAsJSON)
//        var token = (response['token'] != null ? "isNotNull" : null)
//        document.getElementById("test").innerText = response['token']
//        if (token != null) {
//            replacePageWithURL(theURL)
//        }
    }.toString()
    }
//    var messageAsString = JSON.stringify(message)
    native.postMessage(message)
}

var displayError = function() {
    for (var i = 0; i < 4; i++) {
        document.querySelectorAll(".req_fields")[i].style.display = "block";
    }
}

function confirmPurchase() {
    document.querySelector(".req_fields").style.display = "none";
    var message = ""
    var email = document.querySelector("#email").value
    var confEmail = document.querySelector("#confEmail").value
    var password = document.querySelector("#password").value
    var confirmPwd = document.querySelector("#confirmPwd").value
    // TODO: error handling for incorrect user input
    //do a local pw confirm here
    //if fails, don't continue
    if (email && confEmail && password && confirmPwd) {
        if (confirmPwd == password && confEmail == email) {
            //{"name":username, "mail":email, "pass":password}
            
            message = {"cmd":"requestMonthlyPurchase","userinfo":{"email":email, "pass":password}, "callbackFunc":function(responseAsJSON){//responseAsJSON is what we you back from swift
                var purchaseResponse = JSON.parse(responseAsJSON)
                //document.querySelector("#messages_from_swift").innerText = "Count is "+purchaseResponse
                
                //do ajax on success to setup user on PHP server
                
                
                //					replacePageWithURL(theURL)
                // replacePageWithURL("http://ec2-54-152-204-90.compute-1.amazonaws.com/app/")
                
                
                //then reset the url of the webview to your php server
                document.querySelector("#test").innerText = window.location
            }.toString()}
        } else {
            message = {"cmd":"errorMsg", "msg":"Email or passwords do not match"}
            document.querySelector("#login_error").innerText = "* Email or passwords do not match"
            //				document.querySelector(".req_fields").style.display = "block"
            displayError()
        }
    } else {
        message = {"cmd":"errorMsg", "msg":"Required fields must be entered"}
        document.querySelector("#login_error").innerText = "* Required fields must be entered"
        //			document.querySelector(".req_fields").style.display = "block"
        displayError()
    }
//    var messageAsString = JSON.stringify(message)
    native.postMessage(message)
}

function replacePageWithURL(aURL){
    if(aURL){
        if(navigator.userAgent.match(/Android/i)) {
            var loadMessage = {"cmd":"load_page","url":aURL}
            var messageAsString = JSON.stringify(loadMessage)
            native.postMessage(messageAsString)
        } else{
            window.location = aURL
        }
    }
}
