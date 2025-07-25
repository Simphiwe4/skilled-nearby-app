import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Calendar as CalendarIcon, Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";

interface ServiceListing {
  id: string;
  title: string;
  description: string;
  price?: number;
  price_type: string;
  duration_minutes?: number;
  service_categories: {
    name: string;
  };
  service_providers: {
    id: string;
    business_name?: string;
    profiles: {
      first_name: string;
      last_name: string;
      phone_number?: string;
      location?: string;
      avatar_url?: string;
    };
  };
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: ServiceListing;
}

const BookingModal = ({ isOpen, onClose, listing }: BookingModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientNotes, setClientNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Generate time slots (9 AM to 6 PM)
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to book a service",
        variant: "destructive"
      });
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get client profile
      const { data: clientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Create booking
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          client_id: clientProfile.id,
          provider_id: listing.service_providers.id,
          listing_id: listing.id,
          scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
          scheduled_time: selectedTime,
          duration_minutes: listing.duration_minutes || 60,
          total_price: listing.price,
          client_notes: clientNotes,
          status: 'pending'
        })
        .select();

      if (error) throw error;

      toast({
        title: "Booking Submitted!",
        description: "Your booking request has been sent to the provider",
      });

      onClose();
      setSelectedDate(undefined);
      setSelectedTime("");
      setClientNotes("");
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to submit booking request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!listing.price || !listing.duration_minutes) return null;
    
    if (listing.price_type === 'hourly') {
      const hours = listing.duration_minutes / 60;
      return listing.price * hours;
    }
    return listing.price;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Service</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service & Provider Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={listing.service_providers.profiles.avatar_url} />
                <AvatarFallback>
                  {listing.service_providers.profiles.first_name[0]}
                  {listing.service_providers.profiles.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">
                  {listing.service_providers.profiles.first_name} {listing.service_providers.profiles.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">{listing.title}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {listing.service_categories.name}
              </Badge>
              {listing.service_providers.profiles.location && (
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{listing.service_providers.profiles.location}</span>
                </div>
              )}
              {listing.duration_minutes && (
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{listing.duration_minutes} minutes</span>
                </div>
              )}
            </div>

            <p className="text-sm">{listing.description}</p>
            
            {listing.price && (
              <div className="text-lg font-semibold text-primary">
                R{listing.price}{listing.price_type === 'hourly' ? '/hour' : ''}
                {calculateTotal() && calculateTotal() !== listing.price && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (Total: R{calculateTotal()})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
            <Label className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4" />
              <span>Select Date</span>
            </Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date() || date.getDay() === 0} // Disable past dates and Sundays
              className="rounded-md border"
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <Label className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Select Time</span>
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-3">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Any specific requirements or notes for the provider..."
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Booking Summary */}
          {selectedDate && selectedTime && (
            <div className="bg-primary/5 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">Booking Summary</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Date:</strong> {format(selectedDate, 'EEEE, MMMM do, yyyy')}</p>
                <p><strong>Time:</strong> {selectedTime}</p>
                <p><strong>Duration:</strong> {listing.duration_minutes || 60} minutes</p>
                {calculateTotal() && (
                  <p><strong>Total Price:</strong> R{calculateTotal()}</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleBooking} 
              disabled={!selectedDate || !selectedTime || loading}
              className="flex-1 bg-gradient-primary"
            >
              {loading ? "Submitting..." : "Confirm Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;