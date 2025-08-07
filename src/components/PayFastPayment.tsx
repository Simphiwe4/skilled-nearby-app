import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PayFastPaymentProps {
  amount: number;
  itemName: string;
  itemDescription: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PayFastPayment = ({
  amount,
  itemName,
  itemDescription,
  onSuccess,
  onCancel,
}: PayFastPaymentProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name_first: "",
    name_last: "",
    email_address: "",
    cell_number: "",
  });

  // PayFast configuration (use sandbox for testing)
  const payfastConfig = {
    merchant_id: "10024000", // PayFast sandbox merchant ID
    merchant_key: "77jcu5v4ufdod", // PayFast sandbox merchant key
    return_url: `${window.location.origin}/payment-success`,
    cancel_url: `${window.location.origin}/payment-cancel`,
    notify_url: `${window.location.origin}/api/payfast-notify`, // Will need backend endpoint
  };

  const generateSignature = (data: Record<string, string>) => {
    // Sort the data by key
    const sortedData = Object.keys(data)
      .sort()
      .reduce((result: Record<string, string>, key) => {
        result[key] = data[key];
        return result;
      }, {});

    // Create parameter string
    const paramString = Object.entries(sortedData)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    // Note: In production, signature generation should be done on the server
    // for security reasons. This is simplified for demonstration.
    return paramString;
  };

  const handlePayment = async () => {
    if (!customerDetails.name_first || !customerDetails.name_last || !customerDetails.email_address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare payment data
      const paymentData = {
        merchant_id: payfastConfig.merchant_id,
        merchant_key: payfastConfig.merchant_key,
        return_url: payfastConfig.return_url,
        cancel_url: payfastConfig.cancel_url,
        notify_url: payfastConfig.notify_url,
        name_first: customerDetails.name_first,
        name_last: customerDetails.name_last,
        email_address: customerDetails.email_address,
        cell_number: customerDetails.cell_number,
        amount: amount.toFixed(2),
        item_name: itemName,
        item_description: itemDescription,
        custom_int1: Date.now().toString(), // Unique transaction reference
      };

      // Generate signature (in production, do this server-side)
      const signature = generateSignature(paymentData);

      // Create form and submit to PayFast
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://sandbox.payfast.co.za/eng/process"; // Use https://www.payfast.co.za/eng/process for production

      // Add all fields to form
      Object.entries(paymentData).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      // Add signature field
      const signatureInput = document.createElement("input");
      signatureInput.type = "hidden";
      signatureInput.name = "signature";
      signatureInput.value = signature;
      form.appendChild(signatureInput);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Secure Payment</CardTitle>
        <div className="text-center text-sm text-muted-foreground">
          Amount: R{amount.toFixed(2)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name_first">First Name *</Label>
          <Input
            id="name_first"
            type="text"
            value={customerDetails.name_first}
            onChange={(e) =>
              setCustomerDetails({ ...customerDetails, name_first: e.target.value })
            }
            placeholder="Enter first name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name_last">Last Name *</Label>
          <Input
            id="name_last"
            type="text"
            value={customerDetails.name_last}
            onChange={(e) =>
              setCustomerDetails({ ...customerDetails, name_last: e.target.value })
            }
            placeholder="Enter last name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email_address">Email Address *</Label>
          <Input
            id="email_address"
            type="email"
            value={customerDetails.email_address}
            onChange={(e) =>
              setCustomerDetails({ ...customerDetails, email_address: e.target.value })
            }
            placeholder="Enter email address"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cell_number">Cell Number</Label>
          <Input
            id="cell_number"
            type="tel"
            value={customerDetails.cell_number}
            onChange={(e) =>
              setCustomerDetails({ ...customerDetails, cell_number: e.target.value })
            }
            placeholder="Enter cell number (optional)"
          />
        </div>

        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-sm">
            <div className="flex justify-between">
              <span>Service:</span>
              <span>{itemName}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>R{amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            className="flex-1"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Pay with PayFast"
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Secure payment powered by PayFast. Currently in sandbox mode for testing.
        </div>
      </CardContent>
    </Card>
  );
};

export default PayFastPayment;