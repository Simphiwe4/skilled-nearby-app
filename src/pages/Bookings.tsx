import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  Star,
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  client_notes?: string;
  provider_notes?: string;
  service_listings: {
    title: string;
    description: string;
  };
  service_providers: {
    business_name?: string;
    profiles: {
      first_name: string;
      last_name: string;
      avatar_url?: string;
    };
  };
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

const Bookings = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      fetchUserProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchUserProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(profile);
      fetchBookings(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    }
  };

  const fetchBookings = async (profile: any) => {
    try {
      let query = supabase.from('bookings').select(`
        *,
        service_listings(title, description),
        service_providers(
          business_name,
          profiles(first_name, last_name, avatar_url)
        ),
        profiles(first_name, last_name, avatar_url)
      `);

      // If user is a client, get bookings where they are the client
      // If user is a provider, get bookings where they are the provider
      if (profile.user_type === 'client') {
        query = query.eq('client_id', profile.id);
      } else {
        // For providers, join through service_providers table
        const { data: providerData } = await supabase
          .from('service_providers')
          .select('id')
          .eq('profile_id', profile.id)
          .single();

        if (providerData) {
          query = query.eq('provider_id', providerData.id);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Booking ${status} successfully`
      });

      // Refresh bookings
      if (userProfile) {
        fetchBookings(userProfile);
      }
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-primary-foreground">Loading...</div>
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const activeBookings = bookings.filter(b => ['confirmed', 'completed'].includes(b.status));
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="container px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/profile" className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary-foreground">
              Skilled Nearby
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-elevated border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-6 w-6" />
                <span>My Bookings</span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="pending" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending" className="relative">
                    Pending
                    {pendingBookings.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                        {pendingBookings.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                  {pendingBookings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No pending bookings
                    </div>
                  ) : (
                    pendingBookings.map((booking) => (
                      <Card key={booking.id} className="border">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold">{booking.service_listings.title}</h3>
                                <Badge variant={getStatusColor(booking.status)}>
                                  {getStatusIcon(booking.status)}
                                  <span className="ml-1 capitalize">{booking.status}</span>
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground">
                                {booking.service_listings.description}
                              </p>

                              <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center space-x-1">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {userProfile?.user_type === 'client' 
                                      ? `${booking.service_providers.profiles.first_name} ${booking.service_providers.profiles.last_name}`
                                      : `${booking.profiles.first_name} ${booking.profiles.last_name}`
                                    }
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>{format(new Date(booking.scheduled_date), 'PPP')}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>{booking.scheduled_time}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-lg">R{booking.total_price}</span>
                                <div className="space-x-2">
                                  {userProfile?.user_type === 'provider' && booking.status === 'pending' && (
                                    <>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                      >
                                        Decline
                                      </Button>
                                      <Button 
                                        size="sm"
                                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                      >
                                        Accept
                                      </Button>
                                    </>
                                  )}
                                  {userProfile?.user_type === 'client' && booking.status === 'pending' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="active" className="space-y-4">
                  {activeBookings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No active bookings
                    </div>
                  ) : (
                    activeBookings.map((booking) => (
                      <Card key={booking.id} className="border">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold">{booking.service_listings.title}</h3>
                                <Badge variant={getStatusColor(booking.status)}>
                                  {getStatusIcon(booking.status)}
                                  <span className="ml-1 capitalize">{booking.status}</span>
                                </Badge>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center space-x-1">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {userProfile?.user_type === 'client' 
                                      ? `${booking.service_providers.profiles.first_name} ${booking.service_providers.profiles.last_name}`
                                      : `${booking.profiles.first_name} ${booking.profiles.last_name}`
                                    }
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>{format(new Date(booking.scheduled_date), 'PPP')}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>{booking.scheduled_time}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-lg">R{booking.total_price}</span>
                                <div className="space-x-2">
                                  {booking.status === 'confirmed' && (
                                    <Button 
                                      size="sm"
                                      onClick={() => updateBookingStatus(booking.id, 'completed')}
                                    >
                                      Mark Complete
                                    </Button>
                                  )}
                                  {booking.status === 'completed' && (
                                    <Button size="sm" variant="outline">
                                      <Star className="h-4 w-4 mr-1" />
                                      Review
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="cancelled" className="space-y-4">
                  {cancelledBookings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No cancelled bookings
                    </div>
                  ) : (
                    cancelledBookings.map((booking) => (
                      <Card key={booking.id} className="border opacity-75">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{booking.service_listings.title}</h3>
                              <Badge variant="destructive">
                                {getStatusIcon(booking.status)}
                                <span className="ml-1 capitalize">{booking.status}</span>
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <User className="h-4 w-4" />
                                <span>
                                  {userProfile?.user_type === 'client' 
                                    ? `${booking.service_providers.profiles.first_name} ${booking.service_providers.profiles.last_name}`
                                    : `${booking.profiles.first_name} ${booking.profiles.last_name}`
                                  }
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(booking.scheduled_date), 'PPP')}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Bookings;