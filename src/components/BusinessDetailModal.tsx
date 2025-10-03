import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Star, 
  Phone, 
  MessageCircle, 
  Clock,
  Award,
  Briefcase,
  CheckCircle
} from "lucide-react";
import PhoneCallButton from "./PhoneCallButton";
import RatingDisplay from "./RatingDisplay";

interface ServiceListing {
  id: string;
  title: string;
  description: string;
  price?: number;
  price_type: string;
  duration_minutes?: number;
}

interface BusinessDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: {
    id: string;
    business_name?: string;
    description?: string;
    skills?: string[];
    experience_years?: number;
    verification_status: string;
    average_rating: number;
    total_reviews: number;
    hourly_rate?: number;
    service_radius?: number;
    portfolio_images?: string[];
    profiles: {
      first_name: string;
      last_name: string;
      phone_number?: string;
      location?: string;
      avatar_url?: string;
    };
  };
  services: ServiceListing[];
  reviews: any[];
  distance?: string;
  onBookService: (service: ServiceListing) => void;
  onMessage: () => void;
  onViewReviews: () => void;
}

const BusinessDetailModal = ({
  isOpen,
  onClose,
  business,
  services,
  reviews,
  distance,
  onBookService,
  onMessage,
  onViewReviews
}: BusinessDetailModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Business Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Business Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={business.profiles.avatar_url} />
              <AvatarFallback className="text-lg">
                {business.business_name?.[0] || business.profiles.first_name[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold">
                      {business.business_name || `${business.profiles.first_name} ${business.profiles.last_name}`}
                    </h2>
                    {business.verification_status === 'approved' && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  {/* Location and Distance */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {business.profiles.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{business.profiles.location}</span>
                        {distance && <span>• {distance}</span>}
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= business.average_rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium">{business.average_rating.toFixed(1)}</span>
                    {business.total_reviews > 0 && (
                      <Button
                        variant="link"
                        className="p-0 h-auto text-primary"
                        onClick={onViewReviews}
                      >
                        ({business.total_reviews} reviews)
                      </Button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onMessage}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  {business.profiles.phone_number && (
                    <PhoneCallButton 
                      phoneNumber={business.profiles.phone_number}
                      size="sm"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Business Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {business.experience_years && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-semibold">{business.experience_years} years</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {business.hourly_rate && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Starting Rate</p>
                    <p className="font-semibold">R{business.hourly_rate}/hour</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Services</p>
                  <p className="font-semibold">{services.length} available</p>
                </div>
              </CardContent>
            </Card>

            {business.service_radius && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Service Area</p>
                    <p className="font-semibold">{business.service_radius} km radius</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tabs for Content */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-4 mt-4">
              {/* Description */}
              {business.description && (
                <div>
                  <h3 className="font-semibold mb-2">About the Business</h3>
                  <p className="text-muted-foreground">{business.description}</p>
                </div>
              )}

              {/* Skills */}
              {business.skills && business.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Services & Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {business.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="font-semibold">Contact Information</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Person</p>
                    <p className="font-medium">
                      {business.profiles.first_name} {business.profiles.last_name}
                    </p>
                  </div>
                  {business.profiles.phone_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{business.profiles.phone_number}</p>
                    </div>
                  )}
                  {business.profiles.location && (
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{business.profiles.location}</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="portfolio" className="mt-4">
              {business.portfolio_images && business.portfolio_images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {business.portfolio_images.map((image, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                      <img 
                        src={image} 
                        alt={`Portfolio ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No portfolio images available yet
                </p>
              )}
            </TabsContent>

            <TabsContent value="services" className="mt-4">
              <div className="space-y-3">
                {services.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No services listed yet
                  </p>
                ) : (
                  services.map((service) => (
                    <Card key={service.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{service.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {service.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-semibold text-primary">
                                {service.price ? (
                                  `R${service.price}${service.price_type === 'hourly' ? '/hour' : 
                                    service.price_type === 'daily' ? '/day' : ''}`
                                ) : (
                                  'Price on request'
                                )}
                              </span>
                              {service.duration_minutes && (
                                <span className="text-muted-foreground">
                                  {service.duration_minutes} mins
                                </span>
                              )}
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            className="bg-gradient-primary"
                            onClick={() => onBookService(service)}
                          >
                            Book
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-4">
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No reviews yet
                  </p>
                ) : (
                  reviews.slice(0, 5).map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.profiles?.avatar_url} />
                            <AvatarFallback>
                              {review.profiles?.first_name?.[0]}
                              {review.profiles?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold">
                                {review.profiles?.first_name} {review.profiles?.last_name}
                              </p>
                              <RatingDisplay rating={review.rating} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {review.comment}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                {reviews.length > 5 && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={onViewReviews}
                  >
                    View All {reviews.length} Reviews
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessDetailModal;