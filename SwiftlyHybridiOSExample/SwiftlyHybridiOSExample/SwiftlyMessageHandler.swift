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

// for the NSDate objects
public func ==(lhs: NSDate, rhs: NSDate) -> Bool {
    return lhs === rhs || lhs.compare(rhs) == .OrderedSame
}

public func <(lhs: NSDate, rhs: NSDate) -> Bool {
    return lhs.compare(rhs) == .OrderedAscending
}

extension NSDate: Comparable { }

class SwiftlyMessageHandler:NSObject, WKScriptMessageHandler, SKProductsRequestDelegate, SKPaymentTransactionObserver {
    var appWebView:WKWebView?

    var list = [SKProduct]()
    var p = SKProduct()
    
    // This is messy, but these "global"  variables are for the event of a faild purchase
    var purchaseError = "false"
    var user_email = ""
    var ePass = ""
    var reg_error = false
    let sysRoot:String = "staging"
    
    let the_url:String = "http://ec2-54-152-204-90.compute-1.amazonaws.com/app"
//    let the_url:String = "https://www.f5admin.com/app"
    
    
    let isSubed = NSUserDefaults.standardUserDefaults()
    let endSub_date = NSUserDefaults.standardUserDefaults()

    init(theController:ViewController){
        super.init()
    
        let theConfiguration = WKWebViewConfiguration()
        
        theConfiguration.userContentController.addScriptMessageHandler(self, name: "native")
        
        appWebView = WKWebView(frame: theController.view.frame, configuration: theConfiguration)
        theController.view.addSubview(appWebView!)
        // Remove the iOS scroll bounce as it messes with our webview scrolling
        appWebView?.scrollView.bounces = false;
        
        let current_date = NSDate()
        print(current_date)
        var end_date:NSDate = NSDate(timeIntervalSinceReferenceDate: 0)// = endSub_date.objectForKey("date") as! NSDate
        // get the end sub date from memory
        if let end = endSub_date.objectForKey("date") {
            end_date = end as! NSDate
        } else {
            endSub_date.setObject(NSDate(timeIntervalSinceReferenceDate: 0), forKey: "date")
        }
        
        print(current_date)
        print(end_date)
        
        if let end:NSDate = endSub_date.objectForKey("date") as? NSDate {
            if (end == NSDate(timeIntervalSinceReferenceDate: 0)) {
                // User has never subscribed or there was a purchase error
                isSubed.setObject("NO", forKey: "subed")
            } else if (current_date < end) {
                isSubed.setObject("YES", forKey: "subed")
            } else if (end < current_date) {
                isSubed.setObject("NO_NEEDS_RENEWING", forKey: "subed")
            }
        }
        
        if let subed = isSubed.stringForKey("subed") {
            if (subed == "YES"){
                
                //TODO: should be checking the reciept for most accurate subscription status
                // Only access site if user has subscribed
                displayPurchase()
                
            } else if (subed == "NO_NEEDS_RENEWING") {
                linkInAppBilling()
                
                // Stay on registration screen
                displayRenewing()
            } else if (subed == "NO") {
                linkInAppBilling()
                
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
            let productID_1 = Set(arrayLiteral: "com.myfrugler.frugler.submonthly")
            let productID_3 = Set(arrayLiteral: "com.myfrugler.frugler.sub3monthly")
            let productID_12 = Set(arrayLiteral: "com.myfrugler.frugler.sub12monthly")
            
            let request_1 = SKProductsRequest(productIdentifiers: productID_1)
            let request_3 = SKProductsRequest(productIdentifiers: productID_3)
            let request_12 = SKProductsRequest(productIdentifiers: productID_12)

            request_1.delegate = self
            request_3.delegate = self
            request_12.delegate = self
            
            request_1.start()
            request_3.start()
            request_12.start()
            
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
            count += 1
            response["count"] = count
        }
        else if command == "requestMonthlyPurchase"{
            // Handle user info stuff here
            
            let plan = sentData["plan"] as! String
            
            if (plan == "1") {
                buyMonthlySub()
            } else if (plan == "3") {
                buy3MonthSub()
            } else if (plan == "12") {
                buy12MonthSub()
            }
            
            if let _ = sentData["renew"] {
                print("Renewing the purchase")
            } else {
                user_email = sentData["email"] as! String
                response["user_email"] = user_email
                ePass = sentData["ePass"] as! String
                response["ePass"] = ePass
                print("USER EMAIL: \(user_email)")
                print("USER PASSW: \(ePass)")
                //your purchase code goes here.
            }
        }
        else if command == "onload" {
            response["purchaseError"] = purchaseError
            response["user_email"] = user_email
        } else if command == "restorePurchases" {
            restorePurchases()
            response["restore"] = "restore purchase response"
        } else if command == "login" {
            let current_date = NSDate()
            
            if let end:NSDate = endSub_date.objectForKey("date") as? NSDate {
                if (end == NSDate(timeIntervalSinceReferenceDate: 0)) {
                    // User has never subscribed or there was a purchase error
                    print("displayRegistration")
                    displayRegistration()
                } else if (current_date < end) {
                    print("restorePurchases")
                    restorePurchases()
                } else if (end < current_date) {
                    print("displayRenewing")
                    displayRenewing()
                }
            }
        }else if command == "log" {
            let value = sentData["string"] as? String
            print("JS: \(value)")
        } else if command == "displayApp" {
            let value = sentData["string"] as? String
            print("displayApp: \(value)")
            displayPurchase()
        } else if command == "show_map_phone" {
            if let value = sentData["url"] as? String {
                if let theURL = NSURL(string: value) {
                    if UIApplication.sharedApplication().canOpenURL(theURL) {
                        UIApplication.sharedApplication().openURL(theURL)
                    }
                }
            }
        } else if command == "reg_error" {
            // registration error
            let value = sentData["bool"] as? String
            if (value == "true") {
                reg_error = true
            } else {
                reg_error = false
            }
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
        //let url = NSURL (string: "https://www.google.com")
// 	    let url = NSURL (string: "http://ec2-54-152-204-90.compute-1.amazonaws.com/app") //TODO: might need to add a request string to this with the user id
        let url = NSURL (string: the_url)
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
    
    func displayRenewing() {
        let renewHTMLPath = NSBundle.mainBundle().pathForResource("renew", ofType: "html")
        let url = NSURL(fileURLWithPath: renewHTMLPath!)
        
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
            if (prodID == "com.myfrugler.frugler.submonthly") {
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
    
    func buy3MonthSub() {
        print("start buy3MonthlySub")
        for product in list {
            let prodID = product.productIdentifier
            if (prodID == "com.myfrugler.frugler.sub3monthly") {
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
    
    func buy12MonthSub() {
        print("start buy12MonthlySub")
        for product in list {
            let prodID = product.productIdentifier
            if (prodID == "com.myfrugler.frugler.sub12monthly") {
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
                    case "com.myfrugler.frugler.submonthly":
                        print("monthly payments: \(trans.transactionState.rawValue)")
                        print("isSubed: ", isSubed.stringForKey("subed"))
                        isSubed.setObject("YES", forKey: "subed")
                        endSub_date.setObject(NSDate().dateByAddingTimeInterval(120), forKey: "date")
                        //endSub_date.setObject(NSDate().dateByAddingTimeInterval(2678400), forKey: "date")
                        print("isSubed: ", isSubed.stringForKey("subed"))
                        purchaseError = "false"
                        break
                    case "com.myfrugler.frugler.sub3monthly":
                        print("monthly payments: \(trans.transactionState.rawValue)")
                        print("isSubed: ", isSubed.stringForKey("subed"))
                        isSubed.setObject("YES", forKey: "subed")
                        endSub_date.setObject(NSDate().dateByAddingTimeInterval(8035200), forKey: "date")
                        print("isSubed: ", isSubed.stringForKey("subed"))
                        purchaseError = "false"
                        break
                    case "com.myfrugler.frugler.sub12monthly":
                        print("monthly payments: \(trans.transactionState.rawValue)")
                        print("isSubed: ", isSubed.stringForKey("subed"))
                        isSubed.setObject("YES", forKey: "subed")
                        endSub_date.setObject(NSDate().dateByAddingTimeInterval(32140800), forKey: "date")
                        print("isSubed: ", isSubed.stringForKey("subed"))
                        purchaseError = "false"
                        break
                    default:
                        print("IAP not setup")
                        isSubed.setValue("NO", forKey: "subed")
                }
                queue.finishTransaction(trans)
                break
            case .Failed:
                print("Purchase error: \(trans.transactionState.rawValue)")
                isSubed.setValue("NO", forKey: "subed")
                purchaseError = "true"
                queue.finishTransaction(trans)
                
                if (endSub_date.objectForKey("date") as! NSDate == NSDate(timeIntervalSinceReferenceDate: 0)){
                    displayRegistration()
                } else {
                    displayRenewing()
                }
                
                //TODO: need to display failure error
                break
            case .Purchasing:
                print("Purchasing right now")
                break
            case .Restored:
                print("Purchase restored")
                isSubed.setObject("YES", forKey: "subed")
                print("isSubed: ", isSubed.stringForKey("subed"))
                break
            default:
//              print("purchasing queue default")
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
                case "com.myfrugler.frugler.submonthly":
                    print("monthly sub")
                    return
                case "com.myfrugler.frugler.sub3monthly":
                    print("3 monthly sub")
                    return
                case "com.myfrugler.frugler.sub12monthly":
                    print("12 monthly sub")
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
