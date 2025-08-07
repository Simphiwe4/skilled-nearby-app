import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Show success message
    toast({
      title: "Payment Successful",
      description: "Your booking has been confirmed and payment processed.",
    });

    // Log payment details for debugging
    console.log("Payment success params:", Object.fromEntries(searchParams));
  }, [searchParams, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <CardTitle className="text-2xl text-success">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Your booking has been confirmed and payment has been processed successfully.
          </p>
          
          {searchParams.get("pf_payment_id") && (
            <div className="text-sm text-muted-foreground">
              Payment ID: {searchParams.get("pf_payment_id")}
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <Button onClick={() => navigate("/bookings")} className="w-full">
              View My Bookings
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

export default PaymentSuccess;