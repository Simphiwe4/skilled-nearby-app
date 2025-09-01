import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

interface PhoneCallButtonProps {
  phoneNumber: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  className?: string;
}

const PhoneCallButton = ({ 
  phoneNumber, 
  size = "sm", 
  variant = "outline",
  className = "" 
}: PhoneCallButtonProps) => {
  const handleCall = () => {
    // Format phone number for tel: link
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    window.location.href = `tel:${cleanNumber}`;
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleCall}
      className={className}
    >
      <Phone className="h-4 w-4 mr-2" />
      Call
    </Button>
  );
};

export default PhoneCallButton;