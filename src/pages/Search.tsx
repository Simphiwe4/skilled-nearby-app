import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BookingModal from "@/components/BookingModal";
import { 
  Search as SearchIcon, 
  MapPin, 
  Star, 
  Filter,
  SlidersHorizontal,
  Heart,
  Phone,
  MessageCircle
} from "lucide-react";
import Navigation from "@/components/ui/navigation";

interface ServiceListing {
  id: string;
  title: string;
  description: string;
  price?: number;
  price_type: string;
  duration_minutes?: number;
  is_active: boolean;
  provider_id: string;
  category_id: string;
  service_categories: {
    name: string;
  };
  service_providers: {
    id: string;
    business_name?: string;
    skills?: string[];
    verification_status: string;
    profiles: {
      first_name: string;
      last_name: string;
      phone_number?: string;
      location?: string;
      avatar_url?: string;
    };
  };
}

const Search = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<ServiceListing | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      console.log('Fetching service listings...');
      
      // First, let's simplify the query to avoid potential join issues
      const { data, error } = await supabase
        .from('service_listings')
        .select(`
          *,
          service_categories!inner (
            name
          ),
          service_providers!inner (
            id,
            business_name,
            skills,
            verification_status,
            profiles!inner (
              first_name,
              last_name,
              phone_number,
              location,
              avatar_url
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      console.log('Query result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Filter approved providers after fetching
      const approvedListings = (data || []).filter(
        listing => listing.service_providers?.verification_status === 'approved'
      );

      console.log('Approved listings:', approvedListings);
      setListings(approvedListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: "Error", 
        description: "Failed to load service listings",
        variant: "destructive"
      });
      // Set empty array to prevent filtering errors
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    // Add safety checks to prevent errors
    if (!listing.service_categories || !listing.service_providers?.profiles) {
      return false;
    }

    const matchesSearch = !searchQuery || 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.service_categories.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.service_providers.skills?.some(skill => 
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesLocation = !location || 
      listing.service_providers.profiles.location?.toLowerCase().includes(location.toLowerCase());

    return matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container px-4 py-6 pb-24 md:pb-6">
        {/* Search Header */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold">Find Services Near You</h1>
            
            {/* Search Form */}
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="What service do you need?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-gradient-primary">
                      <SearchIcon className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Filters */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Price Range</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Any price</option>
                          <option>Under R100</option>
                          <option>R100 - R200</option>
                          <option>R200+</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Distance</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Any distance</option>
                          <option>Under 1km</option>
                          <option>1-5km</option>
                          <option>5km+</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Rating</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Any rating</option>
                          <option>4.5+ stars</option>
                          <option>4+ stars</option>
                          <option>3+ stars</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Availability</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Any time</option>
                          <option>Available now</option>
                          <option>Today</option>
                          <option>This week</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {loading ? 'Loading...' : `Found ${filteredListings.length} service listings`}
              </p>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Sort by
              </Button>
            </div>

            {/* Listing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Loading services...
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No services found. Try adjusting your search criteria.
                </div>
              ) : (
                filteredListings.map((listing) => (
                  <Card key={listing.id} className="hover:shadow-elevated transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={listing.service_providers.profiles.avatar_url} />
                              <AvatarFallback>
                                {listing.service_providers.profiles.first_name[0]}
                                {listing.service_providers.profiles.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold">
                                  {listing.service_providers.profiles.first_name} {listing.service_providers.profiles.last_name}
                                </h3>
                                {listing.service_providers.verification_status === 'approved' && (
                                  <Badge variant="secondary" className="text-xs">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{listing.title}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Category and Location */}
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className="text-xs">
                            {listing.service_categories.name}
                          </Badge>
                          {listing.service_providers.profiles.location && (
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{listing.service_providers.profiles.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Skills */}
                        {listing.service_providers.skills && (
                          <div className="flex flex-wrap gap-1">
                            {listing.service_providers.skills.map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {listing.description}
                        </p>

                        {/* Price and Actions */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-semibold text-primary">
                            {listing.price ? (
                              `R${listing.price}${listing.price_type === 'hourly' ? '/hour' : 
                                listing.price_type === 'daily' ? '/day' : ''}`
                            ) : (
                              'Price on request'
                            )}
                          </span>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            {listing.service_providers.profiles.phone_number && (
                              <Button variant="outline" size="sm">
                                <Phone className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              className="bg-gradient-primary"
                              onClick={() => {
                                setSelectedListing(listing);
                                setIsBookingModalOpen(true);
                              }}
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedListing && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedListing(null);
          }}
          listing={selectedListing}
        />
      )}
    </div>
  );
};

export default Search;