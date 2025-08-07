import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Show cancellation message
    toast({
      title: "Payment Cancelled",
      description: "Your payment was cancelled. You can try again or contact support if needed.",
      variant: "destructive",
    });

    // Log cancellation details for debugging
    console.log("Payment cancel params:", Object.fromEntries(searchParams));
  }, [searchParams, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Your payment was cancelled. No charges were made to your account.
          </p>
          
          <p className="text-sm text-muted-foreground">
            You can try the payment again or contact our support team if you're experiencing issues.
          </p>

          <div className="flex flex-col space-y-2">
            <Button onClick={() => navigate("/search")} className="w-full">
              Continue Browsing
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} className="w-full">
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;