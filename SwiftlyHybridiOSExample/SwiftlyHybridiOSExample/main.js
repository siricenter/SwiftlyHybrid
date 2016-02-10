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

var theURL = 'http://ec2-54-152-204-90.compute-1.amazonaws.com'
var theURL = 'https://www.google.com/'

// set the root domain location for development, stage, or production
var sysRoot = 'staging'

var servicesRoot = ''
if (sysRoot == 'local') {
    servicesRoot = 'http://localhost/f5admin/services/'
} else if (sysRoot == 'staging') {
    servicesRoot = 'http://ec2-54-152-204-90.compute-1.amazonaws.com/services'
} else if (sysRoot == 'prod') {
    servicesRoot = 'https://www.f5admin.com/services/'
} else {
    var rootError = 'Code location specified incorrectly'
}

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
//    native.postMessage(message)
}

var displayError = function() {
    for (var i = 0; i < 4; i++) {
        document.querySelectorAll(".req_fields")[i].style.display = "block";
    }
}

function confirmPurchase() {
    message = {"cmd":"log", "string":"does this confirm button work?"}
    native.postMessage(message)
    document.querySelector(".req_fields").style.display = "none";
    var message = ""
    var purchaseBtn = document.querySelector("#purchase-btn")
    var processingBtn = document.querySelector("#processing-btn")
    var email = document.querySelector("#email").value
    var confEmail = document.querySelector("#confEmail").value
    var password = document.querySelector("#password").value
    var confirmPwd = document.querySelector("#confirmPwd").value
    
    message = {"cmd":"log", "string": "email contents outside: " + email}
    native.postMessage(message)
    // TODO: error handling for incorrect user input
    //do a local pw confirm here
    //if fails, don't continue
    if (email && confEmail && password && confirmPwd) {
        if (confirmPwd == password && confEmail == email) {
            //{"name":username, "mail":email, "pass":password}
            
            purchaseBtn.style.display = "none"
            processingBtn.style.display = "block"

            message = {"cmd":"requestMonthlyPurchase", "callbackFunc":function(responseAsJSON){//responseAsJSON is what we get back from swift
                var purchaseResponse = JSON.parse(responseAsJSON)
                //document.querySelector("#messages_from_swift").innerText = "Count is "+purchaseResponse
                
                // just testing if callback is getting called
                
                //do ajax on success to setup user on PHP server
                
                // do ajax, on success setup user on PHP server
                var xhr = new XMLHttpRequest()
                var postUrl = servicesRoot + '/sec.php/'
                
                message = {"cmd":"log", "string": "email contents inside: " + email}
                native.postMessage(message)
                message = {"cmd":"log", "string": "email contents: " + purchaseResponse.value}
                native.postMessage(message)
                
                xhr.onreadystatechange = function() {
                    message = {"cmd":"log", "string": "inside onreadystatechange " + xhr.readyState + " " + xhr.status}
                    native.postMessage(message)
                    
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        message = {"cmd":"log", "string": "works! onreadystatechange " + xhr.readyState + " " + xhr.status}
                        var acctcreateResponse = JSON.parse(xhr.responseText);
                        
                        if (!acctcreateResponse.errmsg) {
                            message = {"cmd":"displayApp", "string": "Ready to display app " + xhr.responseText		 }
                            native.postMessage(message)
                            //acctcreateCallback(acctcreateResponse);
                        } else {
                            message = {"cmd":"log", "string": "Error from sec.php: " + acctcreateResponse.errmsg}
                            native.postMessage(message)
                        }
                    }
                    

                }
                xhr.open("POST", postUrl, true)
                xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
                
                var readyState = xhr.readyState
                message = {"cmd":"log", "string": "outside onreadystatechange " + readyState + " " + xhr.status}
                native.postMessage(message)

                
                //TODO: find out what to put in place of the term variable for a month term.
                //TODO: Find out what to replace the "stripetoken" variable with.
                //TODO: Might need to wrap the call back in an actual function and only sent the function name
//                var data = "hello world!"

//                var data = JSON.stringify({"called":"sec",
//                                          "params":{
//                                          "sentdata":[{
//                                                      "lgs": "app",
//                                                      "username": email,
//                                                      "email": email,
//                                                      "password": password,
//                                                      "promocode":"",
//                                                      "term": "1",
//                                                      "stripetoken": "applegoogleToken",
//                                                      "req": "acctcreate"
//                                                      }]}})
                
                var data = JSON.stringify({"sentdata": [{
                                                        "username": email.value,
                                                        "email": email.value,
                                                        "password": password.value,
                                                        "promocode":"",
                                                        "term": "1",
                                                        "stripetoken": "applegoogleToken",
                                                        "req": "acctcreate"
                                                        }]})
                document.querySelector("#test").innerText = email.value + " " + password.value
                
                message = {"cmd":"log", "string": "email after data def: " + data}
                native.postMessage(message)

                
                xhr.send(data)
                
                
                
                //then reset the url of the webview to your php server
                //document.querySelector("#test").innerText = window.location
            }.toString()}
        } else {
            message = {"cmd":"log", "string":"Email or passwords do not match"}
            document.querySelector("#login_error").innerText = "* Email or passwords do not match"
            //				document.querySelector(".req_fields").style.display = "block"
            displayError()
        }
    } else {
        message = {"cmd":"log", "string":"Required fields must be entered"}
        document.querySelector("#login_error").innerText = "* Required fields must be entered"
        //			document.querySelector(".req_fields").style.display = "block"
        displayError()
    }
//    var messageAsString = JSON.stringify(message)
    native.postMessage(message)
}

// callback function that runs after creating the user in sec.php
//function acctcreateCallback(data){
    // body of the callback after user has been created
    // TODO: check the data object returned from sec.php to see if everything went well
    
    // if everything is good send the user on to the app webview
    // replacePageWithURL("http://ec2-54-152-204-90.compute-1.amazonaws.com/app/")
//}

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
