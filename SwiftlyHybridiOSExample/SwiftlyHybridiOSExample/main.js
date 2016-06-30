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
//var currentURL = 'https://www.f5admin.com/app'
var currentURL = 'http://ec2-54-152-204-90.compute-1.amazonaws.com/app'

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
    message = {"cmd":"log", "string":"JS onload()" }
    native.postMessage(message)
    
    // check if there was a purchase error
    var message = {"cmd":"onload", "callbackFunc":function(responseAsJSON){
        response = JSON.parse(responseAsJSON)
        
        message = {"cmd":"log", "string":"JS purchaseERROR:" + response['purchaseError']}
        native.postMessage(message)
        
        if (response['purchaseError'] == "true") {
            document.querySelector("#login_error").innerText = "* Purchase Error Try again"
            var email = response['user_email']
            message = {"cmd":"log", "string":"JS purchaseERROR user_email:" + email}
            native.postMessage(message)
            
            // delete user from our DB
            var xhr = new XMLHttpRequest()
            var postUrl = servicesRoot + '/sec.php/'
            
            xhr.onreadystatechange = function() {
                message = {"cmd":"log", "string": "Delete inside onreadystatechange " + xhr.readyState + " " + xhr.status}
                native.postMessage(message)
                
                if (xhr.readyState == 4 && xhr.status == 200) {
                    message = {"cmd":"log", "string": "Delete works! onreadystatechange " + xhr.readyState + " " + xhr.status}
                    native.postMessage(message)
                    var acctcreateResponse = JSON.parse(xhr.responseText);
                    
                    if (!acctcreateResponse.errmsg) {
                        message = {"cmd":"log", "string": "response stuff: " + acctcreateResponse.user_id}
                        native.postMessage(message)

                    } else {
                        message = {"cmd":"log", "string": "Error from sec.php: " + acctcreateResponse.errmsg}
                        native.postMessage(message)
                    }
                }
                
                
            }
            
            xhr.open("POST", postUrl, true)
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
            
            var data = JSON.stringify({"sentdata": [{
                                                    "username": email,
                                                    "email": email,
                                                    "promocode":"",
                                                    "term": "1",
                                                    "stripetoken": "applegoogleToken",
                                                    "req": "reg_deleteuser"
                                                    }]})
            
            xhr.send(data)
        } else {
            // do nothing
        }}.toString()
    }
    var messageAsString = JSON.stringify(message)
    native.postMessage(message)
}

var displayError = function() {
    for (var i = 0; i < 4; i++) {
        document.querySelectorAll(".req_fields")[i].style.display = "block";
    }
}

function restorePurchases() {
    message = {"cmd":"log", "string":"JS restorePurchases()"}
    native.postMessage(message)
    
    message = {"cmd":"restorePurchases", "callbackFunc":function(responseAsJSON){
        var response = JSON.parse(responseAsJSON);
        
        message = {"cmd":"log", "string":"restorePurchases() callback: " + response['restore']}
        native.postMessage(message)
        
//        replacePageWithURL('http://ec2-54-152-204-90.compute-1.amazonaws.com/app')
        replacePageWithURL(currentURL)
    }.toString()
    }
    native.postMessage(message)
}
function displayLogin() {
    message = {"cmd":"display_login", "string":"", "callbackFunc":function(responseAsJSON){
//        var response = JSON.parse(responseAsJSON)
//        if (response['login_error'] == "Reg") {
//            document.querySelector("#login_error").innerText = "* Please Sign Up"
//            
//        } else if (response['login_error'] == "Renew") {
//            document.querySelector("#renew_error").innerText = "* Your subscription has expired"
//            
//        }
    }.toString()}
    native.postMessage(message)
}

function displayRegister() {
    message = {"cmd":"display_register", "string":"", "callbackFunc":function(responseAsJSON){
    }.toString()}
    native.postMessage(message)
}

function setTerm(el) {
    var pricingOptions = el.parentElement.children;
    for (var i=0; i<pricingOptions.length; i++) {
        pricingOptions[i].style.backgroundColor = 'white';
        pricingOptions[i].style.color = '#2660AD';
    }
    el.style.backgroundColor = '#2660AD';
    el.style.color = 'white';
    var term = el.dataset.month;
    var renewBtn = document.getElementById('renew-btn');
    var purchaseBtn = document.getElementById('purchase-btn');
    if (renewBtn) {renewBtn.dataset.term = term;}
    if (purchaseBtn) {purchaseBtn.dataset.term = term;}
    message = {"cmd":"log", "string":"Check the term: " + term}
    native.postMessage(message)
}
//function renewPurchase(el) {
//}

