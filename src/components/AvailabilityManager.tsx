import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar } from "lucide-react";

interface AvailabilitySchedule {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface AvailabilityManagerProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
}

const AvailabilityManager = ({ isOpen, onClose, providerId }: AvailabilityManagerProps) => {
  const { toast } = useToast();
  const [availability, setAvailability] = useState<AvailabilitySchedule[]>([]);
  const [loading, setLoading] = useState(false);

  const daysOfWeek = [
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
    { value: 0, label: "Sunday" },
  ];

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
  ];

  useEffect(() => {
    if (isOpen) {
      fetchAvailability();
    }
  }, [isOpen, providerId]);

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_availability')
        .select('*')
        .eq('provider_id', providerId)
        .order('day_of_week');

      if (error) throw error;

      // Initialize with default availability if none exists
      if (!data || data.length === 0) {
        const defaultAvailability = daysOfWeek.map(day => ({
          day_of_week: day.value,
          start_time: "09:00",
          end_time: "17:00",
          is_available: day.value !== 0 // Default: available Monday-Saturday
        }));
        setAvailability(defaultAvailability);
      } else {
        setAvailability(data);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast({
        title: "Error",
        description: "Failed to load availability",
        variant: "destructive"
      });
    }
  };

  const updateAvailability = (dayOfWeek: number, field: keyof AvailabilitySchedule, value: any) => {
    setAvailability(prev => 
      prev.map(item => 
        item.day_of_week === dayOfWeek 
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Delete existing availability
      await supabase
        .from('provider_availability')
        .delete()
        .eq('provider_id', providerId);

      // Insert new availability (only for available days)
      const availableDays = availability.filter(day => day.is_available);
      
      if (availableDays.length > 0) {
        const { error } = await supabase
          .from('provider_availability')
          .insert(
            availableDays.map(day => ({
              provider_id: providerId,
              day_of_week: day.day_of_week,
              start_time: day.start_time,
              end_time: day.end_time,
              is_available: day.is_available
            }))
          );

        if (error) throw error;
      }

      toast({
        title: "Availability Updated",
        description: "Your availability schedule has been saved",
      });

      onClose();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save availability schedule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDayAvailability = (dayOfWeek: number) => {
    return availability.find(item => item.day_of_week === dayOfWeek) || {
      day_of_week: dayOfWeek,
      start_time: "09:00",
      end_time: "17:00",
      is_available: false
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Manage Availability</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Set your weekly availability. Clients will only be able to book during these times.
          </p>

          <div className="space-y-4">
            {daysOfWeek.map((day) => {
              const dayAvailability = getDayAvailability(day.value);
              
              return (
                <div key={day.value} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">{day.label}</Label>
                    <Switch
                      checked={dayAvailability.is_available}
                      onCheckedChange={(checked) => 
                        updateAvailability(day.value, 'is_available', checked)
                      }
                    />
                  </div>

                  {dayAvailability.is_available && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Start Time</Label>
                        <Select
                          value={dayAvailability.start_time}
                          onValueChange={(value) => 
                            updateAvailability(day.value, 'start_time', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
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

                      <div className="space-y-2">
                        <Label className="text-sm">End Time</Label>
                        <Select
                          value={dayAvailability.end_time}
                          onValueChange={(value) => 
                            updateAvailability(day.value, 'end_time', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="flex-1 bg-gradient-primary"
            >
              {loading ? "Saving..." : "Save Availability"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvailabilityManager;