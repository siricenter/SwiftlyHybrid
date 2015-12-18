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

import Foundation

import WebKit

import StoreKit

class SwiftlyMessageHandler:NSObject, WKScriptMessageHandler, SKProductsRequestDelegate, SKPaymentTransactionObserver  {
    var appWebView:WKWebView?
    
    var list = [SKProduct]()
    var p = SKProduct()
    
    init(theController:ViewController){
        super.init()
        let theConfiguration = WKWebViewConfiguration()
        
        theConfiguration.userContentController.addScriptMessageHandler(self, name: "native")
        
        
        let indexHTMLPath = NSBundle.mainBundle().pathForResource("index", ofType: "html")
        appWebView = WKWebView(frame: theController.view.frame, configuration: theConfiguration)
        let url = NSURL(fileURLWithPath: indexHTMLPath!)
        let request = NSURLRequest(URL: url)
        appWebView!.loadRequest(request)
        theController.view.addSubview(appWebView!)
    }
    func userContentController(userContentController: WKUserContentController, didReceiveScriptMessage message: WKScriptMessage) {
        let sentData = message.body as! NSDictionary
        
        let command = sentData["cmd"] as! String
//        let block = sentData["block"] as! String
        print("command: \(command)")
        var response = Dictionary<String,AnyObject>()
        if command == "increment"{
            guard var count = sentData["count"] as? Int else{
                return
            }
            count++
            response["count"] = count
        }
        else if command == "requestMonthlyPurchase"{
            // Handle user info stuff here
            buyMonthlySub()
            print("got purchase request \(sentData["userinfo"])")
            //your purchase code goes here. 
        }
        else if command == "onload" {
            // Request IAPs Info
            if(SKPaymentQueue.canMakePayments()) {
                print("IAP is enabled, loading")
//                let productID = Set(arrayLiteral: "com.myfrugler.frugler.monthly")
//                let request = SKProductsRequest(productIdentifiers: productID)
//                request.delegate = self
//                request.start()
                
            } else {
                print("please enable IAPS")
            }
        }
        
//        if block == "on" {
//            print("Block is on")
//        } else {
            let callbackString = sentData["callbackFunc"] as? String
            sendResponse(response, callback: callbackString)            
//        }
    }
    func sendResponse(aResponse:Dictionary<String,AnyObject>, callback:String?){
        guard let callbackString = callback else{
            return
        }
        guard let generatedJSONData = try? NSJSONSerialization.dataWithJSONObject(aResponse, options: NSJSONWritingOptions(rawValue: 0)) else{
            print("failed to generate JSON for \(aResponse)")
            return
        }
        appWebView!.evaluateJavaScript("(\(callbackString)('\(NSString(data:generatedJSONData, encoding:NSUTF8StringEncoding)!)'))"){(JSReturnValue:AnyObject?, error:NSError?) in
            if let errorDescription = error?.description{
                print("returned value: \(errorDescription)")
            }
            else if JSReturnValue != nil{
                print("returned value: \(JSReturnValue!)")
            }
            else{
                print("no return from JS")
            }
        }
    }
    
    // Payment Methods
    
    func displayPurchase() {
        print("Purchased")
        
    }
    

    func buyMonthlySub() {
        for product in list {
            let prodID = product.productIdentifier
            if (prodID == "com.myfrugler.frugler.monthly") {
                p = product
                print("Product = " + p.productIdentifier)
                break;
            }
        }
    
        print("buy " + p.productIdentifier)
        let pay = SKPayment(product: p)
        SKPaymentQueue.defaultQueue().addTransactionObserver(self)
        SKPaymentQueue.defaultQueue().addPayment(pay as SKPayment)
    }
    
    
    func productsRequest(request: SKProductsRequest, didReceiveResponse response: SKProductsResponse) {
        print("products request")
        print("product count \(response.products.count)")
        print("invalid product IDs \(response.invalidProductIdentifiers)")
        
        let myProduct = response.products
        
        for product in myProduct {
            print(product.productIdentifier)
            print(product.localizedTitle)
            print(product.localizedDescription)
            print(product.price)
            
            list.append(product)
        }
    }
    
    func paymentQueue(queue: SKPaymentQueue, updatedTransactions transactions: [SKPaymentTransaction]) {
        print("Add Payment")
        
        for transaction:SKPaymentTransaction in transactions {
            let trans = transaction
            print(trans.error)
            
            switch trans.transactionState {
                
            case .Purchased:
                print("Purchasing")
                print(p.productIdentifier)
                
                let prodID = p.productIdentifier as String
                switch prodID {
                    case "com.myfrugler.frugler.monthly":
                        print("monthly payments")
                        displayPurchase()
                        // do stuff after they pay here
                    case "com.myFrugler.frugler.testFree":
                        print("testFree free purchase")
                        // pretend to do stuff here
                        displayPurchase()
                    default:
                        print("IAP not setup")
                }
                
                queue.finishTransaction(trans)
                break;
            case .Failed:
                print("Purchase error")
                queue.finishTransaction(trans)
                break;
            default:
                print("default")
                break;
                
            }
        }
    }
    
    func paymentQueueRestoreCompletedTransactionsFinished(queue: SKPaymentQueue) {
        
    }
    
    func finishTransaction(trans:SKPaymentTransaction) {
        print("finish trans")
        SKPaymentQueue.defaultQueue().finishTransaction(trans)
    }
}