function renewPurchase() {
    var renewBtn = document.querySelector("#renew-btn");
    var plan = renewBtn.dataset.term;
    
    if (plan == "1" || plan == "3" || plan == "12") {
        message = {"cmd":"log", "string":"Does the renew button work? Plan " + plan}
        native.postMessage(message)
        
        message = {"cmd":"requestMonthlyPurchase", "plan": plan, "renew":"true", "callbackFunc":function(responseAsJSON){
            message = {"cmd":"log", "string": "successCallback URL: " + currentURL}
            native.postMessage(message)
            
            // TODO: update user sub date in Firebase
            
            
            // load our webview
            replacePageWithURL(currentURL)
            
        }.toString()}
        native.postMessage(message)
    } else {
        message = {"cmd":"log", "string":"Purchase error sub not selected"}
        native.postMessage(message)
        
        document.querySelector("#renew_error").innerText = "* Please select a subscription period"
    }
}

function confirmLogin() {
    message = {"cmd":"log", "string":"does this confirm login button work?"}
    native.postMessage(message)
    var loginBtn = document.querySelector("#login-btn")
    var processingBtn = document.querySelector("#processing-btn")
    var email = document.querySelector("#email").value
    var password = document.querySelector("#password").value

    var error = document.querySelector("#login_error");
    
    loginBtn.style.display = "none"
    processingBtn.style.display = "block"

    if (email && password) {
        message = {"cmd":"login", "email": email, "password": password, "loginCallbackFunc":function(responseAsJSON){
            message = {"cmd":"log", "string":"Login response!!!!!!!!!!!!!!!!!!"}
            native.postMessage(message)
            
            var response = JSON.parse(responseAsJSON)
            var error = document.querySelector("#login_error");
            var login_error = response['login_error']
            var email = response['email']
            var password = response['pass']
            
            if (login_error == "reg_error") {
                error.innerText = "* No registration for this device"
            } else if (login_error == "exp_error") {
                error.innerText = "* Expired Subscription"
            } else if (login_error == "fb_error") {
                error.innerText = "* No Internet Connection. Please check connection and try again."
            }else if (login_error == "none") {
                var ePass = btoa(CryptoJS.AES.encrypt(password, "Frugler:dealzfordayz!"));
                
                message = {"cmd":"log", "string":"login: " + email + " " + password + " " + ePass}
                native.postMessage(message)
                
                replacePageWithURL(currentURL + "?email='" + email + "'&password='" + ePass + "'")
            }
        }.toString()}
        native.postMessage(message)
    } else {
        error.innerText = "* Please enter valid username and password."
    }
    loginBtn.style.display = "block"
    processingBtn.style.display = "none"
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
    var plan = purchaseBtn.dataset.term;
    
    message = {"cmd":"log", "string": "email contents outside: " + email + " plan: " + plan}
    native.postMessage(message)
    // TODO: error handling for incorrect user input
    //do a local pw confirm here
    //if fails, don't continue
    if (email && confEmail && password && confirmPwd) {
        if (confirmPwd == password && confEmail == email) {
            if (plan == "1" || plan == "3" || plan == "12") {
            //{"name":username, "mail":email, "pass":password}
            
            purchaseBtn.style.display = "none"
            processingBtn.style.display = "block"

            createAccount(email, password, function(email, ePass) {
                message = {"cmd":"requestMonthlyPurchase", "email": email, "ePass": ePass, "plan": plan, "callbackFunc":function(responseAsJSON){
                    // responseAsJSON is what we get back from swift
                    var response = JSON.parse(responseAsJSON)
                    
                    email = response['user_email']
                    ePass = response['ePass']
                    
                    message = {"cmd":"log", "string":"email = " + response['user_email'] + " password = " + response['ePass']}
                    native.postMessage(message)
                          
//                    message = {"cmd":"log", "string": "successCallback URL: " + "http://ec2-54-152-204-90.compute-1.amazonaws.com/app/?email='" + email + "'&password=" + ePass + "'"	}
                    message = {"cmd":"log", "string": "successCallback URL: " + currentURL + "?email='" + email + "'&password=" + ePass + "'"	}
                    native.postMessage(message)
                    // load our webview
//                    replacePageWithURL("http://ec2-54-152-204-90.compute-1.amazonaws.com/app/?email='" + email + "'&password='" + ePass + "'")
                    replacePageWithURL(currentURL + "?email='" + email + "'&password='" + ePass + "'")
                }.toString()}
                native.postMessage(message)
            }, function() {
                // handle the account creation fail
            	    // Potential reasons: duplicate email
                message = {"cmd":"log", "string":"User creation error"}
                document.querySelector("#login_error").innerText = "* User creation error (email already in use)"
                
                purchaseBtn.style.display = "block"
                processingBtn.style.display = "none"
            })
            } else {
                message = {"cmd":"log", "string":"Email or passwords do not match"}
                document.querySelector("#login_error").innerText = "* Please select a subscription period"
            }
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

function createAccount(email, password, successCallback, failureCallback) {

    // TODO: figure out how to keep the callback from being fired prematurely
    
    // do ajax, on success setup user on PHP server
    var xhr = new XMLHttpRequest()
    var postUrl = servicesRoot + '/sec.php/'
    
    message = {"cmd":"log", "string": "password contents inside: " + password}
    native.postMessage(message)
//    message = {"cmd":"log", "string": "password contents inside: " + password.value}
//    native.postMessage(message)
//    var CryptoJS = new Crypt();
    
    var ePass = btoa(CryptoJS.AES.encrypt(password, "Frugler:dealzfordayz!"));
    
    message = {"cmd":"log", "string": "password contents inside: " + ePass}
//    message = {"cmd":"log", "string": "password contents inside: " + password}
    native.postMessage(message)
    
    
    xhr.onreadystatechange = function() {
        message = {"cmd":"log", "string": "inside onreadystatechange " + xhr.readyState + " " + xhr.status}
        native.postMessage(message)
        
        if (xhr.readyState == 4 && xhr.status == 200) {
            message = {"cmd":"log", "string": "works! onreadystatechange " + xhr.readyState + " " + xhr.status}
            native.postMessage(message)
            var acctcreateResponse = JSON.parse(xhr.responseText);
            
            if (!acctcreateResponse.errmsg) {

                message = {"cmd":"log", "string": "response stuff: " + acctcreateResponse.user_id}
                native.postMessage(message)
                
//                message = {"cmd":"log", "string": "the URL: " + "http://ec2-54-152-204-90.compute-1.amazonaws.com/app/?email='" + email + "'&password=" + ePass + "'"	}
                message = {"cmd":"log", "string": "the URL: " + currentURL + "?email='" + email + "'&password=" + ePass + "'"	}
                native.postMessage(message)
//                message = {"cmd":"log", "string": "the URL: " + "http://ec2-54-152-204-90.compute-1.amazonaws.com/app/?email='" + email.value + "'&password=" + ePass + "'"	}
//                native.postMessage(message)
                
                // TODO: or get this to work
                successCallback(email, ePass)
                //replacePageWithURL("http://ec2-54-152-204-90.compute-1.amazonaws.com/app/?email='" + email + "'&password='" + ePass + "'")
            } else {
                message = {"cmd":"log", "string": "Error from sec.php: " + acctcreateResponse.errmsg}
                native.postMessage(message)
                failureCallback()
            }
        }
    }
    
    xhr.open("POST", postUrl, true)
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
    
    var readyState = xhr.readyState
    message = {"cmd":"log", "string": "outside onreadystatechange " + readyState + " " + xhr.status}
    native.postMessage(message)
    
    var data = JSON.stringify({"sentdata": [{
                                            "username": email,
                                            "email": email,
                                            "password": password,
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
        message = {"cmd":"log", "string": "What is the url: " + aURL}
        native.postMessage(message)
        if(navigator.userAgent.match(/Android/i)) {
            var loadMessage = {"cmd":"load_page","url":aURL}
            var messageAsString = JSON.stringify(loadMessage)
            native.postMessage(messageAsString)
        } else{
            window.location = aURL
            message = {"cmd":"log", "string": "iOS should be redirecting to: " + aURL}
            native.postMessage(message)
        }
    }
}

function launchMapOrPhone(aURL) {
    event.preventDefault()
    alert("hit map/phone launch: ", aURL)
    var message = {"cmd": "show_map_phone", "url": aURL}
    native.postMessage(message)
    return false
}
