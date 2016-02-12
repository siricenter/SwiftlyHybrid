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
    
    let isSubed = NSUserDefaults.standardUserDefaults()
    
    init(theController:ViewController){
        super.init()
        let theConfiguration = WKWebViewConfiguration()
        
        theConfiguration.userContentController.addScriptMessageHandler(self, name: "native")
        
        
        appWebView = WKWebView(frame: theController.view.frame, configuration: theConfiguration)
        theController.view.addSubview(appWebView!)
        
        if let subed = isSubed.stringForKey("subed") {
            if (subed == "YES"){
                
                //TODO: should be checking the reciept for most accurate subscription status
                // Only access site if user has subscribed
                displayPurchase()
                
            } else {
                linkInAppBilling()
                
                // Stay on registration screen
                displayRegistration()
            }
        } else {
            // User has not subscribed subed is null
            linkInAppBilling()
            displayRegistration()
        }

    }
    
    func linkInAppBilling() {
        isSubed.setObject("NO", forKey: "subed")

        
        // link to apple in app billing
        if(SKPaymentQueue.canMakePayments()) {
            print("IAP is enabled, loading")
            let productID = Set(arrayLiteral: "com.myfrugler.frugler.monthly")
            let request = SKProductsRequest(productIdentifiers: productID)
            request.delegate = self
            request.start()
            
        } else {
            print("please enable IAPS")
        }
    }
    
    func userContentController(userContentController: WKUserContentController, didReceiveScriptMessage message: WKScriptMessage) {
        let sentData = message.body as! NSDictionary
        
        print("start userContentController")
        
        let command = sentData["cmd"] as! String
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
            restorePurchases()  // TODO: figure out if this is the best way to do check if the app has already been purchased
            print("isSubed before: ", isSubed.stringForKey("subed"))
            if let subed = isSubed.stringForKey("subed") {
                if (subed == "YES"){
                    
                    // Only access site if user has subscribed
                    displayPurchase()

                } else {
                    // Stay on registration screen
                }
            } else {
                // User has not subscribed
                isSubed.setObject("NO", forKey: "subed")
            }
            print("isSubed after: ", isSubed.stringForKey("subed"))
        }
        else if command == "restorePurchases" {
            restorePurchases()
        }
        else if command == "log" {
            let value = sentData["string"] as? String
            print("JS: \(value)")
        } else if command == "displayApp" {
            let value = sentData["string"] as? String
            print("displayApp: \(value)")
            displayPurchase()
        }
        let callbackString = sentData["callbackFunc"] as? String
        sendResponse(response, callback: callbackString)
    }
    func sendResponse(aResponse:Dictionary<String,AnyObject>, callback:String?){
        print("start sendResponse")
        guard let callbackString = callback else{
            return
        }
        guard let generatedJSONData = try? NSJSONSerialization.dataWithJSONObject(aResponse, options: NSJSONWritingOptions(rawValue: 0)) else{
            print("failed to generate JSON for \(aResponse)")
            return
        }
        appWebView!.evaluateJavaScript("(\(callbackString)('\(NSString(data:generatedJSONData, encoding:NSUTF8StringEncoding)!)'))"){(JSReturnValue:AnyObject?, error:NSError?) in
            print("successfully generated JSON from main.js")
            print(generatedJSONData)
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
        print("start displayPurchase")
        let url = NSURL (string: "http://ec2-54-152-204-90.compute-1.amazonaws.com/app") //TODO: might need to add a request string to this
        let requestObj = NSURLRequest(URL: url!)
        appWebView!.loadRequest(requestObj)
        print("loading webview")
    }
    
    func displayRegistration() {
        let indexHTMLPath = NSBundle.mainBundle().pathForResource("index", ofType: "html")
        let url = NSURL(fileURLWithPath: indexHTMLPath!)
        
        let request = NSURLRequest(URL: url)
        appWebView!.loadRequest(request)
        print("registration displayed")
    }
    
    func restorePurchases() {
        print("start restorePurchases")
        SKPaymentQueue.defaultQueue().addTransactionObserver(self)
        SKPaymentQueue.defaultQueue().restoreCompletedTransactions()
    }
    

    func buyMonthlySub() {
        print("start buyMonthlySub")
        for product in list {
            let prodID = product.productIdentifier
            if (prodID == "com.myfrugler.frugler.monthly") {
                p = product
                print("Product = " + p.productIdentifier)
                break;
            }
        }
    
        print("Buy " + p.productIdentifier)
        let pay = SKPayment(product: p)
        SKPaymentQueue.defaultQueue().addTransactionObserver(self)
        SKPaymentQueue.defaultQueue().addPayment(pay as SKPayment)
    }
    
    
    func productsRequest(request: SKProductsRequest, didReceiveResponse response: SKProductsResponse) {
        print("start productsRequest")
        print("product count \(response.products.count)")
        print("invalid product IDs \(response.invalidProductIdentifiers)")
        
        let myProduct = response.products
        
        print(myProduct)
        
        for product in myProduct {
            print(product.productIdentifier, " | ", product.localizedTitle, " | ", product.localizedDescription, " | ", product.price)            
            list.append(product)
        }
    }
    
    func paymentQueue(queue: SKPaymentQueue, updatedTransactions transactions: [SKPaymentTransaction]) {
        print("start paymentQueue") //itunes signin popup showing up about here
        
        for transaction:SKPaymentTransaction in transactions {
            let trans = transaction
//            print("trans.error: ", trans.error)
//            print("trans.transactionState: ", trans.transactionState.rawValue)
            
            switch trans.transactionState {
                
            case .Purchased:
                print("Purchasing")
                print(p.productIdentifier)
                
                let prodID = p.productIdentifier as String
                switch prodID {
                    case "com.myfrugler.frugler.monthly":
                        print("monthly payments")
                        print("isSubed: ", isSubed.stringForKey("subed"))
                        isSubed.setObject("YES", forKey: "subed")
                        print("isSubed: ", isSubed.stringForKey("subed"))
                    default:
                        print("IAP not setup")
                        isSubed.setValue("NO", forKey: "subed")
                }
                queue.finishTransaction(trans)
                break
            case .Failed:
                print("Purchase error")
                isSubed.setValue("NO", forKey: "subed")
                queue.finishTransaction(trans)
                //TODO: need to display failure error
                displayRegistration()
                break
            case .Purchasing:
                print("Purchasing right now")
                break
            default:
//                print("purchasing queue default")
                break
                
            }
        }
    }
    
    func paymentQueueRestoreCompletedTransactionsFinished(queue: SKPaymentQueue) {
        print("start paymentQueueRestoreCompletedTransactionsFinished")
        print(queue.transactions)
        for transaction in queue.transactions {
            let t : SKPaymentTransaction = transaction
            let prodID = t.payment.productIdentifier as String
            print(prodID)
            switch prodID {
            case "com.myfrugler.frugler.monthly":
                print("monthly sub")
                return
            default:
                print("IAP not setup")
            }
        }
    }
    
    func finishTransaction(trans:SKPaymentTransaction) {
        print("start finishTransaction")
        SKPaymentQueue.defaultQueue().finishTransaction(trans)
    }
}
