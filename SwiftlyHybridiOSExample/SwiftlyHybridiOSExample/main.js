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
function sendCount(){
    
    var message = {"cmd":"increment","count":clicks,"callbackFunc":function(responseAsJSON){
        var response = JSON.parse(responseAsJSON)
        clicks = response['count']
        document.querySelector("#messages_from_swift").innerText = "Count is "+clicks
    }.toString()}
    native.postMessage(message)
}

// Load data from iTunes
window.onload = function() {
    var message = {"cmd": "onload"}
    native.postMessage(message)
}

function confirmPurchase(){
    
    
    var username = document.querySelector("#username").value
    var email = document.querySelector("#email").value
    var password = document.querySelector("#password").value
    var confirmPwd = document.querySelector("#confirmPwd").value
    // TODO: error handling for incorrect user input
    //do a local pw confirm here
    //if fails, don't continue
    
    var message = {"cmd":"requestMonthlyPurchase","block":"on","userinfo":{"name":username, "mail":email, "pass":password}, "callbackFunc":function(responseAsJSON){//responseAsJSON is what we you back from swift
        var purchaseResponse = JSON.parse(responseAsJSON)
        //document.querySelector("#messages_from_swift").innerText = "Count is "+purchaseResponse
        //do ajax on success to setup user on PHP server
        
        //then reset the url of the webview to your php server
//        window.location = "http://www.apple.com/"
        document.querySelector("#test").innerText = window.location
    }.toString()}
    native.postMessage(message)
}

function restorePurchase() {
    var message = {"cmd": "restorePurchases"}
    native.postMessage(message)
}