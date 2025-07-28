import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/ui/navigation";
import ServiceListingForm from "@/components/ServiceListingForm";
import AvailabilityManager from "@/components/AvailabilityManager";
import ReviewsList from "@/components/ReviewsList";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Users
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
  profiles: {
    first_name: string;
    last_name: string;
    phone_number?: string;
    location?: string;
    avatar_url?: string;
  };
}

const ProviderDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bookings");
  const [providerId, setProviderId] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<string>("");
  const [providerNotes, setProviderNotes] = useState("");
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProviderData();
    }
  }, [user]);

  const fetchProviderData = async () => {
    if (!user) return;

    try {
      // Get provider profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get service provider record
      const { data: provider, error: providerError } = await supabase
        .from('service_providers')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (providerError) throw providerError;

      setProviderId(provider.id);

      // Fetch bookings for this provider
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
          profiles!inner (
            first_name,
            last_name,
            phone_number,
            location,
            avatar_url
          )
        `)
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching provider data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string, notes?: string) => {
    try {
      const updateData: any = { status };
      if (notes) updateData.provider_notes = notes;

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Booking Updated",
        description: `Booking has been ${status}`,
      });

      fetchProviderData(); // Refresh the list
      setSelectedBooking("");
      setProviderNotes("");
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking",
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

  const getDashboardStats = () => {
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const totalRevenue = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_price || 0), 0);
    
    return { totalBookings, pendingBookings, totalRevenue };
  };

  const stats = getDashboardStats();

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
            <h1 className="text-2xl md:text-3xl font-bold">Provider Dashboard</h1>
            <p className="text-muted-foreground">Manage your services and bookings</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBookings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingBookings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R{stats.totalRevenue}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading your bookings...</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground">
                    Your booking requests will appear here once clients start booking your services.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {bookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={booking.profiles.avatar_url} />
                                <AvatarFallback>
                                  {booking.profiles.first_name[0]}{booking.profiles.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">
                                  {booking.profiles.first_name} {booking.profiles.last_name}
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

                          {/* Booking Details */}
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
                              {booking.profiles.location && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>{booking.profiles.location}</span>
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

                          {/* Client Notes */}
                          {booking.client_notes && (
                            <div className="space-y-2 pt-2 border-t">
                              <p className="text-sm font-medium">Client Notes:</p>
                              <p className="text-sm text-muted-foreground">{booking.client_notes}</p>
                            </div>
                          )}

                          {/* Provider Notes Section */}
                          {selectedBooking === booking.id && (
                            <div className="space-y-3 pt-2 border-t">
                              <Label htmlFor="provider-notes">Add Notes (Optional)</Label>
                              <Textarea
                                id="provider-notes"
                                placeholder="Add any notes for the client..."
                                value={providerNotes}
                                onChange={(e) => setProviderNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t">
                            {/* TODO: Add messaging functionality */}
                            {booking.profiles.phone_number && (
                              <Button variant="outline" size="sm">
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </Button>
                            )}
                            
                            {booking.status === 'pending' && (
                              <>
                                {selectedBooking === booking.id ? (
                                  <>
                                    <Button 
                                      size="sm"
                                      onClick={() => updateBookingStatus(booking.id, 'confirmed', providerNotes)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      Confirm
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      onClick={() => updateBookingStatus(booking.id, 'cancelled', providerNotes)}
                                    >
                                      Decline
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedBooking("");
                                        setProviderNotes("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <Button 
                                    size="sm"
                                    onClick={() => setSelectedBooking(booking.id)}
                                    className="bg-gradient-primary"
                                  >
                                    Respond
                                  </Button>
                                )}
                              </>
                            )}
                            
                            {booking.status === 'confirmed' && (
                              <Button 
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, 'completed')}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Mark Complete
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

            <TabsContent value="services">
              {providerId && (
                <ServiceListingForm 
                  providerId={providerId} 
                  onListingAdded={fetchProviderData}
                />
              )}
            </TabsContent>

            <TabsContent value="availability">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Manage Your Availability</h3>
                    <p className="text-sm text-muted-foreground">
                      Set your weekly schedule so clients know when you're available to book.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsAvailabilityModalOpen(true)}
                    className="bg-gradient-primary"
                  >
                    Update Schedule
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              {providerId && <ReviewsList providerId={providerId} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Availability Manager Modal */}
      {providerId && (
        <AvailabilityManager
          isOpen={isAvailabilityModalOpen}
          onClose={() => setIsAvailabilityModalOpen(false)}
          providerId={providerId}
        />
      )}
    </div>
  );
};

export default ProviderDashboard;