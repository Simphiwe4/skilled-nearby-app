import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Mock data for service providers
  const providers = [
    {
      id: 1,
      name: "Thabo Mthembu",
      service: "Handyman",
      rating: 4.9,
      reviews: 127,
      distance: "2.3 km",
      price: "R150/hour",
      avatar: "/api/placeholder/150/150",
      skills: ["Plumbing", "Electrical", "Carpentry"],
      verified: true,
      description: "Experienced handyman with 8+ years in home repairs."
    },
    {
      id: 2,
      name: "Nomsa Dlamini",
      service: "Hair Stylist",
      rating: 4.8,
      reviews: 89,
      distance: "1.7 km",
      price: "R80/session",
      avatar: "/api/placeholder/150/150",
      skills: ["Braids", "Natural Hair", "Color"],
      verified: true,
      description: "Professional stylist specializing in natural African hair."
    },
    {
      id: 3,
      name: "Sipho Nkomo",
      service: "Tutor",
      rating: 4.7,
      reviews: 64,
      distance: "3.1 km",
      price: "R120/hour",
      avatar: "/api/placeholder/150/150",
      skills: ["Maths", "Science", "English"],
      verified: true,
      description: "Mathematics teacher with experience in all grade levels."
    },
    {
      id: 4,
      name: "Lerato Molefe",
      service: "Cleaner",
      rating: 4.9,
      reviews: 156,
      distance: "1.2 km",
      price: "R200/session",
      avatar: "/api/placeholder/150/150",
      skills: ["Deep Clean", "Office", "Residential"],
      verified: true,
      description: "Reliable cleaning service for homes and offices."
    }
  ];

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
              <p className="text-muted-foreground">Found {providers.length} service providers</p>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Sort by
              </Button>
            </div>

            {/* Provider Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <Card key={provider.id} className="hover:shadow-elevated transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={provider.avatar} alt={provider.name} />
                            <AvatarFallback>{provider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{provider.name}</h3>
                              {provider.verified && (
                                <Badge variant="secondary" className="text-xs">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{provider.service}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{provider.rating}</span>
                          <span className="text-sm text-muted-foreground">({provider.reviews})</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{provider.distance}</span>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1">
                        {provider.skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {provider.description}
                      </p>

                      {/* Price and Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="font-semibold text-primary">{provider.price}</span>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button size="sm" className="bg-gradient-primary">
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;