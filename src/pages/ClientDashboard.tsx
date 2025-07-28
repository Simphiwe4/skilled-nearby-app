import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/ui/navigation";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Star,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  total_price?: number;
  status: string;
  client_notes?: string;
  provider_notes?: string;
  created_at: string;
  service_listings: {
    title: string;
    description: string;
    service_categories: {
      name: string;
    };
  };
  service_providers: {
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

const ClientDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      // Get user's profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch bookings for this client
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service_listings!inner (
            title,
            description,
            service_categories!inner (
              name
            )
          ),
          service_providers!inner (
            business_name,
            profiles!inner (
              first_name,
              last_name,
              phone_number,
              location,
              avatar_url
            )
          )
        `)
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load your bookings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled",
      });

      fetchBookings(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'completed':
        return <Star className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === "all") return true;
    return booking.status === activeTab;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container px-4 py-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container px-4 py-6 pb-24 md:pb-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Bookings</h1>
            <p className="text-muted-foreground">Manage your service bookings</p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading your bookings...</div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === "all" 
                      ? "You haven't made any bookings yet." 
                      : `No ${activeTab} bookings found.`}
                  </p>
                  <Button onClick={() => window.location.href = '/search'}>
                    Find Services
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={booking.service_providers.profiles.avatar_url} />
                                <AvatarFallback>
                                  {booking.service_providers.profiles.first_name[0]}
                                  {booking.service_providers.profiles.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">
                                  {booking.service_providers.profiles.first_name} {booking.service_providers.profiles.last_name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {booking.service_listings.title}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(booking.status)}
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </Badge>
                            </div>
                          </div>

                          {/* Service Details */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{format(new Date(booking.scheduled_date), 'EEEE, MMMM do, yyyy')}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{booking.scheduled_time} ({booking.duration_minutes} minutes)</span>
                              </div>
                              {booking.service_providers.profiles.location && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>{booking.service_providers.profiles.location}</span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Badge variant="outline" className="text-xs">
                                {booking.service_listings.service_categories.name}
                              </Badge>
                              {booking.total_price && (
                                <div className="text-lg font-semibold text-primary">
                                  R{booking.total_price}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Notes */}
                          {(booking.client_notes || booking.provider_notes) && (
                            <div className="space-y-2 pt-2 border-t">
                              {booking.client_notes && (
                                <div>
                                  <p className="text-sm font-medium">Your Notes:</p>
                                  <p className="text-sm text-muted-foreground">{booking.client_notes}</p>
                                </div>
                              )}
                              {booking.provider_notes && (
                                <div>
                                  <p className="text-sm font-medium">Provider Notes:</p>
                                  <p className="text-sm text-muted-foreground">{booking.provider_notes}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex space-x-2 pt-2 border-t">
                            {/* TODO: Add messaging functionality */}
                            {booking.service_providers.profiles.phone_number && (
                              <Button variant="outline" size="sm">
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </Button>
                            )}
                            {booking.status === 'pending' && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => cancelBooking(booking.id)}
                              >
                                Cancel
                              </Button>
                            )}
                            {booking.status === 'completed' && (
                              <Button variant="outline" size="sm">
                                <Star className="h-4 w-4 mr-2" />
                                Review
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;