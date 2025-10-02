import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BookingModal from "@/components/BookingModal";
import AdvancedSearchFilters from "@/components/AdvancedSearchFilters";
import RatingDisplay from "@/components/RatingDisplay";
import ReviewsViewModal from "@/components/ReviewsViewModal";
import PhoneCallButton from "@/components/PhoneCallButton";
import BusinessDetailModal from "@/components/BusinessDetailModal";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

import ChatModal from "@/components/ChatModal";
import { 
  Search as SearchIcon, 
  MapPin, 
  Star, 
  Filter,
  SlidersHorizontal,
  Heart,
  Phone,
  MessageCircle,
  Navigation as LocationIcon
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
  distance?: number;
  distanceText?: string;
  service_categories: {
    name: string;
  };
  service_providers: {
    id: string;
    business_name?: string;
    skills?: string[];
    verification_status: string;
    average_rating: number;
    total_reviews: number;
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [categories, setCategories] = useState<Array<{id: string; name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<ServiceListing | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [reviews, setReviews] = useState<Record<string, any[]>>({});
  const [selectedReviews, setSelectedReviews] = useState<any[]>([]);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [selectedProviderName, setSelectedProviderName] = useState("");
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState<string>('prompt');
  const [isBusinessDetailOpen, setIsBusinessDetailOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [businessServices, setBusinessServices] = useState<ServiceListing[]>([]);
  const [filters, setFilters] = useState({
    priceRange: [0, 1000] as [number, number],
    rating: "",
    category: "",
    distance: "",
    availability: "",
    sortBy: "distance"
  });

  useEffect(() => {
    fetchListings();
    fetchCategories();
    fetchReviews();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationPermission('granted');
        },
        (error) => {
          console.log('Location access denied or failed:', error);
          setLocationPermission('denied');
          // For testing in Pretoria area
          setUserLocation({
            lat: -25.7479,
            lng: 28.2293
          });
        }
      );
    } else {
      console.log('Geolocation not supported');
      setLocationPermission('denied');
      // For testing in Pretoria area
      setUserLocation({
        lat: -25.7479,
        lng: 28.2293
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_reviewer_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Group reviews by provider_id
      const reviewsByProvider: Record<string, any[]> = {};
      (data || []).forEach((review) => {
        if (!reviewsByProvider[review.provider_id]) {
          reviewsByProvider[review.provider_id] = [];
        }
        reviewsByProvider[review.provider_id].push(review);
      });
      
      console.log('Reviews fetched and grouped:', reviewsByProvider);
      setReviews(reviewsByProvider);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchListings = async () => {
    try {
      console.log('Fetching service listings...');
      
      let query = supabase
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
            average_rating,
            total_reviews,
            profiles!inner (
              first_name,
              last_name,
              phone_number,
              location,
              avatar_url
            )
          )
        `)
        .eq('is_active', true);
      // Apply filters
      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters.rating) {
        query = query.gte('service_providers.average_rating', parseFloat(filters.rating));
      }

      if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
        query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
      }

      // Apply sorting (skip distance sorting here, will be done after distance calculation)
      if (filters.sortBy !== 'distance') {
        switch (filters.sortBy) {
          case 'rating':
            query = query.order('service_providers.average_rating', { ascending: false });
            break;
          case 'price_low':
            query = query.order('price', { ascending: true });
            break;
          case 'price_high':
            query = query.order('price', { ascending: false });
            break;
          case 'reviews':
            query = query.order('service_providers.total_reviews', { ascending: false });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

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
      
      // Calculate distances if user location is available and we want to sort by distance
      if (userLocation && approvedListings.length > 0) {
        await calculateDistances(approvedListings);
      } else {
        setListings(approvedListings);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: "Error", 
        description: "Failed to load service listings",
        variant: "destructive"
      });
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistances = async (listingsData: ServiceListing[]) => {
    try {
      if (!userLocation) return;

      // Filter listings that have location data
      const listingsWithLocation = listingsData.filter(
        listing => listing.service_providers.profiles.location
      );

      if (listingsWithLocation.length === 0) {
        setListings(listingsData);
        return;
      }

      // Prepare provider locations for distance calculation
      const providerLocations = listingsWithLocation.map(listing => ({
        id: listing.service_providers.id,
        location: listing.service_providers.profiles.location!
      }));

      // Call distance calculation edge function
      const { data, error } = await supabase.functions.invoke('calculate-distance', {
        body: {
          userLocation,
          providerLocations
        }
      });

      if (error) {
        console.error('Distance calculation error:', error);
        setListings(listingsData);
        return;
      }

      // Map distances back to listings
      const listingsWithDistance = listingsData.map(listing => {
        const distanceData = data.distances.find(
          (d: any) => d.providerId === listing.service_providers.id
        );
        
        return {
          ...listing,
          distance: distanceData?.distance || Infinity,
          distanceText: distanceData?.distanceText ? `${Math.round(distanceData.distance || 0).toLocaleString()} km` : 'Distance unavailable'
        };
      });

      // Sort by distance if that's the selected sort option
      if (filters.sortBy === 'distance') {
        listingsWithDistance.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      }

      setListings(listingsWithDistance);
    } catch (error) {
      console.error('Error calculating distances:', error);
      setListings(listingsData);
    }
  };

  // Refetch when filters change
  useEffect(() => {
    fetchListings();
  }, [filters, userLocation]);

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

    // Apply distance filter if set
    const matchesDistance = !filters.distance || 
      (listing.distance !== undefined && listing.distance <= parseFloat(filters.distance));

    return matchesSearch && matchesLocation && matchesDistance;
  });

  // Group listings by business/provider
  const businessGroups = filteredListings.reduce((acc, listing) => {
    const providerId = listing.service_providers.id;
    if (!acc[providerId]) {
      acc[providerId] = {
        provider: listing.service_providers,
        services: [],
        distance: listing.distance,
        distanceText: listing.distanceText
      };
    }
    acc[providerId].services.push(listing);
    return acc;
  }, {} as Record<string, any>);

  const businesses = Object.values(businessGroups);

  const handleBusinessClick = (business: any) => {
    setSelectedBusiness(business.provider);
    setBusinessServices(business.services);
    setIsBusinessDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container px-4 py-6 pb-24 md:pb-6">
        {/* Search Header */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold">Find Local Service Businesses</h1>
            
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
                      className="pl-10 pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                      onClick={getCurrentLocation}
                      title="Use current location"
                    >
                      <LocationIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-gradient-primary" onClick={() => fetchListings()}>
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
            </CardContent>
          </Card>
          
          {/* Advanced Filters - Rendered outside the card to prevent layout issues */}
          {showFilters && (
            <div className="mt-4">
              <AdvancedSearchFilters
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                filters={filters}
                onFiltersChange={setFilters}
                categories={categories}
              />
            </div>
          )}
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {loading ? 'Loading...' : `Found ${businesses.length} local businesses`}
              </p>
            </div>

            {/* Business Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Loading services...
                </div>
              ) : businesses.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No businesses found. Try adjusting your search criteria.
                </div>
              ) : (
                businesses.map((business) => (
                  <Card 
                    key={business.provider.id} 
                    className="hover:shadow-elevated transition-shadow cursor-pointer"
                    onClick={() => handleBusinessClick(business)}
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start gap-3">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={business.provider.profiles.avatar_url} />
                            <AvatarFallback className="text-lg">
                              {business.provider.business_name?.[0] || business.provider.profiles.first_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg truncate">
                                  {business.provider.business_name || 
                                    `${business.provider.profiles.first_name} ${business.provider.profiles.last_name}`}
                                </h3>
                                {business.provider.verification_status === 'approved' && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Verified Business
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Location */}
                            {business.provider.profiles.location && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">
                                  {business.provider.profiles.location}
                                  {business.distanceText && business.distanceText !== 'Distance unavailable' && 
                                    ` • ${business.distanceText}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= (business.provider.average_rating || 0)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">
                              {business.provider.average_rating?.toFixed(1) || '0.0'}
                            </span>
                          </div>
                          {business.provider.total_reviews > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {business.provider.total_reviews} reviews
                            </span>
                          )}
                        </div>

                        {/* Services Preview */}
                        <div>
                          <p className="text-sm font-medium mb-2">Services Offered:</p>
                          <div className="space-y-1">
                            {business.services.slice(0, 2).map((service: ServiceListing) => (
                              <div key={service.id} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground truncate flex-1">
                                  • {service.title}
                                </span>
                                {service.price && (
                                  <span className="font-medium text-primary ml-2">
                                    R{service.price}
                                  </span>
                                )}
                              </div>
                            ))}
                            {business.services.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{business.services.length - 2} more services
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Skills Preview */}
                        {business.provider.skills && business.provider.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {business.provider.skills.slice(0, 3).map((skill: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {business.provider.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{business.provider.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* CTA */}
                        <div className="pt-2 border-t">
                          <Button 
                            className="w-full bg-gradient-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBusinessClick(business);
                            }}
                          >
                            View Business Details
                          </Button>
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

      {/* Reviews Modal */}
      <ReviewsViewModal
        isOpen={isReviewsModalOpen}
        onClose={() => {
          setIsReviewsModalOpen(false);
          setSelectedReviews([]);
          setSelectedProviderName("");
        }}
        reviews={selectedReviews}
        providerName={selectedProviderName}
        averageRating={selectedReviews.length > 0 ? 
          selectedReviews.reduce((sum, review) => sum + review.rating, 0) / selectedReviews.length : 0
        }
      />

      {/* Chat Modal */}
      {selectedProvider && (
        <ChatModal
          isOpen={isChatModalOpen}
          onClose={() => {
            setIsChatModalOpen(false);
            setSelectedProvider(null);
          }}
          providerId={selectedProvider.id}
          providerName={`${selectedProvider.profiles.first_name} ${selectedProvider.profiles.last_name}`}
          providerAvatar={selectedProvider.profiles.avatar_url}
        />
      )}

      {/* Business Detail Modal */}
      {selectedBusiness && (
        <BusinessDetailModal
          isOpen={isBusinessDetailOpen}
          onClose={() => {
            setIsBusinessDetailOpen(false);
            setSelectedBusiness(null);
            setBusinessServices([]);
          }}
          business={selectedBusiness}
          services={businessServices}
          reviews={reviews[selectedBusiness.id] || []}
          distance={businessServices[0]?.distanceText}
          onBookService={(service) => {
            if (!user) {
              navigate('/auth');
              return;
            }
            const fullListing = businessServices.find(s => s.id === service.id);
            if (fullListing) {
              setSelectedListing(fullListing);
              setIsBookingModalOpen(true);
              setIsBusinessDetailOpen(false);
            }
          }}
          onMessage={() => {
            setSelectedProvider(selectedBusiness);
            setIsChatModalOpen(true);
            setIsBusinessDetailOpen(false);
          }}
          onViewReviews={() => {
            setSelectedReviews(reviews[selectedBusiness.id] || []);
            setSelectedProviderName(selectedBusiness.business_name || 
              `${selectedBusiness.profiles.first_name} ${selectedBusiness.profiles.last_name}`);
            setIsReviewsModalOpen(true);
          }}
        />
      )}
    </div>
  );
};

export default Search;